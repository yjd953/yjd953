# 写错以后，restore、reset、revert 应该选哪个？

Git 撤销最危险的地方不是命令多，而是同一个“撤销”可能指四种不同目标：

1. 丢弃工作区修改；
2. 取消暂存但保留文件内容；
3. 移动本地分支到旧提交；
4. 在公共历史上创建一个反向提交。

选择命令前，先问两个问题：

```text
改动现在位于工作区、暂存区还是提交历史？
这个历史是否已经推送并被别人使用？
```

## 一张选择表

| 当前状态 | 目标 | 常用命令 |
| --- | --- | --- |
| 工作区未暂存 | 丢弃修改 | `git restore <file>` |
| 已暂存 | 取消暂存、保留内容 | `git restore --staged <file>` |
| 最后一次本地提交 | 补文件或改说明 | `git commit --amend` |
| 多个未共享提交 | 重排、合并、修改 | `git rebase -i` |
| 本地分支走错 | 移动分支 | `git reset` |
| 已共享提交 | 安全撤销效果 | `git revert` |
| 误删提交/分支 | 找旧引用 | `git reflog` |

任何可能丢失内容的操作前，先运行：

```bash
git status --short --branch
git diff
git diff --staged
```

重要修改可以先创建临时分支：

```bash
git branch backup-before-recovery
```

## `restore`：恢复工作区或暂存区内容

丢弃某文件未暂存修改：

```bash
git restore path/to/file
```

默认来源是暂存区。它让工作区文件匹配 Index。

这会丢失尚未提交的修改，执行前先看：

```bash
git diff -- path/to/file
```

取消暂存但保留工作区：

```bash
git restore --staged path/to/file
```

状态变化：

```text
执行前：
HEAD      = v1
Index     = v2
Worktree  = v2

执行后：
HEAD      = v1
Index     = v1
Worktree  = v2
```

从指定提交恢复文件到工作区：

```bash
git restore --source=<commit> -- path/to/file
```

同时写入暂存区和工作区：

```bash
git restore --source=<commit> --staged --worktree -- path/to/file
```

这不是移动分支，只是恢复路径内容。

## `reset`：移动当前分支，并可同步 Index 和工作区

`reset` 的核心动作是：

> 把当前分支引用移动到指定 Commit。

三种模式决定还要更新什么。

### `--soft`：只移动分支

```bash
git reset --soft HEAD~1
```

状态：

```text
分支：移动到父提交
Index：保留原提交内容
工作区：保留原提交内容
```

结果是“最后一个提交被拆回暂存状态”。

适合：

- 合并几个尚未共享的提交；
- 重写最后一次提交说明；
- 重新组织提交边界。

### `--mixed`：移动分支并重置暂存区

```bash
git reset HEAD~1
```

`--mixed` 是默认模式：

```text
分支：移动到父提交
Index：匹配目标提交
工作区：保留
```

最后一个提交变成工作区未暂存修改。

适合重新选择 `git add -p`。

### `--hard`：分支、暂存区、工作区一起重置

```bash
git reset --hard HEAD~1
```

```text
分支：移动
Index：匹配目标
工作区：匹配目标
```

未提交内容会被覆盖。它是高风险命令，但并非不能使用。安全前提是：

- 已确认工作区没有需要保留的修改；
- 已记录目标 Commit；
- 已了解公共历史影响；
- 最好有备份分支或远端副本。

## `reset <file>` 与 `reset <commit>` 为什么容易混淆

传统命令：

```bash
git reset path/to/file
```

不会移动分支，而是把该路径从 HEAD 恢复到暂存区，效果接近：

```bash
git restore --staged path/to/file
```

加了路径以后，语义从“移动分支”变成“更新 Index 路径”，这也是旧 Git 用户容易误操作的原因。现代命令优先用 `restore` 表达文件恢复，用 `reset` 表达引用移动。

## `revert`：在公共历史上创建反向提交

假设：

```text
A ← B ← C
        引入错误
```

执行：

```bash
git revert B
```

会创建新提交 D：

```text
A ← B ← C ← D
            撤销 B 的效果
```

B 仍在历史里，因此：

- Commit ID 不变；
- 其他协作者无需重置；
- 审计记录完整；
- Push 通常是 Fast-forward。

这适合已经推送的公共分支。

Revert 不是“删除 B”，而是尝试应用 B 的逆 Patch。如果 C 又修改了相同位置，可能产生冲突。

撤销合并提交时需要指定主线父节点：

```bash
git revert -m 1 <merge-commit>
```

这里的 `-m 1` 不是 Message，而是 Mainline Parent。执行前必须确认哪个父节点代表要保留的主线。

## `amend`：替换最后一个提交

补上漏掉的文件：

```bash
git add missing-file
git commit --amend --no-edit
```

修改提交说明：

```bash
git commit --amend
```

Amend 创建新 Commit：

```text
A ← B        旧
A ← B'       新
```

如果 B 尚未 Push，通常安全。

如果 B 已经共享，需要强推才能让远端改成 B'，并可能影响协作者。因此公共分支更倾向于新增修复提交。

