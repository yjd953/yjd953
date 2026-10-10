# TCP 为什么需要三次握手？

最常见的回答是：

```text
SYN → SYN-ACK → ACK
```

这只背出了报文顺序，没有回答“为什么”。真正的问题应该拆成三个：

1. 建立 TCP 连接时，双方必须确认哪些事实？
2. 为什么两个报文不能确认完？
3. 第三个报文到底补上了哪条不可缺少的信息？

答案与“礼貌地打三次招呼”无关。TCP 要在一个可能丢包、延迟、重复和乱序的网络上，为双方建立一致的连接状态，并同步两个独立方向的初始序列号。

## 连接不是一根线，而是两份状态

TCP 连接并不存在于网络中间。客户端内核和服务器内核各自保存一份 Transport Control Block，里面包含：

```text
local / remote IP and port
send sequence state
receive sequence state
send / receive window
retransmission timer
congestion-control state
TCP options
connection state
```

网络只负责搬运 IP 包，并不知道两端是否认为连接已经建立。

因此“建立连接”的本质是：

> 两台主机通过报文交换，让各自内核对同一条双向字节流建立兼容的状态。

如果客户端认为连接已建立、服务器却没有对应状态，后续数据会被重置或丢弃。如果服务器把一条早已失效的请求当成新连接，也会创建错误状态。

## TCP 是两个方向的字节流

TCP 是 Full-Duplex：

```text
Client send stream  ─────────→  Server receive stream
Client receive stream ←───────  Server send stream
```

两个方向各自拥有独立的序列号空间。

客户端选择初始序列号 `x`，服务器选择初始序列号 `y`：

```text
Client first data byte: x + 1
Server first data byte: y + 1
```

SYN 本身会消耗一个序列号。即使它不携带普通 Payload，ACK 也要确认 `ISN + 1`。这让“连接建立事件”进入与后续字节相同的可靠序列空间。

初始序列号不是固定从零开始，因为网络中可能残留旧连接的重复报文。随时间变化、难以预测的 ISN 有助于区分不同连接实例，也降低伪造序列号的风险。

## 三个报文分别提供什么证据

标准主动连接过程：

```text
Client                                      Server
CLOSED                                      LISTEN
  |                                            |
  |  SYN, seq=x                                |
  | -----------------------------------------> |
  |                          SYN-RECEIVED       |
  |  SYN, seq=y, ACK=x+1                        |
  | <----------------------------------------- |
ESTABLISHED                                    |
  |  ACK=y+1                                   |
  | -----------------------------------------> |
  |                               ESTABLISHED  |
```

逐条看它们证明了什么。

### 第一次：客户端提出连接并公布 `x`

```text
C → S: SYN, seq=x
```

服务器收到后可以确认：

- Client → Server 方向当前可达；
- 客户端希望创建一条新连接；
- 客户端发送序列空间从 `x` 开始；
- 客户端支持 SYN 中携带的选项。

但客户端还没有收到服务器任何信息。

### 第二次：服务器确认 `x`，同时公布 `y`

```text
S → C: SYN, seq=y, ACK=x+1
```

客户端收到后可以确认：

- 自己的 SYN 已到达服务器；
- Server → Client 方向当前可达；
- 服务器愿意建立连接；
- 服务器正确接收并确认了 `x`；
- 服务器发送序列空间从 `y` 开始。

此时客户端已经掌握双方 ISN，并知道自己的发送可到达服务器、服务器的返回也可到达自己。

但服务器只知道自己发出了 `y`。它还不知道：

- SYN-ACK 是否到达客户端；
- 客户端是否接受了 `y`；
- 客户端是否仍然认为这次连接有效；
- 这次 SYN 是否只是网络里迟到的旧副本。

### 第三次：客户端确认 `y` 与本次连接

```text
C → S: ACK=y+1
```

服务器收到后才得到最后的证据：

- 客户端确实收到了服务器的 SYN；
- 客户端接受并同步了服务器的初始序列号 `y`；
- SYN-ACK 的 Server → Client 路径与 ACK 的 Client → Server 路径可用；
- 客户端在这次交换的当前时刻仍参与连接。

至此双方才都拥有：

