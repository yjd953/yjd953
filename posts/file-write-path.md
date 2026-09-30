# 一个文件到底是怎么存进硬盘的？

严格说，不能只调用：

```c
write("hello");
```

POSIX `write()` 至少需要一个文件描述符：

```c
write(fd, "hello", 5);
```

这个 `fd` 从哪里来？`hello` 写到了哪个文件？为什么 `write()` 返回后拔电源仍可能丢失？文件名、Inode、Page Cache 和硬盘 Block 又是什么关系？

一条典型路径是：

```text
Path
→ open()
→ File Descriptor
→ Open File Description
→ VFS
→ Dentry / Inode
→ Page Cache
→ Filesystem Extent / Block
→ Block Device
→ SSD
```

要理解“文件存在哪里”，必须同时看命名、运行时对象、缓存和持久化数据四个层次。

## 先写一个最小程序

```c
#include <fcntl.h>
#include <unistd.h>

int main(void) {
    int fd = open(
        "message.txt",
        O_WRONLY | O_CREAT | O_TRUNC,
        0644
    );
    if (fd == -1) return 1;

    const char *data = "hello";
    ssize_t n = write(fd, data, 5);
    if (n != 5) return 2;

    if (fsync(fd) == -1) return 3;
    if (close(fd) == -1) return 4;
    return 0;
}
```

程序做了四件不同的事：

```text
open   解析名字并建立进程到文件的引用
write  修改文件内容
fsync  请求把相关状态推进到持久化边界
close  释放本进程的文件描述符引用
```

`close()` 不等于 `fsync()`；`write()` 成功也不等于数据已进入 NAND。

## 文件名不是文件本体

路径：

```text
/home/dale/message.txt
```

是从目录树寻找对象的方式。路径中的每一段通常对应 Directory Entry：

```text
/
└─ home
   └─ dale
      └─ message.txt
```

在传统 Unix 文件系统模型中，目录项主要建立：

```text
name → inode number
```

Inode 保存文件元数据，例如：

- 文件类型；
- 权限与所有者；
- 文件大小；
- 时间戳；
- Link Count；
- 数据 Extent 或 Block 映射；
- 扩展属性引用；
- 文件系统状态字段。

文件名通常不存放在目标文件自己的 Inode 中，而存在父目录的数据结构里。因此同一个 Inode 可以有多个名字，也就是 Hard Link：

```text
name-a ─┐
        ├→ inode 1207 → data blocks
name-b ─┘
```

“文件就是文件名”从一开始就不准确。

## `open()` 如何沿路径找到 Inode

程序调用：

```c
open("message.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
```

现代 Linux libc 常最终使用 `openat()` 或相关系统调用。内核从以下位置开始 Path Walk：

- 绝对路径从进程 Root 开始；
- 相对路径从 Current Working Directory 或给定 Directory FD 开始。

每个路径组件都要：

```text
lookup name in current directory
→ permission check
→ follow mount point if needed
→ resolve symlink according to rules
→ reach next dentry/inode
```

Linux VFS 使用 Dentry Cache 和 Inode Cache 减少重复读取目录和 Metadata：

```text
Dentry:
  cached relationship between a name and inode

Inode:
  cached in-memory representation of filesystem object metadata
```

Dentry 不等于磁盘目录项的原样复制，VFS Inode 也不等于所有文件系统都以同样二进制布局存储 Inode。它们是内核统一接口中的对象。

### `O_CREAT`

若文件不存在，文件系统要：

- 检查父目录写权限；
- 分配新 Inode；
- 在父目录加入名字映射；
- 初始化 Mode、Owner、Timestamp；
- 之后在需要时分配数据空间。

### `O_TRUNC`

若普通文件已存在且允许写，文件长度被截为零。旧数据 Block 可被释放或延迟处理。这个 Metadata 修改也需要崩溃一致性保护。

## File Descriptor 只是进程内的整数索引

`open()` 返回：

```text
fd = 3
```

数字 `3` 本身不在磁盘上。它是当前进程 File Descriptor Table 的索引：

```text
Process fd table
├─ 0 → stdin
├─ 1 → stdout
├─ 2 → stderr
└─ 3 → open file description
```

