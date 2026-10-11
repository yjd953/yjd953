# 一个可维护的 Git 协作流程应该怎样设计？

Git 提供对象、引用、合并和传输机制，但不会自动决定团队怎样合作。

一个可维护的流程需要回答：

- 主干是否允许直接 Push；
- 分支从哪里创建、多久合回；
- 提交需要多大粒度；
- Pull Request 怎样描述和验证；
- 谁可以 Review 和合并；
- 使用 Merge、Squash 还是 Rebase；
- 紧急修复如何进入不同发布线；
- 历史是否允许改写。

流程的目标不是让历史“看起来漂亮”，而是降低并行开发、审查、发布和恢复的成本。

## 主干是可发布基线，不是公共草稿箱

常见主干：

```text
main
```

理想属性：

- 能构建；
- 核心测试通过；
- 没有已知阻断问题；
- 变化经过审查；
- 可以明确追溯到需求或修复。

这不意味着每个主干提交都必须立即生产发布，但它应当保持可验证状态。

建议通过平台分支保护：

- 禁止直接 Push；
- 必须 Pull Request；
- 必须通过 CI；
- 至少一个有效 Review；
- 关键目录要求 Code Owner；
- 禁止未协调 Force Push；
- 合并后自动删除任务分支。

## 一个任务一个短生命周期分支

开始：

```bash
git fetch origin
git switch -c feature/git-learning origin/main
```

任务分支应围绕一个清晰目标：

```text
feature/add-export
fix/login-timeout
docs/git-learning
refactor/cache-boundary
```

避免：

```text
dev
my-work
test
changes
```

分支越长寿：

- 与主干差异越大；
- 冲突越复杂；
- Review 范围越大；
- 集成风险越晚暴露；
- 开发者越倾向于继续混入其他任务。

如果一个功能必须长期建设，可以通过 Feature Flag 保持小步合入，而不是让分支数周不合并。

## 提交是 Review 和恢复的最小语义单元

一个好提交应当：

- 只有一个主要意图；
- 独立可解释；
- 尽量可构建或可测试；
- 不混入无关格式化；
- Message 说明为什么。

例如：

```text
feat: add retry budget to upload requests
test: cover exhausted retry budget
docs: explain retry behavior
```

是否合成一个提交取决于团队合并策略：

- 如果最终 Squash，分支内允许更多过程提交；
- 如果 Rebase Merge，分支提交本身应达到主干质量；
- 如果 Merge Commit，所有原提交都会保留在历史图中。

即使最终 Squash，提交仍然帮助开发者本地恢复和 Review 分段，不应完全放弃质量。

## 提交说明结构

一种简洁格式：

```text
<type>: <imperative summary>

<why this change is needed>
<non-obvious trade-offs>
<migration or risk notes>
```

常见类型：

```text
feat      新功能
fix       缺陷修复
refactor  不改变外部行为的重构
test      测试
docs      文档
build     构建与依赖
ci        CI 配置
chore     维护操作
```

类型不是核心，清晰意图才是核心。团队不使用 Conventional Commits 时，不必机械套用。

## Pull Request 应该提供一条可验证叙事

PR 不只是“请合并这些代码”。它应该让 Reviewer 快速回答：

1. 为什么要改？
2. 改了什么边界？
3. 如何验证？
4. 有什么风险？
5. 哪些内容不在本次范围？

推荐模板：

```markdown
## 背景
现有上传请求失败后会无限重试，导致任务长时间占用资源。

## 变化
- 增加最大重试次数；
- 将超限原因写入任务状态；
- 增加对应单元测试。

## 验证
- `npm test -- upload`
- 手工模拟 503，确认第 4 次停止。

## 风险
- 默认预算从无限改为 3 次；
- 老任务恢复时使用新默认值。

## 不包含
- 不调整请求超时；
- 不修改告警阈值。
```

如果 PR 很大，应先拆问题，而不是依靠超长说明掩盖不可审查的范围。

## Review 看什么

Reviewer 不应只看语法和格式。优先顺序：

1. 行为是否符合需求；
2. 边界和失败路径；
3. 数据兼容与回滚；
4. 并发、安全和权限；
5. 测试能否证明关键行为；
6. 可维护性；
7. 命名与风格。

作者应先 Self-review：

```bash
git fetch origin
git diff origin/main...HEAD
git log --oneline origin/main..HEAD
```

这接近 Reviewer 看到的 PR 范围。

检查：

- 是否有调试日志；
- 是否有密钥或本地路径；
- 是否误提交生成物；
- 是否夹带无关变化；
- 是否缺少迁移说明；
- 是否所有评论已处理。

## 评论应该针对代码，而不是人

有效评论：

```text
这里在请求成功但状态写入失败时会重复执行外部副作用。
能否使用幂等键，或先把执行状态持久化？
```

低价值评论：

```text
这写得不对。
```

评论可以标注：

- Blocking：必须修复；
- Suggestion：建议；
- Question：需要澄清；
- Nit：非阻断小问题。

团队若不区分严重度，作者会难以判断哪些意见阻止合并。

## CI 是机器执行的合并前合同

典型检查：

```text
format
lint
unit test
integration test
build
security scan
secret scan
license check
```

CI 应：