## Interactive Rebase：整理未共享提交

```bash
git rebase -i HEAD~4
```

编辑列表：

```text
pick a1 first change
reword b2 unclear message
squash c3 tiny follow-up
edit d4 wrong author
```

常见动作：

| 动作 | 作用 |
| --- | --- |
| `pick` | 保留提交 |
| `reword` | 修改说明 |
| `edit` | 暂停以修改内容或身份 |
| `squash` | 合并到前一个提交并编辑说明 |
| `fixup` | 合并并丢弃当前说明 |
| `drop` | 删除提交 |

Rebase 会重新创建目标提交和后续提交，因此 ID 全部改变。

规则：

> 优先整理自己的未共享历史，不要随意改写团队已经基于其开发的公共历史。

## Reflog：引用走错后的第一恢复入口

误执行：

```bash
git reset --hard HEAD~3
```

先不要继续大量操作。查看：

```bash
git reflog --date=iso
```

可能看到：

```text
111aaaa HEAD@{0}: reset: moving to HEAD~3
444dddd HEAD@{1}: commit: important work
```

先建立救援分支：

```bash
git branch rescue 444dddd
```

再决定如何恢复：

```bash
git reset --hard rescue
```

使用救援分支比直接再次 Reset 更稳，因为它先给旧提交创建一个持久引用。

常见恢复：

```bash
# 误删分支
git reflog
git branch recovered <old-tip>

# Rebase 结果错误
git reflog
git branch before-rebase <old-head>

# Amend 后想回旧提交
git reflog
git show HEAD@{1}
```

## 未提交文件一定能恢复吗

不一定。

如果修改从未被：

- `git add` 写成 Blob；
- Commit；
- Stash；
- IDE Local History 保存；
- 系统快照或备份保存；

那么 Git 可能从未拥有这份内容。`git restore` 或 `reset --hard` 覆盖后，Git Reflog 也无法凭空恢复。

如果曾执行 `git add`，即使没有 Commit，Blob 可能暂时存在为不可达对象。可以尝试：

```bash
git fsck --lost-found
```

再检查 Dangling Blob：

```bash
git cat-file -p <blob-id>
```

但这不是可靠工作流：

- 文件名不会保存在 Blob 中；
- Blob 可能很多；
- 垃圾回收可能删除；
- 不能保证内容曾写入对象库。

重要工作应及时提交到临时分支，而不是依赖对象打捞。

## Stash 的恢复

查看：

```bash
git stash list
git stash show -p stash@{0}
```

应用但保留 Stash：

```bash
git stash apply stash@{0}
```

应用并删除：

```bash
git stash pop
```

如果 Stash 对当前分支冲突，可以从保存时的基线创建分支：

```bash
git stash branch recover-work stash@{0}
```

这通常比在变化很大的当前分支上直接 Pop 更容易解决。

## 已经 Push 后应该怎样撤销

公共主干上：

```bash
git revert <bad-commit>
git push
```

通常是默认选择。

只有以下情况才考虑改写远端：

- 敏感密钥或个人信息必须移除；
- 错误大文件导致仓库严重膨胀；
- 团队明确同意重建历史；
- 分支是个人临时分支，没有其他使用者。

需要强推时优先：

```bash
git push --force-with-lease
```

而不是：

```bash
git push --force
```

`--force-with-lease` 会验证远端仍是你最后 Fetch 时看到的状态。如果别人刚推了新提交，它通常会拒绝覆盖。

## 一套事故处理流程

发生误操作时：

### 1. 停止继续写入

不要马上：

- 再次 Reset；
- 随意 Rebase；
- 运行 GC；
- 删除 `.git`；
- 重新 Clone 覆盖现场。

### 2. 收集状态

```bash
git status --short --branch
git log --graph --oneline --decorate --all -30
git reflog --date=iso -30
git branch --all --verbose
```

### 3. 给可能需要的提交建分支

```bash
git branch rescue/<name> <commit>
```

### 4. 再选择恢复工具

- 文件内容：`restore`；
- 暂存状态：`restore --staged`；
- 本地引用：`reset`；
- 公共历史：`revert`；
- 丢失引用：`reflog`；
- 未提交 Blob：`fsck`，仅作为最后尝试。

### 5. 验证

```bash
git status
git diff
git diff --staged
git log --graph --oneline --decorate --all
```

## 四个练习

### 练习 1：取消暂存

```bash
printf "change\n" >> demo.txt
git add demo.txt
git restore --staged demo.txt
```

确认文件内容仍在，但状态变为未暂存。

### 练习 2：拆回最后一次提交

```bash
git reset --soft HEAD~1
```

观察分支、Index 和工作区。

### 练习 3：公共撤销

```bash
git revert HEAD
```

观察历史中同时存在原提交和 Revert 提交。

### 练习 4：误 Reset 后恢复

先记录：

```bash
git log --oneline -3
```

在临时仓库执行：

```bash
git reset --hard HEAD~1
git reflog
git branch rescue HEAD@{1}
```

理解恢复成功的原因：旧 Commit 没有被修改，只是原分支引用离开了它；Reflog 暂时保留了旧位置。
