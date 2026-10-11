# 怎样用 Git Bisect 定位引入 Bug 的提交？

当项目有几百个提交，而你只知道：

```text
三个月前正常，现在失败
```

逐个提交检查的成本很高。`git bisect` 利用提交图做二分搜索：

```text
已知 good ─────────────── 已知 bad
                 ▲
              检查中点
```

每次判断当前提交是 Good 还是 Bad，Git 就排除一半候选。若有 1024 个线性候选，理论上约 10 次判断就能定位。

## Bisect 需要一个可判定问题

首先定义：

- Good：行为正常的提交；
- Bad：行为异常的提交。

例如：

```text
Good：单元测试 testUploadRetry 通过
Bad：单元测试失败
```

或：

```text
Good：页面首屏小于 2 秒
Bad：页面首屏大于等于 2 秒
```

判定必须尽量：

- 可重复；
- 不依赖人工感觉；
- 不受随机数据干扰；
- 能在历史版本上运行。

如果测试本身不稳定，Bisect 会根据错误标签排除真正根因。

## 手工 Bisect 流程

当前版本有 Bug：

```bash
git bisect start
git bisect bad
```

指定一个已知正常版本：

```bash
git bisect good v1.2.0
```

Git 检出候选提交，进入 Detached HEAD。

运行验证：

```bash
npm test -- upload-retry
```

通过：

```bash
git bisect good
```

失败：

```bash
git bisect bad
```

Git 继续选择下一个候选。最后输出：

```text
abc123 is the first bad commit
```

结束并回到原分支：

```bash
git bisect reset
```

不要忘记 Reset，否则仍停留在 Bisect 检出的提交。

## 为什么它不一定选择“中间日期”

Git 历史是一张图，不是按时间排序的数组。Bisect 根据可达提交图选择能最大化排除候选的节点。

存在 Merge 时：

```text
          D ← E
         ↗     ↘
A ← B ← C       M ← N
         ↘     ↗
          F ← G
```

候选选择需要考虑祖先关系，而不是简单按 Commit Date 取中间。

提交时间还可能因为：

- Rebase；
- Cherry-pick；
- 时区；
- 修改系统时间；

与图位置不一致。

## 自动 Bisect

如果测试命令能用退出码表示结果：

```bash
git bisect start HEAD v1.2.0
git bisect run npm test -- upload-retry
```

Git 约定：

| 退出码 | 含义 |
| --- | --- |
| `0` | Good |
| `1-127`，除 `125` | Bad |
| `125` | Skip，当前提交无法测试 |

测试脚本示例：

```bash
#!/usr/bin/env bash
set -e

npm ci
npm test -- upload-retry
```

保存为临时脚本后：

```bash
git bisect run ./bisect-test.sh
```

自动化前要确认脚本不会：

- 修改历史；
- 推送远端；
- 删除重要数据；
- 依赖工作区残留；
- 把构建失败误判为产品 Bug。

## Build 失败不一定等于 Bad

历史版本可能因为环境变化无法构建：

- 旧依赖下线；
- 编译器不兼容；
- 测试命令尚未存在；
- 数据迁移缺失。

如果这类提交与目标 Bug 无关，应返回 125：

```bash
#!/usr/bin/env bash

if ! npm ci; then
  exit 125
fi

if npm test -- upload-retry; then
  exit 0
else
  exit 1
fi
```

大量 Skip 会降低定位效率，甚至产生多个可能结果。可以：

- 缩小范围；
- 修复历史测试环境；
- 使用容器固定工具链；
- 换一个更稳定的判定信号。

## 测试脚本在历史里不存在怎么办

Bisect 每次切换提交，仓库内脚本也会跟着变化。如果把诊断脚本放在项目目录并未提交，它可能被清理或被旧版本路径影响。

可以把脚本放到仓库外：

```bash
git bisect run /tmp/project-bisect-test.sh
```

脚本应根据当前检出版本运行兼容命令。

或者先创建测试提交，把回归测试放进历史，再使用 `--no-checkout` 或专门 Worktree 进行高级排查。但要注意新测试是否能在旧版本编译。

## 用现有测试定位回归

理想情况：

```bash
git bisect start HEAD <known-good>
git bisect run ./gradlew test --tests UploadRetryTest
```

不要每轮运行整个项目全部测试，除非没有更小的可靠信号。Bisect 成本约为：

```text
测试次数 × 单次构建测试时间
```

优化顺序：

1. 最小失败测试；
2. 增量构建；
3. 固定依赖缓存；
4. 独立测试数据；
5. 必要时并行准备环境，但不要同时修改同一 Worktree。

## 性能回归的 Bisect

性能有噪声，不能单次超过阈值就判 Bad。

