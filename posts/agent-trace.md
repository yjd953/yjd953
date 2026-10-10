# Agent 为什么需要 Trace？

普通服务出错时，日志通常能告诉我们：

```text
10:03:12 request started
10:03:13 database timeout
10:03:13 request failed
```

但 Agent 给出错误答案时，问题可能发生在更长的因果链：

```text
用户目标
→ Context 构建
→ LLM 决策
→ Tool Call
→ Retry
→ Observation
→ 第二次 LLM 决策
→ 最终答案
```

如果日志只是多行独立文本，就很难回答“最终错误是从哪一步开始的”。Trace 的作用，是把一次 Agent 执行中的事件组织成有父子关系、可关联、可回放的结构。

## 一个只看日志无法解释的案例

用户要求：

> 查询订单状态；如果尚未发货，只解释原因，不要取消订单。

最终 Agent 却回答“订单已取消”。

系统日志里能找到：

```text
tool call success
order service 200
model response completed
```

每条都像成功。只有还原轨迹才发现：

1. `get_order` 返回 `status=pending`；
2. Context Builder 错把 `cancel_order` 的结果示例当成真实 Observation；
3. 模型看到“cancelled=true”，于是生成已取消的回答；
4. 实际并没有调用取消接口。

这是 Context 数据串线，不是工具失败，也不是模型凭空幻觉。没有 Trace，只看最终答案和服务日志很难区分。

## Trace、Span 与 Event

### Trace：一次端到端执行

一个 Trace 对应一项可识别的用户任务或 Run：

```text
trace_id = tr_8af2
goal = 查询订单状态并解释
start → end
```

### Span：有时间边界的工作单元

例如：

- `agent.run`
- `context.build`
- `llm.call`
- `tool.execute`
- `memory.retrieve`
- `approval.wait`

Span 有开始时间、结束时间、状态和父 Span。父子关系表达因果结构，而不仅是先后时间。

### Event：Span 内的瞬时事实

例如：

- Streaming 首 Token 到达；
- Retry 第 2 次开始；
- 参数校验失败；
- 用户发出取消；
- 输出因敏感信息被脱敏。

Event 不一定单独占据一段时间，但对解释行为有价值。

## 一条 Agent Trace 应该长什么样

```text
agent.run [tr_8af2]
├─ context.build [sp_01]
│  ├─ memory.retrieve [sp_02]
│  └─ knowledge.retrieve [sp_03]
├─ llm.call [sp_04]
├─ tool.execute:get_order [sp_05]
│  ├─ policy.check [sp_06]
│  └─ http.request [sp_07]
├─ context.build [sp_08]
├─ llm.call [sp_09]
└─ answer.verify [sp_10]
```

从树上可以直接看到：一次 Run 调了两次模型、一次工具，第二次 Context 是在工具结果后构建的。

## LLM Call 需要记录什么

至少包括：

```json
{
  "span_id": "sp_04",
  "kind": "llm.call",
  "model": "model-x",
  "provider": "provider-a",
  "prompt_template_version": "order-agent-v17",
  "context_manifest_id": "ctx_001",
  "available_tools": ["get_order@2", "cancel_order@4"],
  "input_tokens": 3812,
  "output_tokens": 146,
  "first_token_ms": 420,
  "duration_ms": 1260,
  "finish_reason": "tool_calls",
  "output_ref": "blob://trace/tr_8af2/sp_04/output"
}
```

完整 Prompt 和响应可能包含隐私，不能无条件写进普通日志。常见做法是：

- Trace 主记录保存摘要、Hash 和对象引用；
- 原文放进加密、限权、短保留期存储；
- 敏感字段在采集前脱敏；
- 调试权限与业务访问权限分离。

要想回放，至少还需记录模型版本、采样参数、Prompt 模板版本和实际工具集合。只保存用户问题无法复现原决策环境。

## Tool Call 需要记录什么

```json
{
  "span_id": "sp_05",
  "parent_span_id": "sp_04",
  "kind": "tool.execute",
  "tool_call_id": "call_12",
  "tool": "get_order",
  "tool_version": "2.3.1",
  "arguments": {"order_id": "masked"},
  "arguments_hash": "sha256:...",
  "permission_result": "allow",
  "idempotency_key": null,
  "attempts": 1,
  "duration_ms": 183,
  "status": "ok",
  "result_ref": "blob://trace/tr_8af2/sp_05/result",
  "result_summary": {
    "order_status": "pending",
    "truncated": false
  }
}
```

对于有副作用的工具，还要记录：

- 操作前确认；
- 外部资源 ID；
- 服务端请求 ID；
- 幂等键；
- 副作用核验结果；
- 取消发生时动作是否已提交。

“HTTP 200”只能证明接口返回成功，不一定证明业务目标完成。

## Token、Latency、Error 为什么要进入同一条轨迹

