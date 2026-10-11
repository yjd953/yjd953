# Git 提交身份、邮箱与签名是怎样工作的？

Git 提交天然包含身份元数据。公开仓库中的 Commit 不仅能展示代码变化，还可能展示：

- 姓名或昵称；
- 邮箱；
- Author 时间与时区；
- Committer；
- GPG/SSH 签名状态；
- 与托管平台账号的关联。

这不是 GitHub 页面额外猜出来的，而是 Commit 对象本身的一部分。

## Author 与 Committer

查看：

```bash
git show --no-patch --format=fuller HEAD
```

示例：

```text
Author:     DaleYang <128274172+yjd953@users.noreply.github.com>
AuthorDate: ...
Commit:     DaleYang <128274172+yjd953@users.noreply.github.com>
CommitDate: ...
```

Author 表示：

> 原始变更由谁创作。

Committer 表示：

> 当前 Commit 对象由谁创建或最终应用。

普通本地提交两者通常相同。

以下场景可能不同：

- 应用别人通过邮件发送的 Patch；
- Cherry-pick；
- Rebase；
- 网页平台创建合并提交；
- 自动化 Bot 提交；
- 维护者代为提交贡献。

隐私审计必须同时检查两组邮箱。

## 身份值从哪里来

Git 读取配置层级：

```text
系统级 system
全局级 global
仓库级 local
Worktree 级 worktree
命令/环境变量临时覆盖
```

查看来源：

```bash
git config --show-origin --get-regexp '^user\.'
```

查看最终值：

```bash
git config user.name
git config user.email
```

全局配置常位于：

```text
~/.gitconfig
```

仓库级配置位于：

```text
.git/config
```

仓库级值通常覆盖全局值：

```bash
git config --local user.name "DaleYang"
git config --local user.email "128274172+yjd953@users.noreply.github.com"
```

这允许：

- 公司仓库使用公司身份；
- 公开个人仓库使用 Noreply；
- 不必修改全局身份影响所有项目。

在共享机器上仍应注意文件权限和凭证隔离。

## 临时指定身份而不改配置

只影响一次提交：

```bash
git \
  -c user.name="DaleYang" \
  -c user.email="128274172+yjd953@users.noreply.github.com" \
  commit -m "docs: update notes"
```

或者环境变量：

```bash
GIT_AUTHOR_NAME="DaleYang" \
GIT_AUTHOR_EMAIL="128274172+yjd953@users.noreply.github.com" \
GIT_COMMITTER_NAME="DaleYang" \
GIT_COMMITTER_EMAIL="128274172+yjd953@users.noreply.github.com" \
git commit -m "Initial public snapshot"
```

环境变量可以分别覆盖 Author 和 Committer，适合受控脚本和一次性历史重建。

不要把真实邮箱或 Token 写入会提交的脚本。

## GitHub Noreply 邮箱

GitHub 提供类似：

```text
128274172+yjd953@users.noreply.github.com
```

或旧式：

```text
yjd953@users.noreply.github.com
```

它不是匿名身份，只是避免公开真实联系邮箱。用户名和账号 ID 仍然公开。

平台可通过 Noreply 邮箱把 Commit 关联到账号。

需要在 GitHub 邮箱设置中：

- 启用 Keep my email addresses private；
- 可选启用 Block command line pushes that expose my email。

第二项能阻止部分包含受保护邮箱的新 Push，但不是万能扫描器：

- 已有历史仍存在；
- 其他邮箱可能未登记；
- 文件正文中的邮箱不一定受此规则保护；
- 其他托管平台规则不同。

## 邮箱为什么出现在公开 Commit 中

Commit 对象内容包含：

```text
author Name <email> timestamp timezone
committer Name <email> timestamp timezone
```

查看原始对象：

```bash
git cat-file -p HEAD
```

只要公开引用能到达这个 Commit，任何能 Clone 仓库的人都可以读取邮箱：

```bash
git log --all --format='%H %an <%ae> %cn <%ce>'
```

隐藏 GitHub Profile 的公开邮箱字段，不会修改已有 Commit。

删除 README 中的邮箱，也不会修改 Commit 元数据。

## 托管平台如何关联账号

平台通常根据经过验证的邮箱识别贡献者。若 Commit 邮箱属于某账号：

- 页面可能显示头像和账号链接；
- Contribution Graph 可能计入；
- Verified 状态仍取决于签名；
- Author 和 Pusher 可能不同。

关联是平台层功能，不改变 Commit 对象。

如果从账号删除某个邮箱，历史 Commit 仍包含原邮箱文本，只是平台关联展示可能变化。

## 时区也是身份线索

Commit 保存时间戳和时区，例如：

```text
1791673200 +0800
```

公开历史可能反映：

- 常用工作时区；
- 活跃时间段；
- 工作节奏。

这通常不是高风险秘密，但属于公开画像的一部分。仅修改展示日期不能消除对象里的原始时间。