Linux 内核术语中的 Open File Description 可抽象为：

```text
current file offset
open status flags
reference to inode / file object
credentials and operation table
```

这解释了几个行为。

### 两次独立 `open()` 通常有独立 Offset

```c
int a = open("x", O_WRONLY);
int b = open("x", O_WRONLY);
```

`a` 与 `b` 指向同一文件对象，但拥有各自 Open File Description，因此文件 Offset 独立。

### `dup()` 或 `fork()` 后可共享 Offset

复制 Descriptor 常让两个 FD 引用同一个 Open File Description：

```text
fd 3 ─┐
      ├→ one open file description → inode
fd 7 ─┘
```

一方写入推进 Offset，另一方观察到相同 Offset。

### FD 只在进程上下文中有意义

另一个进程的 FD `3` 可以指向完全不同的对象。向远程 API 传整数 `3`，不会自动传递文件访问能力。Unix Domain Socket 的 Descriptor Passing 是专门机制。

## `write()` 首先处理 Offset 和权限

调用：

```c
write(fd, "hello", 5);
```

CPU 从用户态进入内核态。内核大致执行：

```text
validate fd
→ find open file description
→ check writable mode
→ determine current offset
→ call filesystem write path
→ copy or pin user memory
→ update offset
→ return byte count
```

若当前 Offset 为 0，成功写入 5 Bytes 后通常变为 5。

`pwrite()` 显式给出 Offset，不修改共享 File Offset：

```c
pwrite(fd, "hello", 5, 0);
```

### `O_APPEND` 不只是先 `lseek`

多个进程向同一文件追加时，用户态执行：

```text
lseek(fd, 0, SEEK_END)
write(fd, data, len)
```

两步之间存在 Race。`O_APPEND` 要求内核把“定位到当前末尾并写入”作为单次写操作的一部分处理。

但这不意味着任意大的并发写永远以应用消息为单位完全不可交错，也不自动提供事务持久性。具体原子性受文件类型、文件系统和接口保证限制。

## `write()` 允许部分成功

返回值可能小于请求长度：

```c
ssize_t n = write(fd, buf, len);
```

原因可能包括：

- 磁盘空间不足；
- 文件大小限制；
- Signal；
- I/O Error；
- Non-blocking 对象当前无法接收更多；
- 特定文件或设备语义。

正确调用方要处理：

```c
size_t written = 0;
while (written < len) {
    ssize_t n = write(fd, buf + written, len - written);
    if (n > 0) {
        written += (size_t)n;
        continue;
    }
    /* handle EINTR and real errors */
}
```

普通 Buffered Regular File 写入常一次接收全部小 Buffer，但不能把常见现象误当 API 的绝对承诺。

## Buffered Write 先进入 Page Cache

常见写路径不是直接提交 SSD Command，而是定位文件对应的 Page Cache Page：

```text
key: inode + file page index
```

例如 OS Memory Page 为 4KiB，写 Offset 0..4：

```text
File Page 0
┌───────────────────────────────────────┐
│ hello │ unchanged / zeroed area ...   │
└───────────────────────────────────────┘
```

内核把用户态的 5 Bytes 复制进去，并标记 Dirty：

```text
page.dirty = true
```

同时更新内存中的文件大小和时间等状态。随后 `write()` 就可能返回。

因此此时文件同时存在多个表示：

```text
Persistent data blocks: old content
Page Cache:             new content "hello"
In-memory inode:        new size = 5
```

对同一机器上的后续 `read()`，内核通常从 Page Cache 返回新内容，所以程序能立刻读到 `hello`。这证明缓存一致，不证明数据已持久。

## 文件系统可能延迟分配物理 Block

写入发生时，文件系统不一定马上决定最终 Block 位置。Delayed Allocation 可以先记录：

```text
file logical range 0..4095 is dirty
physical extent not chosen yet
```

等 Writeback 时再为一批数据选择连续 Extent。好处包括：

- 更好的空间布局；
- 减少碎片；
- 合并小写；
- 避免很快被覆盖的数据产生无效分配。

