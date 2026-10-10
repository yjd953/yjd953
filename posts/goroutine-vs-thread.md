# 协程到底比线程轻在哪里？

“Goroutine 很轻，可以随便开几十万个。”这句话只给结论，没有解释轻在哪里，也容易让人误以为 Goroutine 不消耗资源。

Goroutine 的优势来自一整套 Runtime 设计：

```text
小型可增长 Stack
+ 用户态调度
+ 大量 Goroutine 复用少量系统线程
+ 网络轮询器避免每个连接占一个线程
```

下面用 Go Goroutine 与 Linux 系统线程对比。具体数字依赖 Go 版本、操作系统、线程库和机器，实验重点是测量方法与数量级来源。

## 两层调度器

系统线程由内核 Scheduler 调度：

```text
Kernel Scheduler
  Thread 1 → CPU 0
  Thread 2 → CPU 1
  Thread 3 → Runnable Queue
```

Goroutine 由 Go Runtime 调度到系统线程：

```text
Go Scheduler
  G1 G2 G3 ... G100000
       ↓
  M1 M2 M3 M4
       ↓
Kernel Scheduler
       ↓
CPU Cores
```

Go Runtime 常用 G、M、P 描述调度：

- **G**：Goroutine，保存栈、状态和调度上下文；
- **M**：Machine，对应一个操作系统线程；
- **P**：Processor，持有执行 Go 代码所需的调度资源与本地队列。

`GOMAXPROCS` 主要限制同时执行 Go 代码的 P 数量，不等于进程最多只能有这么多系统线程。阻塞系统调用、GC 和 Runtime 工作可能让 M 数量更多。

## 第一处轻量：Stack 初始很小并可增长

传统 pthread 通常为每个线程预留较大的虚拟地址区域作为 Stack。Linux 上常见默认值是数 MiB，可通过：

```bash
ulimit -s
```

查看当前 Shell 的线程栈限制。注意这是虚拟地址预留或上限，不代表创建线程后立即产生同等 RSS。

Goroutine 从很小的 Stack 开始，常见 Go 实现的初始量级约为几 KiB，具体值属于实现细节。函数调用接近边界时，Runtime 可以：

1. 分配更大的连续 Stack；
2. 复制旧 Stack 内容；
3. 修正其中可追踪指针；
4. 继续执行；
5. 在合适时机缩小过大的 Stack。

所以十万个仅仅阻塞、调用层次很浅的 Goroutine，不需要预留十万个 8MiB 物理栈。

代价是 Stack 增长需要检查和偶发复制；保存指向 Stack 内部对象的裸指针也必须受到语言和 Runtime 规则约束。

## 用实验测 Goroutine 的增量内存

下面创建 N 个等待中的 Goroutine，并读取 Runtime 内存统计与 Linux 线程数：

```go
package main

import (
    "bufio"
    "fmt"
    "os"
    "runtime"
    "strconv"
    "strings"
)

func procValue(key string) string {
    f, err := os.Open("/proc/self/status")
    if err != nil {
        return "unsupported"
    }
    defer f.Close()

    scanner := bufio.NewScanner(f)
    for scanner.Scan() {
        if strings.HasPrefix(scanner.Text(), key+":") {
            return strings.TrimSpace(strings.TrimPrefix(scanner.Text(), key+":"))
        }
    }
    return "unknown"
}

func main() {
    n := 100_000
    if len(os.Args) > 1 {
        n, _ = strconv.Atoi(os.Args[1])
    }

    release := make(chan struct{})
    ready := make(chan struct{}, n)

    for i := 0; i < n; i++ {
        go func() {
            ready <- struct{}{}
            <-release
        }()
    }
    for i := 0; i < n; i++ {
        <-ready
    }

    runtime.GC()
    var m runtime.MemStats
    runtime.ReadMemStats(&m)

    fmt.Printf("goroutines=%d\n", runtime.NumGoroutine())
    fmt.Printf("threads=%s\n", procValue("Threads"))
    fmt.Printf("VmRSS=%s\n", procValue("VmRSS"))
    fmt.Printf("StackInuse=%d MiB\n", m.StackInuse>>20)
    fmt.Printf("HeapAlloc=%d MiB\n", m.HeapAlloc>>20)

    close(release)
}
```

