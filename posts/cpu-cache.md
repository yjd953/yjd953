# CPU 为什么需要 Cache？

CPU 的加法器可能一个周期就完成运算，但所需数据如果在 DRAM，核心可能等待数百个周期。

Cache 的根本原因不是“内存容量不够”，而是：

> 计算单元变快的速度远高于远端存储提供单次数据的速度，物理距离、信号传播和存储结构造成了不可消除的延迟层次。

## 先建立“距离”概念

程序中的所有数据并不与 CPU 等距离。

粗略数量级如下，具体值随处理器、频率、拓扑和负载变化：

```text
Register                 ~ 1 个周期量级
L1 Cache                 ~ 数个周期
L2 Cache                 ~ 十余周期
L3 / Last-Level Cache    ~ 数十周期
Local DRAM               ~ 数十到上百纳秒
NVMe SSD                 ~ 数十到数百微秒
跨机房 Network           ~ 毫秒及以上
```

假设 CPU 为 3GHz，一个周期约 0.33ns。100ns 的 DRAM 延迟接近 300 个周期。如果流水线没有别的工作可做，这段时间足够执行大量简单算术指令。

SSD 比 DRAM 再慢约三个数量级，网络又受到传播、排队和协议栈影响。

现代计算机不是一个统一速度的“存储器”，而是一组容量越大、越便宜、越远、越慢的层次。

## 为什么不能把所有内存都做成寄存器

寄存器最快，但数量很少，原因包括：

- 需要位于执行核心附近；
- 更多寄存器让指令编码更复杂；
- 多端口寄存器文件面积和功耗很高；
- 大结构的信号传播延迟会增加；
- 上下文切换需要保存架构寄存器。

SRAM Cache 比 DRAM 快，但单位面积更大、更耗电。DRAM 密度高，适合几十或几百 GiB 容量，却需要行激活、刷新和片外访问。

因此硬件只能分层：

```text
越靠近 CPU：小、快、贵
越远离 CPU：大、慢、便宜
```

Cache 试图让“最近可能使用的数据”暂时待在更近的位置。

## Cache 为什么按 Line 搬运

CPU 请求地址 `0x1003` 的一个字节时，Cache 通常不会只取一个字节，而是取整条 Cache Line。现代桌面和服务器 CPU 常见 Line 大小为 64 字节，但应以实际硬件为准。

如果 Line 为 64 字节：

```text
访问 0x1003
→ 拉取 0x1000..0x103f
```

这是利用 Spatial Locality：程序访问一个地址后，很可能很快访问相邻地址。

数组遍历：

```c
for (size_t i = 0; i < n; i++) {
    sum += values[i];
}
```

一次 Cache Miss 带回多个连续元素，后续访问可以命中。

链表遍历：

```c
for (Node *p = head; p != NULL; p = p->next) {
    sum += p->value;
}
```

节点若散布在 Heap，各次访问可能落在不同 Line，硬件也难提前知道 `next`。相同算法复杂度下，数组常明显更快。

## Temporal Locality：刚用过的可能还会用

循环：

```c
for (...) {
    total += config.factor * input[i];
}
```

`config.factor` 被反复读取。第一次进入 Cache 后，后续访问可能持续命中。

局部变量也不一定都在寄存器中。若发生 Spill，它们可能位于 Stack，但 Stack 的热区域通常具有很强时间局部性，容易驻留在 L1。

Cache 有效的前提不是程序员显式调用它，而是程序访问模式呈现时间与空间局部性。

## L1、L2、L3 分别在解决什么

### L1

离执行单元最近，容量最小，延迟最低。常分为 Instruction Cache 和 Data Cache，避免取指与数据访问互相争用。

### L2

更大、更慢，通常仍为 Core 私有或局部共享。接住 L1 容纳不了的工作集。

### Last-Level Cache

通常容量更大，可能由多个 Core 共享，并按 Slice 分布。它既降低访问 DRAM 的概率，也参与多核数据共享和一致性。

层数本身不是目的。每一层都在做容量、延迟、带宽、面积和功耗的折中。

## Cache 如何知道一块数据在哪里

物理地址可概念性拆成：

```text
Tag | Set Index | Block Offset
```

- Offset 选择 Cache Line 内的字节；
- Index 选择某个 Set；
- Tag 判断该 Set 中哪一条对应目标地址。

如果每个地址只能放一个位置，叫 Direct-mapped，查找简单但冲突多。现代 Cache 常采用 Set-associative：一个 Set 有多个 Way。

例如两个热点数组的地址总映射到同一 Set，即使总工作集不大，也可能互相驱逐，产生 Conflict Miss。

Cache Miss 不只有“数据太大”一种：

- Compulsory Miss：首次访问；
- Capacity Miss：工作集超过容量；
- Conflict Miss：映射冲突；
- Coherence Miss：其他 Core 的写入使本地副本失效。

## Cache Hit 与 Miss 如何改变流水线

指令：

```asm
MOV RAX, [RBX]
ADD RCX, RAX
```

第二条依赖 Load 结果。若 L1 命中，等待很短；若访问 DRAM，依赖链可能停顿数百周期。

乱序执行可以先做其他无关指令，Memory-Level Parallelism 也能同时发出多个 Load，但如果后续所有工作都依赖这一个值，延迟无法隐藏。

这就是 Pointer Chasing 慢的原因：

