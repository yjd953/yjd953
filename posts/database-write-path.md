# 数据库为什么不能直接把数据写进硬盘？

执行：

```sql
INSERT INTO users(id, name) VALUES (42, 'Dale');
COMMIT;
```

客户端很快收到成功。很多人会把这个过程想成：

```text
找到 users 文件
→ 在硬盘末尾写入一行
→ 返回成功
```

真实数据库不能这样工作。一条记录可能同时改变 Heap Page、多个 B+Tree Index、事务可见性信息和分配元数据；另一事务可能正在读取同一页面；机器还可能在任意指令后断电。若每个细小变化都随机同步写盘，性能会非常差；若只依赖内存，崩溃后又无法恢复。

数据库因此把一次写入拆成两条路径：

```text
Data path:
INSERT
→ Buffer Pool 中修改 Page
→ Dirty Page
→ 后台按批次 Flush
→ Filesystem / Block Layer
→ SSD

Durability path:
INSERT
→ 生成 WAL Record
→ Log Buffer
→ 顺序写 WAL
→ Flush / fsync
→ Durable Storage
→ COMMIT 成功
```

关键不是“经过的层越多越高级”，而是不同层分别承担并发、缓存、恢复、设备抽象和物理持久化。

## 先明确：“直接写硬盘”有三个歧义

第一种意思是每执行一条 SQL，就调用一次 `write()`。这仍只是写给操作系统，不一定持久化。

第二种意思是绕过 OS Page Cache，使用 Direct I/O。数据库确实可以这样做，但数据仍会经过文件系统映射、Block Layer、设备队列、SSD Controller 与内部缓存。

第三种意思是每修改一条记录，就立刻原地覆盖对应物理页并等待持久化。数据库通常不会把它作为普通提交路径，因为它既慢，也不足以保证多页更新的原子性。

所以更准确的问题是：

> 为什么数据库不能在提交时，把事务涉及的数据页全部同步原地写完，再返回成功？

下面从一次 `INSERT` 开始回答。

## SQL 到达服务器后还不是一行磁盘数据

客户端通过数据库 Wire Protocol 发送 SQL 或已绑定参数的 Prepared Statement。服务器先做：

```text
Parse
→ Bind / Name Resolution
→ Permission Check
→ Rewrite, if applicable
→ Plan
→ Execute
```

执行器找到目标表与索引，并创建一个事务上下文。写入期间还可能涉及：

- 分配事务 ID；
- 获取表、页、行或谓词相关锁；
- 生成 MVCC 版本；
- 检查 Unique / Foreign Key / Check Constraint；
- 触发 Trigger；
- 更新主键和二级索引；
- 记录 Undo 或旧版本信息，取决于引擎。

这说明一条 SQL 的原子性范围远大于“一行文本”。

例如表有两个索引：

```sql
CREATE TABLE users (
  id bigint PRIMARY KEY,
  email text UNIQUE,
  name text
);
```

插入一行可能修改：

```text
table heap / clustered index page
primary-key B+Tree pages
email unique B+Tree pages
free-space metadata
transaction visibility metadata
```

其中任意一步失败，都不能让外界看到“表里有行但索引里没有”或“一个索引已更新、另一个没有”的半完成状态。

## 数据库的基本 I/O 单位通常是 Page

磁盘上的表通常按固定大小 Page 组织，而不是每行一个独立文件操作。常见 Page 大小可能是 8KiB、16KiB 等，具体取决于数据库和配置。

一页内部可能包含：

```text
Page Header
Slot / Item Directory
Tuple or Record Area
Free Space
Checksum / LSN / Flags
```

一条 100 Bytes 的记录插入后，数据库最终需要更新所在的整个 Page 状态。B+Tree 节点也是 Page；节点满时还可能 Split：

```text
one leaf page full
→ allocate new page
→ redistribute keys
→ update sibling links
→ insert separator into parent
→ parent may also split
```

如果事务提交前同步写完所有相关 Page，一次小 `INSERT` 可能变成多次随机 I/O 和多次同步等待。

## Buffer Pool：数据库自己的页面缓存

数据库首先在内存中的 Buffer Pool 查找目标 Page：

```text
page_id
→ buffer hash / page table
→ in-memory frame
```

