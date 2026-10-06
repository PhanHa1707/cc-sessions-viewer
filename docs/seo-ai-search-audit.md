# Sessions Viewer 第二轮 SEO / AI 搜索审计

日期：2026-10-05。范围：现有工作区文档、生成 HTML、GitHub README 与公开搜索样本。审计阶段只分析，没有修改公共站点、应用代码、发布或账号配置。

## 后续实施状态（2026-10-05）

用户随后授权实施第二轮，已在本地落实 README／统计一致性、18 个三语任务／证据页面、公开合成样例，以及默认 dry-run 的 IndexNow 工具；实施计划见 `docs/plans/2026-10-05-docs-seo-round-2.md`，发布与监测步骤见 `docs/seo-ai-search-playbook.md`。下文保留审计时的观察和建议，不代表这些问题仍未修复。线上部署、托管 key、真实通知、爬虫访问、收录与 AI 引用仍未验证，外部账号和渠道没有操作。

## 第三轮增量实施状态（2026-10-06）

最新分析发现的本地缺陷已按 `docs/plans/2026-10-06-docs-seo-round-3.md` 修正：21 个 feature 页的虚构中间面包屑已移除；审计覆盖每级真实URL、语言、名称和顺序，robots 检查实际正文路径及常见最长规则／通配符。原 robots 策略未改，负向测试中的禁用规则不是当前生产故障证据。

三语导出说明明确快捷键直接 Markdown，远程／不可读图片不保证离线；Shell 重启恢复元数据并启动新进程，不恢复原命令。三语首页 title 加入 Sessions Viewer。

截图 `project-editor.png` 从 877,023 减至 659,076 字节（-24.85%），1360×850、RGBA像素、sRGB/EXIF相同；没有移动端LCP实测。新增公开 Claude/Codex 工具链合成样例和精确投影，两个隔离 Rust 解析／后处理测试实际通过，不读取真实标题索引、不扫描home或运行CLI。真实版本端到端验收仍未做，七行CLI版本保持原限制。

本地 94 项文档测试、默认与 `SITE_URL` 覆盖构建及 Rust clippy 通过。已有暂存内容和锁文件保留；没有发布、提交或外部通知。下文仍是第二轮历史审计，不是第三轮搜索结果；本次没有新的线上收录／引用证据。

## 结论

已有 VitePress 静态 HTML、canonical、hreflang、sitemap、JSON-LD 和允许抓取的 robots，继续堆标签不是第一优先级。新的重点是：上线并让检索服务看到最新版本、统一事实、覆盖“找工具”的意图、提供可验证的第一手资料、建立清楚的产品身份，并实际监测抓取与引用。

“AI 收录”要分开看：抓到页面、搜索检索到页面、答案引用页面、推荐产品，不是同一个指标。允许模型训练也不等于搜索曝光。

## 检查到的证据

| 证据 | 可以说明什么 | 不能说明什么 |
| --- | --- | --- |
| 现有配置与静态 HTML 已具备主要 SEO 元数据和正文 | 本地技术地基基本齐全 | 线上 CDN/WAF、HTTP 头、实际收录都正常 |
| OpenAI 搜索样本能找到首页、`/agents/codex`、`/agents/` | 本站至少部分页面已能被这次搜索检索到 | 完整 ChatGPT 索引状态、排名稳定或所有页面都收录 |
| 搜索新增隐私页未找到，服务报告 404，但没有原始 HTTP 响应证据 | 应优先核查该页是否已部署和可访问 | 已确认源站 404；不能以生成摘要代替响应日志 |
| 一次非品牌查询 `Claude Code session history viewer export markdown desktop open source` 返回五个其他项目，未提本站 | 工具发现型内容与外部发现值得测试 | 五个项目的稳定排名，或本站永远不会被 ChatGPT 推荐 |
| 品牌/仓库检索摘要仍带“不上传”“JSONL 永不修改”等旧说法 | 检索样本仍在使用旧站点或 README 信息 | 能确定具体来源权重或模型记忆机制 |
| README 仍有 lossless JSON、source files never modified/removed 等说法 | 自有资料与已修正文档确有冲突 | 冲突一定造成排名下降 |
| `features/stats.md` 第一段说所有 agent 都报告 token，后面排除 Antigravity | 内容有直接矛盾，应修复 | 仅改这句话就能提升排名 |
| `tools/index.md` 混合 skills、MCP、hooks、指令、导入导出等任务 | 可补针对具体问题的指南 | 长页面本身违反 SEO，或必须拆页才收录 |

