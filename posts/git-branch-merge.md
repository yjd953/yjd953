# 分支、合并与冲突到底发生了什么？

分支不是代码副本，而是一个可移动的提交引用。合并也不是简单地“把两个目录覆盖到一起”，而是基于提交图寻找共同祖先，再计算两侧变化。

假设从 C 创建 `feature`：

```text
A ← B ← C
        ▲
       main
       feature
```

两边继续开发：

```text
          D ← E  feature
         ↗
A ← B ← C
         ↘
          F      main
```

这张图是理解 Merge、冲突与 Pull Request 的基础。

## 创建和切换分支

从当前提交创建并切换：

```bash
git switch -c feature/login
```

从远端主干明确创建：

```bash
git fetch origin
git switch -c feature/login origin/main
```

只创建不切换：

```bash
git branch feature/login
```

查看：

```bash
git branch --verbose
git log --graph --oneline --decorate --all
```

命名可以表达任务类型：

```text
feature/login-rate-limit
fix/upload-timeout
docs/git-learning
refactor/token-accounting
```

分支生命周期应短而聚焦。长期存活且持续偏离主干的分支，合并成本通常会越来越高。

## Fast-forward：只移动引用

假设：

```text
main ─► C
         \
          D ← E ◄─ feature
```

在 `main` 上执行：

```bash
git merge feature
```

如果 main 没有新提交，Git 可以直接把 main 移动到 E：

```text
A ← B ← C ← D ← E
                ▲
          main, feature
```

没有新 Merge Commit，这叫 Fast-forward。

只接受快进：

```bash
git merge --ff-only feature
```

如果不能快进就失败，适合要求线性更新的流程。

强制创建 Merge Commit：

```bash
git merge --no-ff feature
```

即使可快进，也保留“这个功能分支在此合入”的节点。

## 三方合并：共同祖先 + 两个端点

当两边都前进：

```text
          D ← E  feature
         ↗
A ← B ← C
         ↘
          F      main
```

Git 找到：

- Base：共同祖先 C；
- Ours：当前分支 F；
- Theirs：待合并分支 E。

然后比较：

```text
C → F：main 做了什么
C → E：feature 做了什么
```

如果变化可自动组合，创建 Merge Commit M：

```text
          D ← E
         ↗     ↘
A ← B ← C       M  main
         ↘     ↗
          F ───
```

M 有两个 Parent。查看：

```bash
git cat-file -p <merge-commit>
```

会看到两个 `parent` 字段。

## 冲突不是“Git 坏了”

如果两边修改互不干扰：

```text
Base：第 10 行 timeout = 3
Ours：第 20 行增加日志
Theirs：第 30 行增加重试
```

Git 可以自动合并。

如果两边对同一区域给出不兼容结果：

```text
Base：timeout = 3
Ours：timeout = 5
Theirs：timeout = 30
```

Git 无法判断业务意图，产生冲突。

冲突标记：

```text
MARKER: <<<<<<< HEAD
timeout = 5
MARKER: =======
timeout = 30
MARKER: >>>>>>> feature/login
```

它表达：

- 当前分支选择 5；
- 待合并分支选择 30；
- Git 不知道最终应该是什么。

解决冲突不是简单删除标记，而是决定正确业务结果，例如：

```text
timeout = config.requestTimeout
```

最终内容可能既不是 Ours，也不是 Theirs。

## 合并冲突时 Index 有三个阶段

冲突期间，Index 可以保存同一路径的多个版本：

```text
stage 1：Base
stage 2：Ours
stage 3：Theirs
```

查看：

```bash
git ls-files -u
```

读取：

```bash
git show :1:path/to/file
git show :2:path/to/file
git show :3:path/to/file
```

理解这三份内容，比只看冲突标记更适合复杂冲突。

注意 `ours` 和 `theirs` 的含义依赖当前操作。在 Rebase 中，用户直觉更容易混乱，因为“当前基线”和“正在重放的提交”角色不同。遇到疑问直接查看三阶段内容。

## 标准冲突解决流程

开始前：

```bash
git status --short --branch
git merge feature/login
```

发生冲突后：

```bash
git status
git diff --name-only --diff-filter=U
```

逐文件：

1. 查看 Base/Ours/Theirs；
2. 理解双方意图；
3. 编辑最终结果；
4. 运行格式化和测试；
5. 暂存已解决文件。

```bash
git add path/to/resolved-file
```

确认没有未解决路径：

```bash
git diff --check
git status
```

完成：

```bash
git commit
```

放弃整个合并：

