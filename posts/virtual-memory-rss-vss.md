# 为什么一个 100MB 的程序，不一定真的占了 100MB 内存？

系统工具显示：

```text
VIRT  1.2G
RES    48M
```

另一个进程的可执行文件有 100MB，RSS 却只有 20MB。究竟哪个数字才是“真实内存”？

答案是：它们在测不同层。进程使用虚拟地址空间；物理内存按页面在需要时进入；文件映射页还可能被多个进程共享。一个“100MB”无法描述完整情况。

## Virtual Address Space 是地址，不是 RAM

64 位进程看到一片巨大的虚拟地址空间。每段范围可以有不同来源：

```text
Address Space
├─ executable mappings
├─ shared libraries
├─ Heap / anonymous mappings
├─ memory-mapped files
├─ thread stacks
├─ guard pages
└─ reserved but inaccessible regions
```

虚拟地址需要经过页表转换成物理地址：

```text
Virtual Page Number + Offset
        ↓ Page Table
Physical Page Number + Offset
```

某段虚拟地址可以：

- 已映射并驻留在 RAM；
- 已映射但尚未触页；
- 映射到文件；
- 映射到共享零页；
- 被换出到 Swap；
- 只保留地址范围；
- 当前不可访问。

所以虚拟空间大小不能直接等同物理占用。

## VSS / VSZ 在统计什么

VSS，Virtual Set Size，或 `ps` 中的 VSZ，近似统计进程所有虚拟映射范围之和。

它可能包含：

- 还没访问的匿名内存；
- 映射但未读入的可执行文件页面；
- 大量共享库；
- 共享内存；
- 为线程 Stack 预留但未提交的区域；
- `mmap` 保留的大文件地址范围；
- 已经被 Swap 换出的页。

VSS 回答：

> 这个进程的页表与 VMA 描述了多大的虚拟范围？

它不回答：

> 当前有多少独占物理 RAM 因这个进程而存在？

## RSS 在统计什么

RSS，Resident Set Size，统计当前驻留在物理内存中的进程页面。

它包括：

- 进程私有匿名页；
- 当前驻留的代码和文件映射页；
- 当前驻留的共享库页；
- 共享内存页。

RSS 比 VSS 更接近“现在 RAM 中有多少页映射给这个进程”，但仍不能直接把所有进程 RSS 相加，因为共享页会在每个进程的 RSS 中重复出现。

例如 100 个进程共享一份 2MB libc 代码：

```text
每个进程 RSS 都可能计入这 2MB
物理内存中不一定有 100 份
```

## PSS 与 USS 为什么更适合归因

PSS，Proportional Set Size，把共享页按共享进程数量平摊：

```text
一页被 4 个进程共享
→ 每个进程 PSS 计 1/4 页
```

USS，Unique Set Size，近似只统计当前进程独占的物理页。如果终止该进程，这部分最可能直接释放。

因此分析容器或一组 Worker 的内存归因时：

- VSS 看地址空间规模；
- RSS 看驻留映射；
- PSS 看共享页分摊；
- USS 看独占驻留。

Linux 可从 `/proc/<pid>/smaps_rollup` 查看更细统计：

```bash
cat /proc/<pid>/smaps_rollup
```

## Page 是虚拟与物理的连接单位

操作系统通常按 Page 管理内存，常见基础页大小为 4KiB，也可能使用 Huge Page。

申请 100MB 虚拟区域时，大约覆盖：

```text
100 MiB / 4 KiB = 25,600 pages
```

这些虚拟页不必全部立刻拥有物理页。

当 CPU 首次访问尚未建立有效映射的页：

```text
访问虚拟地址
→ TLB / Page Table 未命中有效物理页
→ Page Fault
→ 内核确定页面来源
→ 分配物理页或载入文件页
→ 更新 Page Table
→ 重新执行指令
```

Minor Fault 通常不需要磁盘 I/O，例如分配匿名零页或复用 Page Cache；Major Fault 通常涉及等待存储读取。

## 实验一：`mmap` 100MB 但不访问

```c
#include <stdio.h>
#include <sys/mman.h>
#include <unistd.h>

int main(void) {
    size_t size = 100UL * 1024 * 1024;
    char *p = mmap(
        NULL,
        size,
        PROT_READ | PROT_WRITE,
        MAP_PRIVATE | MAP_ANONYMOUS,
        -1,
        0
    );
    if (p == MAP_FAILED) return 1;

    printf("mapped pid=%d\n", getpid());
    getchar();

    for (size_t i = 0; i < size / 2; i += 4096) {
        p[i] = 1;
    }
    printf("touched half\n");
    getchar();

    munmap(p, size);
    getchar();
}
```

在暂停点观察：

```bash
grep -E 'VmSize|VmRSS|VmSwap' /proc/<pid>/status
cat /proc/<pid>/smaps_rollup
```

典型趋势：

```text
mmap 后：
  VmSize 增加约 100MB
  VmRSS 变化很小

触碰一半页面后：
  VmRSS 增加约 50MB

munmap 后：
  对应虚拟区域消失
  RSS 随之下降
```

数值不会精确相等，因为进程还有二进制、库、栈、页表和测量时机等开销。

## 为什么只读也可能不分配独立页面

新匿名内存语义上应全为零。内核可以让多个未写页面共同映射一个只读 Zero Page：

```text
Virtual Page A ─┐
Virtual Page B ─┼→ Shared Zero Page
Virtual Page C ─┘
```

