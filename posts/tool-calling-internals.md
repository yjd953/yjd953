# Tool Calling 到底发生了什么？

从模型 API 中看到下面这段 JSON 时，人们很容易说：“模型调用了搜索函数。”

```json
{
  "name": "search",
  "arguments": {
    "query": "xxx"
  }
}
```

严格来说，模型没有调用任何函数。它只生成了一份符合约定格式的**调用请求**。从这份 JSON 到真实搜索结果，中间至少经过工具描述、模型解码、协议解析、参数校验、函数路由、执行隔离和结果回传七个环节。

## 第 0 步：Runtime 先把工具告诉模型

模型不会自动知道进程中有哪些 Python 函数。Runtime 在请求模型时附带工具 Schema：

```json
{
  "name": "search",
  "description": "Search public web pages for current information.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "A concise search query."
      },
      "limit": {
        "type": "integer",
        "minimum": 1,
        "maximum": 10
      }
    },
    "required": ["query"],
    "additionalProperties": false
  }
}
```

这份 Schema 有两种作用。

第一，它进入模型 Context，帮助模型理解“我能做什么”。工具名称和描述会影响选择，参数描述会影响模型如何填值。

第二，它成为 Runtime 的输入契约。即使模型声称输出符合 Schema，Runtime 仍要重新校验，因为生成结果不可信。

工具注册表则保存执行侧信息：

```python
TOOL_REGISTRY = {
    "search": {
        "schema": search_schema,
        "handler": search_web,
        "timeout_seconds": 5,
        "permission": "network:read",
        "idempotent": True,
        "version": "2.1.0",
    }
}
```

Schema 是给模型和校验器看的；`handler`、权限、超时等信息只属于 Runtime，不应暴露成让模型自行决定的文本。

## 第 1 步：模型生成的仍然是 Token

支持 Tool Calling 的模型并不是突然获得了函数指针。底层仍然是在预测下一个 Token，只是服务端通过训练、特殊 Token 和受约束解码，让输出落入某种结构。

一个 API 响应可能是：

```json
{
  "finish_reason": "tool_calls",
  "message": {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "call_7f3",
        "type": "function",
        "function": {
          "name": "search",
          "arguments": "{\"query\":\"xxx\",\"limit\":5}"
        }
      }
    ]
  }
}
```

注意 `arguments` 在一些协议里是 JSON 字符串，而不是已经解析的对象。Streaming 响应甚至会把它拆成多段：

```text
chunk 1: {"query":
chunk 2: "xxx",
chunk 3: "limit":5}
```

适配层必须按 `tool_call_id` 聚合增量，直到收到结束标记后再解析。对未完成的半段 JSON 直接执行，会制造难以复现的问题。

## 第 2 步：协议适配层做标准化

不同模型供应商使用不同字段名、结束原因和内容块格式。Agent Runtime 通常先将它们统一为内部事件：

```json
{
  "kind": "tool_call_requested",
  "call_id": "call_7f3",
  "tool_name": "search",
  "arguments": {
    "query": "xxx",
    "limit": 5
  },
  "model": "model-name",
  "request_id": "req_abc"
}
```

标准化不是简单改字段名。它还要处理：

- 一个响应中的多个并行 Tool Call；
- 文本内容和 Tool Call 同时出现；
- 参数 JSON 无法解析；
- 模型请求了未提供的工具；
- Provider 重试后返回重复 `call_id`；
- Streaming 中断，只收到部分参数。

只有完成标准化后，后续执行器才能与模型厂商解耦。

## 第 3 步：Tool Registry 负责从名称到能力的映射

解析出 `name: search` 后，Runtime 在 Registry 中查找工具。这里不是普通的字典查询那么简单，因为生产系统还要确定：

- 当前租户是否启用了该工具；
- 当前用户是否有调用权限；
- 此 Session 是否允许网络访问；
- 请求的是哪个工具版本；
- 工具是否已熔断或下线；
- 模型看到的别名应映射到哪个内部实现。

如果模型请求 `search_web`，而 Registry 只有 `search`，Runtime 不应靠模糊匹配猜一个最像的函数。正确做法是返回结构化的 `unknown_tool`，让模型重新选择，或由明确的兼容映射处理旧名称。

模糊路由会把一个可见错误变成错误工具的真实副作用。

## 第 4 步：参数要经过三层检查

### 语法检查

`arguments` 必须是合法 JSON。不要使用 `eval`，也不要用正则“修复”任意模型输出后直接执行。

### Schema 检查

校验必填字段、类型、枚举、长度、数值范围和 `additionalProperties`。例如：

```json
{
  "query": ["xxx"]
}
```

虽然语法正确，但 `query` 应为字符串，不能进入执行层。

### 业务与安全检查

Schema 正确不代表调用合法：

