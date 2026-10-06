# 文档站传播与效果跟踪手册

前三轮已在本地改进文档、静态资产和回归测试，没有部署、发帖、接入统计服务或修改账号。公共文档在 `site-docs/`；这份维护手册不进入站点 sitemap。

## 1. 先验证，再发布

本地执行：

```bash
npm run docs:test
# Rust/Tauri 构建依赖需已缓存，只运行两个公开合成样本测试
npm run docs:test:adapters
SITE_URL=https://docs.example.test npm run docs:build
# 最后恢复生产默认产物，不留下预览域名
unset SITE_URL
npm run docs:build
git diff --check
```

命令测试需要 `jq` 和 `sqlite3`，CI 的独立 docs job 安装它们；使用项目支持的最新 Node 22。`docs:test:adapters` 是独立的 `cargo test --lib --locked --offline docs_public_fixture`，需要相应平台的 Rust/Tauri 构建条件。依赖未缓存时失败而非联网下载；只解析公开样本，Codex 用空标题索引，不扫描真实home或执行CLI／工具／服务商请求。已有 Rust CI 的完整测试包含这两个用例，Node docs job 不依赖 Rust。

区分命令抽取、真实适配器离线解析与真实CLI端到端三层证据。解析回归核对角色、消息顺序、Claude thinking、工具参数/ID/结果及输入不变，不认证图片、GUI、搜索、导出、恢复或每个CLI版本。构建检查各级面包屑真实URL/语言/名称/顺序与实际正文路径的常见 robots 规则，不验证 CDN/WAF、所有爬虫语法或真实抓取。合法静态内容也不代表必然收录。

部署后，用正常可访问的网络检查：

- `/`、`/zh/`、`/ja/` 以及 privacy、troubleshooting、compatibility、about、Claude/Codex 任务指南、skills/MCP 指南的三语页正常打开。
- `/examples/` 下的八份 JSONL、opencode.sql、expected.json 和 adapter-expected.json（11 文件）可下载，内容与本地测试样本一致；全部为合成数据，不是完整可导入／恢复会话。
- 三语首页title/OG带有 Sessions Viewer，各级面包屑指向真实同语言页面；feature页不引用不存在的 `/features/` 总览。
- 优先截图 `project-editor.png` 与源文件字节一致。第三轮基线：659,076字节，1360×850，RGBA像素指纹 `6046cea09f6b672154c9b13a54ff6d61859e48d089c7af2d4c6d19f92c8830ee`，sRGB/EXIF保留；Node测试独立解码核验并设700,000字节预算。新截图应有意更新像素基线，不直接删断言。需在真实访问条件下另测移动端LCP／Core Web Vitals；压缩率不是性能测量。
- `/robots.txt`、`/sitemap.xml` 返回正确内容；正文页为 200，真正不存在的 URL 为 404，不是所有地址都返回首页。
- 不带 `.html` 的规范 URL、HTTP → HTTPS、旧地址重定向一致，canonical 不指向预览域名。
- 用 Search Console URL 检查确认代表页可抓取，正文不是验证码或登录页；查看渲染结果。
- 用 Google Rich Results Test / Schema Markup Validator 检查适用标记。合法 schema 不等于一定有富结果；不补造评分、评价或作者身份。
- 检查 CDN/WAF 是否误挡 Googlebot、Bingbot、OAI-SearchBot；核对官方爬虫 IP 或验证办法，不只信任 user-agent 字符串。

本机探测公开域名时 HTTPS 有 LibreSSL TLS 错误，HTTP 返回代理 502，尚未核实线上状态。这不是网站源站故障的结论。Vercel／防火墙设置和真实收录需在发布环境验证。

## 2. 传播草稿（部署后再用）

### GitHub release / discussion

