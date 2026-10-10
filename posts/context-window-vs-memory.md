# Context Window 为什么不是 Agent Memory？

“这个模型有 1M Context，所以不需要 Memory。”这句话把容量和持久化混在了一起。

Context Window 回答的是：**一次模型调用最多能处理多少输入与输出 Token。**  
Memory 回答的是：**哪些过去信息能跨调用保存，并在需要时重新出现。**

一个窗口再大，也会随当前请求结束；一个 Memory Store 再小，只要能够持久化和检索，就可能跨越数月。

## 四个概念先放到同一张图里

```text
Knowledge ──检索──┐
Memory ─────召回──┼→ Context → LLM → Decision
State ──────投影──┘              │
        ↑                         ↓
        └──── Runtime 更新 ← Tool Result
```

### Context：本轮模型的可见输入

Context 是发给模型的一次请求内容，包括 System Prompt、消息、Tool Schema、检索片段和最新工具结果。它短暂、有上限，并且每轮都可能不同。

### Memory：可跨调用保存并被召回的过去信息

Memory 是关于用户、会话或任务的历史信息。它通常由 Runtime 写入数据库，再按当前目标检索。没有召回进 Context 的 Memory，本轮模型看不见。

### State：当前任务的权威进度

State 描述系统现在处于什么位置，例如：

```json
{
  "job_id": "migration_42",
  "phase": "copying",
  "copied_tables": 17,
  "failed_tables": ["orders"],
  "approval_required": false
}
```

它用于控制状态迁移、恢复和并发，不应只存在于自然语言消息中。

### Knowledge：Agent 可以访问的外部事实

Knowledge 通常来自文档库、代码仓库、产品手册或搜索引擎。它并不一定源于这个 Agent 的过去经历。

例如“Redis Cluster 如何重定向”是知识；“用户上次选择了 Redis 7”是 Memory；“迁移任务正在复制第 17 张表”是 State；本轮 Prompt 中被选中的几段内容才是 Context。

## 用一个运行七天的 Agent 看区别

假设 Agent 负责数据库迁移：

> 将 120 张表从旧集群迁到新集群，分批校验，遇到高风险差异时等待人工确认。

任务不可能在一次模型调用中完成。它会经历执行、限流、暂停、人工确认和进程重启。

### 第一天：建立任务

Runtime 持久化 State：

```json
{
  "phase": "planning",
  "pending_tables": 120,
  "completed_tables": 0,
  "status": "running"
}
```

Agent 检索 Knowledge：

- 迁移操作手册；
- 表一致性校验规则；
- 目标集群的配额说明。

它还从 Memory 取回项目偏好：

- 该团队禁止在工作日 18:00 后切流；
- 大表默认每批 5 张；
- 用户要求所有 DDL 先确认。

Context Builder 只把当前规划所需内容放入第一轮 Context。模型生成批次计划后，这次 Context 生命周期结束。

### 第三天：进程重启

如果所谓 Memory 只是“前几天的消息还在 Context 里”，进程重启后任务就失去进度。正确恢复依赖 State Store：

```json
{
  "phase": "validating",
  "completed_tables": 63,
  "current_batch": ["orders", "order_items"],
  "checkpoint_version": 28,
  "status": "running"
}
```

Runtime 根据 State 重建下一轮 Context，而不是把三天的所有日志重新发送给模型。

这说明 State 不只是供模型参考的信息，它是 Runtime 恢复执行的权威依据。

### 第五天：出现 Schema 差异

工具返回：

```json
{
  "table": "orders",
  "difference": "target missing index idx_created_at",
  "severity": "high"
}
```

这个 Observation 进入当前 Context。Agent 从 Knowledge Base 检索索引迁移规范，再结合 Memory 中“所有 DDL 先确认”的用户规则，决定暂停。

Runtime 更新 State：

```json
{
  "status": "waiting_for_approval",
  "pending_action": {
    "type": "create_index",
    "table": "orders"
  }
}
```

四种信息在此各司其职：

- Observation 是刚发生的事实；
- Knowledge 提供通用操作规范；
- Memory 提供这个用户的长期约束；
- State 控制任务进入等待态；
- Context 只是把本轮需要的几项组合给模型。

