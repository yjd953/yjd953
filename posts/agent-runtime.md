# Agent Runtime 到底是什么？

把 Prompt 发给 LLM，只能得到一次响应。即使响应中包含 Tool Call，模型也不会自己找到函数、执行请求、等待结果或开启下一轮。

让 Agent 从“会提出行动”变成“能完成任务”的，是模型外面的 Agent Runtime。

## 为什么不能只有一个 LLM

假设模型收到：

```text
请检查订单 123 的状态，如果已经超时，创建补偿单。
```

它可能生成：

```json
{"name": "get_order", "arguments": {"id": "123"}}
```

到这里模型调用已经结束。接下来必须有人回答：

- `get_order` 对应哪个真实服务？
- 用户能否读取这个订单？
- 请求最多等待多久？
- 服务返回 503 时是否重试？
- 查询结果放到哪里？
- 如果要创建补偿单，是否需要确认？
- 进程重启后任务能否继续？

这些问题都不属于语言模型推理，却决定系统是否真的可用。Runtime 就是承接这些责任的执行环境。

可以把它理解为一层控制平面：

```text
用户 / 上游系统
        ↓
Agent Runtime
  ├─ 调用 LLM
  ├─ 执行 Tool
  ├─ 管理 Context 与 State
  ├─ 维护 Session
  ├─ 实施权限与预算
  └─ 记录 Trace
        ↓
外部 Environment
```

## Tool Executor：动作的唯一出口

模型输出的工具名只是字符串。Tool Executor 将它解析成真实能力，并在执行前后实施控制。

一次执行通常经过：

```text
lookup → validate → authorize → schedule
→ execute → normalize result → record
```

Executor 不应只做一个 `functions[name](**args)`。它至少要知道：

- 工具版本和参数 Schema；
- 调用者身份与所需权限；
- 工具是只读还是有副作用；
- 是否幂等、能否重试；
- 超时和并发限制；
- 返回结果如何截断和脱敏；
- 审计事件写到哪里。

对于代码执行、浏览器操作等高风险工具，还要提供沙箱、文件路径白名单、网络域名限制或进程隔离。

## Context：这一轮模型实际看见什么

Context 是某一次模型调用的输入集合，可能包括：

- System Prompt；
- 当前用户目标；
- 最近对话；
- Tool Schema；
- 最新 Observation；
- 从 Memory 或 Knowledge 检索出的片段；
- 当前任务状态摘要。

Context Builder 的工作不是简单拼接字符串，而是做选择与排序。Context Window 有硬上限，输入越长成本和延迟越高，噪声也越多。

一个可靠的构建过程会保留来源：

```json
{
  "content": "订单 123 已超时 48 小时",
  "source": "tool:get_order",
  "source_id": "call_01",
  "observed_at": "2026-09-30T10:00:00Z",
  "trust": "authoritative"
}
```

模型看到的是文本，Runtime 必须知道这段文本从哪里来、是否过期、能否信任。

## State：任务当前处于哪里

Context 是给模型看的输入，State 是 Runtime 持有的事实。二者不能混为一谈。

```json
{
  "run_id": "run_42",
  "status": "waiting_for_approval",
  "current_step": 4,
  "order_id": "123",
  "order_overdue": true,
  "compensation_id": null,
  "remaining_steps": 8,
  "pending_action": "create_compensation"
}
```

State 应支持机器读取和状态迁移。不能只把“当前做到哪了”写进一段自然语言摘要，因为摘要可能遗漏字段，也不适合做并发控制。

模型可以建议 `status = completed`，但 Runtime 应根据完成条件决定状态是否真的可转移。例如创建补偿单后，只有从订单服务重新读到补偿 ID，才能进入 `completed`。

## Session 与 Run：不要把一次会话当一次执行

Session 表示一段持续交互，Run 表示其中一次具体任务执行。

```text
Session user_7/order_support
  ├─ Run 001：查询订单状态
  ├─ Run 002：申请补偿，等待确认
  └─ Run 003：用户确认后继续执行
```

区分两者有几个好处：

- 一次 Run 可以失败，不必破坏整个会话；
- 可以为每次 Run 单独统计成本和 Trace；
- 等待人工确认时，可以持久化后释放计算资源；
- 同一 Session 中的并发请求可以做版本控制。

生产系统通常还需要 Checkpoint。每次关键状态迁移后持久化，进程崩溃时从最后一个确认点恢复，而不是让模型凭历史文本猜测已执行到哪一步。

## Retry：重试的是动作，不是愿望

模型调用超时、搜索服务限流、数据库连接断开，都可能是暂时错误。但 Retry 必须建立在错误分类上：

