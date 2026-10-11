# 怎样保持一个 Git 仓库长期干净？

仓库卫生不是“文件排列整齐”，而是让版本库长期保持：

- Clone 体积可控；
- Diff 可读；
- 构建可重复；
- 本地环境不泄露；
- 二进制和生成物边界清晰；
- 不同操作系统协作稳定；
- 敏感信息不进入历史。

一个仓库刚创建时问题很少，几年后常见负担来自：

- `node_modules`、构建目录进入历史；
- 大型二进制反复更新；
- CRLF/LF 导致全文件变化；
- `.env`、证书、密钥误提交；
- IDE 和系统文件污染；
- 生成代码和源代码混在一起；
- 依赖锁文件策略不一致；
- 历史中删除的大文件仍占空间。

## `.gitignore`：只控制未跟踪路径

示例：

```gitignore
# dependencies
node_modules/

# build output
dist/
build/

# local environment
.env
.env.local

# IDE and OS
.idea/
.vscode/
.DS_Store

# logs
*.log
```

检查某路径为什么被忽略：

```bash
git check-ignore -v path/to/file
```

列出被忽略文件：

```bash
git status --ignored --short
```

规则来源可能包括：

- 仓库 `.gitignore`；
- 子目录 `.gitignore`；
- `.git/info/exclude`；
- 用户全局 excludesfile。

只适用于当前仓库但不应提交的个人规则，放：

```text
.git/info/exclude
```

不要把个人 IDE 偏好强加给整个团队，除非团队明确共享配置。

## 已跟踪文件不会因 `.gitignore` 自动消失

如果 `.env` 已被跟踪，再添加规则仍会继续出现在修改列表。

停止未来跟踪但保留本地文件：

```bash
git rm --cached .env
git commit -m "chore: stop tracking local environment"
```

目录：

```bash
git rm -r --cached dist/
```

这只影响新提交。旧历史仍包含文件内容。

如果里面有凭证：

1. 立即吊销和轮换；
2. 调查暴露范围；
3. 再决定是否改写历史。

不要先花几小时清 Git 历史，却让旧密钥仍然有效。

## Ignore 规则的匹配

```gitignore
*.log          # 任意层级的 .log
/build/        # 只匹配仓库根 build
build/         # 可匹配任意层级 build 目录
temp/*         # temp 直接子项
!temp/keep.md  # 尝试重新包含
```

重新包含有一个常见陷阱：如果父目录本身已经被完整排除，Git 可能不会继续遍历其子项。需要逐层放开：

```gitignore
temp/*
!temp/docs/
temp/docs/*
!temp/docs/keep.md
```

规则越复杂，越应使用 `git check-ignore -v` 验证，不要凭猜测。

## `.gitattributes`：声明内容怎样被 Git 处理

`.gitignore` 决定是否跟踪，`.gitattributes` 决定已跟踪内容的属性。

示例：

```gitattributes
* text=auto
*.sh text eol=lf
*.bat text eol=crlf
*.png binary
*.jpg binary
*.pdf binary
```

常见用途：

- 统一换行；
- 标记二进制；
- 指定 Diff Driver；
- 指定 Merge Driver；
- Git LFS 跟踪；
- 控制 `git archive` 导出。

查看：

```bash
git check-attr -a -- path/to/file
```

## 换行为什么会制造全文件 Diff

Unix 常用 LF：

```text
\n
```

Windows 常用 CRLF：

```text
\r\n
```

如果工具把整文件从 LF 改为 CRLF，Git 可能显示每一行都变化，淹没真实修改。

仓库可以明确：

```gitattributes
* text=auto
*.sh text eol=lf
*.bat text eol=crlf
```

新增规则后规范化：

```bash
git add --renormalize .
git diff --staged
```

这可能产生大范围变化，应单独提交，并与团队协调，避免和功能修改混在一起。

不要在不了解公司仓库规范时随意修改全局 `core.autocrlf`。仓库级 `.gitattributes` 更容易共享和审查。

## 二进制文件为什么不适合普通 Git Diff

源码变化通常可按行压缩和合并；压缩包、图片、视频、数据库文件常表现为整体变化。

问题：

- Diff 不可读；
- 每个版本可能占大量空间；
- 无法可靠三方合并；
- Clone 会下载整个可达历史；
- 删除当前文件不减少旧历史体积。

先问：

1. 它是源资产还是生成物？
2. 能否从源码和构建过程重新生成？
3. 是否需要历史版本？
4. 是否应该放制品仓库或对象存储？
5. 是否适合 Git LFS？

通常：

```text
源代码、配置、迁移脚本 → Git
构建产物、APK、ZIP、日志 → Release/制品系统
大型设计资产 → Git LFS 或专用资产系统
数据库备份 → 备份系统，不进 Git
```

## Git LFS 的工作方式

Git LFS 在普通 Git 历史中保存一个小指针：

```text
version https://git-lfs.github.com/spec/v1
oid sha256:...
size 123456789
```

真实大文件保存在 LFS 服务。

配置：

```bash
git lfs install
git lfs track "*.psd"
git add .gitattributes
```

注意：

- 团队所有环境需要 LFS 支持；
- 托管平台可能有流量和存储额度；
- 把已有历史迁移到 LFS 会改写历史；
- LFS 不适合秘密文件；
- 删除 LFS 指针不一定立即删除服务器对象。

## 生成物是否提交

默认不提交能稳定生成的构建产物：