```text
client ISN = x
server ISN = y
peer acknowledged my ISN
I acknowledged peer ISN
```

第三次不是重复确认，而是服务器第一次收到“客户端已经知道服务器序列号”的证据。

## 为什么两次不够

假设设计一个“两次握手”：

```text
1. Client → Server: SYN(x)
2. Server → Client: SYN(y), ACK(x+1)
```

如果第二步发送后，服务器和客户端都直接进入 `ESTABLISHED`，客户端确实已经知道服务器的状态，但服务器没有收到客户端对 `y` 的确认。

这个缺口不能靠服务器“相信包大概到了”填补。IP 网络可能丢包，发送成功只表示报文被交给本机网络栈或链路，并不表示对端已经接收。

### 情况一：第二个报文丢了

```text
Client                Network                 Server
  | SYN(x) ------------------------------------> |
  |                                               | create state
  |                 X <----- SYN(y), ACK(x+1) ----|
```

如果服务器在发送第二个报文后就认为连接建立：

- 服务器持有一个 `ESTABLISHED` 连接；
- 客户端从未得到 `y`，仍在重传 SYN 或最终超时；
- 双方状态不一致；
- 服务器可能向一个并未建立连接的客户端发送数据。

TCP 的三次握手下，服务器保持 `SYN-RECEIVED` 并重传 SYN-ACK。只有收到第三个 ACK 才进入 `ESTABLISHED`。

有人会提出：服务器可以把第二个报文重传，客户端收到后再发数据。没错，但服务器若以“收到客户端数据”为最终确认，那么这份数据必须带 ACK 确认 `y`：

```text
Client → Server: ACK(y+1) + Data
```

这仍是第三次消息，只是 ACK 与首批数据合并了。不能通过改名消除信息交换的轮次。

### 情况二：旧 SYN 迟到

假设早先连接尝试的 SYN 在网络中严重延迟。客户端已经放弃该连接，随后旧 SYN 才到达服务器：

```text
Old Client SYN(x_old)  ── delayed ──> Server
```

两次握手协议中，服务器回复一次就把连接视为建立：

```text
Server → Client: SYN(y_new), ACK(x_old+1)
Server state: ESTABLISHED
```

客户端现在并没有请求这条连接。它可能回复 RST，也可能已不存在；但在服务器确认这些事实之前，服务器已经创建了一个虚假已建立连接。

三次握手要求客户端返回：

```text
ACK=y_new+1
```

迟到的旧 SYN 本身无法凭空产生这个与服务器新 ISN 对应的 ACK。因此服务器不会仅凭旧请求进入 `ESTABLISHED`。

这里不能夸大成“三次握手彻底消灭所有旧报文”。TCP 还依赖：

- 四元组；
- 32 位序列号空间；
- ISN 随时间变化；
- Maximum Segment Lifetime 假设；
- TIME_WAIT；
- PAWS / Timestamp 等机制。

第三次确认是建立连接时验证对端掌握本次服务器序列号的关键步骤，但不是 TCP 抗所有历史报文问题的唯一机制。

### 情况三：服务器无法确认自己的发送方向

收到客户端 SYN 只证明：

```text
Client → Server
```

服务器发出 SYN-ACK 后，没有客户端回包，就无法知道：

```text
Server → Client
```

是否真的送达。

第三个 ACK 回来，形成了一个因果链：

```text
服务器发送 y
→ 客户端收到 y
→ 客户端生成 ACK(y+1)
→ 服务器收到该 ACK
```

因此服务器不是通过“网络看起来正常”推测可达，而是通过一个只有收到 `y` 后才能正确生成的报文获得证据。

## “双方收发能力正常”要精确理解

常见说法是三次握手确认了双方的发送和接收能力：

```text
Client send / receive OK
Server send / receive OK
```

这可以作为直觉，但不能理解成永久健康检查。握手只证明这些控制报文在当时的路径上完成了往返。握手结束下一毫秒，链路仍然可能断开。

它也不证明应用进程一定能正确处理数据。握手主要由内核 TCP 栈完成，服务器应用可能尚未 `accept()`，也可能在建立后立即崩溃。

更准确的说法是：

> 三次握手让双方 TCP 状态机确认了本次连接的双向可达性，并同步、确认了两个方向的初始序列号。