如果命中，执行器直接操作内存 Frame；若不命中：

```text
choose victim frame
→ flush it first if dirty
→ read target page from storage
→ verify page
→ install mapping
```

Buffer Pool 不只是“为了读得快”。它还让数据库拥有页面级控制：

- 哪些 Page 热，应该保留；
- 哪些 Page 被并发访问，需要 Latch；
- 哪些 Page 已修改但未写回；
- Page 对应的最新 Log Sequence Number；
- 什么时候预取或批量刷脏；
- 如何满足 WAL-before-data 的顺序。

### Lock 和 Latch 不是同一个东西

事务 Lock 保护逻辑数据与隔离级别，例如阻止两个事务产生冲突更新。

Latch 是数据库内部短期同步原语，保护 Buffer Pool 中 Page 或索引结构在并发线程下不被破坏。

```text
Lock:
  lifetime may span transaction
  protects logical rows / keys / predicates

Latch:
  held for short critical section
  protects in-memory data structure
```

一次写入常同时涉及两者。

## 修改发生在内存，Page 先变成 Dirty

数据库把新记录写入 Buffer Pool 中的 Page，并设置 Dirty 标记：

```text
Disk page:      old version
Buffer frame:   new version, dirty=true
```

Dirty 表示内存版本比持久化数据文件中的版本新。此时数据页本身还不必写盘。

数据库这么做有直接收益：

### 合并多次修改

同一 Page 在短时间内插入 100 条记录：

```text
100 in-memory modifications
→ possibly 1 later page write
```

若每次都同步原地写 Page，会产生大量重复 I/O。

### 把随机前台写变成可调度后台写

前台事务关注低延迟；后台 Flusher 可以：

- 批量收集 Dirty Page；
- 控制刷盘速率；
- 尽量形成更友好的 I/O；
- 避免 Buffer Pool 被脏页塞满；
- 配合 Checkpoint 限制恢复时间。

SSD 没有机械寻道，但随机小写仍有队列、FTL 映射、Flash Page 编程和 Garbage Collection 成本。批量与顺序性依然有价值。

## 只改 Buffer Pool 为什么不安全

如果数据库在 Dirty Page 还只存在于 RAM 时回复 `COMMIT`，机器断电后新值消失：

```text
client saw COMMIT success
→ power loss
→ RAM lost
→ data file still old
```

这违反事务 Durability。

直觉方案是：提交时把事务改过的所有数据 Page 同步刷盘。但这又产生三个问题。

### 问题一：随机 I/O 太多

一个事务可能修改分散在多个表和索引中的 Page。逐页同步等待，提交延迟与吞吐都难以接受。

### 问题二：多页写没有整体原子性

假设事务修改 Page A、B、C：

```text
write A success
write B success
power loss before C
```

磁盘上得到半个事务。普通 Block Device 不提供“把任意多个离散 Page 作为一个原子组提交”的通用接口。

### 问题三：单页也可能撕裂

数据库 Page 往往大于存储设备保证的原子写入单位。断电时，8KiB 或 16KiB Page 可能只有部分扇区更新：

```text
first sectors: new
last sectors: old
```

这叫 Torn Page。文件系统日志通常保护文件系统自身元数据一致性，不自动保证数据库数据页的业务级原子更新。

WAL 正是为这些问题提供恢复依据。

## WAL：先记录“如何重做”，再慢慢写数据页

Write-Ahead Logging 的核心规则：

> 某个数据页的新版本写入持久化存储之前，描述该修改的日志必须先持久化。

对一次插入，可抽象出 WAL Record：

```text
LSN: 847201
Transaction: 9007
Page: users/segment-3/page-18
Operation: insert tuple at slot 12
Payload: ...
Previous LSN: ...
Checksum: ...
```

不同数据库的日志是 Physical、Logical 或 Physiological 的不同组合。不能把这个示意格式当成 PostgreSQL、InnoDB 或其他引擎的真实二进制结构。

执行时形成：

```text
1. Modify page in Buffer Pool
2. Assign / attach WAL LSN
3. Append WAL record to in-memory Log Buffer
4. Mark page dirty
```

提交时，关键动作通常是确保与该事务提交相关的 WAL 已到达要求的持久化边界：