不要为了隐藏时区随意伪造企业审计历史。公开个人项目如果有严格匿名需求，应从项目开始前设计身份隔离，而不是事后零散修补。

## 提交签名证明什么

Git 可以用 GPG、SSH 或 X.509 对提交/标签签名，具体取决于版本和配置。

签名覆盖 Commit 对象内容，因此可以证明：

1. 签名私钥持有者签署了这个对象；
2. 对象签署后没有被修改。

签名不证明：

- 代码没有漏洞；
- Author 字段一定是真实人；
- 签名机器没有被入侵；
- Review 已发生；
- 构建制品来自该提交。

它是供应链证据的一环。

## 使用 SSH Key 签名的基本概念

现代 Git 可使用 SSH Key：

```bash
git config --local gpg.format ssh
git config --local user.signingkey ~/.ssh/id_ed25519.pub
git config --local commit.gpgsign true
```

具体配置应根据平台文档和公司规范完成。私钥路径、Agent、硬件密钥策略可能不同。

创建：

```bash
git commit -S -m "feat: signed change"
```

验证：

```bash
git show --show-signature HEAD
git verify-commit HEAD
```

验证者需要可信公钥映射。仅有签名但没有可信身份绑定，价值有限。

## GPG 签名

典型配置：

```bash
git config --local user.signingkey <key-id>
git config --local commit.gpgsign true
```

验证：

```bash
git verify-commit <commit>
git verify-tag <tag>
```

密钥管理要求：

- 私钥不进仓库；
- 设置合理保护；
- 备份和撤销证书；
- 离职或设备丢失后撤销；
- 定期轮换按组织策略执行。

## Signed-off-by 不是密码学签名

执行：

```bash
git commit -s
```

会在 Message 增加：

```text
Signed-off-by: Name <email>
```

它通常用于 Developer Certificate of Origin，表示提交者对贡献许可做声明。

它不是 GPG/SSH 数字签名，任何人都能写这行文本。两者不要混淆：

```text
Signed-off-by  法律/流程声明
Verified       密码学签名验证结果
```

## 检查公开历史中的身份

列出唯一身份：

```bash
git log --all --format='%an <%ae>%n%cn <%ce>' | sort -u
```

完整 Commit：

```bash
git log --all \
  --format='%H%x09%an%x09%ae%x09%cn%x09%ce%x09%s'
```

搜索公司域名：

```bash
git log --all \
  --format='%H %an <%ae> %cn <%ce> %s' |
grep -i '@company.example'
```

还要检查文件内容：

```bash
grep -RInE \
  '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' \
  . \
  --exclude-dir=.git
```

二者是不同泄露面：

- Commit 元数据；
- 文件正文与历史 Blob。

## 防止不同项目用错身份

最简单方案：公开仓库设置 Local Identity：

```bash
git config --local user.name "DaleYang"
git config --local user.email "128274172+yjd953@users.noreply.github.com"
```

公司仓库保留公司配置。

提交前检查：

```bash
git config --show-origin user.name
git config --show-origin user.email
```

提交后检查：

```bash
git show --no-patch --format=fuller HEAD
```

更大规模可使用条件配置：

```ini
[includeIf "gitdir:~/work/company/"]
    path = ~/.gitconfig-company

[includeIf "gitdir:~/work/public/"]
    path = ~/.gitconfig-public
```

这会影响本机配置体系，使用前应理解目录匹配规则并在自己的环境中验证。

## 已经提交错误邮箱怎么办

未 Push 的最后一次提交：

```bash
git commit --amend --reset-author
```

前提是当前配置已正确。

一段未共享历史：

```bash
git rebase -i <base>
```

在目标提交标记 `edit`，再：

```bash
git commit --amend --reset-author --no-edit
git rebase --continue
```

大量历史：

- 使用 `git filter-repo`；
- 或从当前快照创建全新根提交；
- 更新所有公开引用；
- 协调协作者重新同步。

已公开的邮箱不能保证从互联网绝对收回。外部 Clone、Fork、缓存和索引可能保留副本。

## 隐私与可追责的平衡

公开开源项目可以使用：

- 稳定昵称；
- Noreply 邮箱；
- 平台账号关联；
- 签名提交；
- Issue 作为联系入口。

企业内部仓库可能要求：

- 公司实名邮箱；
- SSO 关联；
- 签名；
- 审计保留；
- 禁止匿名提交。

两种场景目标不同。最稳妥的方式不是频繁修改全局身份，而是：

> 按仓库或目录明确配置身份，让公开隐私与内部审计各自满足要求。

## 提交前的身份检查清单

```bash
git rev-parse --show-toplevel
git config --show-origin user.name
git config --show-origin user.email
git status --short --branch
```

提交后：

```bash
git show --no-patch --format=fuller HEAD
git log -1 --show-signature
```

推送前：

```bash
git log origin/main..HEAD \
  --format='%H | %an <%ae> | %cn <%ce> | %s'
```

这几步能在错误身份进入公开远端之前发现问题。
