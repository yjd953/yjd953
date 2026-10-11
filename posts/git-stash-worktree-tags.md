# Stash、Worktree 和 Tag 分别解决什么问题？

这三个工具看起来彼此无关，但都在解决“当前分支之外的状态管理”：

- Stash：暂时收起未完成修改；
- Worktree：让同一个仓库同时检出多个工作目录；
- Tag：给一个稳定历史节点建立版本标记。

正确使用它们，可以避免：

- 为切分支创建无意义的临时提交；
- 在一个目录里反复切换并污染工作区；
- 用分支名代替正式发布版本；
- 把不同任务混在一起。

## Stash 到底保存了什么

执行：

```bash
git stash push -m "WIP: upload retry"
```

Git 会保存当前工作区和暂存区状态，并尽量把工作区恢复到基线。

Stash 不是简单复制到临时文件夹。它由 Git 对象和引用组成，通常可以包含：

- 已跟踪文件的工作区变化；
- 暂存区变化；
- 可选未跟踪文件；
- 可选忽略文件。

查看：

```bash
git stash list
```

示例：

```text
stash@{0}: On main: WIP: upload retry
stash@{1}: On feature/login: before rebase
```

查看概要：

```bash
git stash show stash@{0}
```

查看 Patch：

```bash
git stash show -p stash@{0}
```

## 默认 Stash 不包含所有文件

默认通常保存已跟踪文件变化，不包括未跟踪文件。

包含未跟踪：

```bash
git stash push -u -m "include untracked files"
```

包含忽略文件：

```bash
git stash push -a -m "include ignored files"
```

`-a` 可能把大量构建产物、依赖目录一起保存，体积和恢复冲突都会增大。执行前先：

```bash
git status --short
```

只保存指定路径：

```bash
git stash push -m "only docs" -- docs/
```

交互选择：

```bash
git stash push -p
```

## `apply`、`pop`、`drop`

应用但保留记录：

```bash
git stash apply stash@{0}
```

应用成功后删除：

```bash
git stash pop stash@{0}
```

只删除：

```bash
git stash drop stash@{0}
```

清空全部：

```bash
git stash clear
```

`clear` 很难恢复，不要把 Stash 当长期备份。

更稳健的恢复习惯：

```bash
git stash apply stash@{0}
# 检查并测试
git stash drop stash@{0}
```

比直接 Pop 多一步，但应用结果出问题时原 Stash 仍在。

## 保留暂存状态

创建 Stash 时保留 Index 中的修改在当前工作区：

```bash
git stash push --keep-index
```

常见用途：

1. 已暂存准备提交的功能；
2. 工作区还有未暂存的其他实验；
3. 想只测试已暂存版本。

流程：

```bash
git stash push --keep-index
<运行测试>
git commit
git stash pop
```

应用时恢复原暂存状态：

```bash
git stash apply --index stash@{0}
```

否则变化可能只回到工作区。

## Stash 冲突怎样处理

Stash 保存时基于旧提交，应用到新基线时也需要三方合并，可能冲突。

```bash
git stash apply stash@{0}
git status
```

解决方式与 Merge 类似：

```bash
# 编辑冲突
git add <resolved-file>
```

如果当前基线变化太大，使用：

```bash
git stash branch recover-stash stash@{0}
```

Git 会从 Stash 创建时的原基线建立新分支并应用修改，通常能减少冲突。

## 什么时候不应该用 Stash

不适合：

- 长期保存重要工作；
- 跨机器协作；
- 需要 Review；
- 需要清楚历史说明；
- 数周后才继续。

这类工作应创建分支并提交：

```bash
git switch -c wip/upload-retry
git add -A
git commit -m "wip: preserve upload retry experiment"
```

WIP Commit 至少有稳定引用，可以 Push 到私有远端；之后再用 Interactive Rebase 整理。

## Worktree：同一对象库的多个工作目录

假设正在 `feature/x` 开发，工作区有大量未完成修改，突然需要检查 `main` 的线上问题。

传统方式：

- Stash；
- 切分支；
- 修复；
- 切回来；
- 恢复 Stash。

Worktree 可以创建另一个工作目录：

```bash
git worktree add ../project-hotfix -b hotfix/login origin/main
```

结果：

```text
project/          → feature/x
project-hotfix/   → hotfix/login
```

两者共享大部分 Git 对象数据库，但拥有独立：

- 工作区；
- Index；
- HEAD；
- 当前分支。

可以同时打开两个 IDE 窗口，不需要反复切换。

## Worktree 的常用操作

查看：

```bash
git worktree list
```

基于现有分支：

