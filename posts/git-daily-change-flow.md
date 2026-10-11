# 一次代码修改是怎样进入 Git 历史的？

Git 日常操作并不复杂，真正难的是准确判断：

- 当前改动在哪里；
- 下一次提交会包含什么；
- 哪些变化不该混进来；
- 提交以后如何验证。

一套稳健流程可以概括为：

```text
先看状态
→ 再看差异
→ 选择性暂存
→ 检查暂存差异
→ 创建提交
→ 检查提交结果
```

对应命令：

```bash
git status --short --branch
git diff
git add -p
git diff --staged
git commit
git show --stat HEAD
```

这套流程比直接使用 `git add . && git commit` 更慢几秒，却能显著降低误提交。

## 第一步：确认自己在哪个仓库、哪个分支

先运行：

```bash
git status --short --branch
```

示例：

```text
## feature/git-notes...origin/feature/git-notes [ahead 2]
 M README.md
?? posts/git-basics.md
```

你已经知道：

- 当前分支是 `feature/git-notes`；
- 上游是 `origin/feature/git-notes`；
- 本地领先 2 个提交；
- `README.md` 已修改但未暂存；
- `posts/git-basics.md` 尚未跟踪。

进一步确认仓库根目录：

```bash
git rev-parse --show-toplevel
```

在多仓库、子模块或大型工作区中，这一步能避免在错误目录提交。

## 第二步：查看真正修改了什么

查看工作区相对暂存区的差异：

```bash
git diff
```

只看文件名和状态：

```bash
git diff --name-status
```

统计：

```bash
git diff --stat
```

按单词显示：

```bash
git diff --word-diff
```

只检查某个文件：

```bash
git diff -- path/to/file
```

Diff 的基本结构：

```diff
diff --git a/app.js b/app.js
index 1111111..2222222 100644
--- a/app.js
+++ b/app.js
@@ -10,3 +10,4 @@
 const port = 3000;
+const timeout = 5000;
 start(port);
```

其中：

- `---` 是旧文件；
- `+++` 是新文件；
- `@@` 描述代码块位置；
- `-` 是删除；
- `+` 是增加；
- 无前缀是上下文。

Diff 是从两份内容计算出来的，不是编辑器操作录像。

## 第三步：把一次任务拆成逻辑提交

一个提交应该表达一件可解释的事情，例如：

```text
fix: avoid duplicate order submission
test: cover retry after timeout
docs: explain Git object model
```

不理想的提交：

```text
update
misc changes
fix stuff
```

提交边界主要依靠暂存区控制。

暂存完整文件：

```bash
git add README.md
```

暂存多个明确路径：

```bash
git add src/order.ts tests/order.test.ts
```

逐块暂存：

```bash
git add -p
```

常见交互：

| 按键 | 含义 |
| --- | --- |
| `y` | 暂存当前代码块 |
| `n` | 跳过当前代码块 |
| `s` | 尝试拆分代码块 |
| `e` | 手工编辑要暂存的 Patch |
| `q` | 退出 |
| `?` | 查看帮助 |

如果一个文件同时包含功能修改和格式化，`git add -p` 可以避免把二者混在同一提交中。

## 第四步：检查暂存区，而不是相信记忆

暂存以后：

```bash
git diff --staged
```

这条命令回答：

> 如果现在执行 `git commit`，相对当前 HEAD 会提交什么？

只看统计：

```bash
git diff --staged --stat
```

查看暂存文件列表：

```bash
git diff --staged --name-only
```

如果暂存错了文件，可以移出暂存区但保留工作区修改：

```bash
git restore --staged path/to/file
```

然后重新选择。

不要依赖 `git status` 的文件名列表来代替 Diff 审查。文件名只能告诉你“哪个文件变了”，不能告诉你“变成了什么”。

## 第五步：提交时到底发生了什么

执行：

```bash
git commit -m "docs: add Git mental model"
```

Git 大致完成：

1. 读取暂存区；
2. 根据 Index 写出 Tree；
3. 读取当前 HEAD 作为 Parent；
4. 读取作者与提交者信息；
5. 写入时间和 Message；
6. 创建 Commit 对象；
7. 把当前分支移动到新 Commit；
8. 更新 Reflog。

工作区未暂存的变化不会进入该提交。

提交后暂存区通常与新 HEAD 一致，而工作区可能仍保留未提交修改。

## `git commit -a` 的边界

命令：

```bash
git commit -am "fix: update tracked files"
```

会自动暂存已跟踪文件的修改和删除，但不会自动加入新建的未跟踪文件。

它适合范围明确的小修改，但容易让人跳过暂存差异检查。更安全的日常习惯仍然是：

```bash
git add <explicit-paths>
git diff --staged
git commit
```

## 提交说明应该记录什么

好的提交说明回答：

- 这次变化的意图是什么；
- 为什么需要它；
- 是否存在不明显的约束。

标题示例：

```text
fix: preserve draft when upload fails
feat: add Git learning section
docs: explain author and committer identity
refactor: isolate token accounting
test: cover empty repository state
```

