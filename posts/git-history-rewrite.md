# 怎样安全地改写历史并清除敏感信息？

历史改写不是“编辑旧 Commit”。Git 对象不可变，所谓改写是：

1. 根据旧历史创建一套新对象；
2. 让分支和标签指向新对象；
3. 旧对象失去公开引用；
4. 协调所有副本迁移到新历史。

典型用途：

- Commit 元数据暴露真实邮箱；
- 密钥进入文件历史；
- 大文件让仓库膨胀；
- 错误生成物贯穿大量提交；
- 需要把当前快照重建成干净根提交。

它是破坏性协作操作。执行前必须区分：

```text
修复当前文件
改写可见历史
吊销已泄露凭证
清理本地不可达对象
请求平台清理缓存
```

这些不是同一件事。

## 第一原则：秘密泄露先轮换，后清历史

如果提交的是：

- API Key；
- Token；
- 私钥；
- 数据库密码；
- 云访问密钥；
- 签名密钥；

立即：

1. 吊销；
2. 轮换；
3. 检查使用日志；
4. 缩小权限；
5. 通知安全负责人；
6. 再做历史清理。

因为即使历史最终被改写：

- 别人可能已经 Clone；
- CI 日志可能打印；
- 搜索引擎可能索引；
- Fork 可能保留；
- 平台缓存可能存在。

历史清理降低继续暴露，不会让泄露从未发生。

## 改写前先盘点所有引用

```bash
git status --short --branch
git remote -v
git branch --all --verbose
git tag --list
git stash list
git show-ref
```

查看提交图：

```bash
git log --graph --oneline --decorate --all
```

检查目标信息：

```bash
git log --all \
  --format='%H | %an <%ae> | %cn <%ce> | %s'
```

检查文件历史：

```bash
git log --all -- path/to/sensitive-file
```

历史文本搜索可以遍历提交执行 `git grep`，大型仓库更适合专门扫描工具。

如果敏感提交还被 Tag、旧分支或 PR 引用，只改 main 不够。

## 备份不是把旧秘密再次公开

改写前需要可恢复备份，但备份必须受控：

- 本地加密存储；
- 受限访问目录；
- 不推到另一个公开仓库；
- 记录删除计划；
- 秘密已经轮换。

可以创建 Mirror Clone：

```bash
git clone --mirror <repo-url> repo-backup.git
```

它包含大量引用，适合受控备份，也意味着它完整保留敏感历史。不要把这个目录随意上传或共享。

对于只需保留当前文件快照的场景，还可以导出普通目录备份，不包含 `.git`。

## 场景一：只修正最后一个未共享提交

当前配置已正确时：

```bash
git commit --amend --reset-author --no-edit
```

检查：

```bash
git show --no-patch --format=fuller HEAD
```

这会创建新 Commit。若尚未 Push，无需远端强推。

如果已 Push 到个人分支且无人依赖：

```bash
git push --force-with-lease
```

仍应确认平台上的旧 Commit 是否由其他引用保留。

## 场景二：少量未共享提交

```bash
git rebase -i <base>
```

把目标提交改为：

```text
edit <commit> message
```

暂停后修正：

```bash
git commit --amend --reset-author --no-edit
git rebase --continue
```

每个被改写提交之后的 Commit 都会因为 Parent 变化而得到新 ID。

## 场景三：批量重写邮箱或文件历史

现代 Git 历史过滤通常优先使用 `git filter-repo`，而不是旧的 `filter-branch`。

它不是 Git 所有安装都自带的核心子命令，需要单独安装。先：

```bash
git filter-repo --version
```

建议在全新 Mirror Clone 上操作：

```bash
git clone --mirror <repo-url> rewrite.git
cd rewrite.git
```

这样：

- 工作区状态不会混入；
- 所有常规引用更容易统一处理；
- 原本地仓库仍可用于对照；
- 工具通常更容易判断这是新 Clone。

### 删除一个敏感文件的全部历史

```bash
git filter-repo \
  --path path/to/secret.env \
  --invert-paths
```

这会重写包含该路径的相关提交。

如果文件历史中改过名字，需要列出所有旧路径，或先分析重命名。

### 替换文本

准备受控替换规则文件，例如：

```text
literal:old-secret==>REMOVED
```

执行：

```bash
git filter-repo --replace-text replacements.txt
```

替换后必须再次扫描。编码、压缩、拆分字符串和二进制内容可能逃过简单文本替换。

### 修改邮箱映射

可以使用 Mailmap 或 Filter-repo 的 Mailmap 能力进行身份映射，具体命令应按当前版本文档执行。映射文件概念：

```text
DaleYang <noreply-address> <old-company-address>
```

注意 `.mailmap` 仅用于显示规范化时，不一定改写底层 Commit；历史清理必须确认工具实际重写了对象，而不是只改变 `git log` 展示。

## 场景四：保留当前文件，清空全部历史

如果可以接受所有旧提交消失，最直接方案是创建 Orphan Branch：

```bash
git switch --orphan clean-main
git add -A
```

使用一次性身份提交，不必修改全局配置：

```bash
GIT_AUTHOR_NAME="DaleYang" \
GIT_AUTHOR_EMAIL="<noreply-email>" \
GIT_COMMITTER_NAME="DaleYang" \
GIT_COMMITTER_EMAIL="<noreply-email>" \
git commit -m "Initial public snapshot"
```

替换本地 main：

```bash
git branch -M main
```

远端更新前先确认：

```bash
git log --graph --oneline --decorate --all
git show --no-patch --format=fuller HEAD
git status --short
```

推送：