> Updated the Sessions Viewer docs with a seven-agent comparison of transcript locations, formats and resume commands. Each reference includes read-only jq/SQLite examples and links to the adapter implementation. There is also a missing-session checklist and a clearer explanation of local history versus online chat.
>
> Comparison: https://sessions-viewer.js-bridge.com/agents/
> Missing sessions: https://sessions-viewer.js-bridge.com/guide/troubleshooting
> Privacy: https://sessions-viewer.js-bridge.com/guide/privacy
>
> Command examples are tested on synthetic data, not a guarantee for every CLI release. Feedback on changed record formats is welcome; please use redacted or synthetic examples.

### X 中文草稿

> Claude Code、Codex、Pi 的会话记录在哪？整理了七种 coding agent 的路径、格式和恢复命令，附 jq/SQLite 示例。不装应用也能查；找不到记录还有排障清单。
> https://sessions-viewer.js-bridge.com/zh/agents/

### X 英文草稿

> Where do coding agents save sessions? A seven-agent reference for paths, formats and resume commands, with jq/SQLite examples you can use without the app.
> https://sessions-viewer.js-bridge.com/agents/

### 社区分享草稿

> 我维护 Sessions Viewer，整理这份指南时修正了几个常见误区：Codex 项目路径在 session_meta.payload.cwd；Pi 的消息嵌在 message.content；不是所有 agent 都支持应用内续聊。文档给了命令、实现依据和限制，希望能帮到手动查记录的人。
>
> 路径与恢复对照：https://sessions-viewer.js-bridge.com/zh/agents/
> 排障：https://sessions-viewer.js-bridge.com/zh/guide/troubleshooting
>
> 如果格式已经变化，欢迎带 CLI 版本与最小脱敏／合成样本反馈。不要贴完整私人会话或认证文件。

发布清单：用户确认账号和文案 → 确认链接已上线 → 选择允许自荐的相关社区并披露维护者身份 → 逐条回答真实问题 → 根据反馈更新参考页。不要批量刷帖、买引用或伪装独立用户评价。

## 3. 搜索效果：每周只看三件事

1. **是否收录：**Search Console 看 sitemap 状态与页面索引问题。已有 HTML 验证标记不代表本次已进入账号确认；不要删除它。Bing Webmaster Tools 可在账号验证后提交相同 sitemap。
2. **哪些问题带来访问：**看展示、点击、点击率，区分品牌词 `Sessions Viewer` 和非品牌问题词（例如 `claude code history location`）。按页面、语言、国家和设备查看，避免把不同群体的波动混在一起。
3. **是否有人想下载：**观察从内容页到下载链接的点击。点击不等于完成下载，更不等于安装或活跃用户。

先记录发布前基线；每周留一行，相同窗口比较，低流量站优先按月看趋势。不要因为某天没有点击就重写全站，也不要把发布时间前后的变化都归功于 GEO。

| 周期 | 新页收录情况 | 非品牌展示／点击 | 带来访问的问题 | 下载点击（若有采集） | 下一项改进 |
| --- | --- | --- | --- | --- | --- |
| 上线前基线 | 待填写 | 待填写 | 待填写 | 未采集 | — |
| 上线后第 1 周 | 待填写 | 待填写 | 待填写 | 待填写 | — |

## 4. AI 来源和下载点击：先选隐私方案

本轮不新增 analytics SDK、cookie 或第三方请求。若需要统计，先由用户决定现有平台日志／隐私友好分析工具／自建采集哪种可用，确认权限、数据保留与同意要求后再接入。

建议只收集：

| 指标 | 最小字段 | 注意事项 |
| --- | --- | --- |
| 内容访问 | 页面规范路径、语言、时间段、来源主机 | 不采集完整查询字符串、私人文件路径或会话内容 |
| `download_click` | 来源页面路径、语言、目标主机／路径 | 记录真实点击，不伪装已完成下载 |
| AI 推荐访问 | 来源主机及明确存在的来源参数 | ChatGPT、Perplexity 等可能缺失 referrer，不能把空来源都算 AI |

能否拿到源信息取决于浏览器、隐私策略及平台。GitHub release 的下载数量可作总量参考，但不能直接归因到某篇文档。Search Console 的普通搜索表现也不能直接当成所有 AI 平台的引用数据。

## 5. AI 引用抽样：看趋势，不做排名承诺