代价是 `write()` 成功时，物理空间可能还没真正分配。文件系统必须处理后续 ENOSPC、Writeback Error 和崩溃语义。

Sparse File 更能说明逻辑大小与物理占用不同：

```c
lseek(fd, 1L << 30, SEEK_SET);
write(fd, "x", 1);
```

文件逻辑大小约 1GiB，但中间 Hole 不必占据真实数据 Block；读取 Hole 时返回零。

```text
logical file:
[hole........................][x]

allocated blocks:
                              [block]
```

## Inode 如何找到文件内容

简单模型会把 Inode 画成一组 Direct/Indirect Block Pointer。现代文件系统常使用 Extent：

```text
file logical blocks 0..127
→ device logical blocks 900000..900127
```

Extent 用“起点 + 长度”描述连续区域，减少大文件映射 Metadata。

读取某个 Offset：

```text
offset
→ logical file block
→ extent lookup
→ device LBA
→ block read
→ page cache
→ user buffer
```

写入时，Extent Tree 自身也可能改变。因此保存 5 Bytes 可能涉及的不只数据：

- 文件数据块；
- Inode Size；
- Extent Metadata；
- Free-Space Bitmap/Tree；
- Parent Directory，若文件刚创建；
- 文件系统 Journal 或新的 Copy-on-Write Tree Node。

## 文件系统 Journal 保护什么

假设创建文件需要：

```text
allocate inode
allocate data block
add directory entry
update free-space metadata
```

若这些 Metadata 原地更新到一半就断电，文件系统结构可能自相矛盾。Journaling Filesystem 先记录一组 Metadata 变更，再按协议应用到主位置。

常见思想：

```text
begin transaction
→ log metadata changes
→ commit journal transaction
→ write home locations
→ checkpoint / reclaim journal
```

具体模式可能只 Journal Metadata，也可能 Journal Data。以 Linux ext4 为例，不同 Data Mode 的顺序与保证不同；其他文件系统采用 Copy-on-Write 或各自日志机制。

文件系统 Journal 主要保证：

```text
after crash, filesystem structure remains recoverable
```

它不自动保证：

```text
application's several files form one business transaction
```

数据库仍需要 WAL，应用仍需正确使用 `fsync()`、原子 Rename 或事务存储协议。

## Dirty Page 如何被写回

Writeback 可由多种条件触发：

- Dirty Page 存在太久；
- 脏页占比达到阈值；
- 内存回收；
- `fsync()` / `fdatasync()`；
- `sync()`；
- 文件系统 Checkpoint；
- 应用显式同步写。

内核与文件系统大致执行：

```text
collect dirty pages
→ allocate / resolve extents
→ build block I/O
→ preserve required data/metadata ordering
→ submit to block layer
→ mark writeback completion
```

多个相邻 File Page 可以形成更大、更连续的 I/O。一次 5-Byte 修改最终可能写一个完整文件系统 Block 或存储逻辑块范围。

Page Cache 的 Page、Filesystem Block、Block Device Logical Block 与 SSD NAND Page 不是同一个单位：

```text
VM page:             CPU/OS memory management
filesystem block:    file layout and allocation
device logical block:LBA interface
NAND page:           flash read/program unit
```

它们可能恰好同为 4KiB，也不能因此视为同一个对象。

## Block Device 与 SSD 看不到文件名

文件系统生成请求：

```text
WRITE LBA 900000, length 4096
```

到了设备层，`message.txt` 这个名字已经不存在。SSD 只看到：

- Read / Write / Flush / Discard 等命令；
- LBA；
- Block Count；
- Queue / Command ID；
- Flags。

SSD Controller 的 FTL 再把 LBA 映射到 NAND 位置。覆盖同一 LBA 时，它通常写入新 NAND Page、更新映射并把旧 Page 标记无效。

所以问“`message.txt` 在 NAND 的哪几格”通常没有稳定答案：

- 文件系统 Extent 可能变化；
- SSD FTL 映射对主机不可见；
- Garbage Collection 会在主机不写该文件时迁移物理 Page；
- Snapshot、Compression、Encryption、RAID 和虚拟化还会加入更多映射。

路径名只存在于文件系统命名层，不会一路刻在每个 NAND Page 上。