这些指标单独聚合时只能看到总体趋势，放入 Trace 后才能解释原因。

### Token

一次任务消耗 80K Token，可能是模型反复规划，也可能是某个工具每轮返回大日志。按 Span 记录输入输出 Token，才能定位膨胀从哪一步开始。

### Latency

端到端耗时 40 秒，需要分解为：

```text
LLM 推理      12s
Tool 执行     20s
Retry 等待     5s
队列等待       2s
其他           1s
```

平均总延迟无法指导优化。

### Error

错误应记录为类型，而不是只有字符串：

```text
model_rate_limited
tool_timeout
invalid_arguments
permission_denied
observation_truncated
goal_verification_failed
```

这样既能聚合统计，也能看到它发生在哪个父 Span 下。

## Trace 与普通日志的关系

Trace 不替代日志。

- **日志**记录离散事件和诊断细节；
- **Metrics**回答总体有多少、多久、是否异常；
- **Trace**连接一次请求跨组件的因果路径。

三者应通过 `trace_id`、`span_id`、`run_id` 关联。工具内部仍可以写详细日志，但日志行要携带当前 Span 上下文：

```text
trace_id=tr_8af2 span_id=sp_05 tool=get_order timeout after 3s
```

没有关联 ID 的日志只能全文搜索，无法可靠还原父子关系。

## 一套可落地的数据结构

顶层 Run：

```json
{
  "trace_id": "tr_8af2",
  "run_id": "run_901",
  "session_id": "sess_77",
  "user_id_hash": "usr_hash",
  "goal_summary": "query order status",
  "started_at": "2026-09-30T10:03:12Z",
  "ended_at": "2026-09-30T10:03:15Z",
  "status": "completed",
  "termination_reason": "final_answer",
  "verified_outcome": false,
  "total_tokens": 6120,
  "total_cost_usd": 0.018
}
```

通用 Span：

```json
{
  "trace_id": "tr_8af2",
  "span_id": "sp_04",
  "parent_span_id": "root",
  "sequence": 4,
  "kind": "llm.call",
  "name": "decide_next_action",
  "started_at": "...",
  "ended_at": "...",
  "status": "ok",
  "attributes": {},
  "input_ref": "...",
  "output_ref": "...",
  "events": []
}
```

关键设计点：

1. `sequence` 保留逻辑顺序，不能只依赖时间戳；
2. `parent_span_id` 表达因果关系；
3. 大输入输出使用引用，避免主表膨胀；
4. `status` 与 `verified_outcome` 分开，运行成功不代表目标成功；
5. 模型、Prompt、Tool 和策略都记录版本；
6. 敏感身份使用受控引用或 Hash，不复制明文。

## “回放”不等于重新调用同一个模型

LLM 具有非确定性，供应商模型也可能更新。即使输入完全相同，也未必生成同样结果。

Trace Replay 至少有三种模式：

### 展示回放

按原始 Span 顺序展示输入、决策、工具结果和状态变化，用于人工诊断。它不重新执行任何副作用。

### 决策重放

固定原始 Observation，使用新 Prompt 或新模型重新生成决策，比较 Tool Selection 和答案。这适合离线评测。

### 执行重放

在沙箱中重新执行工具，用于验证 Runtime 或工具版本。带副作用的调用必须 Mock、使用测试环境或由幂等机制保护。

不能把生产 Trace 直接“再跑一遍”，否则一次调试可能重复发邮件、删文件或创建订单。

## Trace 如何改变 Debug

面对错误回答，调试顺序从“搜报错日志”变为：

```text
1. 找到 Run 与 termination_reason
2. 检查最终答案使用了哪些 Observation
3. 沿父 Span 回看这些 Observation 的来源
4. 对比模型原始 Tool Call 与 Runtime 实际 Handler
5. 检查 Context Manifest 是否混入错误或过期内容
6. 确认 Retry、截断和并发是否改变了结果
7. 将失败 Trace 加入离线回归集
```

Trace 不只用于故障后排查。它还能支撑：

- 计算每种任务的 Token 与成本；
- 找出最慢的工具和轮次；
- 统计错误 Tool Selection；
- 比较新旧模型的行为；
- 建立发布门禁；
- 审计高风险操作；
- 发现用户在哪一步频繁取消。

## 没有 Trace，Agent 只留下一个答案

传统程序的代码路径相对稳定，输入与错误栈常能定位问题。Agent 的路径在运行时由模型决定，同一输入可能走不同工具、不同轮数和不同 Context。

因此一次执行的过程本身就是核心数据。最终答案只是轨迹最后一个节点。

Agent 需要 Trace，不是因为它“更智能”，而是因为它把概率决策、外部动作和多轮反馈连接在一起。要让这类系统可调试、可评测、可审计，就必须记录每次决策看到了什么、请求了什么、实际执行了什么，以及结果如何改变了下一步。