```bash
git push --force-with-lease origin main
```

旧远端分支和 Tag 也可能引用旧历史：

```bash
git ls-remote --heads origin
git ls-remote --tags origin
```

按计划删除不再需要的引用，而不是只处理 main。

## 为什么删除当前文件没有清除历史

假设：

```text
A：提交 secret.env
B：正常修改
C：删除 secret.env
```

当前 C 的工作区没有文件，但 A 的 Tree 仍引用秘密 Blob：

```text
C → B → A → secret Blob
```

Clone 完整仓库后仍能：

```bash
git show A:secret.env
```

只有重写 A 及其后代，或让整段历史从公开引用不可达，才能从常规历史中移除。

## 为什么 Force Push 后旧 Commit 可能还能访问

可能原因：

- 其他远端分支仍引用；
- Tag 仍引用；
- Pull Request 隐藏引用；
- Fork 仍引用；
- 平台 GC 尚未发生；
- Commit 页面缓存；
- 别人的 Clone；
- 搜索引擎缓存。

因此“远端 main 已看不到”只证明主引用更新成功，不证明全网绝对删除。

敏感度高时，应联系托管平台 Support，提供：

- 仓库；
- 受影响 Commit；
- 已完成的历史改写；
- 需要清理的缓存或 Pull Request 引用；
- 凭证已轮换证明。

具体支持范围取决于平台。

## 改写后怎样验证

### 检查引用

```bash
git show-ref
git branch --all
git tag --list
```

### 检查身份

```bash
git log --all \
  --format='%H%x09%an%x09%ae%x09%cn%x09%ce' |
grep -i '<sensitive-domain>'
```

预期无输出。

### 检查敏感文件路径

```bash
git log --all -- path/to/secret.env
```

### 检查对象可访问性

```bash
git cat-file -e <old-commit>^{commit}
```

在清理后的新 Clone 中应失败，前提是远端没有其他引用保留对象。

### 从远端全新 Clone 验证

不要只验证执行改写的本地仓库：

```bash
git clone <repo-url> verify-clone
cd verify-clone
git log --all --oneline
```

再运行身份、路径、密钥扫描。

这是最接近普通新访问者看到的状态。

## 本地旧仓库怎样同步

远端历史已协调重建后，旧 Clone 可以：

### 最干净：重新 Clone

备份未提交工作后删除旧 Clone，再重新获取。

### 保留目录：Fetch + Hard Reset

确认没有需要保留的本地修改：

```bash
git status --short
```

然后：

```bash
git fetch origin --prune
git reset --hard origin/main
```

旧本地分支、Tag 和 Reflog仍可能保留旧对象，应逐项处理。

### 清除本地不可达对象

只有在确认不再需要恢复旧历史后：

```bash
git reflog expire \
  --expire=now \
  --expire-unreachable=now \
  --all

git gc --prune=now
```

验证：

```bash
git fsck --unreachable --no-reflogs
git cat-file -e <old-commit>^{commit}
```

激进 GC 会破坏本地恢复线索。不要把它作为日常“清缓存”命令。

## 协作者如何迁移

历史改写前通知：

- 影响哪些分支和 Tag；
- 冻结 Push 的时间窗口；
- 新旧基线 Commit；
- 未合并工作如何迁移；
- 截止时间；
- 谁负责验证。

协作者若有功能分支：

```text
旧主干：A ← B ← C
                 ↖ X ← Y

新主干：A' ← B' ← C'
```

可以把 X、Y 重放到新主干：

```bash
git fetch origin
git rebase --onto origin/main <old-base-C> feature
```

复杂分支可能更适合：

1. 新建基于新 main 的分支；
2. Cherry-pick 自己的业务提交；
3. 完整测试；
4. 推送新分支。

不要直接把旧分支 Merge 回新主干，否则可能重新引入已清理的旧历史。

## 分支保护与自动化

Force Push 可能被分支保护拒绝。历史清理前需要：

- 获得仓库管理员批准；
- 临时调整保护规则；
- 暂停自动部署；
- 停止 Bot 自动提交；
- 完成后恢复规则；
- 验证 GitHub Pages、Release 和 Actions。

历史重写会使基于 Commit ID 的：

- CI 缓存；
- 部署记录；
- Issue 链接；
- Review 评论；
- Release 资产关联；

可能失效或指向旧对象。

## `filter-branch` 为什么不再优先

旧教程常见：

```bash
git filter-branch ...
```

它：

- 容易留下备份引用；
- 性能较差；
- 复杂边界容易出错；
- 官方长期警告其风险。

现代场景通常优先：

- `git filter-repo`；
- BFG Repo-Cleaner，适合部分大文件/秘密场景；
- Orphan Branch，适合完全清空历史。

选择工具前先明确目标，不要盲目复制一条删除命令。

## 历史清理完成标准

- [ ] 泄露凭证已吊销和轮换；
- [ ] 所有公开 Branch 已检查；
- [ ] 所有 Tag 已检查；
- [ ] 旧敏感 Commit 不在新 Clone 可达历史；
- [ ] 文件正文和 Commit 元数据重新扫描；
- [ ] CI、Pages、Release 正常；
- [ ] 分支保护已恢复；
- [ ] 协作者已迁移；
- [ ] 必要时已联系平台清缓存；
- [ ] 受控备份有明确销毁计划。

最重要的边界是：

> Git 可以让敏感对象不再从官方引用可达，但无法远程删除所有已经分发出去的副本。

因此真正的安全处置始终是“凭证失效 + 历史清理 + 暴露调查 + 流程预防”的组合。