## `fsync()` 到底补上什么

普通 `write()` 只要求内核接受数据。`fsync(fd)` 请求把文件内容和恢复该内容所需 Metadata 同步到持久化存储。

简化顺序：

```text
dirty file pages
→ allocate blocks
→ write data
→ journal / metadata ordering
→ device cache flush as required
→ wait
→ fsync returns
```

`fdatasync()` 可减少与数据检索无关的 Metadata 同步，但文件大小等必要 Metadata 仍需处理。实际差异由平台决定。

### `close()` 为什么不够

`close(fd)` 释放 Descriptor 引用并报告一部分延迟错误，但系统通常仍可把 Dirty Page 留在 Page Cache，稍后后台写回。

```text
write
→ close
→ program exits
→ kernel still has dirty pages
```

因此“程序正常退出了”不等于“机器断电也不会丢”。

### 文件 `fsync()` 为什么有时还不够

创建新文件涉及父目录中的名字映射：

```text
message.txt → inode 1207
```

为了保证断电后名字也存在，常见持久写模式要同步文件，再同步父目录：

```c
fsync(file_fd);
fsync(directory_fd);
```

具体要求和实现受操作系统、文件系统以及操作类型影响，但不能默认“文件内容同步”必然包含所有目录项持久化。

## 如何原子替换配置文件

直接覆盖原文件：

```text
open config
truncate
write new bytes
crash halfway
```

可能留下空文件或半份内容。常见模式：

```text
1. create temp file in same directory
2. write complete new content
3. fsync(temp file)
4. rename(temp, target)
5. fsync(parent directory)
```

同一文件系统内的 `rename()` 通常提供命名层面的原子切换：

```text
reader sees old complete file
or new complete file
not a half-renamed name
```

但原子可见性不等于断电持久性。`fsync` 步骤用于确保内容和目录变更经得住崩溃。还要处理权限、Owner、扩展属性、备份策略和失败清理。

## `unlink()` 后文件为什么还能读

打开文件后执行：

```c
unlink("message.txt");
```

删除的是目录中的名字：

```text
message.txt -X-> inode
```

只要进程仍持有打开引用：

```text
fd → open file description → inode → data
```

它仍然可以读写。等 Link Count 为零且最后一个打开引用释放后，文件系统才回收 Inode 和数据 Block。

这说明文件有两个独立生命周期：

```text
namespace lifetime: path / hard links
open-reference lifetime: fd / kernel references
```

Linux 上，日志文件被删除但进程仍打开时，`df` 可能显示空间未释放。可查：

```bash
lsof +L1
```

这类“deleted but open”文件没有正常路径名，却仍作为内核和文件系统对象存在。

## `mmap()` 写文件走哪条路

应用还可以：

```c
void *p = mmap(..., MAP_SHARED, fd, 0);
memcpy(p, "hello", 5);
```

CPU Store 修改映射的文件 Page，页面变 Dirty。持久化通常需要：

```c
msync(..., MS_SYNC);
```

并根据 Metadata 与目录操作考虑 `fsync()` 等要求。

`mmap` 省去了显式 `write()` 调用形式，但没有绕过 Page Cache、文件系统和持久化协议。异常访问还可能通过 Page Fault 延迟载入 Page。

## Direct I/O 改变缓存，不改变文件概念

使用 `O_DIRECT` 等机制时，文件数据可绕过普通 Page Cache：

```text
user buffer
→ filesystem direct-I/O path
→ block layer
→ device
```

它通常对 Buffer Alignment、Offset 和 Length 有要求，且语义因平台与文件系统而异。

Direct I/O 可以：

- 避免数据库 Buffer Pool 与 OS Page Cache 双重缓存；
- 减少复制或缓存污染；
- 让应用更直接控制 I/O。

但它不表示：

- 不经过文件系统；
- 数据已自动持久；
- 不需要 Flush；
- 每次小写都高效；
- 不受设备 Cache 与 FTL 影响。

同步性和缓存绕过是两个独立维度。

## 崩溃点实验

可以把程序改成几个版本，在一次性测试环境观察。

### 版本 A：只 `write`

```text
open
write("hello")
sleep
```

