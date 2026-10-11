# Git 的对象数据库里到底存了什么？

从用户视角看，Git 管理的是文件和提交；从内部实现看，Git 管理的是一组按内容寻址的对象。

最核心的四种对象是：

```text
Blob   文件内容
Tree   目录结构
Commit 一次历史节点
Tag    带说明的稳定引用对象
```

它们通常保存在：

```text
.git/objects/
```

理解这些对象以后，很多现象都会变得自然：

- Git 为什么能快速判断相同内容；
- 文件重命名为什么不是一种永久记录；
- 提交为什么修改一点内容就会得到全新哈希；
- 分支删除后提交为什么有时还能恢复；
- 清理敏感历史为什么不等于删除当前文件。

## 内容寻址：对象 ID 由内容决定

Git 对对象进行序列化和哈希，得到对象 ID。概念上：

```text
对象 ID = hash(对象类型 + 内容长度 + 对象内容)
```

传统仓库常见 SHA-1：

```text
e965047ad7c57865823c7d992b1d046ea66edf78
```

较新的 Git 也支持 SHA-256 仓库。无论使用哪种算法，关键性质相同：

> 对象的名字不是用户随便取的，而是由对象内容计算得到。

因此相同内容会得到相同对象 ID；内容改变一个字节，就会得到不同 ID。

可以直接创建一个 Blob：

```bash
printf "hello\n" | git hash-object --stdin
```

只计算但不写入对象库。加上 `-w`：

```bash
printf "hello\n" | git hash-object -w --stdin
```

对象会写入 `.git/objects`。

查看对象类型与内容：

```bash
git cat-file -t <object-id>
git cat-file -p <object-id>
```

## Blob：只保存文件内容，不保存文件名

Blob 是 Binary Large Object 的缩写。它保存一段字节，不关心这段字节叫什么名字。

假设两个文件内容完全相同：

```text
docs/a.txt  → "hello\n"
docs/b.txt  → "hello\n"
```

它们可以共同引用同一个 Blob：

```text
Blob e965047...
     ▲       ▲
     │       │
   a.txt   b.txt
```

文件名和路径由 Tree 保存，而不是 Blob。

Blob 也通常不保存：

- 作者；
- 修改时间；
- 文件路径；
- “这是一行新增还是一行删除”；
- 完整 Unix 权限。

Git 主要关心少量模式信息，例如普通文件、可执行文件、符号链接和子模块。

这解释了一个重要事实：

> Git 不是逐行记录编辑动作的录像机。

它保存每个版本的文件内容。需要查看变化时，再比较两个 Blob 并生成 Diff。

## Tree：把名字、模式与对象组织成目录

Tree 类似目录快照。一个 Tree 条目包含：

```text
文件模式  对象类型  对象 ID  名称
```

查看当前提交的根 Tree：

```bash
git cat-file -p HEAD^{tree}
```

可能得到：

```text
100644 blob a1b2c3...  README.md
040000 tree d4e5f6...  src
100755 blob 112233...  scripts/build.sh
```

其中：

- `100644` 表示普通非执行文件；
- `100755` 表示可执行文件；
- `040000` 表示子 Tree，也就是目录；
- 名称把对象放到了具体路径。

例如：

```text
根 Tree
├── README.md ──► Blob A
└── src ────────► Tree B
                   ├── app.js ──► Blob C
                   └── api.js ──► Blob D
```

这整棵树共同描述一次项目快照。

如果只修改 `src/app.js`：

1. 产生新的 Blob C2；
2. `src` 目录产生新的 Tree B2；
3. 根目录产生新的 Tree Root2；
4. 新提交引用 Root2。

没有变化的 `README.md` 和 `api.js` 继续复用原对象。

这就是 Git 能采用快照模型而不必每次完整复制仓库的原因：不变对象天然复用。

## Commit：把快照接入历史图

Commit 对象不直接包含所有文件内容。它引用根 Tree，并带有历史和身份信息。

执行：

```bash
git cat-file -p HEAD
```

可以看到类似：

```text
tree 70f3a9...
parent 4c21b8...
author DaleYang <128274172+yjd953@users.noreply.github.com> 1791673200 +0800
committer DaleYang <128274172+yjd953@users.noreply.github.com> 1791673200 +0800

docs: explain Git objects
```

字段含义：

| 字段 | 作用 |
| --- | --- |
| `tree` | 该提交对应的项目根快照 |
| `parent` | 直接父提交 |
| `author` | 原始变更作者 |
| `committer` | 创建当前 Commit 对象的人 |
| message | 提交说明 |

普通提交有一个父节点：

```text
C1 ← C2 ← C3
```

合并提交可能有两个或更多父节点：

```text
C1 ← C2 ← M
       ↖ C3 ↗
```

根提交没有父节点。

由于 Commit 内容包含：

- Tree ID；
- Parent ID；
- 作者和提交者；
- 时间戳；
- 提交说明；

其中任意字段变化，Commit ID 都会变化。

所以即使文件快照完全相同，只要提交说明或父提交不同，也会创建不同的 Commit。

## Tag：给某个对象建立带说明、可签名的标记

轻量标签只是一个引用：

```bash
git tag v1.0.0
```

它通常直接指向某个 Commit。

附注标签会创建 Tag 对象：

```bash
git tag -a v1.0.0 -m "First stable release"
```

Tag 对象包含：

- 目标对象；
- 目标类型；
- Tag 名；
- 创建者；
- 时间；
- 说明；
- 可选签名。

查看：

```bash
git cat-file -p v1.0.0
```