```bash
git worktree add ../project-release release/1.0
```

Detached 检出旧版本：

```bash
git worktree add --detach ../project-old v1.0.0
```

删除：

```bash
git worktree remove ../project-hotfix
```

清理已被手工删除目录的过期记录：

```bash
git worktree prune
```

移动：

```bash
git worktree move ../old-path ../new-path
```

不要直接复制包含 `.git` 的整个仓库来模拟 Worktree，容易造成远端、分支和对象重复管理。

## 为什么同一分支通常不能同时检出两次

Git 默认阻止：

```text
fatal: 'main' is already checked out
```

因为两个工作目录同时修改同一个分支引用，会让“当前分支对应哪个工作区状态”变得危险。

不同 Worktree 应使用不同分支，或其中一个使用 Detached HEAD。

Worktree 适合：

- 并行功能开发；
- 紧急 Hotfix；
- 比较多个版本；
- 在旧版本运行测试；
- 同时维护 Release 分支；
- Agent/自动化任务隔离工作目录。

## Worktree 的 `.git` 为什么可能是文件

附加 Worktree 根目录中的 `.git` 可能是文本文件：

```text
gitdir: /path/main-repo/.git/worktrees/project-hotfix
```

它指向主仓库的 Worktree 管理目录。

因此：

- 不要假设 `.git` 永远是目录；
- 脚本应使用 `git rev-parse --git-dir`；
- 删除主仓库前要处理附加 Worktree；
- 备份时要理解共享对象关系。

## Tag：给历史节点建立版本名字

分支会随提交移动：

```text
main: v1 commit → v2 commit → v3 commit
```

Tag 通常表示稳定版本点：

```text
v1.0.0 ─► Commit A
v1.1.0 ─► Commit D
```

轻量标签：

```bash
git tag v1.0.0
```

本质接近一个直接引用。

附注标签：

```bash
git tag -a v1.0.0 -m "First stable release"
```

会创建 Tag 对象，保存：

- Tagger；
- 时间；
- Message；
- 目标对象；
- 可选签名。

发布版本通常用附注标签。

## 查看和推送 Tag

列出：

```bash
git tag --list
git tag --list 'v1.*'
```

查看：

```bash
git show v1.0.0
```

推送一个：

```bash
git push origin v1.0.0
```

推送所有：

```bash
git push origin --tags
```

普通 `git push` 不一定推送所有 Tag。

从指定提交创建：

```bash
git tag -a v1.0.1 <commit> -m "Patch release"
```

## 不要随意移动已发布 Tag

如果 `v1.0.0` 已公开，它可能被：

- CI 构建制品；
- 软件包；
- 部署记录；
- 用户依赖；
- Release 页面；
- 安全审计；

引用。

删除并重建同名 Tag 会让“v1.0.0 到底是哪份代码”失去稳定性。

发现发布错误时，通常创建新版本：

```text
v1.0.1
```

而不是偷偷移动 `v1.0.0`。

确需删除：

```bash
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

必须与团队和下游用户协调。

## 签名 Tag

使用 GPG 或 SSH 签名配置后：

```bash
git tag -s v1.0.0 -m "Signed release"
```

验证：

```bash
git tag -v v1.0.0
```

签名证明：

- 持有对应私钥的人签署了该对象；
- 对象内容签署后未被修改。

它不自动证明代码安全，也不等于发布流程可信。仍需要：

- 受保护构建环境；
- 制品签名；
- 依赖审计；
- 权限和密钥管理。

## 三者怎样选择

### 临时切换任务

修改很小、很快回来：

```text
Stash
```

### 两个任务要并行多小时或多天

```text
Worktree + 独立分支
```

### 需要跨机器或与人共享

```text
Commit + Push 分支
```

### 标记不可随开发移动的发布节点

```text
Annotated Tag
```

### 保存未经整理但重要的工作

```text
WIP Branch/Commit 优于长期 Stash
```

## 一个组合实践

正在开发：

```bash
git switch -c feature/export origin/main
# 有未完成修改
```

突然要修复线上：

```bash
git worktree add ../project-hotfix -b hotfix/crash origin/main
cd ../project-hotfix
# 修复、测试、提交、推送
```

发布：

```bash
git tag -a v1.4.1 -m "Fix export crash"
git push origin hotfix/crash
git push origin v1.4.1
```

清理：

```bash
cd ../project
git worktree remove ../project-hotfix
git fetch --prune origin
```

原功能目录从未被切换，未完成修改也不需要 Stash。

这三个工具的共同原则是：给不同生命周期的状态使用不同容器，而不是把所有东西都堆在当前工作区和当前分支里。
