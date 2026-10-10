# 如何设计一个可靠的 Agent Tool 系统？

模型可以生成错误参数、选错工具、重复请求，也可能在执行一半时改变主意。可靠 Tool 系统不能假设模型永远正确，它必须把 Tool Call 当作来自不可信决策器的执行提案。

核心原则是：

> 模型负责提出“想做什么”，Runtime 负责决定“能不能做、怎样做、做完如何证明”。

## 从 Tool Contract 开始

一个工具不能只有函数名。完整契约至少包含：

```yaml
name: create_refund
version: 3.2.0
description: Create a refund for one paid order.
input_schema: ...
output_schema: ...
permissions:
  - order:read
  - refund:write
side_effect: irreversible
idempotent: true
timeout_ms: 5000
retry_policy: transient_only
confirmation: required_above_100
```

这些字段分别服务于模型、Runtime 和审计系统。Description 帮助模型选择；Schema 用于校验；权限、超时和重试策略必须由 Runtime 强制执行。

## Schema Validation：模型输出永远不是可信参数

假设模型生成：

```json
{
  "name": "create_refund",
  "arguments": {
    "order_id": "o_123",
    "amount": "all",
    "reason": "user request",
    "notify": true
  }
}
```

如果 `amount` 应是整数分，Runtime 必须拒绝，而不是猜 `"all"` 表示全额。

一个更严格的 Schema：

```json
{
  "type": "object",
  "properties": {
    "order_id": {
      "type": "string",
      "pattern": "^o_[a-zA-Z0-9]+$"
    },
    "amount_cents": {
      "type": "integer",
      "minimum": 1
    },
    "reason_code": {
      "type": "string",
      "enum": ["duplicate", "service_failure", "customer_request"]
    }
  },
  "required": ["order_id", "amount_cents", "reason_code"],
  "additionalProperties": false
}
```

Schema 之后仍要做业务校验：

- 订单是否属于当前用户；
- 是否已经退款；
- 金额是否超过可退余额；
- 订单所在地区是否允许该原因；
- 当前时间是否超过退款窗口。

类型正确不等于业务合法。

## Permission：授权必须绑定真实身份

模型可能在 Prompt Injection 影响下请求高风险工具。System Prompt 中写“不要越权”不是访问控制。

Runtime 应基于可信上下文判断：

```text
Principal：谁发起任务
Resource：要操作哪个对象
Action：read / write / delete / execute
Environment：租户、区域、设备、时间
Policy：是否允许，是否需要审批
```

授权结果不应来自模型参数中的 `user_id`。用户身份必须由会话或服务令牌注入：

```python
handler(
    arguments=validated_arguments,
    principal=runtime_context.principal,
)
```

对于写操作，可以引入风险分级：

| 风险 | 示例 | 处理 |
| --- | --- | --- |
| 低 | 读取公开文档 | 自动执行 |
| 中 | 修改草稿、创建临时资源 | 明确展示后执行 |
| 高 | 转账、删除、外发消息 | 人工确认或双重授权 |

确认信息要展示实际参数和影响，不能只问“是否继续”。

## Timeout：每个动作必须有上界

工具超时至少有三层：

```text
Agent Run Deadline
  └─ Tool Call Timeout
       └─ 下游连接 / 读取 Timeout
```

如果 Run 只剩 4 秒，Runtime 不应再发起默认超时 30 秒的调用。Deadline 要向下传播。

超时结果还需区分：

```text
not_started      请求未发送，可安全重试
in_flight        是否生效未知，先查询状态
server_cancelled 服务确认取消
completed_late   已生效但结果迟到
```

仅返回 `timeout` 会让模型无法判断下一步，也可能导致重复副作用。

## Retry：只恢复暂时故障

可以重试的常见错误：

- 连接建立失败；
- 读操作超时；
- 服务端明确返回可重试状态；
- 限流并提供 `retry_after`。

不应原样重试：

- 参数校验失败；
- 权限拒绝；
- 业务规则冲突；
- 非幂等写操作结果未知；
- 工具版本不兼容。

重试需要指数退避、随机抖动和总预算：

```text
attempt 1 → 200ms
attempt 2 → 400ms + jitter
attempt 3 → 800ms + jitter
stop when deadline is exhausted
```

模型不必看见每一次网络抖动，但 Trace 必须记录。最终 Observation 应说明执行了几次以及最终状态。

## Idempotency：防止同一意图生效两次

创建订单、发消息、退款等动作可能在服务端成功后丢失响应。Runtime 重试时，工具必须识别这是同一项业务意图。

```http
POST /refunds
Idempotency-Key: run_42:call_07
```

服务端保存键与结果：

```text
首次请求 → 创建 refund_99，保存映射
重复请求 → 直接返回 refund_99，不再次退款
```

