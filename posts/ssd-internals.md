# SSD 到底是怎么工作的？

应用执行：

```c
write(fd, "hello", 5);
```

几微秒后 `write()` 可能返回 `5`。直觉上，“hello”似乎已经写进 SSD。实际上，这 5 Bytes 可能仍停留在：

- 进程到内核的复制路径；
- OS Page Cache；
- 文件系统尚未分配完成的脏页；
- Block Layer 队列；
- SSD Controller 的 DRAM Cache；
- NAND 中一个与旧位置完全不同的新 Page。

从应用到 NAND 的完整路径更接近：

```text
write()
→ File Descriptor
→ VFS / Filesystem
→ Page Cache or Direct I/O
→ Block Layer
→ NVMe / SATA Driver
→ SSD Controller
→ FTL
→ NAND Channel / Die / Plane
→ Flash Page Program
```

SSD 不是“没有磁头的硬盘”。它是一台内部运行固件、维护映射表、执行垃圾回收和纠错的小型存储计算机。

## `write()` 返回时发生了什么

对普通 Buffered I/O：

```c
ssize_t n = write(fd, buf, len);
```

内核通常：

1. 检查文件描述符和权限；
2. 计算文件 Offset；
3. 把用户数据复制到对应 Page Cache Page；
4. 标记 Page Dirty；
5. 更新文件大小与时间等内存 Metadata；
6. 返回已接收字节数。

这时数据已经离开应用的用户空间，但通常还在 RAM：

```text
Application buffer: "hello"
        ↓ copy
Kernel Page Cache:  dirty page containing "hello"
```

`write()` 成功主要表示：

> 操作系统已经接受这些字节，并按文件接口更新了内核中的可见状态。

它不自动表示数据已经进入 NAND。

## Page Cache 为什么存在

应用写入可能很小且频繁：

```text
write 5 bytes
write 12 bytes
write 80 bytes
```

存储设备的高效 I/O 单位远大于几个字节。Page Cache 可以：

- 合并同一 Page 的多次修改；
- 让应用快速返回；
- 按批次生成 Block I/O；
- 缓存后续读取；
- 统一处理 Memory-Mapped File 与普通 I/O；
- 调整写回时机与顺序。

后台 Writeback 线程会在脏页比例、时间、内存压力或显式同步触发时，把 Dirty Page 写向文件系统和设备。

因此进程崩溃与机器断电不同：

```text
process crash:
  kernel and page cache may remain

power loss:
  unprotected DRAM state disappears
```

## 怎样要求数据持久化

应用可调用：

```c
fsync(fd);
```

或根据需求使用 `fdatasync()`、同步打开标志等。

`fsync()` 的语义大致是让文件相关的数据和恢复所需 Metadata 达到持久化边界。它通常需要：

```text
dirty page cache
→ filesystem block mapping
→ submit writes
→ wait for device completion
→ flush volatile device cache when required
```

若新建文件后还要求“断电后目录中一定存在这个名字”，仅同步文件可能不够，常还需要同步父目录。具体契约受操作系统与文件系统影响。

Direct I/O 可以绕过普通文件数据 Page Cache，但不等于绕过文件系统、Block Layer、设备缓存或 FTL，也不天然等于同步持久化。

## 文件系统把 Offset 映射为 Block

应用看到：

```text
file = /data/message.txt
offset = 0
length = 5
```

文件系统维护：

- Path 与 Directory Entry；
- Inode 或等价文件 Metadata；
- 文件逻辑 Offset 到 Extent/Block 的映射；
- 空闲空间；
- 权限、大小、时间；
- Journal 或 Copy-on-Write Metadata。

写入新文件时，文件系统需要选择逻辑 Block：

```text
file logical block 0
→ filesystem extent
→ block device LBA 9123456
```

“文件在哪个 SSD 位置”不是应用自己计算的。文件系统把名字和 Offset 转换为 Block Device 能理解的逻辑地址。

日志型文件系统可能先记录 Metadata Journal；Copy-on-Write 文件系统可能把更新写到新位置再切换树根。它们解决的是文件系统结构崩溃一致性，不自动等同数据库事务语义。

## Block Layer 只看到逻辑块请求

