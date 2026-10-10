# Skill、Tool、MCP、CLI 到底有什么区别？

在 Agent 项目里经常同时看到 Skill、Tool、MCP、CLI 和 API。它们不是五个互斥方案，而是位于不同层次的东西。

最简单的理解方式，是让它们一起完成一项真实任务：

> 查看线上服务过去一小时的错误日志，定位最常见错误，并创建一条修复任务。

## 先看完整调用链

```text
用户目标
  ↓
Skill：告诉 Agent 如何诊断线上错误
  ↓
Tool：向模型暴露 search_logs / create_task
  ↓
MCP：让 Runtime 发现并调用外部工具
  ↓
CLI 或 HTTP API：真正访问日志与任务系统
  ↓
远程服务
```

这条链并非每层都必需。Tool 可以直接调用 HTTP API，不经过 MCP；Skill 也可以指导 Agent 使用本地 CLI。但各层解决的问题不同。

## API：服务真正提供的能力边界

日志平台可能提供 HTTP API：

```http
POST /v1/logs/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "service": "payment-api",
  "start_time": "2026-09-30T09:00:00Z",
  "end_time": "2026-09-30T10:00:00Z",
  "query": "level:error"
}
```

API 定义系统之间如何通信：URL、认证、请求结构、状态码、返回数据。它通常面向普通程序，并不关心调用者是不是 LLM。

API 可以很完整，却不一定适合直接交给模型：

- 接口数量多；
- 参数接近底层实现；
- 认证信息不能进入模型；
- 返回值可能过大；
- 一个业务动作可能需要组合多个 API。

因此 Runtime 往往在 API 上再包装一层 Tool。

## CLI：给人和脚本使用的程序入口

同一个平台可能提供命令行：

```bash
logctl search \
  --service payment-api \
  --since 1h \
  --query 'level:error' \
  --format json
```

CLI 解决本地操作和自动化入口问题。它负责解析命令行参数、读取配置、调用 API，并把结果打印到标准输出。

Agent 可以通过 Shell Tool 执行 CLI，但需要注意：

- CLI 输出主要为人设计，格式可能不稳定；
- Shell 拼接有命令注入风险；
- 凭证通常来自本机配置，权限边界要单独控制；
- 退出码、标准错误和 JSON 输出必须保留；
- 交互式登录、分页器和确认提示会让自动化卡住。

如果 CLI 支持稳定的 `--json` 输出和非交互模式，它可以成为很实用的执行后端。若只有彩色表格文本，Runtime 就要做脆弱的解析。

## Tool：模型可选择的动作契约

Runtime 可以把日志能力包装为：

```json
{
  "name": "search_service_errors",
  "description": "Search error logs for one service in a bounded time range.",
  "parameters": {
    "type": "object",
    "properties": {
      "service": {"type": "string"},
      "minutes": {"type": "integer", "minimum": 1, "maximum": 120},
      "keywords": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["service", "minutes"]
  }
}
```

Tool 是给模型看的能力接口。它隐藏了：

- API URL 和认证；
- CLI 的具体命令；
- 日志平台的分页逻辑；
- 查询结果的截断与脱敏；
- 超时、重试和限流。

模型只需决定：现在是否该搜索日志，以及搜索哪个服务、哪个时间范围。

Tool 的实现可以调用 SDK：

```python
def search_service_errors(service, minutes, keywords=None):
    return log_client.search(...)
```

也可以调用 CLI：

```python
def search_service_errors(service, minutes, keywords=None):
    return run_json_command(["logctl", "search", ...])
```

还可以通过 MCP Client 调远程工具。对模型来说，它们都表现为同一种 Tool Call。

## MCP：工具提供方与 Agent Runtime 之间的通用协议

如果每个 Agent 都要手工接入日志、任务、数据库和云盘系统，会反复实现：

- 如何列出可用工具；
- 如何描述参数 Schema；
- 如何发起调用；
- 如何关联请求与响应；
- 如何读取资源；
- 如何通过本地进程或网络传输。

MCP 把这些交互标准化。日志团队可以运行一个 MCP Server，声明：

```text
tools/list  → search_service_errors, get_trace
tools/call  → 执行指定工具
resources/* → 暴露可读取资源
```

Agent Runtime 作为 MCP Client 连接 Server，发现工具，再把选中的工具描述交给模型。

MCP 不是日志 API 的替代品。Server 内部往往仍调用原有 HTTP API 或 CLI。它解决的是**AI Runtime 如何用统一方式发现和调用上下文能力**。

