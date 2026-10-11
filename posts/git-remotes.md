# 本地分支和远端分支究竟是什么关系？

Git 是分布式版本控制系统。本地仓库拥有自己的：

- 对象数据库；
- 分支；
- 标签；
- HEAD；
- Reflog；
- 配置。

远端仓库是另一个独立 Git 仓库，不是本地目录的实时镜像。

理解远端协作，需要区分三种名字：

```text
main          本地分支
origin/main   本地保存的远端跟踪引用
远端 main      服务器仓库中的真实引用
```

它们可能指向三个不同提交。

## Remote 只是一个命名连接配置

查看：

```bash
git remote -v
```

可能得到：

```text
origin  git@github.com:yjd953/yjd953.git (fetch)
origin  git@github.com:yjd953/yjd953.git (push)
```

`origin` 只是默认名称，不是 Git 保留字。可以叫：

```text
upstream
company
github
backup
```

查看详细配置：

```bash
git remote show origin
git config --get-regexp '^remote\.'
```

添加：

```bash
git remote add upstream https://github.com/example/project.git
```

修改 URL：

```bash
git remote set-url origin <new-url>
```

## `origin/main` 位于本地

执行 Clone 或 Fetch 后，本地会保存：

```text
refs/remotes/origin/main
```

它表示：

> 最近一次成功与 origin 通信时，本地观察到远端 main 位于这里。

它不是实时查询结果。

假设本地：

```text
main ─────────► C
origin/main ──► C
```

同事向远端推了 D：

```text
服务器 main ─► D
本地 origin/main 仍然 ─► C
```

在你 Fetch 前，本地不知道 D。

执行：

```bash
git fetch origin
```

后：

```text
服务器 main ───────► D
本地 origin/main ──► D
本地 main ─────────► C
```

Fetch 通常不自动移动本地 main，也不改工作区。

## Fetch 做了什么

```bash
git fetch origin
```

主要步骤：

1. 连接远端；
2. 交换引用状态；
3. 协商本地缺少哪些对象；
4. 下载并校验对象；
5. 按 Refspec 更新远端跟踪引用；
6. 记录 `FETCH_HEAD`。

查看 Refspec：

```bash
git config --get-all remote.origin.fetch
```

常见值：

```text
+refs/heads/*:refs/remotes/origin/*
```

含义是把远端所有分支映射到本地 `refs/remotes/origin/*`。

删除本地已不存在的远端跟踪引用：

```bash
git fetch --prune origin
```

这只删除本地过期的 `origin/xxx`，不是删除服务器分支。

## Pull 不是基础动作，而是组合动作

```bash
git pull
```

通常相当于：

```text
git fetch
+
git merge 或 git rebase
```

具体策略由配置和参数决定：

```bash
git pull --ff-only
git pull --rebase
git pull --no-rebase
```

推荐先理解并明确策略。对初学者，稳健方式是拆开：

```bash
git fetch origin
git log --graph --oneline --decorate --all
git merge --ff-only origin/main
```

如果不能 Fast-forward，再有意识地决定 Merge 或 Rebase。

配置示例：

```bash
git config pull.ff only
```

这里只修改当前仓库；是否使用应结合团队规范。不要在不了解公司仓库流程时贸然修改全局配置。

## Upstream：本地分支默认跟踪谁

查看：

```bash
git branch -vv
```

示例：

```text
* main 2803068 [origin/main] Initial public snapshot
```

表示本地 main 的 Upstream 是 `origin/main`。

首次推送并建立关系：

```bash
git push -u origin feature/git-notes
```

以后可以简写：

```bash
git push
git pull
```

查看配置：

```bash
git config --get branch.main.remote
git config --get branch.main.merge
```

设置：

```bash
git branch --set-upstream-to=origin/main main
```

Upstream 只是一组默认比较和推拉关系，不会自动同步。

## Ahead 和 Behind 是怎样计算的

执行：

```bash
git status --short --branch
```

可能显示：

```text
## main...origin/main [ahead 2, behind 1]
```

含义：

- 有 2 个提交从本地 main 可达，但从 origin/main 不可达；
- 有 1 个提交从 origin/main 可达，但从本地 main 不可达。

它比较的是提交图可达集合，不是文件行数。

查看：

```bash
git log --left-right --oneline main...origin/main
```

统计：

```bash
git rev-list --left-right --count main...origin/main
```

注意结果只基于当前本地的 `origin/main`。想知道服务器最新状态，先 Fetch。

## Push 做了什么

```bash
git push origin main
```

概念上：

```text
本地 refs/heads/main
        │
        └── 请求更新远端 refs/heads/main
```

Git 会：

1. 连接远端并认证；
2. 读取远端引用；
3. 计算远端缺少的对象；
4. 打包并传输；
5. 请求远端更新引用；
6. 远端执行权限、Hook、分支保护检查；
7. 成功后本地更新相关跟踪信息。

