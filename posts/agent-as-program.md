# Agent 是不是一种新的程序？

传统程序由人写下明确指令，计算机按规则执行。Agent 则把目标交给模型，由模型在运行时决定下一步。

这看起来像一种全新的程序：

```text
传统程序：开发者预先写控制流
Agent：模型运行时生成部分控制流
```

但 Agent 并没有脱离函数、进程、数据库和调度器。它更像是在传统软件结构中加入一个概率性决策层。问题不该被简化成“是”或“不是”，而应看哪些部分真的发生了变化。

## Function 与 Tool：从确定调用到语义选择

传统代码调用函数：

```python
order = get_order(order_id)
if order.is_late:
    create_compensation(order.id)
```

函数签名与调用位置由开发者确定。编译器或解释器无需理解“为什么要补偿”。

Agent 使用 Tool：

```text
目标：处理这个延迟订单
可用动作：get_order / get_logistics / create_compensation / ask_user
```

模型根据自然语言目标和 Observation 选择动作。Tool 在执行层仍然可能只是普通函数，但调用关系不再完全写死。

相同点：

- 都需要名称、参数、返回值和错误；
- 都应有类型或 Schema；
- 都可能产生副作用；
- 都需要测试和版本管理。

变化点：

- Function Call 的调用者通常是确定代码；
- Tool Call 的提案者可能是概率模型；
- Tool Description 成为行为接口的一部分；
- Runtime 必须验证动态生成的参数与权限。

Tool 不是 Function 的替代品，而是把函数包装成模型可理解、Runtime 可控制的动作。

## Process 与 Agent：从执行映像到目标载体

操作系统中的 Process 拥有：

- 指令位置；
- 内存空间；
- 打开的资源；
- 生命周期状态；
- 调度与信号。

长时间运行的 Agent Run 也需要：

- 当前目标；
- Conversation / Context；
- Task State；
- 可用工具；
- 执行预算；
- 暂停、恢复和取消。

二者有相似的生命周期：

```text
created → running → waiting → running → completed / failed / cancelled
```

但 Process 的下一条指令由程序计数器确定；Agent 的下一步可能由 LLM 根据语义状态生成。Agent 也不一定一直占用一个进程，它可以持久化后在不同 Worker 上恢复。

所以 Agent 更像逻辑执行实体，而不是操作系统实体。一个 Agent Run 可以跨越多个进程、模型请求和人工等待。

## State 与 Context：机器事实和模型视野

传统程序把变量保存在内存或数据库中：

```json
{
  "status": "waiting_payment",
  "amount_cents": 10000
}
```

Agent 还需要把一部分信息转换成自然语言或结构化消息，放进 Context：

```text
订单正在等待支付，金额为 100 元。
```

这带来一个新问题：**系统真实 State 与模型可见 Context 可能不一致。**

例如数据库已更新为 `paid`，Context 仍保留旧的 `waiting_payment`，模型就会在过期世界中决策。传统程序也有缓存一致性问题，但 Agent 多了一层有损的自然语言投影。

因此：

```text
State = Runtime 的权威事实
Context = 为本轮决策构造的有限视图
```

模型可以读取 State 投影、建议状态变化，却不应仅凭生成文本直接覆盖权威状态。

## Database 与 Memory：持久化没有消失

Agent Memory 常被描述得像新的认知器官，底层仍是熟悉的数据系统：

- SQL / KV 保存结构化偏好和任务状态；
- Vector DB 检索相似历史；
- Object Storage 保存完整文档与 Trace；
- Cache 降低热点读取延迟。

新的部分主要在写入和读取策略：

```text
什么值得记住？
哪条历史与当前目标相关？
多少内容应该进入 Context？
模型推断能否当成事实保存？
```

传统数据库负责存取一致性，Memory Layer 负责把数据转换成模型可用的上下文。没有数据库能力，Memory 仍会遇到权限、过期、删除、冲突和版本问题。

## Scheduler 与 Agent Loop：谁决定下一步

传统 Scheduler 决定哪个任务获得 CPU 或 Worker，但任务内部执行哪条指令由代码决定。

Agent Runtime 有两层调度：

```text
系统调度：
  哪个 Run 现在可以执行？
  是否有模型配额？
  是否在等待人工？

语义调度：
  当前 Run 下一步应该查资料、调用工具还是结束？
```

第一层仍是传统确定性调度器，第二层可能交给模型。这种“调度器里嵌套语义决策器”的结构，是 Agent 系统较新的部分。

但生产系统不会把全部调度权交给模型。Deadline、并发限制、审批和状态机仍由 Runtime 控制。模型只在合法动作集合中选择。