## 为什么不是四次

如果把两个方向完全分开，理论上可以写成：

```text
1. C → S: SYN(x)
2. S → C: ACK(x+1)
3. S → C: SYN(y)
4. C → S: ACK(y+1)
```

第二步 ACK 客户端的 SYN，第三步发送服务器自己的 SYN。TCP 允许 ACK 和 SYN 同时出现在一个 Segment 中：

```text
SYN(y) + ACK(x+1)
```

于是中间两步合并，四个报文变成三个：

```text
SYN
SYN + ACK
ACK
```

这就是三次而非四次的直接原因：服务器对客户端 SYN 的确认，与服务器自己的 SYN 可以一起发送；最后仍需要客户端确认服务器的 SYN。

## TCP 状态机如何体现这个信息差

客户端执行 Active Open：

```text
CLOSED
  └─ send SYN → SYN-SENT
       └─ receive SYN-ACK, send ACK → ESTABLISHED
```

服务器执行 Passive Open：

```text
CLOSED
  └─ listen → LISTEN
       └─ receive SYN, send SYN-ACK → SYN-RECEIVED
            └─ receive ACK → ESTABLISHED
```

服务器比客户端晚一个报文进入 `ESTABLISHED`，正是因为它需要等待对 `y` 的确认。

监听端通常存在两个相关队列概念：

- 尚未完成握手的连接状态；
- 已完成握手、等待应用 `accept()` 的连接。

不同操作系统对队列实现和术语有差异，不应简单断言所有内核都有结构完全相同的“半连接队列”和“全连接队列”。但协议状态的区别始终存在：`SYN-RECEIVED` 不等于已完成握手。

## 报文丢失时为什么不会重新发明连接

### 第一个 SYN 丢失

```text
C -- SYN --> X
```

客户端在重传计时器到期后再次发送 SYN。多次失败后 `connect()` 超时。

### SYN-ACK 丢失

服务器重传 SYN-ACK；客户端也可能重传 SYN，从而触发服务器再次回复。

```text
C -- SYN ----------------> S
C X <-------- SYN-ACK ---- S
C -- SYN retransmit -----> S
C <---------- SYN-ACK ---- S
```

### 第三个 ACK 丢失

```text
C -- ACK --> X
```

客户端已经进入 `ESTABLISHED`，服务器仍在 `SYN-RECEIVED`。服务器重传 SYN-ACK，客户端看到后会再次发送 ACK。

若客户端紧接着发送数据，数据 Segment 通常也带有 ACK，可以完成服务器侧状态转换。ACK 自身通常不单独可靠重传，而是由“未被确认的信息”触发对端重传，再生成新的 ACK。

这揭示了 TCP 可靠性的一个重要原则：

> TCP 不是保证每个独立报文只发送一次，而是通过序列号、确认和重传，让双方最终对字节流状态收敛。

## 第三个报文可以携带数据吗

可以。普通 TCP 中，客户端收到 SYN-ACK 后发送的 ACK 可以同时携带应用数据：

```text
C → S: ACK(y+1), seq=x+1, payload=...
```

对服务器而言，这仍是握手的第三个 Segment，同时是第一个数据 Segment。

传统 TCP 通常不能在第一个 SYN 中随意发送普通应用数据并让接收方直接交付。TCP Fast Open 通过 Cookie 等机制允许特定条件下在 SYN 中携带数据，用来减少重复连接的延迟，但会引入重放与应用幂等性问题，也依赖双方和中间网络支持。

TLS 1.3 的 0-RTT 是 TLS 会话恢复层面的 Early Data，不等于跳过 TCP 状态建立。运行在 QUIC 上时，传输与 TLS 握手结构又不同。

## SYN Flood 与第三次确认的资源代价

服务器收到 SYN 后需要在 `SYN-RECEIVED` 保存一定状态。如果攻击者伪造大量源地址且不发送第三个 ACK，就可能耗尽未完成连接资源：

```text
fake SYN
→ server allocates pending state
→ no final ACK
→ state waits and retransmits
```

SYN Cookie 的思路是把必要状态编码进服务器选择的初始序列号：

