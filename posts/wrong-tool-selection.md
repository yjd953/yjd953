# Agent 为什么会调用错误的 Tool？

一个线上诊断 Agent 收到问题：

> 查一下 `payment-api` 最近 30 分钟为什么报错。

系统有两个工具：

```text
search_logs  查询线上服务日志
search_docs  搜索内部技术文档
```

模型却调用了 `search_docs(query="payment-api 最近 30 分钟报错")`，返回几篇过期故障复盘，最后给出错误结论。

“模型不够聪明”不是可操作的分析。选错工具可能发生在 Prompt、描述、Schema、Context、模型决策或 Runtime Mapping 中，必须沿执行链定位。

## 先确认：到底是谁错了

用户看到的是“调用了错误工具”，但至少存在三种情况：

1. 模型明确生成了 `search_docs`，属于选择错误；
2. 模型生成 `search_logs`，Adapter 却解析成 `search_docs`；
3. Trace 显示 `search_logs`，Registry 实际映射到了文档搜索函数。

第一步必须查看原始模型响应和 Runtime 事件：

```json
{
  "model_output": {
    "name": "search_logs",
    "arguments": {
      "service": "payment-api",
      "minutes": 30
    }
  },
  "resolved_tool": "search_docs",
  "handler": "docs.search"
}
```

这个例子里模型选对了，错误发生在 Runtime Mapping。若只看最终 Observation，就可能错误地去调 Prompt。

## 第一层：Prompt 是否制造了错误目标

System Prompt 可能写着：

```text
优先使用内部知识库回答问题，避免昂贵的线上查询。
```

这条全局规则与当前“最近 30 分钟”的实时性要求冲突。模型选择文档并非随机，而是在服从更高优先级指令。

排查 Prompt 时要看最终实际发送内容，而不是只看源模板：

- 系统规则是否强调了错误优先级；
- 用户目标是否被中间层重写；
- 安全策略是否禁止了正确工具；
- Few-shot 示例是否总在相似问题上使用另一个工具；
- 多语言表达是否让时间条件丢失。

修复不一定是加一句“请使用 search_logs”。更好的规则是表达决策条件：

```text
涉及当前或指定时间范围内的运行状态，使用 search_logs。
涉及操作方法、设计说明和历史复盘，使用 search_docs。
```

## 第二层：Tool Description 是否可区分

原始描述可能是：

```text
search_logs: Search service information.
search_docs: Search service information and documents.
```

两者几乎重叠。模型没有清晰特征可以区分，只能依据名称和训练偏好猜测。

好的 Description 应包含四类信息：

```text
search_logs:
Search runtime log events emitted by a service.
Use for errors, requests, LogIDs, and behavior within a concrete time range.
Do not use for design documents or operational instructions.

search_docs:
Search durable internal documents and historical postmortems.
Use for architecture, runbooks, and explanations.
It does not contain live service events.
```

描述不仅要说“它是什么”，还要说“什么时候用”和“什么时候不用”。对于容易混淆的工具，负面边界尤其重要。

## 第三层：Schema 是否让正确调用变难

`search_logs` 的旧 Schema：

```json
{
  "properties": {
    "psm": {"type": "string"},
    "start_ns": {"type": "integer"},
    "end_ns": {"type": "integer"},
    "dsl": {"type": "string"}
  },
  "required": ["psm", "start_ns", "end_ns", "dsl"]
}
```

`search_docs` 只需要一个 `query`。即使模型知道应该查日志，也可能因为无法可靠计算纳秒时间戳和 DSL，转向参数更简单的工具。

Tool Schema 是模型行动空间的一部分。可以把复杂转换留给 Runtime：

```json
{
  "properties": {
    "service": {"type": "string"},
    "minutes": {
      "type": "integer",
      "minimum": 1,
      "maximum": 120
    },
    "keywords": {
      "type": "array",
      "items": {"type": "string"}
    }
  },
  "required": ["service", "minutes"]
}
```

底层 API 仍可以使用纳秒和 DSL，但不必把基础设施细节暴露给模型。

## 第四层：Context 是否污染了当前决策

Agent 之前刚完成“搜索支付架构文档”的任务，Context 中有大量 `search_docs` 调用。新问题到来时，Runtime 没有正确切分 Run，模型延续了旧模式。

Context 污染常见于：

- 保留了上一个任务的 Tool Call 示例；
- 历史 Observation 比当前用户目标更长、更显眼；
- Memory 召回了语义相似但场景不同的记录；
- 工具错误信息诱导模型反复尝试错误工具；
- Summary 把“查实时日志”错误压缩成“查支付资料”。