上线后每两周用一组固定问题抽样，使用正常用户会话。记录服务名、模型／模式、语言、是否开启联网、日期、回答是否正确、引用的完整 URL。记录所有抽样结果，不只展示命中的例子。

| 问题 | 语言 | 希望相关的本站页 |
| --- | --- | --- |
| Where does Claude Code save session history? | 英文 | `/agents/claude-code` |
| How can I find which project a Codex rollout belongs to? | 英文 | `/agents/codex` |
| Pi 的会话记录在哪里，怎么恢复？ | 中文 | `/zh/agents/pi` |
| Claude Code、Codex、opencode 的记录格式有什么区别？ | 中文 | `/zh/agents/` |
| 有没有能搜索多个 coding agent 本地记录的桌面工具？ | 中文 | `/zh/` |
| コーディングエージェントの履歴が見つからない場合は？ | 日文 | `/ja/guide/troubleshooting` |
| Is Sessions Viewer completely offline? | 英文 | `/guide/privacy`（答案必须说明网络边界） |
| Is there a desktop tool to search and resume Claude Code history? | 英文 | `/guide/claude-code-session-viewer` |
| 怎么找回 Codex 会话并导出给同事？ | 中文 | `/zh/guide/codex-session-viewer` |
| How can I share a skill between agents and repair a broken link? | 英文 | `/tools/share-skills` |
| MCP 設定はどのエージェントに読み込まれていますか？ | 日文 | `/ja/tools/check-mcp` |
| Does ⌘E open an export-format picker? | 英文 | `/features/export-and-trash`（直接Markdown；其他格式走菜单） |
| 导出的 HTML 能保证所有图片完全离线吗？ | 中文 | `/zh/features/export-and-trash#offline-images`（外链／不可读本地图片例外） |
| シェルタブは再起動前のプロセスを復元しますか？ | 日文 | `/ja/features/resume`（メタデータと新規シェル） |
| Do the synthetic parser tests certify a Codex CLI release? | 英文 | `/guide/compatibility#offline-parser-tests`（否；区分解析与端到端） |

回答正确但没引用本站，和引用本站但说错事实，是两种不同结果。样本会受检索、模型版本、上下文与地域影响，不能视为稳定排名或可靠市场份额，也不要承诺“优化后一定被推荐”。

## 6. 后续内容怎么选

优先处理 Search Console 有展示但答案不完整的页、issue 里的重复问题和真实格式变更。一篇文章解决一个完整任务；优先完善已有恢复／导出页，不为同义词重复建页。变更后同步三语、更新核对日期与依据，再运行命令测试和构建。

不优先做：批量 AI 生成薄内容、meta keywords 堆词、与可见内容不一致的 schema、伪造评论、`llms.txt` 排名承诺。

## 7. 发布后可选：IndexNow 更新通知