```text
flush WAL through commit_lsn
→ durable
→ report COMMIT success
```

数据 Page 仍可以稍后写回，因为崩溃后能用 WAL 重做。

## 数据路径和日志路径不是一条直线

“Database → Buffer Pool → WAL → Page Cache → SSD”容易让人误解成一份数据依次穿过所有层。实际上至少有两股 I/O：

```text
                      ┌→ WAL Buffer
Transaction Changes ──┤   → WAL File
                      │   → fsync / durable flush
                      │
                      └→ Buffer Pool Data Page
                          → Dirty Page Queue
                          → Data File Writeback
```

日志路径通常：

- 追加写；
- 写量相对紧凑；
- 位于 Commit 延迟关键路径；
- 必须满足明确的顺序和持久性要求。

数据页路径通常：

- 位置分散；
- 可以在后台批量处理；
- 同一页的多次变更可合并；
- 受 Checkpoint、Buffer 回收和脏页比例驱动。

WAL 用较便宜的顺序持久化，把昂贵的数据页随机写从前台提交路径移开。

## Group Commit 为什么有效

假设并发事务产生提交 LSN：

```text
T1 commit_lsn = 100
T2 commit_lsn = 130
T3 commit_lsn = 170
```

数据库不必为每个事务分别执行一次持久化 Flush。一次把 WAL 刷到 `170`：

```text
durable_lsn >= 170
```

就同时满足 T1、T2、T3。

```text
many transactions
→ one batched WAL write
→ one storage flush
→ many commit acknowledgments
```

这叫 Group Commit。它把昂贵的同步边界分摊给多个事务，是高并发数据库吞吐的重要来源。

提交是否等待 WAL 真正持久化取决于配置。异步提交可以更快，但崩溃时可能丢失已经向客户端报告成功的最近事务。性能开关背后是明确的 Durability 语义变化。

## WAL-before-data 如何被执行

每个 Dirty Page 通常记录与其最新变更相关的 Page LSN。后台准备写该 Page 前，要确认：

```text
durable_wal_lsn >= page_lsn
```

如果 WAL 还没持久化，先推动 WAL Flush，再允许数据页落盘。

否则可能出现：

```text
new data page persisted
WAL record not persisted
power loss
```

恢复程序会看到一个数据文件中的新变化，却没有足够日志解释它属于哪个事务、是否应该保留。这正是 Write-Ahead 中“日志在前”的含义。

WAL 规则不是“WAL 文件永远比所有数据文件新”，而是对每个允许落盘的数据页版本建立日志持久化先后关系。

## Checkpoint 限制恢复范围

如果数据页一直不刷，WAL 可以恢复正确状态，但重启时可能要从很久以前重放大量日志，WAL 本身也不能无限保留。

Checkpoint 推动一批 Dirty Page 写回，并记录一个恢复起点。其目标不是让数据库从此“没有脏页”，而是建立：

```text
从某个已知点开始重放 WAL
足以恢复后续状态
```

Checkpoint 太频繁：

- 数据页写放大增加；
- I/O 峰值明显；
- 前台延迟可能抖动。

Checkpoint 太稀疏：

- 崩溃恢复时间变长；
- WAL 保留量增加；
- Dirty Page 积累更多。

数据库需要在运行写入成本与恢复目标之间平衡。

## 进入操作系统：`write()` 仍不等于落盘

数据库最终通过 `write()`、`pwrite()`、`writev()` 或异步 I/O 接口提交数据。

使用 Buffered I/O 时：

```text
Database Buffer Pool
→ copy to OS Page Cache
→ write() returns
→ kernel writeback later
→ block I/O
→ device
```

此时 `write()` 返回，只表示内核接收了数据。断电会丢失尚在 DRAM 中的 Page Cache。

要请求持久化，数据库使用类似：

```c
fsync(fd);
fdatasync(fd);
```

具体使用哪种调用、是否同步目录、如何处理日志切换和文件扩展，取决于数据库与文件系统。

### 为什么数据库已经有 Buffer Pool，OS 还有 Page Cache

二者职责不同：

```text
Database Buffer Pool:
  understands page identity, dirty LSN, latch, eviction policy

OS Page Cache:
  provides generic file cache and buffered writeback
```

