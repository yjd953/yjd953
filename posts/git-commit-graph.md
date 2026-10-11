# 分支和 HEAD 为什么只是指针？

很多 Git 操作看起来像在搬动大量文件：

- 创建分支；
- 切换分支；
- 合并分支；
- 删除分支；
- 回退到旧版本。

但从内部看，其中很多动作只是在移动一个很小的引用文件。

要理解这一点，需要先把提交看成一张有向无环图：

```text
A ← B ← C ← D
```

箭头表示“当前提交记录了父提交”。`D` 指向 `C`，`C` 指向 `B`。历史方向从新提交沿 Parent 回到过去。

分支则是某个提交的可移动名字：

```text
main ──► D
```

## 为什么提交历史是一张图

普通提交只有一个父节点：

```text
A ← B ← C
```

合并提交有两个父节点：

```text
          D ← E
         ↗     ↘
A ← B ← C       M
         ↘     ↗
          F ← G
```

`M` 同时记录 `E` 和 `G` 为父提交。这样，历史不再是一条链，而是一张图。

Git 中的大量问题都可以转化成图问题：

- 两个分支是否有祖先关系；
- 它们的共同祖先是谁；
- 哪些提交只存在于一侧；
- 删除某个引用后，哪些对象变得不可达；
- Rebase 需要复制哪一段提交。

常见查询：

```bash
# A 是否是 B 的祖先
git merge-base --is-ancestor A B

# 两个提交的最佳共同祖先
git merge-base branch-a branch-b

# main 有、feature 没有的提交
git log feature..main

# 两边各自独有的提交
git log --left-right main...feature
```

## 分支不是目录副本

创建分支：

```bash
git branch feature
```

不会复制整个项目。它大致只是新增一个引用：

```text
.git/refs/heads/feature
```

文件内容可能只有一行 Commit ID：

```text
2803068e293954b7d793d99f7db8f7be9ae26e6d
```

此时：

```text
main ────┐
         ├──► C
feature ─┘
```

两个分支指向同一提交，也就共享同一段历史和对象。

切换到 `feature` 后创建新提交：

```text
main ───────► C
               ↖
feature ───────► D
```

更准确地画：

```text
A ← B ← C ← D
        ▲    ▲
        │    │
      main feature
```

只有引用移动到了 `D`。旧对象没有复制。

## HEAD：你当前所处位置的引用

`.git/HEAD` 通常不是直接保存 Commit ID，而是：

```text
ref: refs/heads/main
```

含义是：

```text
HEAD ──► main ──► C
```

当你在 `main` 上提交：

1. Git 创建新 Commit D；
2. D 的 Parent 是 C；
3. `main` 从 C 移动到 D；
4. HEAD 仍然指向 `main`。

```text
提交前：
HEAD ─► main ─► C

提交后：
HEAD ─► main ─► D ─► C
```

这就是“当前分支向前移动一个提交”。

查看：

```bash
git symbolic-ref HEAD
git rev-parse HEAD
git branch --show-current
```

分别回答：

- HEAD 符号指向哪个引用；
- HEAD 最终解析到哪个提交；
- 当前分支名是什么。

## Detached HEAD：HEAD 直接指向提交

如果执行：

```bash
git switch --detach <commit-id>
```

HEAD 不再指向分支，而是直接指向某个提交：

```text
HEAD ──► C
main ──► E
```

这叫 Detached HEAD。

它不是仓库损坏。你可以：

- 查看旧版本；
- 运行测试；
- 构建旧代码；
- 创建实验提交。

风险在于，如果继续提交：

```text
main ─────────► E

A ← B ← C ← X ← Y
        ▲         ▲
        │         │
      old       HEAD
```

`X`、`Y` 没有分支名。切走以后，它们可能只在 Reflog 中暂时可找。

要保留：

```bash
git switch -c experiment
```

此时：

```text
HEAD ─► experiment ─► Y
```

## `switch` 时工作区为什么会变化

分支只是指针，但每个分支最终指向不同 Commit，而 Commit 指向不同 Tree 快照。

执行：

```bash
git switch feature
```

Git 需要让：

- HEAD 指向 `feature`；
- 暂存区匹配 `feature` 的快照；
- 工作区文件匹配 `feature` 的快照。

因此切分支看起来像“换了一套目录”，本质上是：

```text
读取目标 Commit 的 Tree
→ 更新 Index
→ 更新 Working Tree
→ 移动 HEAD
```

如果工作区未提交修改会被目标分支覆盖，Git 通常拒绝切换：

```text
Your local changes would be overwritten by checkout
```

这是保护机制。应先：

- 提交；
- 暂存到 Stash；
- 丢弃确认不需要的修改；
- 或使用 Worktree 在另一个目录工作。

## 引用不只包括本地分支

常见引用命名空间：

```text
refs/heads/main             本地分支
refs/remotes/origin/main    远端跟踪引用
refs/tags/v1.0.0            标签
refs/stash                  Stash
```

也可能有：

- Pull Request 临时引用；
- Gerrit Review 引用；
- Replace 引用；
- Notes 引用；
- Bisect 过程引用。

查看所有引用：

```bash
git show-ref
git for-each-ref
```

解析任意名字：

```bash
git rev-parse main
git rev-parse origin/main
git rev-parse v1.0.0
```

Git 命令接收的“版本”经常不是完整 Commit ID，而是一个 Revision Expression。

## Revision 表达式如何沿图定位

假设：

