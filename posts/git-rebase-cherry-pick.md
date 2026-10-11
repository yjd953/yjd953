# Rebase 和 Cherry-pick 为什么会改写提交？

Rebase 常被描述为“把分支移动到最新主干”，Cherry-pick 常被描述为“拿一个提交过来”。这两个说法适合操作层，但没有说明本质。

更准确地说：

> Git 不能把已有 Commit 原地换父节点；它只能计算变化，再基于新父节点创建新的 Commit。

因此 Rebase 和 Cherry-pick 都是在“重新应用变化”，而不是搬运原对象。

## Commit ID 为什么一定会变化

Commit 对象包含：

- Tree；
- Parent；
- Author；
- Committer；
- 时间；
- Message。

假设：

```text
A ← B ← C
     \
      D ← E  feature
```

把 feature Rebase 到 C：

```text
A ← B ← C ← D' ← E'
```

即使 D' 最终文件内容与 D 等价：

- D' 的 Parent 从 B 变成 C；
- Committer 时间通常变化；
- D' 的 Commit ID 必然不同；
- E' 的 Parent 从 D 变成 D'，所以也不同。

旧 D、E 没有被修改；只是 feature 引用从 E 移到 E'。

## Rebase 的概念步骤

执行：

```bash
git switch feature
git rebase main
```

Git 大致会：

1. 找到 feature 与 main 的共同祖先 B；
2. 找出 feature 独有提交 D、E；
3. 暂时把当前基线移动到 main 的 C；
4. 依次计算并应用 D、E 的变化；
5. 创建 D'、E'；
6. 把 feature 指向 E'。

可以近似理解为：

```text
for commit in [D, E]:
    patch = diff(commit.parent, commit)
    apply(patch, current_base)
    current_base = create_new_commit()
```

真实实现会处理 Merge、空提交、重命名检测等更多细节，但心智模型一致。

## 为什么 Rebase 会冲突

D 原本是在 B 上开发，它的 Patch 能干净应用到 B，不代表能应用到 C。

如果 main 的 C 修改了 D 依赖的同一区域：

```text
B → C：timeout 3 改为 5
B → D：timeout 3 改为 30
```

重放 D 时发生冲突。

解决流程：

```bash
git status
# 编辑冲突文件
git add <resolved-files>
git rebase --continue
```

跳过当前提交：

```bash
git rebase --skip
```

这会丢弃该提交的变化，应谨慎使用。

放弃整个 Rebase：

```bash
git rebase --abort
```

回到开始前状态。

## Rebase 中 Ours/Theirs 为什么反直觉

合并冲突时，人们通常理解：

- Ours：当前分支；
- Theirs：被合入分支。

Rebase 时，Git 先把当前工作位置放到新基线，再逐个重放原分支提交。于是：

- Ours 往往是新基线及已重放结果；
- Theirs 往往是当前正在重放的原提交。

不要只凭名称选择：

```bash
git checkout --ours file
git checkout --theirs file
```

先检查：

```bash
git show :1:file
git show :2:file
git show :3:file
```

并理解最终业务结果。

## `rebase main` 与 `rebase --onto`

普通：

```bash
git rebase main
```

将当前分支独有提交重放到 main。

更精确的：

```bash
git rebase --onto <new-base> <old-base> <branch>
```

含义：

> 找出 branch 中从 old-base 之后的提交，把它们重放到 new-base。

示例：

```text
A ← B ← C ← D  main
     \
      E ← F ← G  feature
          ▲
        subfeature
```

如果只想把 F、G 移到 D，而不带 E：

```bash
git rebase --onto main E feature
```

结果：

```text
A ← B ← C ← D ← F' ← G'
```

`--onto` 是拆分错误基线、移动提交片段的重要工具，但执行前应画提交图。

## Interactive Rebase：重写一段本地历史

```bash
git rebase -i HEAD~5
```

Git 打开待重放提交列表：

```text
pick a111 add parser
pick b222 fix typo
pick c333 add tests
pick d444 debug output
pick e555 remove debug output
```

可以改成：

```text
pick a111 add parser
fixup b222 fix typo
pick c333 add tests
fixup d444 debug output
fixup e555 remove debug output
```

也可以：

- 重排顺序；
- 修改 Message；
- 暂停编辑内容；
- 删除提交；
- 拆分提交。

拆分一个提交：

```text
edit abc123 mixed change
```

Rebase 暂停后：

```bash
git reset HEAD^
git add -p
git commit -m "first logical change"
git add -p
git commit -m "second logical change"
git rebase --continue
```

## `--autosquash` 与 Fixup 提交

开发时发现旧提交需要补充：

```bash
git commit --fixup=<target-commit>
```

会创建类似：

```text
fixup! original subject
```

整理：

```bash
git rebase -i --autosquash <base>
```

Git 自动把 Fixup 移到目标提交后并标记 `fixup`。

适合个人功能分支在 Review 前整理，但不要对已经被协作者引用的提交随意执行。

## Cherry-pick：把指定提交的变化应用到当前位置

假设：

```text
main:    A ← B ← C
release: A ← R1
                 ▲
                HEAD
```