```bash
git merge --abort
```

如果工作区在合并前就不干净，Abort 不一定能恢复所有混杂状态。因此合并前最好先提交或 Stash。

## 冲突类型不只有文本

常见类型：

- Modify/Modify：双方修改同一文件；
- Add/Add：双方新增同名文件；
- Modify/Delete：一边修改，一边删除；
- Rename/Rename：双方把同一文件改成不同名字；
- Rename/Delete：一边重命名，一边删除；
- Directory/File：一边创建目录，一边创建同名文件；
- 二进制冲突：无法逐行合并。

Modify/Delete 不能只凭“保留还是删除”机械处理。应确认删除是否代表架构迁移，修改是否应移到新位置。

二进制文件通常需要：

- 选一侧版本；
- 重新生成；
- 使用领域专用合并工具；
- 或避免多人并行修改。

## `ours` 合并策略与 `-X ours` 不是一回事

```bash
git merge -X ours feature
```

表示三方合并时，冲突块偏向当前分支，但非冲突变化仍会合入。

```bash
git merge -s ours feature
```

使用 `ours` 策略，生成的结果 Tree 基本保持当前分支，忽略对方内容，但历史上记录已合并。

两者语义差异很大。除非明确理解图和内容结果，否则不要用它们“快速解决冲突”。

## 合并前先预览

查看共同祖先：

```bash
git merge-base main feature
```

查看 feature 独有提交：

```bash
git log --oneline main..feature
```

查看从分叉点以来的最终差异：

```bash
git diff main...feature
```

检查是否能快进：

```bash
git merge-base --is-ancestor main feature
```

测试合并但暂不提交：

```bash
git merge --no-commit --no-ff feature
```

检查后可完成提交，或：

```bash
git merge --abort
```

## Merge Commit、Squash Merge 和 Rebase Merge

平台常见三种合并方式。

### Merge Commit

```text
          D ← E
         ↗     ↘
A ← B ← C       M
         ↘     ↗
          F ───
```

优点：

- 保留真实分支拓扑；
- 原提交 ID 不变；
- 容易看出功能分支整体边界。

缺点：

- 高频小分支会让图复杂。

### Squash Merge

把 feature 最终变化压成主干上的一个新提交：

```text
A ← B ← C ← S
```

原分支 D、E 不成为 main 的祖先。

优点：

- 主干简洁；
- 一个 PR 对应一个提交；
- 可在合并前整理统一说明。

缺点：

- 丢失主干中的细粒度提交关系；
- 原分支提交与主干提交 ID 不同；
- 后续重复合并时需理解 Patch 等价而非祖先关系。

### Rebase and Merge

把 feature 提交复制到最新 main 后：

```text
A ← B ← C ← D' ← E'
```

优点：

- 线性历史；
- 保留多个逻辑提交。

缺点：

- 提交 ID 被重写；
- 如果原提交质量低，主干仍会保留噪声；
- 提交者和签名语义可能变化。

团队应明确一种默认策略，而不是每个 PR 临时选择。

## `rerere`：记录冲突解决方式

Git 可以记录冲突形状与解决结果：

```bash
git config rerere.enabled true
```

以后遇到相同冲突，Git 可以复用之前的解决方案。

它适合：

- 长期 Rebase；
- 维护多个发布分支；
- 反复 Cherry-pick 补丁。

仍应检查复用结果并运行测试，因为文本冲突相同不一定代表业务上下文完全相同。

## 降低冲突成本的工程习惯

1. 分支保持短生命周期；
2. 提交只包含一个逻辑变化；
3. 避免无关全文件格式化；
4. 大规模重命名与功能修改分开；
5. 经常 Fetch 主干变化；
6. 明确代码所有权和模块边界；
7. 合并后运行测试，不只检查冲突标记；
8. 不用“选 ours/theirs 全部覆盖”代替业务判断。

## 最小三方合并实验

```bash
mkdir git-merge-lab
cd git-merge-lab
git init

printf "timeout=3\n" > config.txt
git add config.txt
git commit -m "base"

git switch -c feature
printf "timeout=30\n" > config.txt
git commit -am "feature timeout"

git switch main
printf "timeout=5\n" > config.txt
git commit -am "main timeout"

git merge feature
```

观察：

```bash
git status
git ls-files -u
git show :1:config.txt
git show :2:config.txt
git show :3:config.txt
```

然后编辑最终值、`git add`、运行验证并提交。

这个实验展示了冲突的真实含义：Git 已经把 Base 和两侧变化都保存好了，缺少的只是人对业务意图的判断。