如果需要正文：

```bash
git commit
```

在编辑器中写：

```text
fix: avoid exposing commit email

Rebuild the public branch from the current snapshot so the old author
metadata is no longer reachable from published refs.

The repository-level identity remains unchanged.
```

标题描述结果，正文说明原因与上下文。不要只复述代码实现。

## 提交钩子与检查

提交过程中可能触发 Hook：

```text
.git/hooks/pre-commit
.git/hooks/commit-msg
```

团队也可能使用：

- Husky；
- pre-commit；
- Lefthook；
- lint-staged；
- 自定义安全扫描。

Hook 可以检查：

- 格式化；
- Lint；
- 单元测试；
- Commit Message；
- 密钥和大文件；
- 禁止路径。

`--no-verify` 可以绕过部分 Hook：

```bash
git commit --no-verify
```

但除非你明确知道检查错误，否则不应把它当成常规解决方法。

## 提交后如何验证

查看刚创建的提交：

```bash
git show --stat HEAD
git show --name-status HEAD
git show HEAD
```

查看元数据：

```bash
git show --no-patch --format=fuller HEAD
```

这一步尤其适合检查：

- Author 邮箱；
- Committer 邮箱；
- 提交时间；
- Message；
- 是否包含意外文件。

确认状态：

```bash
git status --short --branch
```

如果工作区仍有修改，不代表提交失败；可能只是部分修改没有暂存。

## 修改最后一次提交

如果提交还未共享，只是漏了一个文件：

```bash
git add missing-file
git commit --amend --no-edit
```

修改说明：

```bash
git commit --amend
```

Amend 不是“编辑原提交”，而是创建一个新 Commit，然后把当前分支移过去：

```text
原：A ← B
新：A ← B'
```

因此 Commit ID 会变化。

如果 B 已经推送并被别人基于它工作，Amend 会导致协作历史分叉。公共历史优先用新提交修复，而不是随意改写。

## 推送前先获取远端状态

本地提交完成后，远端可能已经变化。先：

```bash
git fetch origin
git status --short --branch
```

比较：

```bash
git log --oneline --left-right HEAD...origin/main
```

只有本地提交：

```text
< local commit
```

只有远端提交：

```text
> remote commit
```

如果双方都有提交，需要按团队策略 Merge 或 Rebase，而不是直接强推覆盖。

## Push 上传的不是“整个项目目录”

执行：

```bash
git push origin feature/git-notes
```

Git 会协商：

1. 远端已经有哪些对象；
2. 本地有哪些远端缺失的对象；
3. 压缩并传输缺失对象；
4. 请求远端更新对应引用。

如果远端引用无法 Fast-forward，普通 Push 会拒绝：

```text
non-fast-forward
```

这是为了防止你无意间让远端已有提交失去引用。

需要有意识改写历史时，优先：

```bash
git push --force-with-lease
```

它会检查远端是否仍处于你预期的位置。相比 `--force`，可以减少覆盖别人新提交的风险。

## `.gitignore` 不会自动取消已跟踪文件

添加：

```gitignore
.env
dist/
*.log
```

只影响尚未跟踪的路径。如果 `.env` 已经提交：

```bash
git rm --cached .env
git commit -m "chore: stop tracking local environment"
```

这只让未来版本不再跟踪，并不会从旧历史中删除秘密。秘密一旦提交，应当：

1. 立即吊销或轮换；
2. 再评估是否需要改写历史。

轮换凭证比清理 Git 历史更优先，因为别人可能已经拿到旧值。

## 二进制、生成物和大文件

提交前检查：

```bash
git diff --staged --stat
```

如果突然出现：

```text
node_modules/
build/
*.apk
*.zip
database.dump
```

应先确认是否真的应该进入仓库。

大文件进入历史后，即使后续删除，旧 Blob 仍在历史中，占据 clone 体积。适合版本化的大二进制可以考虑 Git LFS，但需要团队和托管平台共同支持。

## 一套可重复的日常模板

开始任务：

```bash
git status --short --branch
git fetch origin
git switch -c feature/<task> origin/main
```

开发过程中：

```bash
git diff
git add -p
git diff --staged
```

验证：

```bash
npm test
# 或项目实际测试命令
```

提交：

```bash
git commit -m "feat: describe the change"
git show --stat --format=fuller HEAD
```

推送：

```bash
git push -u origin feature/<task>
```

之后创建 Pull Request。

## 最小练习：同一个文件拆成两个提交

创建文件：

```bash
printf "title\n" > note.txt
git add note.txt
git commit -m "docs: add note"
```

然后同时增加两个独立部分：

```text
title

Git basics

Unrelated personal reminder
```

使用：

```bash
git add -p note.txt
```

只暂存 `Git basics`，检查：

```bash
git diff
git diff --staged
```

提交后再处理剩余变化。

这个练习的重点不是命令本身，而是建立习惯：

> 每次提交前，都能准确说出暂存区里有哪些变化，以及它们为什么应该一起进入历史。