### 第七天：用户批准

新的用户事件到达后，Runtime 从 State 恢复任务，读取审批结果，检索必要的 DDL 规范，构造一个新的 Context。

第一天的 Context 早已不存在，但任务没有失忆，因为真正需要持久化的内容位于 State、Memory 和 Knowledge Store 中。

## 为什么把长 Context 当 Memory 会失败

### 失败一：窗口最终仍会满

无论 128K 还是 1M Token，都不是无限。长期任务中的日志、代码、工具结果会持续增长。简单地“全部保留”只是推迟溢出时间。

### 失败二：有效信息会被噪声淹没

大窗口意味着模型可以接收更多内容，不意味着它能同等准确地使用每个细节。过期计划、重复日志和失败尝试可能干扰当前决策。

### 失败三：无法提供可靠更新语义

历史中先说预算 800，后来改成 1000。完整保留两条消息并不能告诉程序哪个是当前权威值。结构化 Memory 可以用版本或时间戳明确覆盖关系。

### 失败四：无法支撑恢复与并发

两个 Worker 同时处理同一任务时，需要状态版本和原子更新。Prompt 文本不能提供 Compare-And-Set，也不能防止重复执行同一步。

### 失败五：权限与删除难以控制

长期 Memory 需要按用户、租户和数据类型隔离，也要响应删除请求。把所有历史复制进多个 Prompt、缓存和日志，会让数据生命周期更难治理。

## Context 不是仓库，而是工作台

一个实用类比是：

- **Knowledge** 像图书馆，保存外部可查询资料；
- **Memory** 像档案柜，保存与这个用户或任务过去有关的信息；
- **State** 像任务控制表，记录当前进度和合法下一步；
- **Context** 像工作台，只摆放眼前这一步要使用的材料。

工作台可以很大，但不应该把整座图书馆和所有档案永远堆在上面。

## Context Builder 才是连接点

Runtime 每轮要做一次上下文编排：

```python
context = build_context(
    system_policy=policy.for_task(run.type),
    recent_messages=history.tail(8),
    state=state.project_for_model(),
    memories=memory.search(run.goal, limit=5),
    knowledge=knowledge.search(current_question, limit=6),
    latest_observations=run.unconsumed_observations(),
    token_budget=64_000,
)
```

这里的关键不是具体数字，而是每种来源都有独立预算、可信度和裁剪规则。

State 投影还要隐藏模型不需要的信息。例如数据库锁版本、内部权限令牌不应进入 Prompt；模型只需要看到“正在等待审批”和待审批动作。

## 如何判断一条信息应该放哪里

可以按四个问题判断：

| 问题 | 是 | 更适合 |
| --- | --- | --- |
| 只为当前模型调用服务？ | 是 | Context |
| 来源于过去交互，未来可能复用？ | 是 | Memory |
| 决定任务能否继续、恢复或避免重复？ | 是 | State |
| 是独立于当前用户的外部事实或资料？ | 是 | Knowledge |

同一事实也可能在层之间流动。工具读到的订单状态先作为 Observation 进入 Context；若它决定流程进度，则写入 State；若是未来仍有价值的用户偏好，才进入 Memory。复制时要保留来源和更新时间。

## 大窗口改变策略，但不消灭 Memory

更大的 Context Window 确实有价值：

- 可以保留更多原始证据，减少过度摘要；
- 代码任务可以一次读取更多相关文件；
- 长文分析不必过早切块；
- 检索结果能带上更完整的上下文。

它降低了“本轮材料摆不下”的压力，却没有解决跨运行持久化、精确更新、权限隔离、状态恢复和知识治理。

真正长期运行的 Agent 会把四层清楚分开：

```text
Context：给模型看的临时输入
Memory：从过去保留下来的可召回信息
State：Runtime 用来推进任务的当前事实
Knowledge：Agent 可查询的外部知识
```

当系统出现“它明明记得却没用”“重启后重复执行”“旧偏好覆盖新偏好”时，问题往往不是 Context 不够大，而是这四类数据没有被分开设计。
