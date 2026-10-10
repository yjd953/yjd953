# 一个 Agent 最少需要多少代码？

如果只看核心，Agent 不需要框架，也不需要几千行代码。它需要的只是一个循环：把目标交给模型，识别模型提出的 Tool Call，执行工具，把结果放回消息，再问模型下一步做什么。

但“能跑”与“能长期运行”之间，正好隔着 Memory、Retry、Timeout、并发、权限和可观测性。下面从一个最小循环开始，逐层把这些能力加回来。

## 先规定模型与 Runtime 的协议

为了不绑定某个模型 SDK，先约定 `call_llm` 返回两种结果之一：

```python
{"type": "answer", "content": "最终回答"}
```

或者：

```python
{
    "type": "tool_calls",
    "calls": [
        {
            "id": "call_01",
            "name": "get_weather",
            "arguments": {"city": "Beijing"}
        }
    ]
}
```

模型厂商的 API 格式可能不同，但 Runtime 最好先适配成自己的内部结构。这样 Agent Loop 不必知道 `tool_calls` 究竟来自 OpenAI、Claude 还是本地模型。

## 版本一：最小 Agent Loop

下面是核心代码。假设 `call_llm(messages, tool_schemas)` 已经封装好模型调用：

```python
import json


def get_weather(city: str) -> dict:
    # 示例工具；真实实现可能调用天气 API。
    return {"city": city, "temperature": 18, "condition": "rain"}


TOOLS = {
    "get_weather": {
        "function": get_weather,
        "schema": {
            "name": "get_weather",
            "description": "Get current weather for a city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string"}
                },
                "required": ["city"],
                "additionalProperties": False,
            },
        },
    }
}


def run_agent(user_input: str, max_steps: int = 8) -> str:
    messages = [{"role": "user", "content": user_input}]
    schemas = [item["schema"] for item in TOOLS.values()]

    for _ in range(max_steps):
        response = call_llm(messages, schemas)

        if response["type"] == "answer":
            return response["content"]

        messages.append({"role": "assistant", "tool_calls": response["calls"]})

        for call in response["calls"]:
            tool = TOOLS.get(call["name"])
            if tool is None:
                result = {"ok": False, "error": "unknown_tool"}
            else:
                try:
                    value = tool["function"](**call["arguments"])
                    result = {"ok": True, "value": value}
                except Exception as exc:
                    result = {"ok": False, "error": str(exc)}

            messages.append({
                "role": "tool",
                "tool_call_id": call["id"],
                "content": json.dumps(result, ensure_ascii=False),
            })

    raise RuntimeError("agent exceeded max_steps")
```

去掉工具定义，循环本身只有几十行，却已经具有 Agent 的关键性质：

1. 模型可以选择回答或行动；
2. 行动结果会成为下一轮输入；
3. 模型可以依据结果继续行动；
4. Runtime，而不是模型，执行真正的函数；
5. `max_steps` 保证循环不会无限进行。

这就是最小 Agent。Prompt 再复杂、模型再强，也不能替代这段控制流。

## 先看一次真实执行

用户输入：

```text
北京今天适合带伞吗？
```

消息序列会这样增长：

```text
messages[0] user:
  北京今天适合带伞吗？

LLM → tool_call:
  get_weather(city="Beijing")

messages[1] assistant:
  tool_call call_01

messages[2] tool:
  {"ok": true, "value": {"condition": "rain", ...}}

LLM → answer:
  建议带伞，当前天气为雨。
```

Agent 的“思考过程”不必等同于隐藏的 Chain of Thought。工程上真正可依赖的是可观察事件：模型请求了什么、Runtime 执行了什么、工具返回了什么、下一轮基于哪些输入继续。

## 版本二：加入 Memory，但不要无限追加

当前 `messages` 只活在一次函数调用中。下一次用户再问“那上海呢”，系统不知道“那”指天气。

最简单的 Memory 是按 Session 保存消息：

```python
class InMemorySessionStore:
    def __init__(self):
        self.sessions = {}

    def load(self, session_id):
        return list(self.sessions.get(session_id, []))

    def save(self, session_id, messages):
        self.sessions[session_id] = list(messages)
```

然后把入口改为：

```python
def run_agent(session_id, user_input, store, max_steps=8):
    messages = store.load(session_id)
    messages.append({"role": "user", "content": user_input})
    # 原循环……
    store.save(session_id, messages)
```

这只是 Conversation History，还不是成熟的长期 Memory。消息会不断增长，最终超过 Context Window。实际系统至少还要做三件事：

- 只保留最近若干轮原文；
- 把更早内容压缩成可检查的 Summary；
- 将用户偏好、任务事实等结构化信息单独存储并按需检索。

Memory 不是“把所有历史塞回 Prompt”，而是决定哪些过去信息值得进入当前决策。

## 版本三：加入参数校验

最小代码直接执行：

```python
tool["function"](**call["arguments"])
```

这默认模型一定提供正确参数。现实中它可能漏字段、拼错类型，甚至生成 Schema 外参数。模型输出必须被当作不可信输入。

使用 JSON Schema 校验后再执行：