**当前没有托管 key、没有发通知、没有部署。** 此功能不保证收录，不是 ChatGPT 的直接提交入口。采用 [IndexNow 官方协议](https://www.indexnow.org/documentation)，只有用户选择在真实发布后通知时才运行。

### 第一步：记录两个真实发布版本

从发布平台确认上一次和新一次生产部署的 Git commit。不要把尚未发布的分支 HEAD 当作生产，也不要用任意日期或当前工作区作为基线。

```bash
npm run docs:indexnow -- --from PREVIOUS_PUBLISHED_SHA --to NEW_PUBLISHED_SHA
```

默认 dry-run **零 HTTP 请求、零 Git 写入**。必须传两个已提交 ref，输出完整 SHA、生产 URL、删除项与候选原因；未提交／仅暂存文件不进入清单。本轮工作区无法因此被当作已经发布。

候选规则：修改的正文页；引用变动共享片段／静态资产的正文；受配置、主题、robots 等共享项影响的正文；应用版本变化时的三个首页。脚本与 CI 自身的变动不会自动通报全站。配置依赖是保守推导，可能多报；清单不是渲染后字节比较，也不证明部署或内容一致。

### 第二步：用户自行托管公开验证文件

选择 8–128 位字母、数字或连字符的公开验证 key，文件使用 UTF-8、正文只有 key。把 `<key>.txt` 放在生产站点根目录并发布。**它是公开站点所有权证明，不是服务商 API 密钥。不要复用私人凭据。** 本脚本不生成、不写入、不提交 key 文件。

提交环境使用 `INDEXNOW_KEY`；默认文件地址为 `https://sessions-viewer.js-bridge.com/<key>.txt`。如文件名不同，可用 `INDEXNOW_KEY_LOCATION` 指向生产根目录另一份 `.txt`。为覆盖三语路径，脚本只接受根目录、HTTPS、同域、无凭据／查询参数／fragment 的证明文件。

### 第三步：核对线上内容后，明确选择提交

在正常可访问的网络核对清单里的新内容确实已发布、canonical 正确；删除项为真实 404／410，证明文件返回 200 且正文匹配。HEAD 只能证明 HTTP 可用，无法确认页面包含新版本的正文或判断软 404。

```bash
# 先在自己的环境设置公开证明，不要放入私人 API key
export INDEXNOW_KEY='YOUR-PUBLIC-INDEXNOW-KEY'
npm run docs:indexnow -- --from PREVIOUS_PUBLISHED_SHA --to NEW_PUBLISHED_SHA --submit --published
```

`--published` 是人工确认，不是脚本替你检测发布平台。缺少任意提交开关、错误／缺失 key、预览 `SITE_URL`、非生产 URL、查询参数、重复 URL或超过 10,000 条都会停止。提交前 GET 验证文件，再 HEAD 每个页面；现存页要求 200 HTML，删除页要求 404／410。所有请求拒绝重定向、设超时且不携带认证凭据，验证失败不会 POST。

若有 301／302 迁移，脚本会停止：先核查旧路径、新 canonical 和发布状态，不加“跳过校验”开关强行发送。只在核查后选择适当的提交方式。

### 第四步：记录结果，不把接收当收录

- 200：通知请求接收成功，不保证收录。
- 202：已接收但 IndexNow key 验证仍待处理。
- 其他 HTTP／TLS／网络错误：运行失败，不标为已发送；没有自动重试或回退，修复后人工处理。

保存两个 SHA、URL 清单、时间和响应状态到自己的发布记录。用 Search Console、Bing Webmaster、实际爬虫请求及后续查询观察结果。Bing 的 AI Performance 只覆盖其说明的 Microsoft／合作渠道，不等于全体 ChatGPT 引用。普通 `docs:build`、docs CI 和回归测试不会真实通知任何平台，测试全部使用合成响应。

## 8. 爬虫可访问性和 AI 来源复核

发布平台允许查看日志后，可按时间窗口记录目标路径、状态码与已验证爬虫身份，区分 200、301、404、403、429、5xx。不要只凭 user-agent 放开防火墙；日志可能含 IP 和查询参数，应由用户决定权限、最小采集与保留周期。

ChatGPT 的 `utm_source=chatgpt.com` 和有效 referrer 可作为来源线索，缺失不代表没有 AI 访问。引用抽样、推荐点击、下载点击和安装是不同指标。未新增 SDK、cookie 或账号接入；上线与真实引用仍需要人工核查。

官方参考入口：

- [Google：AI 搜索功能与网站](https://developers.google.com/search/docs/appearance/ai-features)——正常 SEO 基础仍适用，不要求特殊 AI schema。
- [Google：AI 内容与搜索](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)——工具本身不是质量保证，批量低价值内容存在风险。
- [OpenAI：爬虫说明](https://developers.openai.com/api/docs/bots)——OAI-SearchBot 搜索抓取与 GPTBot 训练抓取独立。机器人策略需用户决定；本轮保持已有 robots 不变。
- [OpenAI：发布者与开发者 FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)——可访问性与 ChatGPT 来源线索。
- [IndexNow：协议](https://www.indexnow.org/documentation)与 [FAQ](https://www.indexnow.org/faq)——所有权证明、更新通知与返回码，不是保证收录。