## Skill：教 Agent 在什么情境下如何组合能力

Tool 告诉模型“能做什么”，却未必告诉它“怎样把一项复杂工作做好”。

针对线上错误诊断，可以有一份 Skill：

```markdown
# Production Error Diagnosis

1. 先确认服务名、区域和时间范围。
2. 查询错误率趋势，不要只看单条日志。
3. 按 error_type 聚合，选择出现次数最多的错误。
4. 对代表性请求读取 Trace。
5. 涉及数据写入前必须获得用户确认。
6. 创建任务时附上时间范围、样例 LogID 和证据链接。
```

Skill 通常是面向 Agent 的操作知识、工作流和约束集合。它可能包含：

- 什么时候使用哪些 Tool；
- 参数如何获得；
- 常见失败如何处理；
- 哪些动作必须确认；
- 输出应满足什么格式；
- 相关脚本和参考资料在哪里。

Skill 本身通常不执行远程操作。它通过 Prompt 或运行时编排影响模型如何使用 Tool。

可以类比：

```text
Tool  = 能力：“可以查询日志”
Skill = 方法：“如何完成一次可靠的故障诊断”
```

只给 Tool，模型可能漫无目的地查；只给 Skill，却没有可执行能力，模型只能描述步骤。

## 五者分别处在哪一层

| 名称 | 主要面向 | 解决的问题 | 是否直接执行 |
| --- | --- | --- | --- |
| Skill | 模型 / Agent | 如何完成一类任务 | 通常不直接执行 |
| Tool | 模型 + Runtime | 模型可以请求哪些受控动作 | 由 Runtime 执行 |
| MCP | Runtime + 能力提供方 | 如何发现、描述和调用工具/资源 | 传输和协议层 |
| CLI | 人 / 脚本 / 本地进程 | 如何从命令行操作系统 | 是 |
| API | 程序 / 服务 | 系统之间如何交换请求与响应 | 服务端执行 |

表中的层次不是绝对标准。例如某些平台把 Skill 做成可执行插件，把 API 直接称为 Tool。但只要问清“它面向谁、描述什么、由谁执行”，就能避免名词混乱。

## 同一个任务里它们如何协作

回到开头的故障诊断：

### 1. Skill 约束方法

Agent 读到诊断 Skill，知道先看趋势、再聚合错误、最后读取代表 Trace，不能凭一条日志直接下结论。

### 2. 模型选择 Tool

模型生成：

```json
{
  "name": "search_service_errors",
  "arguments": {
    "service": "payment-api",
    "minutes": 60
  }
}
```

### 3. Runtime 通过 MCP 调用

MCP Client 将调用发给日志 MCP Server。Server 校验权限和参数。

### 4. Server 使用 API 或 CLI

MCP Server 调用日志平台 HTTP API，也可能复用已有 `logctl` CLI。

### 5. 结果逐层返回

```text
日志 API 响应
→ MCP Server 归一化
→ MCP Client 收到 Tool Result
→ Runtime 构造 Observation
→ 模型依据结果继续
```

找到根因后，模型再调用 `create_task`。Skill 要求附带证据，Runtime 则在写操作前检查权限与确认状态。

## 为什么 Agent 系统会同时出现它们

因为一个可维护系统需要把不同变化隔离开：

- 业务方法变化，更新 Skill；
- 模型可用动作变化，更新 Tool Schema；
- 工具连接方式变化，更新 MCP Server 或 Client；
- 本地操作入口变化，更新 CLI；
- 后端服务协议变化，更新 API 和适配器。

如果把所有东西都塞进 Prompt，认证和执行无法控制；如果只暴露一个万能 Shell，模型拥有过大权限且难以校验；如果每个 Agent 直接对接几十套 API，集成代码会重复且难以发现。

## 选择时不要从名词出发

可以按问题反推：

- 需要定义服务间数据协议：设计 API；
- 需要给开发者稳定的本地操作入口：提供 CLI；
- 需要让模型选择一个受控动作：包装 Tool；
- 需要让多种 Agent Runtime 统一接入能力：提供 MCP Server；
- 需要沉淀一类任务的可靠做法：编写 Skill。

它们可以叠加，却不能相互替代。Skill 不提供执行权限，Tool 不自动提供领域方法，MCP 不保证业务正确，CLI 不天然适合模型，API 也不负责 Agent 的上下文与决策。

看懂这些层之后，一条 Tool Call 就不再像模型伸手操作世界，而是一项意图沿着多层契约向下传递，再把可验证结果逐层送回模型的过程。