到了 Block Layer，一次写入可表示为：

```text
WRITE
starting LBA = 9123456
block count = 8
flags = ...
```

LBA 是 Logical Block Address。操作系统不知道对应哪个 NAND Die、Block 或 Page，这正是 SSD 抽象的目的。

Block Layer 和驱动可能：

- 合并相邻请求；
- 拆分过大请求；
- 排队；
- 应用 I/O Priority；
- 处理 Flush、Discard、FUA；
- 把请求放入 SATA 或 NVMe 命令队列。

传统 SATA/AHCI 与 NVMe 的接口设计不同。NVMe 面向低延迟并行设备，支持多对 Submission Queue / Completion Queue，减少单队列锁竞争。

## NVMe 命令如何到达 Controller

简化的 NVMe 写路径：

```text
1. Driver builds an NVMe Write command
2. Command references host-memory data buffers
3. Driver places it in a Submission Queue
4. Driver updates a doorbell register
5. Controller fetches command and data via DMA
6. Controller schedules internal NAND work
7. Controller posts Completion Queue entry
8. Host observes completion by interrupt or polling
```

DMA 让 Controller 直接在系统内存和设备之间传输数据，不要求 CPU 执行逐字节复制。

高性能系统会使用：

- 多队列；
- Interrupt Coalescing；
- Polling；
- CPU/Queue Affinity；
- 大批量异步 I/O；
- 较高 Queue Depth。

这些优化改变命令提交效率，却没有改变 NAND 的基本限制。

## SSD Controller 是一台专用计算机

SSD 内部通常包含：

```text
SSD Controller
├─ host interface: NVMe / SATA
├─ embedded CPU cores
├─ firmware
├─ SRAM / DRAM
├─ ECC engine
├─ encryption engine, possibly
├─ NAND channels
└─ power-loss protection, on some devices
```

Controller 负责：

- LBA 到物理闪存位置的映射；
- 并行调度 Channel、Die、Plane；
- Garbage Collection；
- Wear Leveling；
- Bad Block Management；
- ECC 编码与纠错；
- Read Retry 与数据刷新；
- 缓存和写入合并；
- 断电恢复元数据；
- SMART / Health 信息。

因此主机发出“写 LBA 9123456”，Controller 不会简单前往一个固定格子覆盖。它先经过 FTL 决策。

## NAND Flash 如何保存一个 Bit

NAND Cell 通过 Floating Gate 或 Charge Trap 中的电荷状态改变晶体管阈值电压。读取时，设备施加不同参考电压，判断 Cell 落在哪个阈值区间。

根据一个 Cell 编码的 Bit 数，可分为：

```text
SLC: 1 bit  → 2 voltage states
MLC: 2 bits → 4 states
TLC: 3 bits → 8 states
QLC: 4 bits → 16 states
```

状态越多，每个 Cell 存储密度越高，但相邻电压区间更窄，通常带来：

- 更复杂的编程；
- 更高的错误率；
- 更强 ECC 需求；
- 更低耐久度；
- 更明显的读写延迟变化。

“MLC”在市场材料中有时泛指多比特 Cell，有时特指 2-bit MLC。讨论具体产品时应确认厂商定义。

## NAND 的三个操作单位不同

NAND 最关键的物理约束：

```text
Read:    Page granularity
Program: Page granularity
Erase:   Block granularity
```

一个 Erase Block 包含许多 Page：

```text
Erase Block
├─ Page 0
├─ Page 1
├─ Page 2
├─ ...
└─ Page N
```

具体大小随 NAND 代际而变化。例如 Flash Page 可能是数 KiB 到十几 KiB，Erase Block 可达数 MiB。不要把它与 OS 的 4KiB Memory Page 或数据库 Page 混为一谈。

NAND Page 在擦除后处于可编程状态。编程会把 Cell 状态向特定方向改变，但不能像 DRAM 那样任意原地覆盖。想重新使用已有 Page，通常必须擦除包含它的整个 Block。

这产生 SSD 的核心矛盾：

```text
Host asks: overwrite one 4KiB LBA
NAND says: cannot simply overwrite that programmed physical page
```

## FTL：把覆盖写变成异地写

Flash Translation Layer 维护：