双重缓存可能浪费内存并产生不可控回写，所以许多数据库会对数据文件使用 Direct I/O 或类似机制，绕过普通 Page Cache；WAL 路径也可能采用不同策略。

因此“数据库数据一定先进入 OS Page Cache”不是普遍真理。正确表述是：

- Buffered I/O 路径会经过 Page Cache；
- Direct I/O 可绕过普通文件数据 Page Cache；
- 两者仍经过内核文件、块设备和驱动栈；
- Metadata 与控制路径仍可能涉及文件系统缓存。

## Filesystem 增加名字、空间映射和一致性

数据库看到的是文件与 Offset：

```text
data/users.dat, offset 147456
wal/000000010000000000000042, offset 8192
```

文件系统负责把它们映射到存储设备上的 Block，并管理：

- Inode 或对应 Metadata；
- Extent / Block Mapping；
- 文件大小；
- 空闲空间；
- 目录项；
- 权限；
- 文件系统自己的 Journal 或 Copy-on-Write Metadata。

数据库 WAL 与文件系统 Journal 解决的问题不同：

```text
Database WAL:
  transaction and database-page recovery

Filesystem journal:
  filesystem metadata / structural consistency
```

文件系统恢复后能保证“这个文件结构可访问”，不代表数据库多个数据页组成的事务天然一致。

文件扩展、重命名和创建新 WAL Segment 还涉及目录 Metadata。仅对文件内容 `fsync` 是否足够，要看具体操作和文件系统持久化规则。

## Block Layer 把文件写变成设备请求

文件系统把逻辑文件范围映射成 Block I/O：

```text
file offset
→ filesystem extent
→ logical block address
→ block request queue
→ device driver
```

Block Layer 可能执行：

- 合并相邻请求；
- 调度队列；
- 维护 I/O 优先级；
- 向 NVMe 多队列提交 Command；
- 报告完成状态。

数据库的 8KiB Page、文件系统 Block、传统 512B Sector、设备 4KiB Logical Block 和 NAND Flash Page 不是同一个概念。它们处在不同抽象层，大小也可能不同。

## `fsync()` 如何到达 SSD

从应用看，`fsync()` 要求此前对文件的相关修改达到系统定义的持久化边界。内核需要：

```text
flush dirty page-cache data, if buffered
→ submit block writes
→ wait for completion
→ issue cache flush / FUA as required
→ return
```

但最终正确性还依赖设备诚实实现持久化语义。

SSD Controller 可能有 DRAM Cache。若设备过早报告完成、断电保护失效，数据仍可能丢失。企业 SSD 常提供 Power-Loss Protection；消费级设备的保证和行为可能不同。

NVMe、SATA 与虚拟化存储的 Flush/FUA 细节不同。数据库依赖的是端到端契约：

```text
Database asks for ordering/durability
→ OS preserves it
→ filesystem preserves it
→ driver preserves it
→ controller preserves it
→ device reaches non-volatile media or protected cache
```

任何一层撒谎，WAL 算法本身也无法凭空保证持久性。

## SSD 内部仍会再次改写位置

数据库和文件系统提交的是 Logical Block Address。SSD Controller 通过 FTL 映射到 NAND 物理位置：

```text
LBA
→ FTL mapping
→ NAND channel / die / plane / block / page
```

NAND 通常不能原地覆盖已编程 Page。新数据写到其他空闲 Page，旧 Page 标记失效，后续 Garbage Collection 再搬迁有效数据并擦除整个 Erase Block。

所以数据库所谓“原地更新 Page”，到 SSD 内部也常是 Redirect-on-Write。Buffering、批量和顺序写有助于减少设备内部写放大，但最终行为取决于工作负载和 FTL。

## 一次提交的真实时间线

把各层放在一起，可得到更准确的主线：

```text
Client sends INSERT
→ SQL parse / plan / execute
→ acquire logical concurrency controls
→ locate data and index pages in Buffer Pool
→ modify in-memory pages
→ mark pages dirty and assign LSN
→ append change records to WAL Buffer
→ append COMMIT record
→ flush WAL through commit LSN
→ filesystem / block layer / SSD confirms durability
→ database replies COMMIT success

Later:
→ background writer selects dirty pages
→ ensure corresponding WAL is durable
→ write data pages
→ checkpoint advances
```