```text
A ← B ← C ← D
            ▲
           main
```

常用表达式：

```bash
main       # main 指向的提交 D
HEAD       # 当前提交
HEAD^      # 第一个父提交 C
HEAD~2     # 沿第一个父链向前两步 B
HEAD^{tree} # HEAD 对应的根 Tree
```

对于合并提交：

```text
      C
     ↗
A ← B ← M
     ↘
      D
```

可以使用：

```bash
M^1   # 第一个父提交
M^2   # 第二个父提交
```

范围表达式：

```bash
A..B
```

表示从 B 可达、但从 A 不可达的提交。

```bash
A...B
```

在 `git log` 中通常表示两边对称差集：只属于一侧、不同时属于两侧的提交。

注意，不同命令对三点语法的解释可能不同。例如：

```bash
git diff A...B
```

通常比较 A 与 B 的 Merge Base 到 B，而不是简单的提交集合。

## Fast-forward 为什么没有 Merge Commit

假设：

```text
main ──► C
          \
           D ← E ◄── feature
```

如果 `main` 从 C 合并 `feature`，C 是 E 的祖先。Git 不需要创建新节点，只需把 `main` 移到 E：

```text
A ← B ← C ← D ← E
                ▲
                │
         main, feature
```

这叫 Fast-forward。

命令：

```bash
git merge feature
```

可以控制策略：

```bash
git merge --ff-only feature  # 只允许快进，否则失败
git merge --no-ff feature    # 即使能快进也创建合并提交
```

选择取决于团队希望如何表达历史，而不是哪一个永远正确。

## 删除分支为什么通常不删除提交

假设：

```text
A ← B ← C ← D
        ▲    ▲
       main feature
```

删除 `feature`：

```bash
git branch -d feature
```

只是删除指向 D 的分支引用。如果 `main` 仍在 C，D 可能变得不可达；如果 D 已经合入 main：

```text
A ← B ← C ← D
                ▲
               main
```

删除 `feature` 完全不会影响 D，因为 `main` 仍能到达它。

安全删除：

```bash
git branch -d feature
```

如果 Git 判断分支尚未完全合并，会拒绝。

强制删除：

```bash
git branch -D feature
```

只是绕过检查，不代表对象立即从磁盘消失。

## Reflog：引用移动的本地操作日志

提交图记录的是项目历史；Reflog 记录的是本地引用怎样移动。

查看：

```bash
git reflog
```

可能得到：

```text
e7a1001 HEAD@{0}: reset: moving to origin/main
6faad8e HEAD@{1}: commit: add Git notes
```

这意味着：

- 当前 HEAD 在 `e7a1001`；
- 之前曾位于 `6faad8e`；
- 最近一次移动由 reset 造成。

如果误执行：

```bash
git reset --hard HEAD~3
```

可以先找旧位置：

```bash
git reflog
```

再恢复：

```bash
git branch rescue HEAD@{1}
```

Reflog 的重要边界：

- 默认是本地的，不会随 Push 上传；
- 有过期策略；
- 垃圾回收后不可达对象可能被删除；
- 新 clone 不包含你旧机器上的 Reflog。

因此它是强力兜底，但不是正式备份。

## 可达性：引用决定哪些历史仍被保留

Git 从引用出发遍历对象图：

```text
refs/heads/main
       │
       ▼
Commit → Parent
   │
   ▼
 Tree → Blob / subtree
```

只要对象能从任意受保护引用到达，它就属于可达集合。

历史清理要检查的不只是 `main`：

```bash
git show-ref
git branch --all
git tag --list
git stash list
```

旧敏感提交可能仍被以下对象引用：

- 旧分支；
- Tag；
- 远端跟踪引用；
- Stash；
- Reflog；
- 平台侧 Pull Request 引用；
- 别人的 Fork 或 Clone。

这也是“强推 main 后为什么旧 Commit URL 可能暂时还能访问”的原因之一。

## 画图比背命令更可靠

遇到复杂操作前，先画：

```text
当前：
main          A ← B ← C
                         ↖
feature                   D ← E

目标：
main          A ← B ← C ← M
                         ↖   ↖
feature                   D ← E
```

然后问：

1. 哪些 Commit 已存在？
2. 哪些引用当前指向哪里？
3. 命令会创建新 Commit，还是只移动引用？
4. 工作区和暂存区是否也会改变？
5. 旧提交执行后是否仍然可达？

这样判断：

- `branch`：创建引用；
- `switch`：移动 HEAD 并更新工作区/暂存区；
- `commit`：创建对象并移动当前分支；
- `merge`：快进引用或创建合并提交；
- `reset`：移动引用，可选更新暂存区和工作区；
- `rebase`：复制一串提交，再移动引用；
- `tag`：创建稳定引用或 Tag 对象。

## 最小提交图实验

```bash
mkdir git-graph-lab
cd git-graph-lab
git init

printf "base\n" > demo.txt
git add demo.txt
git commit -m "A: base"

git switch -c feature
printf "feature\n" >> demo.txt
git commit -am "B: feature"

git switch main
printf "main\n" > main.txt
git add main.txt
git commit -m "C: main"
```

观察：

```bash
git log --graph --oneline --decorate --all
```

然后：

```bash
git merge feature
git log --graph --oneline --decorate --all
git cat-file -p HEAD
```

你会看到合并提交包含两个 `parent`。这不是 Git 在界面上画出来的装饰，而是 Commit 对象真实记录的图结构。