另一个进程立刻能读到 `hello`，因为 Page Cache 已更新。此时强制断电，内容未必持久。

### 版本 B：`write` 后 `close`

进程退出后文件通常仍可见，后台也可能很快写回。但这不能建立严格断电保证。

### 版本 C：`write` 后 `fsync`

在存储栈正确实现 Flush 契约的前提下，返回后内容获得更强持久性保证。

### 版本 D：新建、`fsync(file)`，不 `fsync(dir)`

可测试内容与目录项持久化是不同问题。不同文件系统和内核版本的结果可能不同，不能以一次实验反推通用标准。

真正 Power-Loss 实验应在可丢弃虚拟机或专用测试设备中，从系统外部强制掉电。`kill -9` 只杀进程，不会清空 OS Page Cache。

## 用工具观察路径

### 查看系统调用

Linux：

```bash
strace -e trace=openat,write,fsync,close ./write-demo
```

可能看到：

```text
openat(..., "message.txt", O_WRONLY|O_CREAT|O_TRUNC, 0644) = 3
write(3, "hello", 5) = 5
fsync(3) = 0
close(3) = 0
```

这只能证明进程发出了哪些系统调用，不能单独证明 SSD Firmware 最终如何放置数据。

macOS 可使用 `dtruss`、`fs_usage` 等系统工具，但权限与 System Integrity Protection 会影响可用性。

### 查看 Inode 与 Block 占用

Linux：

```bash
stat message.txt
ls -li message.txt
du -h message.txt
du -h --apparent-size message.txt
```

`ls -li` 可观察 Inode Number；`du` 的实际占用和表观大小在 Sparse File 中会明显不同。

查看 Extent：

```bash
filefrag -v message.txt
```

输出是文件系统到逻辑 Block 的映射，不是 SSD 内部 NAND 物理位置。

### 查看打开文件

```bash
lsof message.txt
ls -l /proc/<pid>/fd
```

`/proc` 是 Linux 接口；macOS 可主要使用 `lsof`。

### 观察写回

Linux 可查看：

```bash
grep -E 'Dirty|Writeback' /proc/meminfo
```

全局数字变化受整个系统影响。要归因单个进程，需要更精细的 Tracepoint、eBPF 或文件系统工具。

## “文件”到底在哪里存在

可以把答案分成五层。

### 命名层

```text
directory entry: "message.txt" → inode
```

回答“通过什么名字找到它”。

### 元数据层

```text
inode / filesystem metadata
```

回答“它是什么类型、多大、谁能访问、数据映射在哪里”。

### 进程运行时层

```text
fd → open file description → inode
```

回答“这个进程正在以什么模式、什么 Offset 使用它”。

### 缓存层

```text
page cache + dirty state
```

回答“当前最新字节是否暂存在 RAM，以及何时待写回”。

### 持久化层

```text
filesystem blocks
→ logical block device
→ controller mapping
→ physical media
```

回答“断电后可从哪里恢复内容与结构”。

没有任何一个对象单独等于完整的“文件”。文件是这些层共同维护的一组语义。

## 最终答案

`write(fd, "hello", 5)` 首先通过 FD 找到进程打开的文件对象，再通过 VFS 和 Inode 定位文件。普通 Buffered I/O 把字节写入以 Inode 和文件页号索引的 Page Cache，更新内存 Metadata 并把页面标记为 Dirty。文件系统随后分配 Extent，把文件 Offset 映射成 Block Device LBA；Block Layer 与驱动把请求交给 SSD；SSD 的 FTL 最终再映射到 NAND Page。

文件名没有被写进每个数据块，FD 也不是文件本体：

```text
Path     是名字
FD       是进程内句柄
Inode    是文件系统对象与元数据
Page Cache 是当前内存副本
Block    是文件系统和设备的分配单位
NAND Page 是 SSD 内部物理存储单位
```

`write()` 返回只表示内核接受了数据；`close()` 通常也不建立断电持久性。只有应用发出正确同步请求，文件系统维护好数据与 Metadata 顺序，Block Layer 和 SSD 又兑现 Flush 契约，`hello` 才真正成为断电后仍可找回的文件内容。
