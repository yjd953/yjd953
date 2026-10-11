# Git 是怎样还原每次代码变化的？

一个 Git 仓库看起来只有当前文件，但 `.git` 中保存着历史对象和引用。Git 可以回答不同层次的问题：

- 项目有哪些提交？
- 某个提交由谁创建？
- 某次提交改了哪些文件和代码？
- 一个文件经历过哪些变化？
- 当前某一行最后由哪个提交修改？
- 一个 Bug 从哪个版本开始出现？

这些问题不能靠一条命令全部解决。需要先明确查询对象。

## 查看提交图：`git log`

最常用的全局视图：

```bash
git log --oneline --decorate --graph --all
```

示例：

```text
*   a71b92e (HEAD -> main) merge feature
|\
| * 8c204fd (feature) add validation
* | 991a12d update docs
|/
* 2803068 initial snapshot
```

其中：

- `*` 是提交节点；
- 线条表示父子关系；
- `HEAD -> main` 表示当前 HEAD 指向 main；
- `feature` 是另一个引用；
- 短哈希只是完整对象 ID 的缩写。

不要只看线性列表。如果仓库有 Merge，`--graph --all` 更接近真实提交图。

自定义格式：

```bash
git log \
  --format='%h | %ad | %an <%ae> | %s' \
  --date=short
```

这可以审计每个提交的：

- Commit ID；
- 作者时间；
- Author 名称与邮箱；
- Message。

如果需要同时看 Committer：

```bash
git log --format=fuller
```

## Author 和 Committer 是两套字段

一个提交可能显示：

```text
Author:    Alice <alice@example.com>
Commit:    Bob <bob@example.com>
```

常见场景：

- Alice 写了补丁，Bob 应用并提交；
- Cherry-pick 保留原 Author，但 Committer 变成执行者；
- Rebase 重新创建提交，Author 时间可保留，Committer 时间更新；
- GitHub 网页合并由平台创建新 Commit。

精确输出：

```bash
git show -s --format='
commit:    %H
author:    %an <%ae>
author at: %aI
committer: %cn <%ce>
commit at: %cI
subject:   %s
' <commit>
```

隐私检查时，Author 邮箱和 Committer 邮箱都要检查。

## 查看一个提交：`git show`

```bash
git show <commit>
```

默认显示：

1. 提交元数据；
2. 提交说明；
3. 相对父提交的 Patch。

只看概要：

```bash
git show --stat <commit>
```

只看文件状态：

```bash
git show --name-status <commit>
```

只看元数据：

```bash
git show --no-patch --format=fuller <commit>
```

只看某个文件：

```bash
git show <commit> -- path/to/file
```

查看该提交中的文件完整内容：

```bash
git show <commit>:path/to/file
```

注意两种语法的区别：

```text
git show C -- file   比较 C 与父提交时 file 的变化
git show C:file      读取 C 快照中的 file 内容
```

## Git 如何得到“这次变化”

普通 Commit 对象主要保存：

- 根 Tree；
- Parent；
- Author/Committer；
- Message。

它不直接保存一份面向用户的统一 Diff。`git show C` 大致做：

```text
读取 C 的 Tree
读取 C^ 的 Tree
比较路径与 Blob
根据 Diff 算法生成 Patch
```

对于根提交，没有父节点，Git 把它视为从空 Tree 创建全部文件。

对于 Merge Commit，有多个 Parent。默认 `git show` 可能不展示普通 Patch，因为“相对哪个父提交”并不唯一。可以使用：

```bash
git show -m <merge-commit>
git show --first-parent <merge-commit>
git diff <merge>^1 <merge>
git diff <merge>^2 <merge>
```

## 比较任意两个状态：`git diff`

工作区与暂存区：

```bash
git diff
```

暂存区与 HEAD：

```bash
git diff --staged
```

工作区与 HEAD：

```bash
git diff HEAD
```

两个提交：

```bash
git diff A B
```

两个分支端点：

```bash
git diff main feature
```

从共同祖先到 feature：

```bash
git diff main...feature
```

后者很适合检查 Pull Request 中“这个分支相对开始分叉时做了什么”。

只看文件列表：

```bash
git diff --name-status A B
```

输出状态包括：

```text
M  modified
A  added
D  deleted
R  renamed
C  copied
```

`R` 和 `C` 通常是比较时根据相似度推断，不是对象中永久保存的操作事件。

## 查看一个文件的完整历史

```bash
git log -- path/to/file
```

同时显示 Patch：

```bash
git log -p -- path/to/file
```

显示统计：

```bash
git log --stat -- path/to/file
```

跟随简单重命名：

```bash
git log --follow -- path/to/file
```

`--follow` 有边界：

- 主要针对单个文件；
- 重命名是相似度推断；
- 大幅重写可能无法追踪；
- 复杂目录拆分不一定完整。

查看某文件在旧提交中的样子：

```bash
git show <commit>:path/to/file
```

比较该文件两个版本：

```bash
git diff A B -- path/to/file
```

## 查看每一行最后由谁修改：`git blame`

```bash
git blame path/to/file
```

输出类似：

```text
8c204fd1 (Alice 2026-10-01 10:20:00 +0800 10) validate(input);
```