C 是一个紧急修复，要带到 release：

```bash
git cherry-pick C
```

结果：

```text
main:    A ← B ← C
release: A ← R1 ← C'
```

C'：

- 内容变化通常等价于 C；
- Parent 是 R1；
- Commit ID 不同；
- Author 通常保留；
- Committer 是执行 Cherry-pick 的人。

查看：

```bash
git show --format=fuller C'
```

## Cherry-pick 多个提交

按顺序：

```bash
git cherry-pick A B C
```

连续范围，不包含 A：

```bash
git cherry-pick A..C
```

包含 A：

```bash
git cherry-pick A^..C
```

只把变化放入暂存区，不立即提交：

```bash
git cherry-pick --no-commit <commit>
```

适合将多个提交合成一个新提交，但会丢失原有提交边界。

发生冲突：

```bash
git add <resolved>
git cherry-pick --continue
```

放弃：

```bash
git cherry-pick --abort
```

## Cherry-pick Merge Commit

Merge Commit 有多个父节点，Git 不知道应该以哪个父节点为主线计算变化。

需要：

```bash
git cherry-pick -m 1 <merge-commit>
```

`-m 1` 表示以第一个父提交为 Mainline，应用 Merge 相对该父节点引入的结果。

这不是“选择第一个分支的内容”。执行前应查看：

```bash
git show --no-patch --format=raw <merge-commit>
git diff <merge>^1 <merge>
git diff <merge>^2 <merge>
```

## Rebase、Merge、Cherry-pick 怎样选择

### Merge

保留双方历史关系：

```text
适合：公共分支、需要保留分支拓扑
代价：可能增加 Merge Commit
```

### Rebase

把一段提交复制到新基线：

```text
适合：整理自己的未共享功能分支、保持线性
代价：Commit ID 改变，需要强推已发布分支
```

### Cherry-pick

挑选少数提交复制到当前位置：

```text
适合：Release 补丁、回迁修复、选择性复用
代价：产生等价但不同 ID 的重复提交
```

不要把 Cherry-pick 当成长期同步分支的方式。重复挑选会让祖先关系和 Patch 等价关系难以判断。

## 为什么“不要 Rebase 公共历史”

假设远端：

```text
A ← B ← C  main
```

同事从 C 创建工作：

```text
A ← B ← C ← X
```

你把 B、C Rebase 成 B'、C' 并强推：

```text
A ← B' ← C'  main
```

同事本地仍有旧 C 和 X。Pull 时 Git 看到两条不同历史，不能把 C 和 C' 当成同一个提交，即使 Patch 相近。

团队需要额外协调：

```bash
git fetch origin
git rebase --onto origin/main <old-C> <their-branch>
```

因此规则不是“Rebase 危险”，而是：

> 对共享引用进行非协调改写，会让所有基于旧图工作的人承担迁移成本。

## 强推时为什么优先 `--force-with-lease`

Rebase 后分支不再是远端旧分支的快进，普通 Push 会拒绝。

使用：

```bash
git push --force-with-lease origin feature
```

它表达：

> 只有远端 feature 仍指向我最后看到的位置时，才允许覆盖。

如果同事在你 Rebase 期间推了新提交，Lease 不匹配，Push 失败。

`--force` 则不做这层保护，可能直接让他人提交从远端引用中消失。

执行强推前：

```bash
git fetch origin
git log --graph --oneline --decorate --all
git log --left-right --oneline origin/feature...feature
```

## Patch 等价与 `git cherry`

Rebase 或 Cherry-pick 后，Commit ID 不同，但变化可能等价。

查看：

```bash
git cherry main feature
```

输出：

```text
+ abc123  只在 feature 中，没有等价 Patch
- def456  虽然 ID 不同，但 main 已有等价 Patch
```

Patch ID 忽略部分元数据，尝试比较变化等价性。它有局限，但在判断提交是否已被 Cherry-pick 时有帮助。

## 安全实践

Rebase 前：

```bash
git status --short
git branch backup/before-rebase
git fetch origin
```

Rebase 后：

```bash
git range-diff backup/before-rebase...feature \
               origin/main...feature
```

`range-diff` 用于比较两组提交序列，适合检查 Rebase 前后是否保留了预期变化。

冲突完成后：

```bash
git diff --check
<运行测试>
git log --graph --oneline --decorate --all
```

如果结果错误：

```bash
git reflog
git reset --hard backup/before-rebase
```

## 最小实验

```bash
mkdir git-rebase-lab
cd git-rebase-lab
git init

printf "base\n" > demo.txt
git add demo.txt
git commit -m "A"

git switch -c feature
printf "feature 1\n" >> demo.txt
git commit -am "B"
printf "feature 2\n" >> demo.txt
git commit -am "C"

git switch main
printf "main\n" > main.txt
git add main.txt
git commit -m "D"

git switch feature
git branch before-rebase
git rebase main
```

比较：

```bash
git log --graph --oneline --decorate --all
git range-diff main...before-rebase main...feature
```

你会看到 B、C 变成新的提交，但它们表达的变化被重新应用到了 D 之后。