```text
dist/
coverage/
target/
build/
*.class
*.o
```

但某些场景需要提交生成物：

- 代码生成结果参与下游编译；
- 文档站托管要求；
- 供应商代码；
- 发布流程无法现场生成。

若必须提交：

- 生成命令固定；
- 生成器版本锁定；
- 生成物与源变更一起 Review；
- CI 验证重新生成后无 Diff；
- 尽量放独立目录；
- 避免手工编辑。

## 依赖锁文件

锁文件是否提交取决于生态与项目类型，但应用项目通常需要可重复依赖解析。

常见：

```text
package-lock.json
pnpm-lock.yaml
yarn.lock
Cargo.lock
poetry.lock
go.sum
```

原则：

- 团队只使用一种包管理器；
- 不随意删除并重建锁文件；
- 依赖升级单独提交；
- Review 实际版本变化；
- CI 使用锁定安装模式。

锁文件冲突不要简单全选一侧。通常应先合并声明文件，再用指定包管理器重新生成并验证。

## 可执行位与文件模式

Git 跟踪普通文件的可执行位。

查看：

```bash
git diff --summary
```

可能看到：

```text
mode change 100644 => 100755 scripts/build.sh
```

如果操作系统或文件系统导致无意义模式变化，应先调查，不要全局关闭检查来掩盖真实问题。

正确设置：

```bash
chmod +x scripts/build.sh
git add scripts/build.sh
```

## 符号链接与跨平台

Git 可以把符号链接目标作为特殊 Blob 跟踪。不同操作系统、权限和 Git 配置对检出支持不同。

使用前确认：

- Windows 开发环境是否能创建；
- CI 是否保留；
- 打包工具如何处理；
- 链接是否逃出仓库；
- 安全扫描是否跟随。

跨平台项目若不需要符号链接，普通脚本或构建配置可能更稳定。

## 仓库大小从哪里来

当前工作区大小不是仓库历史大小。

检查：

```bash
du -sh .git
git count-objects -vH
```

列出 Pack 中大对象需要更复杂的对象分析。基本思路：

```bash
git verify-pack -v .git/objects/pack/*.idx
```

结合：

```bash
git rev-list --objects --all
```

把对象 ID 映射回历史路径。

大型仓库优先使用成熟工具分析，例如：

- `git filter-repo --analyze`；
- 平台仓库分析功能；
- 专门的大对象报告脚本。

不要直接删除 `.git/objects` 下文件。

## 提交前检查

最小人工检查：

```bash
git status --short
git diff
git diff --staged
git diff --staged --check
```

`--check` 可以发现：

- 行尾空白；
- 空白错误；
- 冲突标记问题。

自动化可以加入：

- Formatter；
- Linter；
- Unit Test；
- Secret Scanner；
- 大文件阈值；
- 文件名规则；
- License 检查。

但 Hook 不是绝对安全边界：

- 可以被跳过；
- 新环境可能未安装；
- 恶意提交者可以绕过。

关键规则还应在 CI 和服务端保护。

## Secret Scanner 的边界

扫描器能发现：

- 已知 Token 格式；
- 私钥 Header；
- 高熵字符串；
- 常见配置字段。

但会有：

- 误报；
- 漏报；
- 测试样例与真实凭证难区分；
- 自定义内部密钥格式未知。

因此还需要：

- Secret Manager；
- 短期凭证；
- 最小权限；
- 自动轮换；
- 环境变量或受控文件注入；
- 日志脱敏。

## 仓库根目录建议

不是所有项目都必须相同，但通常应能快速找到：

```text
README.md
LICENSE
.gitignore
.gitattributes
CONTRIBUTING.md
SECURITY.md
src/
tests/
docs/
scripts/
```

README 至少说明：

- 项目是什么；
- 如何安装；
- 如何运行；
- 如何测试；
- 关键目录；
- 配置从哪里来；
- 如何贡献。

不要把长期有效知识只放在某个人的本机脚本或聊天记录中。

## 定期维护

Git 通常会自动运行维护。可以观察：

```bash
git count-objects -vH
git fsck
```

大型活跃仓库可使用：

```bash
git maintenance start
```

具体能力取决于 Git 版本。

手动：

```bash
git gc
```

会整理对象并按策略清理。不要在刚发生误删、还想依赖 Reflog 恢复时急着执行激进 Prune。

## 一份仓库卫生清单

### 路径边界

- [ ] 依赖目录不进入 Git；
- [ ] 构建产物有明确去处；
- [ ] 本地配置与模板分离；
- [ ] IDE/OS 文件被正确排除。

### 文本一致性

- [ ] `.gitattributes` 明确换行策略；
- [ ] 格式化独立于功能变更；
- [ ] 二进制文件已标记或迁移。

### 依赖与构建

- [ ] 锁文件策略一致；
- [ ] 构建命令可重复；
- [ ] 生成物能由 CI 验证。

### 安全

- [ ] 私钥和 Token 不进入仓库；
- [ ] Secret Scan 在 CI 运行；
- [ ] 泄露凭证有轮换流程；
- [ ] 提交身份与隐私策略明确。

### 历史

- [ ] 大文件没有反复进入历史；
- [ ] 分支和 Tag 定期清理；
- [ ] 历史改写有团队流程；
- [ ] Reflog 不被当成备份。

仓库卫生的核心不是追求零文件或零历史，而是让每一种内容出现在正确的系统、以正确的生命周期被管理。