它回答：

> 当前版本这一行，最后由哪个提交引入或修改？

不是：

> 最初是谁发明了这行逻辑？

如果之后有人只做格式化，这一行的 Blame 可能指向格式化提交。常用选项：

```bash
git blame -w path/to/file
```

忽略纯空白变化。

查看指定行：

```bash
git blame -L 40,70 path/to/file
```

尝试识别行移动和复制：

```bash
git blame -M -C path/to/file
```

进一步查看对应提交：

```bash
git show <blame-output-commit>
```

Blame 是调查入口，不是责任追究工具。代码通常经过多人 Review、重构和迁移，最后修改者不一定是问题根因的设计者。

## 按内容搜索历史：`git log -S` 与 `-G`

找某个字符串的出现次数在哪次提交中改变：

```bash
git log -S'legacyApi' --oneline
```

同时显示 Patch：

```bash
git log -S'legacyApi' -p
```

`-S` 是 Pickaxe，它寻找字符串出现次数发生变化的提交。

按 Patch 行匹配正则：

```bash
git log -G'validate\\(.+\\)' -p
```

区别：

- `-S` 关注字符串计数变化；
- `-G` 关注 Diff 中新增或删除行是否匹配正则。

找函数历史：

```bash
git log -L :functionName:path/to/file
```

这对长期演化分析有帮助，但依赖 Git 能识别语言函数边界。

## 按作者、时间和说明过滤

```bash
git log --author='Dale'
git log --since='2026-09-01' --until='2026-10-01'
git log --grep='privacy'
git log --all --regexp-ignore-case --grep='git'
```

组合：

```bash
git log \
  --all \
  --author='example.com' \
  --since='2026-01-01' \
  --format='%H %an <%ae> %s'
```

审计邮箱更直接：

```bash
git log --all --format='%H%x09%an%x09%ae%x09%cn%x09%ce'
```

再通过 `grep` 或结构化脚本检查域名。

## 查看分支之间有哪些提交

只在 feature：

```bash
git log main..feature
```

只在 main：

```bash
git log feature..main
```

两边各自独有：

```bash
git log --left-right --graph --oneline main...feature
```

示例：

```text
< a1b2c3 local change
> d4e5f6 remote change
```

查看提交同时附带 Patch：

```bash
git log -p main..feature
```

检查提交是否已被另一个分支包含：

```bash
git branch --contains <commit>
git tag --contains <commit>
```

这对删除分支前判断提交是否仍可达非常重要。

## 查找一个 Commit 属于哪些引用

```bash
git branch --all --contains <commit>
git tag --contains <commit>
```

查看所有直接引用：

```bash
git show-ref
```

检查对象是否存在：

```bash
git cat-file -e <commit>^{commit}
```

成功无输出，失败返回非零状态。

注意：对象存在不等于仍属于公开分支。旧 Commit 可能：

- 仍由 Reflog 保存；
- 处于不可达但尚未 GC 的状态；
- 被平台隐藏引用保留；
- 存在于别人的 Fork。

## 调查一处异常代码的完整流程

假设当前文件第 120 行出现：

```js
const timeout = 0;
```

第一步，找最后修改者：

```bash
git blame -L 115,125 src/client.js
```

第二步，查看提交上下文：

```bash
git show <commit> -- src/client.js
```

第三步，查看文件演化：

```bash
git log -p --follow -- src/client.js
```

第四步，搜索这个配置何时出现：

```bash
git log -S'const timeout = 0' -p --all
```

第五步，检查提交图与分支：

```bash
git log --graph --oneline --decorate --all
git branch --all --contains <commit>
```

这样可以区分：

- 逻辑最初被谁引入；
- 后来是否迁移或格式化；
- 哪个合并把它带入主干；
- 当前哪些版本仍包含它。

## IDE 为什么有时看不到历史

历史实际位于 `.git` 对象和引用中。IDE 的 Git 面板只是读取并展示这些数据。

看不到历史的常见原因：

- 打开的不是仓库根目录；
- `.git` 在父目录；
- IDE 只显示当前分支；
- 远端引用尚未 Fetch；
- 历史刚被改写，本地缓存未刷新；
- 当前目录是导出的源码包，没有 `.git`；
- Shallow Clone 只下载了部分历史。

检查：

```bash
git rev-parse --show-toplevel
git rev-parse --is-shallow-repository
git branch --all
git log --all --oneline
```

如果是浅克隆：

```bash
git fetch --unshallow
```

前提是远端仍保留完整历史。

## 一套只读历史检查清单

```bash
# 仓库与分支状态
git status --short --branch

# 全部提交图
git log --graph --oneline --decorate --all

# 身份信息
git log --all --format='%H | %an <%ae> | %cn <%ce> | %s'

# 单个提交
git show --stat --format=fuller <commit>

# 单文件历史
git log -p --follow -- path/to/file

# 当前行来源
git blame -L 1,120 path/to/file

# 内容何时出现
git log -S'search text' -p --all

# 分支差异
git log --left-right --oneline main...feature
```

这些命令默认只读，不会修改仓库。先用它们建立事实，再决定是否撤销、合并或改写历史。