- 可重复；
- 尽量快速给出反馈；
- 失败信息可定位；
- 避免依赖开发者本机状态；
- 对主干和 PR 使用一致核心检查。

Flaky Test 会削弱所有门禁。团队如果习惯“失败就重跑”，最终会忽视真实回归。

## 三种合并策略怎样定

### Squash Merge

适合：

- 一个 PR 希望对应一个主干提交；
- 分支中有大量 Fixup；
- 团队按 PR 而非细粒度提交回滚。

要求：

- Squash Message 要完整；
- PR 范围必须单一；
- 合并后不要继续复用旧分支。

### Rebase Merge

适合：

- 分支提交经过认真整理；
- 希望线性主干；
- 每个提交都有独立价值。

要求：

- Author 理解 Rebase 和强推；
- 公共分支不随意改写；
- CI 按最终重放结果验证。

### Merge Commit

适合：

- 希望保留分支拓扑；
- 一个功能包含多个有意义提交；
- 需要清楚识别集成节点。

要求：

- 避免无意义的频繁同步 Merge；
- Review 工具能良好展示；
- 团队接受非线性历史。

没有绝对最优。最差的是同一仓库毫无规则地混用，导致回滚和追踪语义不稳定。

## 更新任务分支

方案一，Merge 主干：

```bash
git fetch origin
git switch feature/x
git merge origin/main
git push
```

优点：

- 不改写已有分支提交；
- 其他协作者容易同步。

缺点：

- 可能产生多次同步 Merge。

方案二，Rebase 到主干：

```bash
git fetch origin
git switch feature/x
git rebase origin/main
git push --force-with-lease
```

优点：

- 线性；
- PR 差异更易从最新主干验证。

缺点：

- 改写提交；
- 多人共享分支需要协调。

个人任务分支可 Rebase；多人共同分支通常优先 Merge，除非明确约定。

## 冲突应由最了解变化的人解决

平台提示冲突时，不要让不理解业务的人只为“变绿”而随意选一侧。

解决者应知道：

- 主干为什么改；
- 功能分支为什么改；
- 最终语义是什么；
- 如何测试组合结果。

冲突解决本身也需要 Review，尤其是：

- 配置；
- 数据库迁移；
- 权限；
- 依赖锁文件；
- 自动生成代码。

## Release 与 Hotfix

简单持续交付可以只维护 `main`：

```text
main → tag v1.4.0 → tag v1.4.1
```

需要长期维护版本时可能有：

```text
main
release/1.4
release/1.3
```

Hotfix 流程：

1. 从受影响 Release 创建修复分支；
2. 修复并测试；
3. 合入 Release；
4. 打补丁版本 Tag；
5. 把修复同步回 main；
6. 必要时同步到其他受影响版本。

同步可以 Merge 或 Cherry-pick，但要记录补丁来源，避免不同分支重复或遗漏。

## 回滚策略应该在合并前考虑

回滚不只是：

```bash
git revert <commit>
```

还可能涉及：

- 数据库 Schema 是否向后兼容；
- 数据是否已不可逆迁移；
- 外部 API 是否已发布；
- 消息格式是否被旧消费者读取；
- Feature Flag 是否可以立即关闭；
- 制品和配置是否能独立回滚。

代码提交可以 Revert，不代表生产状态自动恢复。高风险 PR 应在说明中写明回滚路径。

## 敏感信息处理

协作流程应内置：

- `.gitignore` 基线；
- Secret Scanner；
- 提交前检查；
- Noreply 或仓库级个人身份策略；
- 禁止上传私钥；
- 凭证最小权限；
- 泄露后立即轮换。

敏感信息进入 PR 后，即使未合并，也可能已经存在于：

- 远端分支；
- CI 日志；
- Review Diff；
- Fork；
- Reviewer 本地 Clone。

删除文件不是完整处置。先吊销秘密，再决定是否历史清理。

## 一个小团队的推荐基线

```text
main
├── 受保护，禁止直接 Push
├── 需要 1 个 Review
├── CI 必须通过
└── 默认 Squash Merge

任务分支
├── 从最新 origin/main 创建
├── 一个分支一个目标
├── 尽量在数天内合并
└── 合并后删除
```

日常：

```bash
git fetch origin
git switch -c feature/x origin/main

# 开发与提交
git add -p
git diff --staged
git commit

# 推送并发 PR
git push -u origin feature/x
```

合并后：

```bash
git switch main
git fetch origin
git reset --hard origin/main
git branch -d feature/x
```

最后一条 `reset --hard` 的前提是本地 main 不承载未合并工作。团队也可以使用 `git pull --ff-only`。

## 流程是否健康的信号

健康：

- PR 小而聚焦；
- Review 周期短；
- 主干长期可构建；
- 冲突在小范围解决；
- 回滚路径明确；
- 很少需要紧急 Force Push；
- 能快速定位变化来源。

不健康：

- 所有人直接 Push main；
- PR 动辄数千行且跨多个目标；
- CI 经常被绕过；
- 分支存活数周；
- 提交说明都是 `update`；
- 冲突靠全选 Ours/Theirs；
- 敏感信息依靠人工记忆避免；
- 出事故后删除 `.git` 或重新 Clone 代替调查。

Git 协作流程的成熟度，不取决于使用了多少高级命令，而取决于每次变化是否可理解、可验证、可合并、可恢复。