- `read_file("../../etc/passwd")` 类型正确，却越过工作区；
- `transfer(amount=1000000)` 数值合法，却超过用户额度；
- `delete_user(id="admin")` 参数完整，却缺乏授权；
- 搜索字符串可能包含不应发送给第三方的敏感信息。

业务校验需要可信身份、会话策略和环境状态，不能仅依赖模型判断。

## 第 5 步：Tool Executor 才真正执行函数

执行器把已批准的请求交给本地函数、HTTP 服务、CLI、浏览器或远程 MCP Server。一个工具调用至少应产生如下执行记录：

```json
{
  "call_id": "call_7f3",
  "tool": "search",
  "version": "2.1.0",
  "started_at": "2026-09-30T10:00:00Z",
  "deadline_ms": 5000,
  "attempt": 1,
  "permission_principal": "user_123"
}
```

执行期间，Runtime 负责超时、取消、限流、并发隔离、重试和审计。对于修改外部状态的工具，还应携带幂等键：

```text
idempotency_key = session_id + tool_call_id
```

这样网络超时后即使重试，也不会重复创建订单或重复发送消息。

## 第 6 步：返回值要变成 Observation

工具函数可能返回对象、异常、二进制文件或百万行日志。模型接口通常只接受有限长度的文本或结构化内容。因此需要 Result Adapter：

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "title": "Example",
        "url": "https://example.com",
        "snippet": "..."
      }
    ]
  },
  "meta": {
    "total": 128,
    "returned": 5,
    "truncated": true
  }
}
```

一个好的 Observation 要满足三点：

1. **可区分成功与失败**：不能用 `"error": null` 和模糊文本让模型猜；
2. **保留决策所需事实**：例如状态码、资源 ID、是否截断；
3. **限制体积与敏感数据**：大结果存外部，只把摘要和引用放入 Context。

错误也应结构化：

```json
{
  "ok": false,
  "error": {
    "type": "rate_limited",
    "message": "Search quota exceeded.",
    "retryable": true,
    "retry_after_ms": 1000
  }
}
```

如果所有失败都只返回 `"something went wrong"`，模型就无法选择等待、换工具、改参数还是停止。

## 第 7 步：结果以 Tool Message 回到模型

Runtime 将 Observation 关联原始 `tool_call_id`：

```json
{
  "role": "tool",
  "tool_call_id": "call_7f3",
  "content": "{\"ok\":true,\"data\":{...}}"
}
```

然后把完整消息序列再次发送给模型：

```text
system: 你的任务与边界
user: 查询 xxx 并总结
assistant: tool_call call_7f3
tool: call_7f3 的执行结果
```

模型在新一轮可以：

- 根据结果直接回答；
- 发起另一个搜索；
- 换用读取网页工具；
- 发现证据不足并向用户提问。

“再次调用模型”是 Tool Calling 闭环不可缺少的一步。只执行工具、不把结果送回模型，模型就无法基于环境反馈继续决策。

## 一次调用会在哪些地方失败

完整链路可以画成：

```text
Tool Schema
   ↓ 注入 Context
LLM 生成 Tool Call
   ↓ Provider Adapter
内部调用事件
   ↓ Registry + Policy
参数与权限校验
   ↓ Tool Executor
本地/远程函数执行
   ↓ Result Adapter
结构化 Observation
   ↓ 关联 call_id
再次调用 LLM
```

每一层都有不同故障：

| 层 | 典型故障 |
| --- | --- |
| Schema | 描述含糊、工具重叠、版本不一致 |
| 模型输出 | 选错工具、漏参数、生成未知名称 |
| Adapter | 流式参数拼接错误、丢失 call ID |
| Registry | 映射错误、工具下线、租户配置错误 |
| Policy | 越权、敏感数据外发、高风险动作未确认 |
| Executor | 超时、限流、重复副作用、进程崩溃 |
| Observation | 日志截断根因、成功失败语义模糊 |
| Context | 结果关联错调用、顺序错误、内容过长 |

只记录最终答案，就会把这些完全不同的问题混成一句“Agent 调错了”。

## 为什么这条边界重要

把模型说成函数执行者，会产生三个危险误解：

第一，以为 Tool Schema 是提示词装饰，忽略它其实也是行为接口。第二，以为模型会遵守权限，忽略所有授权都必须在执行侧强制。第三，以为模型说“执行成功”就是事实，忽略结果必须来自工具或后续核验。

更准确的说法是：

> 模型生成工具调用提案，Runtime 对提案进行解释、授权和执行，再把环境结果转换成模型可见的 Observation。

这一区分把责任放回正确位置。模型可以犯语义决策错误；Runtime 不能因此执行越权、无界或不可追踪的动作。Tool Calling 的价值并不是让模型直接拥有函数，而是为概率性的决策和确定性的程序执行建立一条受控协议。