```text
Logical Page Number → Physical Flash Page
```

假设原映射：

```text
LBA 1000 → Physical Page A
```

主机覆盖 LBA 1000 时，FTL 通常：

```text
1. choose free Physical Page B
2. program new data into B
3. update mapping: LBA 1000 → B
4. mark A invalid
```

这叫 Out-of-Place Update：

```text
Before:
  LBA 1000 → A(valid)

After:
  LBA 1000 → B(valid)
             A(invalid)
```

从主机看，逻辑地址被原地覆盖；从 NAND 看，新数据写到了别处。

所以 SSD 的“地址”至少有两层：

```text
Host LBA
FTL physical location
```

文件系统知道前者，不知道后者。

## 映射表本身也要持久

Page-Level Mapping 灵活，但映射表很大。Controller 常在 DRAM 中缓存映射，并在 NAND 中保存持久化副本或日志。

断电发生在：

```text
new flash page programmed
→ mapping updated in DRAM
→ persistent mapping metadata not yet updated
```

设备必须能够恢复一致映射。FTL 会使用自己的 Journal、Checkpoint、Sequence Number、Metadata Page 和扫描策略。不同厂商实现属于核心固件技术，外部通常看不到细节。

没有可靠的映射恢复，即使 Payload 已写进某个 NAND Page，重启后 Controller 也可能不知道哪个 LBA 指向它。

这与数据库 WAL 有相似思想，但层次不同：

```text
Database WAL:
  recover transactions and database pages

FTL metadata log:
  recover logical-to-physical flash mapping
```

上层不能因为 SSD 内部也有日志，就省略数据库自己的事务日志。

## Garbage Collection 为什么不可避免

异地写会不断产生 Invalid Page：

```text
Block X:
  valid, invalid, invalid, valid, ...
```

NAND 只能按整个 Block 擦除。Garbage Collection 需要：

1. 选择 Victim Block；
2. 读取其中仍有效的 Page；
3. 把有效数据写到其他空闲 Page；
4. 更新映射；
5. 擦除整个 Victim Block；
6. 把它放回 Free Block Pool。

```text
Victim Block
├─ valid A ──copy──> new block
├─ invalid
├─ valid B ──copy──> new block
└─ invalid

then erase Victim Block
```

主机没有请求写 A 和 B，但 SSD 为回收空间又写了一次。这产生内部写放大。

## Write Amplification 是什么

定义一种常见形式：

```text
Write Amplification Factor
= bytes programmed to NAND / bytes written by host
```

主机写 100GB，NAND 实际编程 250GB：

```text
WAF = 2.5
```

来源包括：

- Garbage Collection 搬迁有效 Page；
- 小随机覆盖写；
- FTL Metadata；
- ECC / Parity；
- RAID-like internal protection；
- 文件系统与数据库自己的写放大；
- 低空闲空间导致 Victim Block 有更多有效数据。

WAF 影响性能和 NAND 磨损。它不是固定设备常数，会随工作负载、剩余空间、TRIM、Firmware 与温度变化。

## Over-Provisioning 为什么有用

SSD 物理 NAND 容量通常大于用户可见容量。隐藏空间用于：

- 保持 Free Block Pool；
- Garbage Collection；
- 替换坏块；
- Wear Leveling；
- 缓冲突发写。

空闲物理 Page 越充足，Controller 越容易选择 Invalid Page 较多的 Block，减少有效数据搬迁。

当 SSD 接近写满、又持续随机覆盖时：

```text
few free pages
→ aggressive garbage collection
→ more internal copies
→ higher latency and WAF
```

这就是一些 SSD 在长时间满盘写后性能明显下降的原因之一。

## TRIM / Discard 告诉 SSD 哪些 LBA 已无效

删除文件时，文件系统通常只更新自己的 Metadata。若不通知 SSD，Controller 仍认为原 LBA 保存有效数据，Garbage Collection 就可能无意义地搬运它。

Discard/TRIM 告诉设备：

```text
these logical blocks no longer contain data the host needs
```

FTL 可以把对应 Physical Page 标记为无效，提高回收效率。

TRIM 不意味着命令返回后 NAND Cell 已立即擦除，也不应被当作安全擦除的普遍保证。设备可以延迟物理擦除；加密擦除和厂商 Secure Erase 有不同语义。