```text
y = encoded(connection tuple, time, options, secret)
```

服务器在 SYN-ACK 后不必立刻保存完整状态。若收到第三个 ACK，可从 `ACK - 1` 验证并恢复必要信息。

这反过来说明第三次 ACK 的价值：它携带了客户端确实收到服务器 SYN-ACK 的可验证证据。SYN Cookie 只是改变服务器在等待证据期间如何保存状态，没有取消第三次握手。

## 为什么挥手经常是四次

建立连接时：

```text
server ACK client SYN
+ server SYN
→ 可合并
```

关闭时，TCP 两个方向可以独立结束。客户端发送 FIN 只表示“我不再发送”，服务器可能还有数据没发完：

```text
C → S: FIN
S → C: ACK
... server continues sending ...
S → C: FIN
C → S: ACK
```

服务器对客户端 FIN 的 ACK 和自己的 FIN 不一定能同时发，所以常见是四个 Segment。如果服务器恰好也准备关闭，ACK 与 FIN 可以合并，报文数可能少于四个。

这再次表明，报文数量由“必须交换哪些独立状态，以及哪些状态能合并到同一个报文”决定，而不是固定仪式。

## 用抓包观察真实握手

在自己有权限的机器上启动本地服务：

```bash
python3 -m http.server 8080
```

另一个终端抓取 Loopback：

Linux：

```bash
sudo tcpdump -i lo -nn -S 'tcp port 8080'
```

macOS：

```bash
sudo tcpdump -i lo0 -nn -S 'tcp port 8080'
```

然后请求：

```bash
curl http://127.0.0.1:8080/
```

典型开头类似：

```text
127.0.0.1.53142 > 127.0.0.1.8080: Flags [S],  seq 1000
127.0.0.1.8080  > 127.0.0.1.53142: Flags [S.], seq 7000, ack 1001
127.0.0.1.53142 > 127.0.0.1.8080: Flags [.],  ack 7001
```

标记含义：

```text
[S]  SYN
[.]  ACK
[S.] SYN + ACK
```

不加 `-S` 时，`tcpdump` 常显示相对序列号，更易阅读；加 `-S` 可观察原始绝对值。不同版本选项可能不同。

还可以观察 Socket 状态。Linux：

```bash
ss -tan
```

macOS：

```bash
netstat -anv -p tcp
```

本地连接建立太快，未必能人工捕捉 `SYN-SENT` 或 `SYN-RECEIVED`。需要网络命名空间、延迟/丢包注入或程序化采样，才能稳定观察中间状态。

## 一个更严格的信息表

把双方在每一步知道的事实列出来：

| 时刻 | 客户端知道 | 服务器知道 |
| --- | --- | --- |
| 初始 | 自己选择了 `x` | 正在监听 |
| S 收到 SYN | 不知道 SYN 是否到达 | 收到 `x`，C→S 可达 |
| C 收到 SYN-ACK | S 收到 `x`；收到 `y`；往返可达 | 已发送 `y`，但不知道 C 是否收到 |
| S 收到 ACK | 已确认 `y` | C 已收到并确认 `y`；双方状态同步 |

两次握手停在第三行：客户端的信息闭合了，服务器的信息还没有闭合。

## 最终答案

TCP 需要三次握手，不是因为“三”天然安全，而是因为连接包含两个独立序列号空间，并且通信发生在会丢失、延迟和重复报文的网络上。

第一次让服务器获得客户端的 ISN；第二次让客户端知道服务器已收到自己的 ISN，并获得服务器 ISN；第三次让服务器知道客户端确实收到了并接受服务器 ISN。最后这条证据不能由前两个报文推出。

如果把客户端随后的数据当作确认，那么它已经是逻辑上的第三次消息；如果服务器不等待任何确认就进入已建立状态，它就无法区分“客户端已经同步状态”和“自己的 SYN-ACK 根本没有到达”，也更容易被迟到的旧 SYN 创建虚假连接。

所以真正的结论是：

```text
三次握手 = 交换两个 ISN
         + 双方各自确认对方 ISN
         + 让两份 TCP 状态机对同一连接实例收敛
```

`SYN → SYN-ACK → ACK` 只是这个信息交换过程在线路上的外观。
