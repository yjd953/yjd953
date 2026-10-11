# Git 到底在管理什么？

很多人第一次接触 Git，会把它理解成“保存代码修改记录的工具”。这个说法没有错，但太容易形成错误直觉：

- 以为 Git 只保存差异；
- 以为 `git add` 是把文件上传到某个地方；
- 以为分支是复制出来的一整套目录；
- 以为删除 `.git` 只是删除日志；
- 以为 GitHub 就是 Git。

更准确的说法是：

> Git 是一个以提交图组织文件快照、以引用定位历史节点的本地版本数据库。

日常使用 Git，本质上是在三个区域之间搬运文件状态：

```text
工作区 Working Tree
        │ git add
        ▼
暂存区 Index
        │ git commit
        ▼
本地仓库 Repository
        │ git push
        ▼
远端仓库 Remote Repository
```

先把这张地图建立起来，后面的 `reset`、`restore`、`checkout`、`rebase` 才不会变成死记命令。

## 工作区：你现在真正看见和编辑的文件

工作区就是项目目录中普通可见的文件：

```text
my-project/
├── README.md
├── src/
├── package.json
└── .git/
```

IDE 修改的是工作区。你在 `README.md` 中增加一行文字，这个动作暂时只改变磁盘上的文件，并没有自动进入 Git 历史。

此时运行：

```bash
git status
```

Git 会比较：

1. 当前提交中的快照；
2. 暂存区中的候选快照；
3. 工作区中的实际文件。

如果工作区文件与暂存区不同，它就会显示 `Changes not staged for commit`。

工作区可能包含四类状态：

| 状态 | 含义 |
| --- | --- |
| Untracked | 文件存在，但从未进入当前 Git 历史 |
| Modified | 已跟踪文件的内容发生变化 |
| Deleted | 当前快照中存在，工作区里已删除 |
| Clean | 工作区与暂存区一致 |

注意，`untracked` 不代表 Git 不知道这个文件存在。Git 能在扫描工作区时看到它，只是当前提交和暂存区里没有它。

## 暂存区：下一次提交的精确候选快照

暂存区也叫 Index。它不是一个普通的“待办列表”，而是一份准备写入下一个提交的目录结构。

执行：

```bash
git add README.md
```

意味着：

> 读取此刻 `README.md` 的内容，把它对应的对象和路径信息写入暂存区，作为下一次提交的一部分。

如果你随后继续修改 `README.md`，会同时出现两份变化：

```text
HEAD 中的 README
        │
        ├── 已暂存版本：第一次 git add 时的内容
        └── 工作区版本：后来继续修改后的内容
```

可以分别观察：

```bash
# 工作区相对暂存区还有什么变化
git diff

# 暂存区相对当前提交将提交什么
git diff --staged
```

这解释了为什么一个文件可以同时出现在 `Changes to be committed` 和 `Changes not staged for commit` 中。

暂存区的价值是让一次提交具有明确边界。例如你在同一个文件里：

- 修复了一个空指针；
- 顺手改了一个按钮文案。

这两项工作不一定应该进入同一个提交。可以使用：

```bash
git add -p
```

逐个代码块决定是否加入暂存区。Git 的提交单位不是“保存时刻”，而是你主动选择的一组一致变化。

## 本地仓库：`.git` 目录中的对象和引用

项目根目录下隐藏的 `.git` 是本地仓库的核心：

```text
.git/
├── HEAD
├── config
├── index
├── objects/
├── refs/
└── logs/
```

其中：

- `objects/` 保存 Blob、Tree、Commit、Tag 等对象；
- `refs/` 保存分支和标签指向哪个对象；
- `HEAD` 指明当前位于哪个分支或提交；
- `index` 是暂存区；
- `config` 是当前仓库配置；
- `logs/` 保存引用移动记录，也就是 Reflog 的主要数据。

删除 `.git` 后，普通源文件仍在，但这个目录不再是 Git 仓库：

```bash
git status
# fatal: not a git repository
```

丢失的不只是“日志”，还包括：

- 所有本地提交；
- 分支与标签；
- 暂存区；
- 远端地址；
- 仓库级配置；
- Reflog 恢复线索。

因此不要手工编辑或删除 `.git`。需要操作内部状态时，应优先使用 Git 命令。

## 提交：不是“保存差异”，而是登记一个快照节点

执行：

```bash
git commit -m "docs: explain Git areas"
```

Git 会基于暂存区创建新提交。一个提交主要记录：