发布版本通常更适合使用附注标签，因为它具有独立说明和签名能力。

## 文件重命名为什么不是独立对象

假设提交 A 中：

```text
old.txt → Blob X
```

提交 B 中：

```text
new.txt → Blob X
```

Git 的快照只表示：

- 旧 Tree 有 `old.txt`；
- 新 Tree 有 `new.txt`；
- 两者引用同一个 Blob。

对象里没有一条永久的“rename old.txt to new.txt”指令。显示历史时，Git 根据内容相似度推断重命名：

```bash
git diff -M A B
git log --follow -- new.txt
```

如果文件同时改名并大幅重写，Git 的相似度判断可能无法把两个版本连接起来。这不是历史损坏，而是“重命名”本来就是比较阶段的推断。

## Diff 是计算结果，不是核心存储格式

给定两个提交：

```text
Commit A → Tree A → Blob old
Commit B → Tree B → Blob new
```

Git 比较两棵 Tree，找到路径变化，再比较对应 Blob：

```bash
git diff A B
```

输出：

```diff
- old line
+ new line
```

这只是对两份内容的解释。可以改变比较方式：

```bash
git diff --word-diff A B
git diff --stat A B
git diff --name-status A B
git diff --ignore-space-change A B
```

底层对象没有改变，展示结果却可以不同。

因此不要把“Git 保存 Diff”当成核心模型。Git 能高效压缩对象，但逻辑模型仍然是快照。

## Loose Object 与 Packfile

刚创建的小对象可能以 Loose Object 保存：

```text
.git/objects/e9/65047ad7c578...
```

目录名取对象 ID 前两位，文件名使用剩余部分。内容经过压缩，并不是可以直接阅读的纯文本。

随着对象增多，Git 会把它们打包到：

```text
.git/objects/pack/
├── pack-xxxx.pack
└── pack-xxxx.idx
```

Packfile 会：

- 集中存储多个对象；
- 对相似对象使用 Delta Compression；
- 用索引快速定位对象。

这属于物理存储优化，不改变逻辑对象模型。一个 Commit 仍然引用 Tree，Tree 仍然引用 Blob，只是对象字节可能被打包和增量压缩。

常见维护命令：

```bash
git count-objects -v
git gc
git verify-pack -v .git/objects/pack/*.idx
```

日常通常不需要手动运行 `git gc`，Git 会在适当时机自动维护。

## 可达性决定对象是否属于当前历史

分支、标签、HEAD 和其他引用是图的入口：

```text
main ──► C5 ──► C4 ──► C3
tag v1 ───────────────► C3
```

从这些引用沿 Parent、Tree、Blob 关系可以走到的对象，称为可达对象。

如果删除唯一指向 C5 的分支：

```text
main 被删除

C5 ──► C4 ──► C3
```

C5 和 C4 可能暂时变成不可达对象。它们不会一定立刻从磁盘消失：

- Reflog 可能仍记录旧引用；
- 垃圾回收通常有宽限期；
- 其他隐藏引用可能仍然指向它。

因此误删分支后经常还能恢复：

```bash
git reflog
git branch recovered <old-commit>
```

反过来，清理敏感信息时，仅删除分支或强推并不一定立刻删除所有对象副本，还需要检查其他引用、Reflog、缓存和外部 clone。

## 对象不可变，历史修改靠创建新对象

Git 对象按内容寻址。修改一个 Commit 的邮箱并不是在原对象上改字段，而是：

1. 创建一个邮箱不同的新 Commit；
2. 因 Parent ID 变化，所有后代 Commit 也要重新创建；
3. 把分支引用移动到新历史；
4. 旧历史变成不可达或仍由其他引用保留。

例如：

```text
旧：A ← B ← C
        邮箱错误

新：A ← B' ← C'
        邮箱修正
```

`B'` 的 ID 与 `B` 不同，`C'` 的 Parent 从 `B` 变成 `B'`，所以 `C'` 也不同。

这就是 Rebase、Amend、Filter-repo 和历史重建都会改变 Commit ID 的根本原因。

## 用 Plumbing 命令观察一个真实提交

在任意测试仓库中：

```bash
git rev-parse HEAD
git cat-file -t HEAD
git cat-file -p HEAD
```

取出根 Tree：

```bash
git rev-parse HEAD^{tree}
git cat-file -p HEAD^{tree}
```

找到其中一个 Blob，再查看：

```bash
git cat-file -t <blob-id>
git cat-file -s <blob-id>
git cat-file -p <blob-id>
```

最后列出整个提交快照：

```bash
git ls-tree -r HEAD
```

这组命令不会修改仓库。它们把平时由 `status`、`log` 和 IDE 隐藏的对象关系直接展示出来。

## 最小对象实验

创建临时仓库：

```bash
mkdir git-object-lab
cd git-object-lab
git init

printf "same content\n" > a.txt
cp a.txt b.txt
git add a.txt b.txt
git commit -m "add equal files"
```

观察：

```bash
git ls-tree HEAD
```

你会发现 `a.txt` 和 `b.txt` 很可能指向同一个 Blob ID。

然后修改一个文件：

```bash
printf "changed\n" > b.txt
git add b.txt
git commit -m "change b"
git ls-tree HEAD
```

此时：

- `a.txt` 继续指向旧 Blob；
- `b.txt` 指向新 Blob；
- 根 Tree 变化；
- Commit 变化。

这就是 Git 的核心：文件内容、目录快照与历史节点彼此分离，通过对象 ID 连成一张不可变图。