运行：

```bash
go run goroutines.go 100000
```

应该关注：

- `goroutines` 接近 100001；
- `Threads` 远小于 Goroutine 数；
- `StackInuse / N` 的平均增量是 KiB 量级，而不是固定数 MiB；
- RSS 不会等于 N 乘以系统线程默认栈上限。

不要把一次 `VmRSS` 差值简单除以 N 就称为“每个 Goroutine 精确占用”，因为其中还包含 Channel、G 结构、Heap Arena、GC 元数据和 Runtime 预留。应对不同 N 多次测量并观察斜率。

## 用 `LockOSThread` 观察系统线程代价

Go 没有把 pthread 创建作为普通 API 暴露，但可以让每个 Goroutine 锁定独立系统线程：

```go
func lockedWorker(ready chan<- struct{}, release <-chan struct{}) {
    runtime.LockOSThread()
    defer runtime.UnlockOSThread()
    ready <- struct{}{}
    <-release
}
```

将创建循环改为：

```go
for i := 0; i < n; i++ {
    go lockedWorker(ready, release)
}
```

只使用较小 N，例如 500 或 1000：

```bash
go run threads.go 1000
```

观察 `/proc/self/status` 中：

- `Threads` 随 N 明显增长；
- `VmSize` 往往大幅增长；
- `VmRSS` 也会上升，但不一定等于线程 Stack 虚拟上限；
- 创建速度更慢，容易触及用户、容器或内核线程限制。

这个实验不是纯 pthread 基准，因为每个实体仍有一个 Goroutine；它展示的是强制增加系统线程后额外资源如何变化。

生产机器上不要盲目创建大量锁定线程，先确认 `ulimit -u`、容器 PID 限制和内存余量。

## 第二处轻量：切换不必每次进入内核

系统线程切换通常需要 Scheduler 介入：

```text
用户态
→ 中断 / 系统调用
→ 内核保存 Thread A
→ 选择 Thread B
→ 恢复 Thread B
→ 用户态
```

Goroutine 在安全调度点切换时，Go Runtime 可以在用户态：

```text
保存 G1 的少量寄存器和 Stack 状态
→ 从 P 的队列选择 G2
→ 恢复 G2
```

它不一定需要切换系统线程、地址空间或进入内核调度路径。

但“用户态切换一定快很多”也不能脱离场景：

- Channel 操作本身有同步成本；
- G 可能跨 P 迁移，影响 Cache；
- Runtime 仍需并发控制；
- 阻塞系统调用可能需要新 M；
- GC Safepoint 与异步抢占会介入。

Goroutine 切换更轻，主要是 Runtime 掌握了语言级任务状态，并能在固定系统线程内完成大量调度。

## 用 Benchmark 测调度，不要伪装成纯 CPU 指标

Channel Ping-Pong：

```go
package switchbench

import "testing"

func BenchmarkGoroutinePingPong(b *testing.B) {
    ping := make(chan struct{})
    pong := make(chan struct{})
    done := make(chan struct{})

    go func() {
        defer close(done)
        for {
            if _, ok := <-ping; !ok {
                return
            }
            pong <- struct{}{}
        }
    }()

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        ping <- struct{}{}
        <-pong
    }
    b.StopTimer()
    close(ping)
    <-done
}
```

运行：

```bash
go test -bench=PingPong -benchmem -count=5
```

每轮至少包含两次 Channel 同步和调度机会。结果不是“单次 Goroutine Context Switch 的纯成本”，但可以作为同一机器、同一 Go 版本下的可重复工作负载。

若要和 pthread 条件变量或 Futex Ping-Pong 比较，必须保证：

- 工作语义相同；
- CPU Affinity 相同；
- 是否跨 Core 相同；
- 编译优化一致；
- 预热和采样次数足够；
- 分别报告 P50/P95，而不是只报最好一次。

跨语言 Benchmark 最容易测到测试框架差异，而不是调度器本质。

## 第三处轻量：阻塞 I/O 不必一连接一线程

传统 Thread-per-Connection 模型：