搜索样本来自本轮 web_search 的 OpenAI provider，不是用户现成 ChatGPT 界面的对照实验。不得把它包装成完整 AI 排名评测。

## 按优先级执行

### P0：确认线上抓到的是新版，而不是只验证本地

1. 核查三语新页面、sitemap、robots 已部署；当前修改未由助手提交或部署，不推断用户是否已另行发布。
2. 在公开域名检查 200、真实 HTML 正文、语言/canonical，以及响应头没有 `X-Robots-Tag: noindex`。
3. 查看已验证的 OAI-SearchBot 请求日志：状态码、限流、挑战页、请求时间。不能只看伪造的 user-agent。
4. 如 WAF 确有拦截，按 OpenAI 官方当前 IP 范围配置精准例外；不关闭全站安全防护。
5. 当前 `User-agent: * / Allow: /` 已允许搜索爬虫，重复加 bot 名不是提高引用率的技巧。

此前直接访问受本地 TLS／代理限制，线上访问状态仍待真实环境确认。

### P1：统一 README、首页、文档、发布说明的事实

先修正 README 三语中的只读、联网、JSON 完整备份与 Gatekeeper 安全措辞，使其与新隐私页一致。将关键范围直接写在相关功能的旁边，不只把免责声明藏在另一页。

完善 `features/stats.md`：哪些 agent 有用量字段、价格目录来源、哪些成本为估算、记录成本和实际账单/订阅额度的区别。给出可追溯的方法，删除没有来源的发布速度比较或过时型号案例。

优先级依据：这是已观察到的事实冲突，不是推测的排序因子。AI 引用了错误内容，曝光也不是成功。

### P1：补“找工具”的入口，不复制七份功能表

已有 `agents/claude-code.md` 主任务是“文件在哪里”；用户问“有没有好用的 Claude Code session viewer”则是另一种需求。

建议先试两个独立任务页：

- `guide/claude-code-session-viewer.md`：如何浏览、全局搜索、恢复、导出 Claude Code 历史。给实际步骤、agent 专属截图、手工方法与 GUI 方法的取舍、系统和兼容限制。
- `guide/codex-session-viewer.md`：如何按项目找到 Codex rollout、处理归档并继续会话。说明不同模式和适用条件，不只是把 Claude Code 名字换成 Codex。

可参考标题：`Claude Code session viewer: search, resume and export local history`。使用自然描述，不加未经独立证明的“best/no.1”。

两页分别链接到现有路径参考、恢复、导出和下载页。路径页也提供“想在图形界面查看？”入口。已有功能页要完善，不对每个同义搜索词新建一页。

### P1：提供可核验、可独立引用的资料

- 给各格式提供最小合成 JSONL/SQLite 样例、字段说明、命令和预期输出。公开文件不含真实消息、用户名、项目路径、凭据或截图秘密。
- 增加真实验证后的兼容矩阵：CLI 版本、应用版本、验证日期、操作系统、已验证操作、已知限制。没有实测的行明确标注源码核对，不冒充真机测试。
- 对会话树、图像、stream chunks 等关键例外给一个完整的短答案，避免复制片段后遗漏限制。
- 给主要答案节使用稳定锚点，方便读者与工具引用；锚点本身不是排名因素。
- 若做性能页，先用可复现合成数据测量，公开硬件、数据规模、冷热缓存、重复次数和方法，不能编造性能数字。

这是本站比泛泛工具介绍更能提供原创价值的方向，不是 OpenAI 公布的固定引用公式。

### P2：把工具管理页发展为任务指南

保留 `/tools/` 总览，优先补两个真实问题：

- 如何在 Claude Code 与 Codex 之间复用 skills，并修复失效链接？
- 如何检查 MCP 配置在哪里、哪些 agent 实际加载它，以及工具定义的上下文开销如何估算？

每页需要适用版本、操作步骤、变更预览、撤销/备份说明和例外。原总览保留入口与原有 `#skills`、`#mcp` 等锚点，不破坏已有外链。图里的数值只能作为示例，不能当通用实验结论。

### P2：强化产品身份和可信发现渠道