第一次写时触发保护异常，内核才分配私有物理页。这进一步解释了“读过”和“写过”的 RSS 行为可能不同。

具体实现与统计方式依内核而异，不应把共享零页当成所有平台保证。

## 文件映射为什么也不等于全部读入

```c
int fd = open("large.bin", O_RDONLY);
void *p = mmap(NULL, 100 * MiB, PROT_READ, MAP_PRIVATE, fd, 0);
```

这建立了 100MB 文件映射。最初 VSS 增长，RSS 不一定增长 100MB。

访问 `p[0]` 时，内核加载包含该位置的页面，可能还做 Readahead。未访问部分仍不必驻留。

文件页通常进入 Page Cache。另一个进程映射同一文件时，可以共享这些物理页。因此两个进程各显示一部分 File RSS，却不代表内核保存两份内容。

## 100MB 可执行文件为何只占一部分 RSS

一个可执行文件的 100MB 可能包含：

- 调试符号；
- Section Header；
- 未映射元数据；
- 很少执行的代码；
- 压缩资源；
- 只在需要时映射或解压的数据。

Loader 根据 Program Header 映射需要运行的 Segment，并按需调页。未走到的函数页面可能一直不进入 RSS。

调试符号甚至可能完全不在 `PT_LOAD` Segment 中，只供调试器读取。

反过来，一个只有 10MB 的可执行文件也可能运行后占用数 GiB，因为它动态分配 Heap、建立缓存和处理输入。

## Copy-on-Write 为什么让两个进程看似各有一份

`fork` 后：

```text
Parent Virtual Page ─┐
                     ├→ Physical Page X
Child Virtual Page ──┘
```

父子页表都引用 X，并标记为 Copy-on-Write。只读时共享；某一方写入后：

```text
Parent → Physical Page X
Child  → copied Physical Page Y
```

这让 `fork` 不必立刻复制全部内存。

统计上，共享和私有 COW 页的归因可能随写入发生变化。`smaps` 中的：

- `Shared_Clean`；
- `Shared_Dirty`；
- `Private_Clean`；
- `Private_Dirty`；

能展示更细分类。

## `MAP_SHARED` 与 `MAP_PRIVATE`

文件映射的两个常见模式：

### `MAP_SHARED`

写入对其他映射同一对象的进程可见，并可能最终回写文件。

### `MAP_PRIVATE`

修改采用 Copy-on-Write，不回写原文件。未修改页面仍可共享文件 Page Cache，写过的页面变成私有匿名副本。

“Private”不等于映射建立时立刻复制全部文件，只表示写入语义私有。

## Heap 释放后 RSS 为什么不降

`free` 只把对象归还给用户态 Allocator。若该对象所在 Page 还包含其他对象，或 Allocator 想保留内存供后续复用，它不会立即 `munmap`。

此时可能看到：

```text
应用层活跃对象下降
Allocator 保留内存不变
RSS 仍然较高
```

这不一定是 Memory Leak。判断泄漏要看长期趋势、活跃对象、Allocator 指标与是否可复用，而不是只看释放后 RSS 没立刻下降。

## Shared Library 如何影响统计

进程映射 libc、动态链接器和其他共享库。它们的只读代码页可被多个进程共享。

`top` 的 `SHR` 字段只是近似信息，不能简单用：

```text
真实内存 = RSS - SHR
```

Linux 内存统计存在文件页、匿名共享、COW 与 Kernel Same-page Merging 等多种情况。需要精确归因时优先看 `smaps` / `smaps_rollup` 和 PSS。

## Swap 会让 RSS 下降，但程序仍拥有地址

匿名页长期不用时，内核可能把内容写到 Swap，释放物理页。

此时：

- VSS 不变；
- RSS 下降；
- VmSwap 增长；
- 再次访问会触发 Major Fault，把页面读回。

所以 RSS 是瞬时驻留集合，不是进程一生中申请过的总内存。

## Page Table 自己也消耗内存

大 VSS 即使没有对应数据页，也可能带来：

- VMA 元数据；
- 已建立部分页表层级；
- TLB 压力；
- 内核记账成本。

稀疏映射的页表开销通常远小于映射范围本身，但“虚拟内存完全免费”也不准确。

## 建立一套正确观察方法

先看总体：

```bash
ps -o pid,vsz,rss,comm -p <pid>
```

再看聚合：

```bash
cat /proc/<pid>/smaps_rollup
```

再定位映射：

```bash
pmap -x <pid>
cat /proc/<pid>/maps
```

观察 Page Fault：

```bash
perf stat -e page-faults,minor-faults,major-faults ./app
```

容器中还要同时看 Cgroup Memory 统计。宿主机进程 RSS 与容器计费可能有不同共享页和缓存归因规则。

## “占了多少内存”必须带上定义

当有人说“这个进程占 100MB”，应继续问：

```text
是可执行文件大小？
虚拟地址空间 VSS？
当前驻留 RSS？
共享页平摊后的 PSS？
独占页面 USS？
Allocator 活跃对象？
Cgroup 记账？
峰值还是当前值？
```

100MB 虚拟映射可以只驻留几页；100MB RSS 可以包含与其他进程共享的库；100MB 文件可以只有少数代码页被执行；小文件也可以动态申请巨大 Heap。

虚拟内存的核心价值，就是把“进程使用的地址”与“此刻放在哪个物理页”分离。VSS 描述前者的范围，RSS 描述后者的当前驻留，而 mmap、Demand Paging 和 Copy-on-Write 决定二者为何会持续变化。
