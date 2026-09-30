# malloc 到底干了什么？

调用：

```c
void *p = malloc(1024);
```

返回一个地址，看起来像“向操作系统申请了 1024 字节内存”。但多数情况下，这次调用：

- 没有进入内核；
- 没有精确申请 1024 字节；
- 没有立刻分配新的物理页；
- 也不保证 `free(p)` 后 RSS 立即下降。

`malloc` 是用户态 Allocator 的接口。它在进程虚拟地址空间中管理比 1024 字节更大的区域，再从中切出满足请求的块。

## 先区分四种“内存”

```text
应用请求大小
  1024 bytes

Allocator 管理块
  1024 + 对齐 + 元数据

进程虚拟地址
  例如 0x7f... 的一段范围

实际驻留物理页
  访问后才可能分配
```

这四个数字不必相等。

`malloc(1024)` 的合同主要是：成功时返回一块至少能容纳 1024 字节、满足对齐要求、当前不与其他已分配对象重叠的可用区域。

它没有承诺这块区域来自哪里，也没有承诺物理内存何时到位。

## 第一层：Allocator 先看自己的库存

进程链接的 libc 或其他分配器，如 glibc malloc、jemalloc、tcmalloc，会维护空闲块。

概念结构：

```text
Arena
├─ allocated chunk
├─ free chunk
├─ allocated chunk
└─ top chunk / unused region
```

调用 `malloc(1024)` 时，Allocator 先：

1. 计算对齐后的内部尺寸；
2. 查找对应 Size Class 或 Bin；
3. 尝试复用空闲块；
4. 必要时切分更大的块；
5. 更新元数据；
6. 返回 Payload 地址。

如果已有合适空闲块，整个过程只是用户态指针和数据结构操作，不需要系统调用。

## 为什么申请 1024，内部可能更多

Allocator 需要：

- 对齐到 8、16 或更高字节边界；
- 保存 Chunk 大小和状态；
- 维护空闲链表或位图；
- 满足 SIMD 与 ABI 对齐；
- 有时加入安全检测元数据。

概念上：

```text
┌──────────────┬─────────────────────────┐
│ chunk header │ 1024-byte user payload  │
└──────────────┴─────────────────────────┘
```

具体元数据布局属于分配器实现，不能假设 Header 一定紧挨 Payload，也不应从 `p` 向前读取内部字段。

## Free List 与 Size Class

如果每次都扫描所有空闲区，分配会很慢。Allocator 常按尺寸组织：

```text
16B class
32B class
64B class
...
1024B class
...
```

小对象从对应 Class 快速取得，释放后回到 Cache 或 Bin。

不同实现采用：

- Segregated Free List；
- Buddy 思想；
- Slab / Span；
- Per-thread Cache；
- 多 Arena；
- Bitmap。

目标是在速度、碎片、并发和内存归还之间折中。

## 没有空闲块时才向内核要更大区域

Allocator 可以通过两类接口扩大可管理虚拟空间。

### `brk`

传统 Heap 尾部由 Program Break 标识：

```text
Data / BSS | Heap 已用 | Top Chunk | program break
```

`brk` 或历史接口 `sbrk` 调整 Heap 末端。现代应用不应直接与 malloc 混用 `sbrk`，因为会破坏分配器对地址空间的假设。

### `mmap`

Allocator 也可以建立匿名映射：

```c
mmap(NULL, length,
     PROT_READ | PROT_WRITE,
     MAP_PRIVATE | MAP_ANONYMOUS,
     -1, 0);
```

较大分配常独立使用 `mmap`，释放时更容易 `munmap` 归还整个区域。阈值并非固定常数，分配器可能动态调整。

因此：

```text
malloc 是用户态分配接口
brk / mmap 是向内核管理虚拟地址空间的机制
```

它们不是同一层。

## 内核返回的首先是虚拟地址

假设 Allocator 通过 `mmap` 获得 4MiB 区域。内核可以先建立 Virtual Memory Area：

```text
0x7f1000000000 ───────── 0x7f1000400000
read/write, anonymous, private
```

此时页表中的很多页面还未映射独立物理页。Linux 常采用 Demand Paging 与 Overcommit 策略。

第一次读取新匿名页时，内核可能映射共享的只读零页；第一次写入时触发 Page Fault，再分配并清零真实物理页。

所以：

```c
char *p = malloc(1024 * 1024 * 1024ULL);
```

如果成功，只能说明分配器和内核提供了 1GiB 虚拟地址承诺，不保证 1GiB 物理 RAM 已经驻留，也不保证未来写遍每一页一定成功。

## 第一次写为什么会变慢

```c
char *p = malloc(size);

// 分配可能很快

for (size_t i = 0; i < size; i += 4096) {
    p[i] = 1;
}
```

循环按页写入，可能为每页触发 Minor Page Fault：

```text
CPU Store
→ 页表项尚未存在或为只读零页
→ Page Fault
→ 内核分配物理页
→ 清零并建立映射
→ 重新执行 Store
```

这不是程序非法访问，而是虚拟内存正常的 Lazy Allocation。

若物理内存和 Swap 无法满足，Linux Overcommit 配置下可能在后续触页时触发 OOM，而不是 `malloc` 当场失败。