```text
invalid_arguments → 返回模型修正，不做相同重试
rate_limited      → 按 retry_after 等待
network_timeout   → 幂等调用可退避重试
permission_denied → 不重试，升级或终止
side_effect_unknown → 先查询结果，不直接重复执行
```

最后一种最危险。创建补偿单时客户端超时，并不能说明服务端没有创建成功。正确动作是用幂等键查询或重放，而不是再创建一张。

Runtime 要保存 `attempt`、错误类型和每次执行结果，使模型看到的是最终的结构化 Observation，而不是一串重复异常。

## Timeout：时间预算必须逐层传播

只在最外层设置 60 秒超时通常无效。内部一次 HTTP 请求可能阻塞 120 秒，取消信号也可能没有传到下游。

合理做法是传播 Deadline：

```text
Run deadline:       60s
当前已消耗:         18s
下一次 LLM 预算:    15s
工具执行预算:       10s
下游 HTTP 超时:      8s
```

每层使用剩余时间，而不是各自重新获得完整 60 秒。Runtime 还要区分：

- 连接超时；
- 单次读取超时；
- 工具总耗时；
- 单轮耗时；
- 整个 Run 的 Deadline。

超时后的状态也必须明确：工具肯定没执行、可能执行、还是已执行但结果丢失。

## Cancellation：停止不是丢弃返回值

用户点击取消后，Runtime 需要：

1. 将 Run 标记为 `cancelling`；
2. 停止发起新的 LLM 和 Tool Call；
3. 向正在执行的任务传播取消信号；
4. 等待可取消动作退出；
5. 记录无法取消的外部副作用；
6. 将最终状态写成 `cancelled` 或 `cancelled_with_effects`。

对于发邮件、支付等已经提交的操作，取消 Agent 并不能撤销现实结果。需要独立的补偿操作，而不是假设中止进程等于回滚世界。

## Scheduler：谁获得下一次执行机会

单用户 Demo 可以用一个 `while` 循环。服务化以后，Runtime 还要调度数千个 Run：

- 每个租户的并发上限；
- 模型和工具的速率限制；
- 等待人工输入的任务挂起；
- 长任务的公平调度；
- 优先级与成本预算；
- Worker 崩溃后的租约回收。

这时 Agent Loop 更像一个持久化状态机。Worker 每次领取可运行步骤，执行后提交新的状态与事件，再由 Scheduler 决定是否继续。

## Trace：让每次状态转移可解释

Runtime 是最适合记录 Trace 的位置，因为它看见所有边界：

```text
Run
  ├─ LLM Call
  ├─ Tool Call
  │    ├─ Attempt 1: timeout
  │    └─ Attempt 2: success
  ├─ State Transition
  ├─ Approval Wait
  └─ LLM Call
```

每个 Span 应关联输入摘要、输出、耗时、Token、错误、工具版本和状态变化。只有这样，最终回答错误时才能判断是模型选错、工具执行错、Observation 丢失，还是 Context 构建错。

## Runtime 与传统 Runtime 的相似之处

操作系统 Runtime 或语言 Runtime 已经解决过许多相似问题：

| 传统系统 | Agent Runtime |
| --- | --- |
| 进程 / 线程 | Run / Step |
| 系统调用 | Tool Call |
| 堆与持久化存储 | Context / Memory / State Store |
| 调度器 | Agent Scheduler |
| 超时与信号 | Deadline / Cancellation |
| 访问控制 | Tool Permission |
| 调用栈与 Trace | LLM / Tool Span |

差异在于，传统程序的下一条指令由代码和程序计数器决定；Agent 的部分控制流由概率模型在运行时生成。因此 Runtime 不仅执行已知指令，还必须验证动态生成的动作。

## 一个可用的最小边界

把 Runtime 设计得很复杂并不是目标。一个可用的最小版本应至少做到：

```text
输入目标
→ 建立 Run 与预算
→ 构造 Context
→ 调用模型
→ 校验并授权 Tool Call
→ 有界执行
→ 记录 Observation 与 State
→ 判断继续、暂停或终止
```

其余能力都沿着真实风险增长。没有长任务时不必先造分布式调度器，但不能省略轮次上限；没有写操作时可以暂缓审批系统，但不能省略参数校验；没有跨会话需求时可以先用内存存储，但要清楚进程退出后信息会消失。

Agent Runtime 的本质不是某个框架名称，而是一组不可逃避的系统责任。LLM 决定“接下来最好做什么”，Runtime 保证“允许做的事情以可控、可恢复、可追踪的方式发生”。当这条边界清晰，Agent 才从一次模型演示变成真正的软件系统。