```text
读取 node.next
→ 才知道下一个地址
→ 再读取
```

下一次地址依赖上一次结果，无法提前并行。

## Prefetch：在使用前把数据拉近

硬件预取器识别顺序或固定步长访问：

```text
读取 A[0], A[1], A[2]
→ 推测接下来需要 A[3], A[4]
```

软件也可通过编译器指令或访问重排帮助预取。

预取不总是有益：

- 猜错会浪费带宽；
- 无用 Line 会挤出热点数据；
- 随机访问难预测；
- 过早预取可能在使用前被驱逐；
- 过晚则隐藏不了延迟。

高性能程序往往不是减少所有内存访问，而是让访问更连续、更可预测、更能并行。

## Cache 与虚拟内存之间还有 TLB

CPU 发出的 Load 使用虚拟地址，访问 Cache 前后还涉及地址翻译。TLB 缓存虚拟页到物理页映射。

```text
Virtual Address
→ TLB hit：快速得到 Physical Address
→ TLB miss：Page Table Walk
→ Cache hierarchy
```

工作集跨越大量页面时，即使数据 Cache 行为尚可，也可能产生 TLB Miss。Huge Page 通过更大页覆盖更多地址范围，可能降低 TLB 压力，但也有内存碎片和管理成本。

所以“内存局部性”同时包括 Cache Line 局部性与 Page 局部性。

## 多核 Cache 为什么需要一致性

假设两个 Core 都缓存了变量 `x`：

```text
Core 0 L1: x = 1
Core 1 L1: x = 1
```

Core 0 写 `x = 2` 后，Core 1 不能永远读到旧值。Cache Coherence Protocol 追踪 Cache Line 状态，使写者获得所有权，并让其他副本失效或更新。

这并不自动解决并发正确性。Coherence 保证硬件层的 Line 一致性，语言内存模型仍要求用锁或原子操作建立 Happens-before。

## False Sharing：没有共享变量也可能争用

```c
struct Counters {
    long a;  // Thread 0 频繁写
    long b;  // Thread 1 频繁写
};
```

`a` 和 `b` 不同，却可能位于同一 64 字节 Cache Line。两个 Core 写各自变量时，整条 Line 的所有权来回转移。

这叫 False Sharing。逻辑上没有数据竞争，性能上却发生一致性争用。

可通过：

- 按 Cache Line Padding；
- 每线程局部计数，最后汇总；
- 减少共享写入；
- 合理布局数据；

缓解。但 Padding 会增加内存占用，应先测量。

## 从 Cache 到 SSD 与 Network

Cache 的思维可以扩展到整个系统：

```text
CPU Register
→ CPU Cache
→ RAM
→ Local SSD
→ Remote Storage
→ Cross-region Service
```

更远的一层通常：

- 延迟更高；
- 容量更大；
- 单位成本更低；
- 故障模式更多；
- 需要批量与异步隐藏延迟。

数据库 Buffer Pool 是磁盘页的内存 Cache；操作系统 Page Cache 是文件块的内存 Cache；CDN 是源站内容的地理 Cache。

它们面对同一个问题：计算或用户离原始数据太远。

## 用两个实验看到局部性

### 顺序访问与随机访问

准备一个远大于 Last-Level Cache 的数组，分别：

```text
顺序读取每个元素
随机排列索引后读取
```

顺序访问能利用 Cache Line、Prefetch 和 DRAM Burst；随机访问更容易等待每次独立 Load。

### 改变工作集

从 4KiB、32KiB、256KiB、数 MiB、数百 MiB 逐步增加数组大小，重复访问并测量每次访问时间。

当工作集越过 L1、L2、L3 容量附近时，曲线可能出现台阶。实际边界会被关联度、共享 Cache、预取和测量噪声模糊。

Linux 可结合：

```bash
perf stat -e cycles,instructions,cache-references,cache-misses ./bench
```

更精确的 L1/L2/LLC 事件名称依 CPU 型号而异，应通过 `perf list` 查询。

## Latency 与 Bandwidth 不是一回事

内存系统可能拥有很高带宽，却仍有较高单次访问延迟。

- 顺序扫描可同时发出许多请求，接近带宽上限；
- Pointer Chasing 每一步依赖上一步，主要受延迟限制；
- 多核一起扫描可能耗尽共享带宽；
- 单线程随机读取即使数据量不大，也可能因延迟很慢。

性能分析需要先判断工作负载是 Latency-bound 还是 Bandwidth-bound。

## Cache 为什么必不可少

如果没有 Cache，每次取指、读取 Stack、访问数组都必须等待 DRAM。快速执行单元会大部分时间闲置。

Cache 利用程序局部性，把最近和相邻数据搬到更靠近 CPU 的 SRAM，使大多数访问呈现“像快速小内存”，只有 Miss 才支付远端代价。

它无法消除距离，只能让常见路径绕开距离。

理解 Cache 后，许多性能现象会连成一条线：

```text
数据布局影响 Cache Line
工作集大小影响命中层级
线程迁移影响局部性
共享写入触发 Coherence
随机依赖限制 Prefetch
远端访问让 CPU 等待
```

CPU 为什么需要 Cache，最终不是一个 L1/L2/L3 名词题，而是整个计算机系统都必须面对的物理事实：数据移动需要时间，而计算速度常常比数据抵达速度快得多。