```python
from jsonschema import validate


def validate_call(tool, arguments):
    validate(
        instance=arguments,
        schema=tool["schema"]["parameters"],
    )
```

校验失败时不要让整个进程崩溃，而应生成结构化 Observation：

```json
{
  "ok": false,
  "error": {
    "type": "invalid_arguments",
    "message": "'city' is required",
    "retryable": true
  }
}
```

模型能根据这个结果修正参数；Runtime 也保留了明确的失败语义。

## 版本四：加入 Retry，但只重试正确的失败

网络抖动可以重试，参数错误不应原样重试；读请求通常可以重试，转账请求则可能造成重复扣款。

一个克制的重试器需要同时知道错误类型与工具属性：

```python
import random
import time


def execute_with_retry(tool, arguments, attempts=3):
    last_error = None

    for attempt in range(attempts):
        try:
            return {"ok": True, "value": tool["function"](**arguments)}
        except tool.get("retryable_errors", (TimeoutError,)) as exc:
            last_error = exc
            if not tool.get("idempotent", False):
                break
            delay = 0.2 * (2 ** attempt) + random.random() * 0.1
            time.sleep(delay)

    return {
        "ok": False,
        "error": {
            "type": "tool_execution_failed",
            "message": str(last_error),
            "retryable": False,
        },
    }
```

对于有副作用的工具，更可靠的办法是让调用携带 `idempotency_key`，由服务端保证同一个键只生效一次。不能把“多试几次”当成通用可靠性策略。

## 版本五：加入 Timeout 与 Cancellation

没有超时的工具可以让整个 Agent 永久卡住。最外层任务要有总 Deadline，每次工具调用只能使用剩余预算的一部分。

```python
import asyncio


async def execute_with_timeout(tool, arguments, timeout_seconds):
    try:
        value = await asyncio.wait_for(
            tool["async_function"](**arguments),
            timeout=timeout_seconds,
        )
        return {"ok": True, "value": value}
    except asyncio.TimeoutError:
        return {
            "ok": False,
            "error": {"type": "timeout", "retryable": True},
        }
```

`wait_for` 能取消遵守协作式取消的异步任务，但未必能终止已经发出的远程请求或阻塞线程。严格的 Cancellation 需要工具实现主动接收 Deadline，网络层设置超时，并为不可控代码提供进程或容器隔离。

超时不是一句 `try/except`，而是一条从 Session 到 Tool 的预算传播链。

## 版本六：加入 Parallel Tool Call

如果模型同时请求北京和上海天气，两次读操作没有依赖，顺序执行只会增加延迟：

```python
async def execute_one(call):
    tool = TOOLS[call["name"]]
    return call["id"], await execute_with_timeout(
        tool,
        call["arguments"],
        timeout_seconds=3,
    )


async def execute_batch(calls):
    pairs = await asyncio.gather(
        *(execute_one(call) for call in calls),
        return_exceptions=True,
    )
    return dict(pairs)
```

并行前要先判断：

- 调用之间是否存在数据依赖；
- 是否会修改同一资源；
- 工具或下游服务是否有限流；
- 结果回传时能否用 `tool_call_id` 正确对应；
- 一项失败时，其他调用是保留、取消还是回滚。

并行不是把所有调用扔进 `gather`。它要求 Runtime 明确依赖关系和失败策略。

## 从循环到系统，增加的是什么

将这些版本放在一起，可以看到 Agent 的演化路径：

| 阶段 | 新增能力 | 解决的问题 | 新风险 |
| --- | --- | --- | --- |
| Loop | 多轮决策 | 模型能根据结果继续行动 | 无限循环 |
| Memory | 跨轮信息 | 能继续会话与长期任务 | Context 膨胀、错误记忆 |
| Validation | 输入契约 | 拦截错误参数 | Schema 演进 |
| Retry | 暂时故障恢复 | 网络抖动不再直接失败 | 重复副作用 |
| Timeout | 有界等待 | 工具不再无限阻塞 | 僵尸任务 |
| Parallel | 独立动作并发 | 降低总延迟 | 竞态与限流 |

几十行代码足以证明 Agent Loop 的原理，却不足以承诺生产可靠性。后续增加的大部分代码并不是让模型“更聪明”，而是在回答这些工程问题：

- 这一步允许执行吗？
- 最多执行多久、多少次、花多少钱？
- 失败以后能不能重试？
- 结果是否真的生效？
- 任务能不能暂停、恢复和取消？
- 出问题时能不能完整回放？

## 最小实现的真正价值

自己写一次最小 Agent，不是为了拒绝框架，而是为了识别框架替你做了什么。一个成熟框架可能隐藏消息适配、工具注册、并发调度和持久化；如果不了解最小循环，遇到重复调用、Context 污染或超时失效时，只能在抽象层外猜测。

Agent 的最小核心可以很短：

```text
LLM → Tool Call → Execute → Result → LLM
```

Agent 系统之所以变大，是因为现实世界要求它在错误、延迟、权限和副作用面前仍然可控。代码量增长的不是“智能”，而是系统对不确定性的管理能力。