Push 不等于“上传当前工作区”。未提交修改没有 Commit 和 Tree，不会被 Push。

## 为什么普通 Push 会拒绝 Non-fast-forward

远端：

```text
A ← B ← C  remote main
```

本地：

```text
A ← B ← D  local main
```

如果把远端 main 直接从 C 改到 D，C 将不再由 main 到达。这不是 Fast-forward。

普通 Push 拒绝：

```text
non-fast-forward
```

因为它可能覆盖别人工作。

先：

```bash
git fetch origin
git log --graph --oneline --decorate --all
```

再选择：

```bash
git merge origin/main
# 或
git rebase origin/main
```

完成验证后普通 Push。

## `--force` 与 `--force-with-lease`

`--force` 表示即使不是 Fast-forward，也请求更新：

```bash
git push --force origin main
```

它可能覆盖你尚未 Fetch 到的远端新提交。

`--force-with-lease` 增加期望值检查：

```bash
git push --force-with-lease origin feature
```

大意是：

> 只有远端 feature 仍位于我预期的旧 Commit，才更新到新 Commit。

更明确地指定期望：

```bash
git push \
  --force-with-lease=refs/heads/feature:<expected-old-id> \
  origin feature
```

它仍然是历史改写，不会自动解决协作影响，只是降低误覆盖风险。

## 删除远端分支

```bash
git push origin --delete feature/old
```

这会请求远端删除引用。

本地还可能存在：

```text
feature/old          本地分支
origin/feature/old   远端跟踪引用
```

Fetch 并 Prune：

```bash
git fetch --prune origin
```

再按需要删除本地分支：

```bash
git branch -d feature/old
```

三个动作不是同一件事。

## Tag 默认不会随普通 Push 自动全部上传

创建：

```bash
git tag -a v1.0.0 -m "release 1.0.0"
```

推送一个：

```bash
git push origin v1.0.0
```

推送所有本地标签：

```bash
git push origin --tags
```

删除远端标签：

```bash
git push origin :refs/tags/v1.0.0
```

发布标签通常不应随意改写，因为构建、制品和外部依赖可能已经绑定该版本。

## Fork 工作流中的 `origin` 与 `upstream`

常见配置：

```text
origin    → 自己的 Fork
upstream  → 原始项目
```

更新：

```bash
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push origin main
```

功能分支：

```bash
git switch -c feature/x upstream/main
git push -u origin feature/x
```

Pull Request 从自己的 Fork 分支指向上游主干。

## 协议与认证

常见 URL：

```text
https://github.com/org/repo.git
git@github.com:org/repo.git
```

HTTPS 通常使用：

- Credential Manager；
- Personal Access Token；
- 平台登录集成。

SSH 通常使用：

- 私钥保存在本机；
- 公钥注册到平台；
- SSH Agent 管理解锁状态。

测试：

```bash
ssh -T git@github.com
```

不要把：

- Token；
- 私钥；
- 带凭证 URL；
- Credential 文件；

提交到仓库。

## 一次安全同步流程

```bash
# 1. 确认本地状态
git status --short --branch

# 2. 只获取，不自动合并
git fetch --prune origin

# 3. 查看图
git log --graph --oneline --decorate --all -30

# 4. 比较双方
git log --left-right --oneline HEAD...origin/main

# 5. 明确选择策略
git merge --ff-only origin/main
# 如果无法快进，再判断 merge 或 rebase

# 6. 验证
git status
<运行测试>

# 7. 推送
git push
```

这比盲目 `git pull` 更容易理解每一步发生了什么。

## 历史强推后的本地覆盖

如果远端经过协调后重建为新历史：

```text
本地 main   → old-history
远端 main   → new-root
```

先确认工作区没有要保留的修改，再：

```bash
git fetch origin --prune
git log --graph --oneline --decorate --all
git reset --hard origin/main
```

如果本地旧 Reflog 和对象也需要清理：

```bash
git reflog expire --expire=now --expire-unreachable=now --all
git gc --prune=now
```

后两条会降低旧提交的本地恢复可能，只应在确认新历史正确且不再需要旧对象后执行。它们不影响其他 Clone、Fork 或平台缓存。

## 最小远端实验

可以用本地 Bare Repository 模拟服务器：

```bash
mkdir remote-lab
cd remote-lab
git init --bare server.git
git clone server.git alice
git clone server.git bob
```

Alice：

```bash
cd alice
printf "alice\n" > demo.txt
git add demo.txt
git commit -m "alice change"
git push origin main
```

Bob 在 Fetch 前：

```bash
cd ../bob
git log --all --oneline
```

然后：

```bash
git fetch origin
git log --all --graph --oneline --decorate
```

这个实验会直接证明：远端已经变化，不代表本地 `origin/main` 会自动变化；只有通信后，本地才更新对远端状态的认知。