幂等键应稳定绑定逻辑调用，不能每次 Retry 重新生成。模型也不应负责生成这个键，否则它可能改变或复用错误值。

对于天然不幂等的系统，需要执行前查询、事务 Outbox、去重表或补偿操作。

## Result Verification：成功响应不等于目标完成

工具返回：

```json
{"ok": true, "refund_id": "r_99"}
```

这证明调用被接受，不一定证明退款到账。可靠系统要定义完成语义：

```text
accepted  已受理
processing 执行中
succeeded 已完成并可查询
failed    明确失败
unknown   结果未知
```

高风险动作可以使用独立读工具核验：

```text
create_refund → refund_id
get_refund(refund_id) → status=succeeded
```

验证最好来自权威外部状态，而不是让模型阅读“success”字符串后自行宣布完成。

## Error Model：让失败可被程序理解

避免只返回：

```json
{"error": "something went wrong"}
```

更好的错误：

```json
{
  "ok": false,
  "error": {
    "code": "REFUND_ALREADY_EXISTS",
    "category": "business_conflict",
    "message": "A refund already exists for this order.",
    "retryable": false,
    "existing_resource_id": "r_99"
  }
}
```

稳定的错误类型让 Runtime 可以执行确定策略，也让模型知道应查询已有资源，而不是换个措辞重复创建。

不要把内部堆栈、凭证或数据库细节直接送入模型。详细异常进入受控日志，Observation 只保留决策所需信息。

## Logging 与 Trace：记录意图、执行和结果

每次 Tool Call 至少记录：

```json
{
  "trace_id": "tr_1",
  "tool_call_id": "call_7",
  "tool": "create_refund",
  "version": "3.2.0",
  "argument_hash": "sha256:...",
  "principal": "user_hash",
  "policy": "allow_after_confirmation",
  "attempt": 1,
  "started_at": "...",
  "duration_ms": 482,
  "status": "accepted",
  "external_request_id": "req_88",
  "result_ref": "secure://..."
}
```

三个值要分开：

- 模型请求了什么；
- Runtime 实际执行了什么；
- 外部系统最终发生了什么。

它们不总是一致。例如 Runtime 可能规范化参数、拒绝动作，或执行成功但后续核验失败。

## Versioning：Schema 与实现必须一起演进

假设 v1 使用：

```json
{"amount": 100}
```

v2 改为：

```json
{"amount_cents": 10000, "currency": "CNY"}
```

如果模型看到 v2 Schema，Worker 却执行 v1 Handler，就可能造成金额错误。

发布时应绑定：

```text
tool_name + schema_version + handler_version + policy_version
```

破坏性修改优先发布新工具版本或新名称，在旧 Session 清空前保持兼容。Trace 中记录版本，离线评测也要按版本分组。

## Parallel Execution：并发前先声明依赖

模型一次返回多个 Tool Call，不代表它们可以安全并行。

可以并行：

```text
get_weather(Beijing)
get_weather(Shanghai)
```

不能直接并行：

```text
create_order()
pay_order(order_id)
```

两个写操作即使参数独立，也可能竞争同一资源。Runtime 应根据 Tool 元数据和计划依赖建立执行图，并设置：

- 每工具并发上限；
- 每租户速率限制；
- Fail-fast 或部分成功策略；
- 结果按 `tool_call_id` 关联；
- 取消时如何处理已开始动作。

并发是调度能力，不应完全由模型输出顺序隐式决定。

## 一个可靠执行管线

把这些要求合在一起：

```text
1. Receive proposal
   接收模型 Tool Call

2. Resolve exact version
   在 Registry 中解析确定版本

3. Parse and validate
   JSON、Schema、业务规则

4. Authorize
   身份、资源、动作、风险与确认

5. Schedule
   Deadline、并发、限流、依赖

6. Execute
   隔离运行，传递幂等键与取消信号

7. Normalize
   统一成功、失败与结果未知

8. Verify
   对关键副作用读取权威状态

9. Record
   日志、Trace、版本与审计

10. Observe
    只把必要、脱敏、可理解的结果交给模型
```

这条管线应位于模型与现实能力之间，不能依赖模型自觉遵守。

## 最重要的责任边界

模型可以：

- 误解用户；
- 选错工具；
- 漏掉参数；
- 重复提出同一动作；
- 过早宣布完成。

Runtime 不应该因此：

- 执行越权操作；
- 无限等待或无限重试；
- 重复产生副作用；
- 把失败包装成成功；
- 丢失审计证据。

可靠 Tool 系统不是让错误永不发生，而是让错误在明确边界内发生：尽早校验、限制影响、保留证据、允许恢复。模型的概率性是 Agent 获得开放决策能力的来源，Runtime 的确定性则是这份能力能够进入生产环境的前提。