脚本可以：

1. 预热；
2. 运行多次；
3. 取中位数；
4. 排除异常值；
5. 与稳定阈值比较。

伪代码：

```bash
scores=$(run_benchmark_7_times)
median=$(calculate_median "$scores")

if (( median < 200 )); then
  exit 0
else
  exit 1
fi
```

如果 Good/Bad 分布重叠严重，二分结论不可靠。应先降低测量噪声。

## 非单调问题会破坏 Bisect 假设

Bisect 隐含假设：

```text
Good Good Good Bad Bad Bad
```

即某个提交首次引入问题，后续一直存在。

如果历史是：

```text
Good Bad Good Bad Good Bad
```

例如 Bug 被引入、修复、再次引入，单次 Bisect 只能定位当前 Good/Bad 边界中的某个变化。

应：

- 缩小版本范围；
- 明确要找“首次引入”还是“最近再次引入”；
- 检查 Revert 和 Cherry-pick；
- 对多个区间分别 Bisect。

## Merge 历史中的归因

如果第一个 Bad 是 Merge Commit：

```text
feature 分支单独测试正常
main 单独测试正常
合并结果失败
```

问题可能来自：

- 冲突解决错误；
- 两侧组合后不兼容；
- Merge Commit 中手工修改；
- 测试环境变化。

不要立即把责任归到某个父分支。检查：

```bash
git show -m <merge>
git diff <merge>^1 <merge>
git diff <merge>^2 <merge>
```

分别测试父提交和合并 Tree。

## `--first-parent` 与发布主线

大型仓库可能希望先定位“哪个 PR 合入后主干坏了”，而不是直接进入功能分支内部。

先沿 First-parent 查看：

```bash
git log --first-parent --oneline main
```

找到可疑 Merge 后，再在该功能分支范围进行第二轮 Bisect。

Bisect 本身有复杂路径选项，但实践中分两层定位往往更容易解释：

```text
第一层：哪个集成节点引入回归
第二层：该 PR 内哪个提交引入问题
```

## Bisect 过程状态在哪里

Bisect 使用内部引用记录 Good/Bad 和当前状态。

查看：

```bash
git bisect log
```

保存：

```bash
git bisect log > /tmp/bisect.log
```

重放：

```bash
git bisect replay /tmp/bisect.log
```

这有助于：

- 分享排查过程；
- 修正某次误判；
- 在另一环境复现；
- 记录事故证据。

## 误标后怎么处理

如果某次把 Bad 标成 Good，可以：

```bash
git bisect log
```

结束：

```bash
git bisect reset
```

编辑日志，删除或修正错误步骤，然后：

```bash
git bisect replay corrected.log
```

比盲目继续更可靠。

## Bisect 找到提交以后

定位 `abc123` 后：

```bash
git show --stat --format=fuller abc123
git show abc123
git blame <affected-file>
```

接着验证因果：

1. 在父提交运行测试，确认 Good；
2. 在目标提交运行，确认 Bad；
3. 理解哪一处变化导致行为；
4. 尝试 Revert 或最小修复；
5. 在最新主干验证修复；
6. 增加防回归测试。

Bisect 只证明该区间中“第一个被判为 Bad 的提交”，不自动证明作者、某一行或设计决定就是根因。

## 与 `log -S`、`blame` 怎样配合

如果已经知道可疑符号：

```bash
git log -S'unsafeRetry' -p
```

可能比 Bisect 更快。

如果知道当前错误行：

```bash
git blame -L 80,100 src/retry.ts
```

可以直接找到最后变化。

选择：

| 已知信息 | 工具 |
| --- | --- |
| 知道错误行 | `blame` + `show` |
| 知道字符串或函数 | `log -S/-G/-L` |
| 只知道某版本好、某版本坏 | `bisect` |
| 想知道文件完整演化 | `log -p --follow` |

## 最小自动化实验

创建一串提交，其中某次把正确值改坏：

```bash
mkdir git-bisect-lab
cd git-bisect-lab
git init

for n in 1 2 3 4 5 6 7 8; do
  value=42
  if [ "$n" -ge 6 ]; then value=0; fi
  printf '%s\n' "$value" > value.txt
  git add value.txt
  git commit -m "step $n"
done
```

仓库外创建 `/tmp/check-value.sh`：

```bash
#!/usr/bin/env bash
test "$(cat value.txt)" = "42"
```

授权并运行：

```bash
chmod +x /tmp/check-value.sh
git bisect start HEAD HEAD~7
git bisect run /tmp/check-value.sh
git bisect reset
```

Git 会定位第 6 个提交。这个实验展示了 Bisect 的核心：Git 负责搜索提交图，你负责提供可信的 Good/Bad 判定函数。