## Wear Leveling 防止局部写穿

NAND Erase Block 的 Program/Erase Cycle 有限。如果日志区反复更新同一批逻辑地址，而 FTL 总使用相同物理 Block，这些 Block 会过早失效。

Dynamic Wear Leveling：

```text
rotate new writes across blocks
```

Static Wear Leveling 还会移动长期不变的冷数据，把低擦写次数 Block 释放给热数据：

```text
cold data on low-wear block
→ move cold data elsewhere
→ use low-wear block for future writes
```

Wear Leveling 会增加一部分内部搬迁，但能延长设备整体寿命。

SSD 健康指标常用 TBW、DWPD 等表达保证范围，但实际寿命还受写放大、温度、保留时间和工作负载影响。

## NAND 会出错，ECC 是正常路径

Cell 电荷会受：

- Program/Erase 磨损；
- Retention；
- Read Disturb；
- Program Disturb；
- 温度；
- 制程差异。

读取并不保证原始 Bit 永远完美。Controller 使用 BCH、LDPC 等 ECC 检测和纠正错误，必要时执行 Read Retry，尝试不同参考电压。

随着 Block 老化，纠错 Bit 数可能上升。Firmware 会：

- 刷新数据；
- 迁移弱块；
- 标记坏块；
- 使用备用块；
- 在不可纠正时向主机报告错误。

因此“SSD 没有机械部件，所以数据天然不会坏”是错误的。SSD 用复杂信号处理与冗余，把不完美 NAND 包装成可靠 Block Device。

## 并行性来自 Channel、Die 和 Plane

一颗 NAND Die 执行 Program 时有明显延迟。SSD 通过多个独立资源并行工作：

```text
Controller
├─ Channel 0 ─ Package ─ Die 0 / Die 1
├─ Channel 1 ─ Package ─ Die 0 / Die 1
├─ Channel 2 ─ ...
└─ Channel N ─ ...
```

高 Queue Depth 和较大 I/O 可以让 Controller 同时调度多个 Die，提高吞吐。

但单个 4KiB Random Read 的延迟不会因为标称“7GB/s”就变成零。带宽和延迟是不同指标：

```text
Bandwidth:
  many operations in parallel per second

Latency:
  one operation takes how long
```

数据库等系统关注的不只是平均吞吐，还要关注 P99/P999 延迟，因为 Garbage Collection、Read Retry、Thermal Throttling 会产生 Tail Latency。

## SLC Cache 为什么会“写着写着变慢”

TLC/QLC SSD 常把一部分 NAND 临时按较少 Bit 的伪 SLC 模式使用：

```text
incoming burst
→ fast SLC cache
→ background fold into TLC / QLC
```

短时 Benchmark 看起来很快；持续写满 SLC Cache 后，速度会降到原生 TLC/QLC 编程与回收能力。

Dynamic SLC Cache 大小还与剩余空闲容量有关。盘越满，可作为 Cache 的空间可能越少。

所以评估 SSD 不能只看“空盘、短时间、顺序写”的峰值：

- Sustained Write；
- Steady State Random Write；
- Queue Depth；
- Working Set；
- Filled Percentage；
- Temperature；
- Flush Frequency；
- Latency Distribution；

都会改变结果。

## “命令完成”与“断电不丢”不是天然相等

Controller 可能先把数据放入设备 DRAM：

```text
host write
→ controller DRAM cache
→ completion reported
→ NAND program later
```

如果 DRAM 没有 Power-Loss Protection，突然断电会丢失缓存内容。

存储协议通过 Flush 与 FUA 等机制表达顺序和持久化要求：

```text
write A
write B
flush
→ A and B must reach required non-volatile domain before completion
```

FUA，Force Unit Access，可要求特定写绕过或正确处理易失 Write Cache，具体语义取决于协议和实现。

带 Power-Loss Protection 的设备可以用电容在掉电时把缓存数据和 FTL Metadata 安全写入 NAND，或把缓存本身置于受保护持久域。

端到端持久化要求每一层都正确传递语义：

```text
application fsync
→ filesystem
→ block layer
→ driver
→ hypervisor, if any
→ controller
→ protected cache / NAND
```