## Physical Memory 在哪一步出现

可以把路径写成：

```text
malloc(1024)
→ Allocator 查空闲块
  ├─ 命中：返回已有虚拟地址
  └─ 不足：brk / mmap 扩大虚拟区域
→ 返回指针
→ 程序首次写页面
→ Page Fault
→ 内核分配物理页
→ 页表建立映射
```

小于 Page Size 的多个对象通常共享一个物理页。一个 1024 字节对象并不会让内核分配“恰好 1024 字节物理内存”，物理内存以页为基本管理单位，常见为 4KiB。

## `free` 做了什么

```c
free(p);
```

首先表示该块重新归 Allocator 管理，后续 `malloc` 可复用。

它不一定立刻调用 `munmap`，因为：

- 小块与其他对象共享同一页；
- 保留空闲块可提高后续分配速度；
- 只有 Heap 顶部连续空闲区域容易通过 `brk` 收缩；
- 归还内核也有系统调用和页表维护成本；
- Per-thread Cache 可能暂存块。

大块独立映射更可能在释放时 `munmap`。某些 Allocator 也通过 `madvise` 告诉内核页面内容可丢弃，同时保留虚拟地址映射。

因此程序 `HeapAlloc` 下降，不等于 RSS 立即同幅下降。

## Fragmentation：明明有空闲却分配不了

### Internal Fragmentation

请求 33 字节，被分配到 48 或 64 字节 Size Class，多出的空间属于块内部浪费。

### External Fragmentation

```text
free 64K | used 64K | free 64K | used 64K
```

总空闲 128K，但无法提供连续 128K 块。

虚拟内存缓解物理连续性要求，Allocator 仍要面对虚拟 Chunk 布局和 Size Class 浪费。长期运行且对象尺寸、生命周期混杂的服务尤其容易出现碎片。

## 多线程让分配器更复杂

如果所有线程抢一把全局锁，`malloc` 会成为瓶颈。因此现代 Allocator 常使用：

- Thread-local Cache；
- 多 Arena；
- Per-CPU Cache；
- 批量从中央结构搬运对象。

这样减少锁竞争，却可能让空闲内存滞留在某个线程 Cache 中。某线程释放的内存，另一个线程未必立即复用；线程退出和 Arena 数量也会影响 RSS。

分配速度、内存占用和跨线程复用之间没有免费方案。

## `calloc` 为什么有时看起来特别快

```c
void *p = calloc(n, size);
```

语义要求初始内容为零。内核新提供的匿名页出于安全必须是零页，因此 Allocator 有时不需要立刻手工清零整个区域。

在页面真正写入前，它可能共享只读零页或尚未分配物理页。于是 `calloc` 的调用很快，成本延后到触页阶段。

但若复用包含旧数据的用户态空闲块，Allocator 必须清零，行为取决于来源和实现。

## `realloc` 为什么可能复制

```c
p = realloc(p, new_size);
```

如果原块后面有足够空闲空间，Allocator 可以原地扩展；否则：

1. 分配新块；
2. 复制旧内容；
3. 释放旧块；
4. 返回新地址。

因此必须用临时变量处理失败：

```c
void *new_p = realloc(p, new_size);
if (new_p != NULL) {
    p = new_p;
}
```

直接覆盖 `p` 会在失败时丢失原地址，造成泄漏。

## 用实验观察虚拟与物理分离

示例：

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main(void) {
    size_t size = 512UL * 1024 * 1024;
    char *p = malloc(size);
    if (!p) return 1;

    printf("allocated, pid=%d\n", getpid());
    getchar();

    for (size_t i = 0; i < size; i += 4096) {
        p[i] = 1;
    }

    printf("touched\n");
    getchar();
    free(p);
    getchar();
}
```

在三个暂停点观察：

```bash
grep -E 'VmSize|VmRSS' /proc/<pid>/status
pmap -x <pid>
```

常见现象：

1. `malloc` 后 VSS / VmSize 增长明显；
2. 写遍页面后 RSS / VmRSS 才显著增长；
3. `free` 后是否下降取决于分配器是否归还映射。

实际结果受 Overcommit、Transparent Huge Pages、Allocator 和编译优化影响。确保编译器不能删除触页循环。

观察系统调用：

```bash
strace -e brk,mmap,mremap,munmap ./app
```

会发现大量小 `malloc` 并不一一对应系统调用，Allocator 批量管理更大区域。

## 为什么 `malloc` 不等于物理内存申请

把每层责任放回正确位置：

```text
malloc
  管理对象大小、对齐、空闲块与并发

brk / mmap
  管理进程虚拟地址区域

Page Table
  记录虚拟页如何映射

Page Fault Handler
  在访问时补齐映射

Physical Memory Manager
  分配与回收物理页
```

`malloc(1024)` 只是这条链的最上层。它可能复用现有 Chunk；即使向内核扩大区域，获得的也先是虚拟地址范围；只有页面被实际触达，物理内存才通常逐步进入。

因此判断内存问题时，不能只看代码请求了多少，也不能只看一个 VSS 数字。必须同时理解 Allocator 统计、虚拟映射、RSS、Page Fault 和内核回收行为。
