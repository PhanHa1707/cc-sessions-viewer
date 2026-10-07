---
title: 管理 skills、MCP 服务器和 hooks
description: 一个面板管理 Claude Code、Codex 等七种 coding agent 的 skills、MCP 服务器、hooks 和指令文件：找出重复的 skill 和死链，看 MCP 的上下文开销，试跑 hook，改动前先预览每一处文件修改。
image: /screenshots/tools-skills.png
---

# 管理 skills、MCP 服务器和 hooks

每个 agent CLI 都把自己的 skills、MCP 服务器、hooks 和指令文件存在磁盘的某个角落。装几个工具、换着用几个月，就没人说得清现在到底加载了什么。同一个 skill 在三个目录里各有一份，某条链接指向的东西早被删了，某个只配过一次的服务器还在你已经忘掉的那个 agent 里跑着。

工具管理面板把这些摊在一起，并且让你能动手收拾。入口在侧栏底部的扳手图标，或者按 `⌘K`。

具体操作可看[复用 skill 与修复链接](/zh/tools/share-skills)或[检查 MCP 配置及加载范围](/zh/tools/check-mcp)。

## 免费浏览器工具 {#browser-tools}

如果要检查记录用量而非 agent 配置，可以先试免费浏览器工具：

[Claude Code 成本计算器](/zh/tools/claude-code-cost-calculator) · [Claude Code Token 计数器](/zh/tools/claude-code-token-counter)

## Skills {#skills}

![Skills 面板，顶部的汇总条统计了重复、绕路和指向不存在位置的 skill](/screenshots/tools-skills.png)

顶上那一条是这台机器的体检结果。截图里是 45 个 skill，28 个重复，12 个绕路才能到，1 个指向不存在的地方。点任意一个数字就能把列表筛成只剩这一类。

选中一个 skill，右边把动手之前该知道的都摆出来：

- 启用于：哪几家 agent 真能看见它。在这儿直接开关。
- 内容：文件实际在哪。可能不止一份。
- 引用：所有指向它的链接，以及中间经过了什么。
- 风险点：从 skill 里扫出来的 shell 命令，可疑的会被标出来。代码块里当例子写的 `rm -rf` 比可执行脚本里同一行降一档，这样角标才还有意义。

排序支持时间倒序、时间正序、按名称，置顶的不受影响。

### 搬进主 store

![「搬进主 store」的预览，列出一次 move 和一次 link](/screenshots/tools-skills-adopt.png)

skill 散在各个目录里，是后面一堆麻烦的根源。这个操作把它归拢到你的主 store，原地留一条链接，所以什么都不会因此失效。

动手之前你先看到完整步骤。截图里是一次 `move` 加一次 `link`。不按按钮就一个字节都不写。顶上的「全部搬进主 store」是整批做。

### 修链接

![修链接的预览，链接被改写成直接指向真正存放文件的目录](/screenshots/tools-skills-repair.png)

绕路指的是一条链接指向了另一条链接。它平时能用，直到某天突然不能用，而那时候很难查出 skill 为什么消失了。

修复会让链接直接指向真正存放文件的目录。截图里 `~/.claude/skills/three` 原本要先经过 `~/.skills-manager` 才能到 `~/.cc-switch`，修完就是直达。

### 删除

![删除的预览，列出所有会被移除的引用和副本](/screenshots/tools-skills-delete.png)

死链就是这么来的：某个工具删掉了 skill 的目录，却把指向它的链接全留在原地。

这里的删除会先解掉每一条引用，再删掉每一份内容，并且开始之前把完整清单给你看。截图里这个 skill 一查发现同时住在三个 store 里。你也可以在「内容」列表里单独删掉其中一份，比如只删全局那份、保留项目那份。

## MCP 服务器 {#mcp}

![MCP 面板，列着每个服务器的上下文预算和它在哪几家 agent 里运行](/screenshots/tools-mcp.png)

七家 agent 的 MCP 服务器汇总成一个列表，不管原来写在 JSON 还是 TOML 里。

上下文预算从 Pi、Antigravity 本地缓存估算工具定义开销，约 4 字符算 1 Token，不启动服务器测量，也不是所选模型的精确分词。没有缓存是未测量，不是零。截图条目缓存有 29 个工具、约 5700 估算 Token。

「启用于」表示哪些 agent 配置为读取该项及来源文件，不证明实际已连接。「Grok Build · 兼容读取」表示 Grok 也可能读取 Claude 配置，编辑前要核对共享范围。

可以新增、编辑、删除、启停，或者把服务器同步给别家 agent，每一项都先给你看会改哪些文件。长得像 token 或密钥的值默认打码，要看才显示。

## 发现 skills {#discover}

![发现面板，显示 skills.sh 的一条搜索结果及其描述和文件清单](/screenshots/tools-discover.png)

搜 [skills.sh](https://www.skills.sh)，装之前先把 skill 看清楚：描述、文件清单、哪个 commit、在仓库里的哪个位置。

「复制并安装」会在旁边拉起一个终端，把命令打进去。你看着它跑，随时 `Ctrl-C` 停掉。它会停在安装器自己那句「装到哪几个 agent？」等你选，这一步应用不替你回答。

## Hooks {#hooks}

![Hooks 面板，把一个挂在多家 agent、多个事件上的脚本归并成一行](/screenshots/tools-hooks.png)

hooks 按命令归并，不按文件。截图里第一条是一个脚本挂在 4 家 agent 的 9 个事件上，显示成一行，而不是二十一行。

可以用真实 payload 试跑一个 hook，查看输出、退出码和耗时。这会实际执行配置命令，不是沙箱；可能写文件或联网，运行前先审查。可以整条删掉，也可以只删它挂在某一处的那个落点。本应用自己装的 hook 会被标出来并防误删。

## 全局配置

![全局配置面板，显示 CLAUDE.md、AGENTS.md 和它们 import 的文件](/screenshots/tools-memo.png)

这一节管的是 `CLAUDE.md`、`AGENTS.md`，以及它们 import 进来的一切。每个文件带一个状态：

- 回退：opencode 自己没有这个文件，于是读 Claude 的。改那个文件等于同时改了两家。
- 未创建：这家支持，只是你还没建。
- 片段：被别人用 `@import` 引进来的文件。
- 额外读取：不在约定路径上，但某家 agent 照样会加载的文件。

同名文件内容漂移了会被标出来，可以并排看差异，也可以一键以某一份为准同步过去。

## 配置集

顶栏归档图标可导出选定配置。MCP 环境变量和请求头只导出键名，识别为凭据形式的参数会脱敏；其他内容、路径或嵌入命令仍可能敏感，分享前检查。导入时勾选每条给哪些 agent。

## 应用前确认 {#两条始终成立的规则}

文件修改类管理操作会先展示计划供确认或取消，需核对路径和范围。运行安装器或 hook 是另一类真实执行，不是无害预览。

配置更新保留无关条目、备份原文件并拒绝过期内容写入。技能移动或删除可改变整个目录和链接，这些保护不等于通用撤销，也不保证所有现有内容都不受影响。