## Source Code 不再描述全部路径

传统程序的可能路径大体编码在源码中。即使输入不同导致分支不同，分支本身通常可枚举。

Agent 的源码可能只有：

```python
while not done:
    decision = model(context, tools)
    observation = runtime.execute(decision)
    context = update(context, observation)
```

真正路径在运行时展开：

```text
search → read → search → edit → test → edit → test
```

它受 Prompt、Context、模型参数和工具结果影响，无法仅从循环源码看出。

这意味着新的“程序材料”包括：

- Prompt 与 Skill；
- Tool Schema 与 Description；
- Context Builder；
- 模型版本和采样配置；
- Runtime Policy；
- 执行 Trace。

它们需要像代码一样版本化、测试和审查。Prompt 不是普通文案，Tool Description 也不是注释，因为它们会改变控制流。

## 编译期、运行期与“推理期”

传统软件常区分编译期和运行期。Agent 又增加一个特殊阶段：

```text
开发期：
  人定义工具、策略、状态机和目标边界

推理期：
  模型根据当前 Context 生成下一步动作

执行期：
  Runtime 校验并执行动作，产生新事实
```

推理期并不在传统执行环境之外，它仍由普通程序发起。但其产物不是固定机器指令，而是需要解释和授权的高层行动提案。

如果把模型输出直接当指令执行，就相当于让不可信编译器生成系统调用且不做校验。Agent Runtime 的重要职责，就是在推理期与执行期之间建立边界。

## Agent 更像解释器，还是操作系统

两种类比都有帮助，也都有局限。

### 像解释器

模型根据自然语言目标动态生成 Tool Call，Runtime 解释并执行。Tool Schema 像可用指令集。

局限是模型输出有概率性，语义也不总精确；它不是严格语言的 Parser 与 Evaluator。

### 像操作系统

Runtime 管理任务、状态、权限、资源、调度、超时和取消，Tool 像受控系统调用。

局限是 Agent Runtime 通常建立在已有操作系统和应用服务之上，并不直接管理底层硬件。

更准确的理解是：Agent 借用了这些系统结构，在上层增加自然语言目标与概率决策。

## 什么情况下不需要 Agent

如果流程可以清楚写成：

```text
校验输入 → 调接口 A → 转换结果 → 调接口 B
```

传统程序或 Workflow 更便宜、更快、更可预测。把每一步交给模型只会增加延迟和失败面。

Agent 更适合：

- 下一步依赖非结构化语义；
- 路径难以预先穷举；
- 需要在多种工具间探索；
- 允许通过反馈逐步修正；
- 错误可以被 Runtime 限制和恢复。

关键不是“能否使用 Agent”，而是“哪一部分不确定性值得交给模型”。

## 一种混合程序模型

现实中的可靠 Agent 往往不是纯自治系统，而是三者组合：

```text
确定性 Workflow
  管理关键阶段与业务约束

概率性 Agent
  处理开放分析与局部决策

人
  处理授权、价值判断与高风险例外
```

例如发布流程可以固定为：

```text
生成变更 → Agent 分析风险 → 自动测试
→ 人工审批 → 确定性部署 → Agent 观察指标
```

模型没有取代整个程序，只进入过去难以编码的决策位置。

## 判断“新”的三个尺度

### 从底层机制看

它仍由普通进程、网络、数据库和函数构成，不是新的计算机基础模型。

### 从编程接口看

开发者开始通过目标、示例、工具描述和策略塑造行为，而不是写出所有分支。这确实改变了程序构造方式。

### 从运行行为看

部分控制流由模型在运行时生成，执行轨迹成为理解程序的必要材料。这与传统确定性应用有显著差别。

## 不急着下结论

把 Agent 称为“新的程序”有启发性，因为它提醒我们：Prompt、Tool、Memory、Runtime 和 Trace 共同构成执行系统，不能只把它当聊天界面。

但这个说法也可能遮蔽事实：权限、事务、幂等、状态、调度和存储仍遵循传统软件工程规律。模型不会让这些问题消失，只会让控制流更动态。

也许更稳妥的描述是：

> Agent 正在形成一种新的上层程序执行模型：它让概率模型参与控制流生成，同时依赖确定性 Runtime 将这种决策约束在传统系统能够验证和管理的边界内。

它是否最终会像进程、Actor 或工作流一样成为独立范式，还需要实践回答。但今天已经可以确定：写一个 Agent 不只是写 Prompt，也不只是接一个模型 API；它是在设计一种由模型、代码、状态和环境共同决定行为的程序。