诊断时应保存 Context Manifest：

```json
{
  "system_prompt_version": "agent-v12",
  "messages": ["msg_101", "msg_102"],
  "memory_items": ["mem_77"],
  "knowledge_chunks": ["doc_12"],
  "tools": ["search_logs@3", "search_docs@2"],
  "token_count": 18420
}
```

这样才能重建模型到底看到了什么，而不是事后凭当前数据库内容猜测。

## 第五层：模型决策本身可能不稳定

即使 Prompt、描述和 Context 都合理，模型仍可能选错。Tool Selection 本质上是概率决策，受模型版本、温度、工具数量和名称影响。

可以用固定输入做重复测试：

```text
同一 Case × 100 次
期望 search_logs
实际：
  search_logs 93
  search_docs  7
```

这说明问题不是确定性 Mapping Bug，而是决策边界不够稳。可采取：

- 减少当前可见工具，只提供任务相关候选；
- 合并高度重叠工具；
- 改善名称、描述和 Schema；
- 增加对比式示例；
- 对明确意图先做确定性路由；
- 对高风险动作增加二次判定或确认。

不要仅靠把温度设为 0。确定性解码可以降低波动，但不会修正错误规则和歧义工具。

## 第六层：Runtime Mapping 是否一致

Registry 可能存在：

```python
REGISTRY = {
    "search_logs": docs_search_handler,  # 配置复制错误
    "search_docs": docs_search_handler,
}
```

也可能是多版本发布不一致：

```text
模型看到：search_logs@v3 Schema
Worker 执行：search_logs@v2 Handler
```

因此 Trace 中要同时记录：

- 模型输出的原始 Tool Name；
- Runtime 解析后的规范名称；
- Registry 版本；
- Handler 标识与部署版本；
- 实际下游 Endpoint；
- 返回结果类型。

Tool 名称相同不代表执行实现相同。没有版本信息时，灰度发布中的 Mapping 问题很难复现。

## 一个完整排查过程

回到案例，团队按顺序检查：

### 1. 重放用户输入

固定模型版本、Prompt 版本、工具集合和 Context，连续执行 30 次。`search_docs` 出现 11 次，证明问题可复现且不是单次偶然。

### 2. 比较两个 Tool 定义

发现描述高度重叠，同时 `search_logs` 参数复杂。将真实线上状态、时间范围和负面边界写入描述，并简化 Schema。

### 3. 做消融实验

只提供 `search_logs` 时成功率 100%；同时提供两者时旧定义准确率 63%；新定义为 98%。这证明主要问题来自工具竞争，而不是模型无法理解用户目标。

### 4. 检查 Context

错误样本中有一条历史 Memory：“payment-api 的错误处理记录在内部文档”。它与当前实时问题语义相似，被高分召回。加入时间意图过滤后不再注入。

### 5. 检查执行映射

确认模型输出与 Handler 一致，排除 Registry Bug。

### 6. 建立回归集

新增成对 Case：

```text
“最近 30 分钟为什么报错” → search_logs
“错误重试策略是怎么设计的” → search_docs
“昨天 LogID xxx 的调用链” → search_logs
“上次故障复盘有什么结论” → search_docs
```

最终修复不是一条更强硬的 Prompt，而是工具边界、Schema、Context 召回和评测共同收敛。

## 一套可复用的 Tool Debug 顺序

出现错工具时，按下面顺序排查能减少猜测：

```text
1. Ground truth
   正确工具真的是唯一合理选择吗？

2. Raw model output
   模型实际生成了什么？

3. Prompt and visible tools
   模型收到了哪些规则和候选？

4. Description and schema
   候选工具是否可区分、可调用？

5. Context and memory
   是否存在过期或冲突信息？

6. Runtime mapping
   名称是否映射到正确版本与 Handler？

7. Execution result
   工具是否正确执行，结果是否被误标？

8. Repeated evaluation
   问题是稳定错误还是概率性退化？
```

每一步都需要证据。只修改 Prompt 然后“感觉好多了”，无法防止下次模型升级或工具新增后回归。

## Tool Selection 是系统行为

模型确实承担语义选择，但它的决策由整个系统塑造：

```text
用户表达
× Prompt 规则
× 可见工具集合
× Description
× Schema 可用性
× Context
× 模型版本
× Runtime Mapping
```

所以“Agent 调错 Tool”很少只有一个原因。可靠的调试方法不是向模型追问“你为什么选错”，而是保存完整执行证据，对每一层做可重复实验，最后把失败样本固化为回归测试。