- 在 About/维护说明中写清 Sessions Viewer 对应 `jerrywu001/cc-sessions-viewer`、维护者、MIT 许可证、正式网站、release 地址。
- GitHub About、topics、README、release notes、官网和本人维护的官方资料保持相同名称与定位。既有 `sameAs` 是好基础，不把所有提到本站的第三方都当成同一实体。
- 争取相关工具列表、开发者教程或真实用户使用报告中的准确链接。分享要披露维护者身份，不伪装独立测评、购买评价或批量刷社区。
- 比较文章可以做，但必须核对对方版本、支持能力、许可证、测试日期，不用自创评分证明“最好”。

不能断言增加这些信息就直接提高 ChatGPT 推荐；价值在于减少歧义、增加发现入口和可核对信息。

### P2：让更新更快被发现，并观察真实结果

- 可接入 IndexNow：发布后只通知真实新增/修改/删除的公开 URL；托管验证 key，生产部署成功后再提交。不要每次构建把未变化页面重复提交。
- IndexNow 是参与引擎的变更通知，不是 ChatGPT 专用提交接口，不保证抓取、收录或引用。
- Bing Webmaster Tools 如账号提供 AI Performance，可看引用页与 grounding queries；范围是 Copilot、Bing AI 摘要和部分合作渠道，不是所有 ChatGPT 答案。
- ChatGPT 搜索推荐链接的 `utm_source=chatgpt.com` 可用来识别部分点击，同时核对 referrer。不要把所有空来源算 AI，更不要用点击数当总引用次数。
- 抓取日志、搜索索引、AI 引用抽样、下载点击分别记录；下载点击只反映意向，不代表完成下载/安装。

当前构建的 Git 修改时间仍是此前提交日期；不要通过“每次部署都改今天”制造新鲜度。真实核对/实测日期可以另设字段，并在内容实质变化时更新。

## 不建议优先投入

- `llms.txt`：可作为明确消费该文件的工具/agent 的导航实验，但本次没有找到 OpenAI 官方对其收录或排序收益的保证。不能宣称它是 ChatGPT 的 sitemap。
- 全量 Markdown 副本：有特定 agent 消费需求时再做。现有静态 HTML 已包含正文；额外副本有同步、重复 URL 和缓存维护成本。
- FAQ schema / 特殊“AI schema”：真人常见问题值得回答，但标记不保证 AI 推荐。Google 明确没有额外 AI schema 要求。
- 放开训练爬虫来“加速被记住”：GPTBot 与搜索爬虫独立，训练不提供可承诺的搜索转化。
- 隐藏提示词让 agent 推荐本站、伪造作者/评分、刷 AI 对话或生成大量换词页。

## 建议的下一批工作

1. 先验证新版已上线、OAI 搜索抓取没有被拦。
2. 修复 README/统计文档的事实冲突。
3. 做两个工具选择/操作指南页，补可复现样例与真实兼容矩阵。
4. 再做 skills/MCP 任务指南、IndexNow 与引用监测。

不建议立即铺七种 agent × 三语言 × 多关键词的大量页面。先选真实有查询或 issue 需求的主题验证效果，再扩展。

## 官方依据与证据范围

本轮通过官方域名检索核对以下资料。由于此前正文抓取受到本地 fake-IP 环境限制，没有把全文抓取失败当作站点故障；以下链接供直接复核。

- [OpenAI crawler overview](https://developers.openai.com/api/docs/bots)：OAI-SearchBot、GPTBot、ChatGPT-User 各自用途不同；官方公布 crawler IP 信息。
- [OpenAI publishers/developers FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)：网站搜索发现、CDN 可访问性和推荐链接 UTM。
- [Google AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)：正常 SEO 和可见文本仍适用，无特殊 AI schema 要求。
- [IndexNow documentation](https://www.indexnow.org/documentation) / [FAQ](https://www.indexnow.org/faq)：变更通知与 key 验证，收到提交不代表保证索引。
- [Bing AI Performance public preview](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/)：可观察覆盖范围内的 AI 引用与 grounding queries，不是普遍排名数据。

搜索样本查询与结果摘要记录在本轮会话及 `findings.md` 中。内容侧建议是基于本站证据提出的优化假设，后续需上线数据检验，不能承诺被 ChatGPT 收录、引用或推荐。