不同数据库的细节不同：

- PostgreSQL 使用 MVCC Tuple、WAL、Checkpointer 等机制；
- InnoDB 还有 Redo Log、Undo Log、Doublewrite Buffer、Clustered Index 等实现；
- LSM Tree 引擎会写 MemTable 与 WAL，后台再 Flush SSTable 和 Compaction；
- 分布式数据库还要等待 Replication 或 Consensus Quorum。

但核心矛盾相似：前台需要快速提交，后台需要高效整理数据，崩溃后还必须恢复出一致状态。

## 断电发生在不同位置会怎样

### WAL 和数据页都没持久化

事务未被确认。重启后看不到它是合理的。

### WAL 已持久化，数据页未持久化

事务可在 Recovery 中通过 Redo 恢复。这是 WAL 设计允许的正常状态。

### 部分数据页持久化，WAL 已持久化

Recovery 根据 Page LSN、WAL 与事务状态决定哪些操作需要重做或撤销/忽略，具体取决于恢复算法。

### 数据页先持久化，WAL 未持久化

这违反 WAL-before-data，可能使恢复失去判断依据。数据库必须通过写入顺序控制避免。

### WAL `write()` 返回，但没有 Flush

数据可能仍在 OS Page Cache 或设备易失缓存中。如果数据库已经对客户端承诺同步持久化，崩溃后丢失就违反契约。

## 为什么“层多”反而能更快

直觉认为中间层越少越快。但这些层主要用于把昂贵操作移出关键路径和合并重复工作：

```text
Buffer Pool
→ repeated page updates collapse into fewer writes

WAL
→ random multi-page changes become sequential durable append

Group Commit
→ many transactions share one flush

Filesystem / Block Layer
→ generic allocation, batching, queueing, device abstraction

SSD Controller
→ parallel channels, wear leveling, error correction
```

层次会产生开销，也会产生控制问题，例如 Double Buffering、Checkpoint 抖动和写放大。因此成熟数据库会绕过某些缓存、调整 I/O Scheduler、分离 WAL 设备或限制后台刷盘速率。重点不是层越多越好，而是每层承担的职责必须与持久化契约一致。

## 可以观察什么

以 PostgreSQL 为例，可以从数据库内部观察 WAL 与 Checkpoint 的趋势。具体系统视图随版本变化：

```sql
SELECT * FROM pg_stat_wal;
SELECT * FROM pg_stat_bgwriter;
```

查看当前 WAL 位置：

```sql
SELECT pg_current_wal_lsn();
```

在 Linux 上可观察进程系统调用：

```bash
sudo strace -ff -e trace=write,pwrite64,fsync,fdatasync \
  -p <database-pid>
```

生产数据库不应随意附加追踪器；它可能影响时序和性能。更稳妥的方法是使用数据库自身指标、eBPF 工具或专门测试环境。

观察 Block I/O：

```bash
iostat -x 1
```

这些工具能看到写入大小、等待与队列趋势，但无法单凭一次 `write()` 证明数据已经进入 NAND。要理解持久性，必须同时知道数据库配置、文件系统 Mount Option、虚拟化层和设备 Flush 语义。

## 最终答案

数据库不是“不能”直接调用存储接口，而是不能把每个事务的所有数据页同步原地写完当作唯一正确方案。

直接数据页写入同时面对：

- 多页事务无法由普通磁盘写天然原子提交；
- 小而随机的同步 I/O 成本高；
- 同一 Page 的重复更新产生大量写放大；
- 断电可能留下部分新、部分旧甚至撕裂的 Page；
- 并发事务需要数据库级可见性与恢复语义。

数据库因此在 Buffer Pool 中高效修改 Page，用 WAL 建立可恢复的持久化顺序，再由后台把 Dirty Page 批量写入数据文件。OS Page Cache、Filesystem、Block Layer 和 SSD Controller 继续把“文件偏移写入”翻译成设备可执行并可持久化的操作。

真正的提交边界不是“数据行已经出现在数据文件里”，而是：

```text
数据库已经持久保存了足够的信息，
即使现在崩溃，也能恢复出这次事务承诺的结果。
```

这就是 WAL、Buffer Pool 和多层存储路径存在的根本原因。