只要中间一层错误地报告完成，上层就可能误以为数据已安全。

## 从 `write("hello")` 到 NAND 的完整时间线

假设使用普通文件、Buffered I/O，并在之后调用 `fsync()`：

```text
1. write(fd, "hello", 5)
2. VFS resolves the open file object
3. filesystem maps offset and updates cached metadata
4. data enters a dirty Page Cache page
5. write() returns 5

6. fsync(fd)
7. filesystem allocates / confirms extents
8. dirty data becomes block write requests
9. driver places NVMe commands in submission queue
10. controller DMA-reads host memory
11. FTL chooses free physical flash pages
12. controller programs NAND and updates mapping metadata
13. flush/order requirements reach protected persistent state
14. NVMe completion reaches driver
15. filesystem completes fsync()
16. fsync() returns success
```

即使如此，“hello”也不一定独占一个 NAND Page。Controller 可能将多个主机写入聚合、编码并分布到多个 Die；以后覆盖同一文件 Offset 时，还会写到另一个物理 Page。

## HDD 与 SSD 的根本差别

HDD 的主机逻辑块通常映射到旋转盘片上的扇区，主要成本来自：

```text
seek
→ rotational latency
→ transfer
```

SSD 没有机械寻道，但增加了另一组问题：

```text
cannot overwrite NAND page in place
erase is block-granular
finite P/E endurance
bit errors require strong ECC
logical mapping must survive power loss
garbage collection creates tail latency
```

两者都向主机暴露 Block Device，但内部物理规律完全不同。文件系统使用同样的 LBA 接口，不代表设备只是“更快的硬盘”。

## 如何观察 SSD，而不被 Benchmark 骗到

查看设备与挂载：

Linux：

```bash
lsblk -o NAME,TYPE,SIZE,ROTA,DISC-GRAN,DISC-MAX,MOUNTPOINTS
findmnt
```

`ROTA=0` 常表示非旋转设备，但虚拟设备信息未必反映底层全部事实。

查看 NVMe 健康信息：

```bash
sudo nvme smart-log /dev/nvme0
```

SATA / 通用 SMART：

```bash
sudo smartctl -a /dev/sda
```

字段含义和单位受厂商影响，不应只凭一个 Raw Value 下结论。

### 一个较安全的 `fio` 测试

只在有足够空间的临时目录中创建专用测试文件：

```bash
fio \
  --name=ssd-observe \
  --filename=./fio-test.bin \
  --size=1G \
  --rw=randwrite \
  --bs=4k \
  --iodepth=32 \
  --direct=1 \
  --time_based=1 \
  --runtime=60 \
  --group_reporting
```

测试后删除专用文件。不要把 `--filename` 指向原始磁盘、分区或重要数据文件。

这个测试仍有局限：

- 1GiB 可能完全落在 SLC Cache；
- 60 秒未必进入 Steady State；
- Direct I/O 不等于每次写都 Flush；
- 文件系统、加密层和虚拟化仍在路径中；
- Benchmark 会消耗 SSD 写入寿命。

要测试持久化提交成本，可使用同步写参数，但必须先理解 `fio` 版本与选项语义，并在隔离环境中执行。

## 最终答案

SSD 接收的不是“文件”和“hello”，而是对逻辑块地址的读写、Flush 和 Discard 命令。Controller 通过 FTL 把逻辑块映射到 NAND 物理 Page；由于 NAND 不能像 RAM 一样原地覆盖，更新会写到新 Page，旧 Page 失效，再由 Garbage Collection 搬迁有效数据并擦除整个 Block。

为了让这个过程可用，SSD 还必须完成：

```text
address translation
garbage collection
wear leveling
error correction
bad-block management
parallel scheduling
cache management
power-loss recovery
```

因此 SSD 不是“电子版硬盘”，而是把一种有擦写寿命、不能原地覆盖、会产生位错误的介质，通过 Controller 与 Firmware 虚拟成普通 Block Device。

应用的 `write()` 只是把数据交给这条路径的上游。只有在文件系统、Block Layer、设备缓存和 FTL 都兑现相同的 Flush 与持久化契约后，程序才能把一次写入视为真正经得住断电。