```text
tree        本次提交对应的根目录快照
parent      父提交
author      原始作者与时间
committer   实际创建这个提交的人与时间
message     提交说明
```

Git 展示“本次改了哪些行”时，通常是把该提交的快照与父提交快照比较后计算出来，而不是因为提交对象里保存了一份面向人类的逐行操作录像。

例如：

```bash
git show HEAD
```

大致执行的是：

```text
读取 HEAD 提交
→ 找到 parent
→ 读取两边 Tree
→ 比较对应 Blob
→ 生成 diff
```

所以同一组快照可以用不同算法显示出不同形式的差异，但提交本身仍然是同一个对象。

## 远端仓库：另一个可以交换对象和引用的 Git 仓库

GitHub、GitLab 或公司代码平台提供的是远端 Git 仓库及其周边协作能力。

远端仓库不是本地仓库的一块实时同步磁盘。它是另一个独立仓库：

```text
本地仓库                           GitHub 仓库
main ──► C3                        main ──► C2
          │                                  │
          └── 本地新提交 C3 尚未推送          └── 远端暂时不知道 C3
```

执行：

```bash
git push origin main
```

才会尝试把远端缺少的对象传过去，并把远端 `main` 从 `C2` 更新到 `C3`。

执行：

```bash
git fetch origin
```

则把远端对象和引用状态下载到本地，更新类似 `origin/main` 的远端跟踪引用，但通常不会直接改你的工作区。

GitHub 额外提供：

- Pull Request；
- Code Review；
- Issue；
- Actions；
- 权限控制；
- 网页查看提交与 Diff。

这些不是 Git 核心协议本身。

## `git status` 为什么是最重要的安全命令

在不确定仓库状态时，第一条命令应当是：

```bash
git status --short --branch
```

示例：

```text
## main...origin/main [ahead 2, behind 1]
 M README.md
M  src/app.js
?? notes.txt
```

含义是：

- 本地 `main` 相对 `origin/main` 多 2 个提交、少 1 个提交；
- `README.md` 只在工作区修改；
- `src/app.js` 左侧是 `M`，表示变化已经暂存；
- `notes.txt` 尚未跟踪。

短格式的两列分别比较：

```text
第一列：暂存区 vs HEAD
第二列：工作区 vs 暂存区
```

例如：

```text
 M file.txt   # 只改了工作区
M  file.txt   # 已进入暂存区
MM file.txt   # 已暂存后又继续修改
A  file.txt   # 新文件已暂存
?? file.txt   # 未跟踪
```

理解这两列，比背诵十条撤销命令更有用。

## 一次完整变化的生命周期

假设创建文件：

```bash
printf "hello\n" > hello.txt
```

状态变化如下：

```text
1. 创建文件
   工作区：hello.txt
   暂存区：无
   HEAD：无

2. git add hello.txt
   工作区：hello
   暂存区：hello
   HEAD：无

3. git commit
   工作区：hello
   暂存区：hello
   HEAD：hello

4. 再修改为 hello world
   工作区：hello world
   暂存区：hello
   HEAD：hello
```

每一步都可以通过以下命令验证：

```bash
git status
git diff
git diff --staged
git show HEAD
```

## 不要把“保存文件”和“提交版本”混在一起

编辑器保存解决的是：

> 内存中的编辑内容是否写入磁盘。

`git add` 解决的是：

> 下一次提交准备包含哪个版本。

`git commit` 解决的是：

> 是否创建一个有身份、时间、父节点和说明的历史节点。

`git push` 解决的是：

> 是否把本地对象和引用更新发送给远端。

四个动作彼此独立：

```text
编辑器 Save ≠ git add ≠ git commit ≠ git push
```

## 最小实践

在临时目录做一次实验：

```bash
mkdir git-area-lab
cd git-area-lab
git init

printf "v1\n" > demo.txt
git status --short

git add demo.txt
git status --short

printf "v2\n" >> demo.txt
git status --short
git diff
git diff --staged
```

此时不要急着继续。先尝试回答：

1. 当前提交里有没有 `demo.txt`？
2. 下一次提交会得到 `v1` 还是 `v1 + v2`？
3. 工作区和暂存区分别保存了什么？

答案是：

- 还没有提交，所以当前历史没有 `demo.txt`；
- 暂存区保存的是第一次 `git add` 时的 `v1`；
- 工作区包含后来追加的 `v2`。

这就是 Git 后续所有复杂操作的起点：先判断对象位于哪个区域，再决定要移动哪一个状态。