```text
Connection 1 → Thread 1 → blocking read
Connection 2 → Thread 2 → blocking read
...
```

Go 网络库通常把可轮询 Socket 交给 Netpoller。Goroutine 调用网络读时：

1. Runtime 尝试非阻塞 I/O；
2. 数据未就绪，则把 G 停放；
3. M 继续运行其他 G；
4. epoll/kqueue 等通知数据就绪；
5. 对应 G 被重新放入 Runnable 队列。

于是十万个大部分时间等待网络的连接，不需要十万个系统线程。

这并不意味着所有调用都能自动异步化。Cgo、某些文件 I/O、阻塞系统调用和外部库可能占住 M，Runtime 需要创建或唤醒其他 M 维持并行度。

## Scheduler 为什么需要 P

如果所有 Goroutine 都竞争一个全局队列，锁会成为瓶颈。Go Scheduler 让每个 P 拥有本地 Runnable Queue：

```text
P0 local queue: G1 G2 G3
P1 local queue: G4 G5
Global queue:   G6 ...
```

某个 P 空闲时可以 Work Stealing，从其他 P 偷取一部分任务。这样兼顾局部性与负载均衡。

当 G 阻塞在系统调用中：

- M 可能被阻塞；
- P 可以与该 M 分离；
- P 被另一个 M 接管，继续运行其他 G。

这正是 M:N 模型的关键：语言任务与内核线程不必一一绑定。

## Preemption：协程不一定只靠主动让出

早期协作式调度主要依赖函数调用和安全点。现代 Go Runtime 还支持异步抢占，避免一个长时间计算且很少调用函数的 Goroutine 永久占据 P。

Runtime 必须在安全位置暂停 G，使 GC 能准确识别 Stack 上的指针并恢复执行。这比内核任意保存机器上下文多了一层语言 Runtime 约束。

## Memory 为什么更省

每个 Goroutine 的成本包含：

- G 描述结构；
- 当前小 Stack；
- Scheduler 队列项；
- 阻塞原因所需对象；
- 用户代码创建的闭包和参数。

每个系统线程通常还需要：

- 更大的 Stack 虚拟映射；
- 内核 Task 与内核 Stack；
- TLS 与线程库状态；
- 调度器和体系结构相关状态。

Goroutine 将大量逻辑任务复用到较少线程上，节省的不是“每条指令的内存”，而是避免为每个等待任务配置完整内核调度实体。

## 轻量不等于免费

一百万个 Goroutine 仍可能因为以下原因耗尽资源：

- 每个 Goroutine 捕获大对象；
- Stack 深度不断增长；
- Channel 和 Timer 数量巨大；
- 全部同时 Runnable，调度开销飙升；
- 下游数据库只有几十个连接；
- 缺乏背压，任务排队无界；
- Goroutine 泄漏，永远等待不会到来的信号。

应使用并发上限、Worker Pool、Semaphore、Context Cancellation 和指标监控，而不是把可创建数量当作应创建数量。

## 到底轻在哪里

可以把结论拆成可验证的四项：

| 维度 | 系统线程 | Goroutine |
| --- | --- | --- |
| Stack | 通常预留较大、按页提交 | 小型起步，可增长和收缩 |
| 调度者 | 内核 | Go Runtime，再映射到内核线程 |
| 切换路径 | 常涉及内核 Scheduler | 可在同一 M 上用户态切换 |
| 阻塞 I/O | 一个阻塞线程占一个内核任务 | Netpoller 可停放 G、复用 M |
| 数量上限 | 受线程、PID、栈与内核资源限制 | 通常可高一个或多个数量级 |

“轻”不是一句语言特性，而是 Stack 策略、M:N Scheduler、Netpoller 与 Runtime 控制共同产生的系统结果。

最可靠的理解方式不是记住“2KB 对 8MB”这种会随实现变化的数字，而是在自己的 Go 版本和部署环境中测：

```text
创建时间
VmSize / VmRSS
StackInuse
系统 Threads
调度延迟
Context Switch
真实吞吐
```

当这些指标与 G-M-P 模型对应起来，协程的轻量性才从口号变成可以解释、复现和评估的工程事实。
