# 上线验收、收录申请与搜索表现待办

更新日期：2026-10-06。站点：<https://sessions-viewer.js-bridge.com/>。

本文件作为后续继续工作的入口。按「上线验收 → 收录申请 → 观察搜索表现 → 数据驱动扩展」推进；保存待办不代表授权自动执行账户操作、开发、发布或定时任务。

## 下次从这里继续

此前达到 Google 每日请求限额后，已按用户要求停止；当前额度是否恢复尚未重新核实。**需额度恢复且用户明确要求继续后，再操作；不自动执行、不绕过限额。**

使用用户现有、已登录的 Chrome 窗口，不新建独立或无头浏览器。Search Console 入口：

<https://search.google.com/search-console?resource_id=https://sessions-viewer.js-bridge.com/>

先完成下方上线验收。额度恢复且用户明确要求申请后，按下列 A → B → C 顺序逐页「网址检查」→「请求编入索引」。每次核对正在检查的完整 URL，以 Google 的「已请求编入索引」成功提示为准，再勾选清单。遇到每日配额或验证码停止并记录，不把点击按钮算成提交成功。

## 1. 上线验收

### 已核实的公开访问结果

2026-10-06 用户确认发布成功后，进行了公开 HTTP 检查（没有登录账户或提交收录）：

- [x] 成本计算器和 Token 计数器的英文、中文、日文共 6 个 URL 均返回 HTTP 200，内容类型为 HTML，没有重定向。
- [x] 线上 `/sitemap.xml` 返回 HTTP 200，包含 **87 个 URL**，上述 6 个工具页面全部在内。

检查原始结果保存在 `/tmp/sv-production-tools-check/results.json`。这些结果仅证明页面可访问和 sitemap 已更新，不证明交互功能、手机布局、Google 收录或排名。

### 待完成的真实页面验收

使用用户现有 Chrome，且只用公开合成样例，不读取私人会话或凭证。

- [x] 已重新抓取实际部署的 6 页：标题与说明可读取、self canonical 正确、各有 en-US / zh-CN / ja-JP / x-default 对应链接；meta robots 为 index/follow，没有 X-Robots-Tag noindex。证据 `/tmp/sv-bing-indexnow/metadata.json`；这不是浏览器交互验收。
- [ ] 在实际页面核对三个成本计算器的定价来源与核对日期，勿把 HTTP/HTML 可访问当作实际组件交互通过。
- [ ] 成本计算器：试公开样例，验证汇总 **$0.155**、每日 4 次 × 22 个工作日的月度 **$13.64**；验证切换模型、自定义价格、空值/负值错误、重置以及修改输入后旧结果清除。
- [ ] Token 计数器：试公开样例，验证 **1,710 Token**、2 条去重后的消息、1 条重复合并；验证公开样例文件选择、错误格式提示和重置。不把记录用量当作提示词分词、账单或实时额度。
- [ ] 在中文、日文页面确认控件、错误提示和相关链接的语言正确。
- [ ] 检查手机宽度布局、明暗主题、键盘焦点和可滚动价格表；结果区域不应撑破页面。
- [ ] 使用公开样例核对浏览器网络请求：正常文档资源可联网，但工具输入不应上传、发送给模型或写入 URL。没有可控现有浏览器时，记录阻碍并请用户恢复窗口，不退回无头/独立浏览器。

本地已有 126 项文档测试、12 项交互测试及精简部署构建通过，但这不能代替上述线上真实交互验收。

## 2. 待申请的 14 个优先页面

### A. 优先：新增英文工具（2 页）

- [ ] Claude Code 成本计算器：<https://sessions-viewer.js-bridge.com/tools/claude-code-cost-calculator>
- [ ] Claude Code Token 计数器：<https://sessions-viewer.js-bridge.com/tools/claude-code-token-counter>

### B. 继续原待办（8 页）

- [ ] 排障指南：<https://sessions-viewer.js-bridge.com/guide/troubleshooting>
- [ ] Skills 共享指南：<https://sessions-viewer.js-bridge.com/tools/share-skills>
- [ ] MCP 检查指南：<https://sessions-viewer.js-bridge.com/tools/check-mcp>
- [ ] 中文 Claude Code 指南：<https://sessions-viewer.js-bridge.com/zh/guide/claude-code-session-viewer>
- [ ] 中文 Codex 指南：<https://sessions-viewer.js-bridge.com/zh/guide/codex-session-viewer>
- [ ] 中文兼容性说明：<https://sessions-viewer.js-bridge.com/zh/guide/compatibility>
- [ ] 日文 Claude Code 指南：<https://sessions-viewer.js-bridge.com/ja/guide/claude-code-session-viewer>
- [ ] 日文 Codex 指南：<https://sessions-viewer.js-bridge.com/ja/guide/codex-session-viewer>

排障页是此前遇到额度限制的位置，没有核实成功，故仍待申请。

### C. 新增中文、日文工具（4 页）

- [ ] 中文成本计算器：<https://sessions-viewer.js-bridge.com/zh/tools/claude-code-cost-calculator>
- [ ] 中文 Token 计数器：<https://sessions-viewer.js-bridge.com/zh/tools/claude-code-token-counter>
- [ ] 日文成本计算器：<https://sessions-viewer.js-bridge.com/ja/tools/claude-code-cost-calculator>
- [ ] 日文 Token 计数器：<https://sessions-viewer.js-bridge.com/ja/tools/claude-code-token-counter>

上述 14 页只是人工申请的优先清单，不是全站全部未收录页面，也不需要为了覆盖 87 页逐页反复申请。

## 此前已成功申请的 7 页（不要重复）

以下页面均已核实 Google「已请求编入索引」成功提示。用户当时要求已收录页面也重新提交，因此前三项已重新申请抓取更新；下次不必重复这些成功请求。

- [x] 英文首页：<https://sessions-viewer.js-bridge.com/>
- [x] 中文首页：<https://sessions-viewer.js-bridge.com/zh/>
- [x] Claude Code 参考页：<https://sessions-viewer.js-bridge.com/agents/claude-code>
- [x] Claude Code 指南：<https://sessions-viewer.js-bridge.com/guide/claude-code-session-viewer>
- [x] Codex 指南：<https://sessions-viewer.js-bridge.com/guide/codex-session-viewer>
- [x] 兼容性说明：<https://sessions-viewer.js-bridge.com/guide/compatibility>
- [x] 隐私说明：<https://sessions-viewer.js-bridge.com/guide/privacy>

## 站点地图与范围

- 最新公开 HTTP 检查：<https://sessions-viewer.js-bridge.com/sitemap.xml> 包含 **87 个 URL**，新增 6 个工具页面全部在内。
- 历史记录：此前线上 sitemap 为 81 个 URL，已在 Search Console 重新提交并核实「已成功提交站点地图」。更早显示的 54 页来自 2026-09-29 的旧读取结果。不要把那次成功提示当作 Google 已读取当前 87 页。
- [ ] 用户授权继续账户操作后，检查 Search Console 中 sitemap 的状态、最新读取时间和发现 URL 数；如仍停留旧版本，再重新提交同一个 `sitemap.xml`。若已成功读取最新版本，不为催收录重复提交。
- 页面申请成功只表示请求被接受，不保证实际收录、排名或 AI 引用。全站最新索引数量尚未重新核实。
- 用户已明确授权本次 Bing / IndexNow 操作。现有 Chrome 中已核对 Bing 属性与自动导入的 sitemap，处理中不重复提交。IndexNow 已通知新增 6 个工具 URL，返回 **HTTP 202（收到通知、密钥验证待完成）**；不是已收录，也不是 Google 或 ChatGPT 的提交入口。未改爬虫策略、防火墙或执行 Google 收录申请。

## Bing / IndexNow 操作记录

- [x] 核对现有 Chrome 中已添加的 `sessions-viewer.js-bridge.com/` 属性。
- [x] 检查 Bing 已自动导入 `sitemap.xml`：UI 显示 `Imported` / `Processing`，Last submit 显示 `10/7/2026`；Last crawl 和 URL 数尚未更新，总发现 URL 为 0。未为催抓取重复提交，不把它当作 87 页已处理或收录。
- [x] 核验根证明文件 `sv-indexnow-2026.txt` 精确内容、6 个新工具页面的公开 GET/HEAD 200 HTML 与实际部署内容。
- [x] 仅通知两个工具的英/中/日 6 个 URL，复用项目 `notifyIndexNow()` 的密钥、URL、发布预检；只发送 1 次 POST，HTTP 202，不自动重试。
- [x] 源码比较 `83adf58872c34e2d9931d836f3ca9416d9c0ce90` → `69e0b4f1c5ee7aa5de190fcc37432e8fa363d3c5` 给出 87 个候选，本次按授权缩小为 6 页，没有通知其余 81 页。比较是源码证据，不是部署证明；另行完成了线上预检。
- [ ] 稍后检查 Bing sitemap 是否变为 Success、URL 发现数是否更新，以及 IndexNow 密钥验证和抓取状态。202 不保证最终验证通过或收录。
- [x] 英文成本计算器 Bing Index：`Discovered but not crawled`，发现日期 `06 Oct 2026`，未收录。Live URL 已实际测试，显示 `URL can be indexed by Bing`；这只是当前可索引性，不是已收录。
- [x] Live URL 报告发现 3 项：`Title too long`、`Meta Description too long or too short`、`Alt attribute for images is missing`（各 1 实例）；检测到 2 种 markup。须核对实际 HTML、具体实例和装饰图语义后再决定修复，不把长度建议或空 alt 都当作抓取阻断。
- [x] 新增 6 页已逐页核对完整 URL 与 Bing Index：均为 `Discovered but not crawled`，发现日期均 `06 Oct 2026`，当前未收录。英语 Token 页 Live URL 实测为 `URL can be indexed by Bing`（Today at 19:33），3 项提示与英语成本页相同；日语 Token 页 Live URL 也显示可索引（Today at 19:39），仅 1 项空 alt 提示。没有点击 Request indexing 或重复发送 IndexNow。
- [x] robots.txt Tester 实际执行 `Fetch latest`，核对 HTTPS 根文件的 `User-agent: * / Allow: /` 和当前 sitemap；界面显示 0 errors / 0 warnings。用默认 **Bingbot** 测试英文成本页，结果 **Allowed**。另以公开 HTTP 核对当前文件内容一致；只证明 robots 允许该测试 URL，不代表已抓取或收录。没有改编辑器内容、点击 Proceed 或发布 robots 配置。
- [ ] Verify Bingbot 仅在有经授权读取的真实访问日志/IP 时使用；目前没有提供相应日志，不拿任意 IP 或 User-Agent 字符串冒充真实 Bingbot 证据。
- [x] 已按用户要求逐项核对并使用当前可用的 Bing 诊断工具：URL Inspection / Live URL、robots Tester、Site Explorer、Recommendations、Keyword Research、Backlinks、Search Performance、AI Performance、Site Scan 额度与 IndexNow 页面。无数据或额度不可用的部分没有硬跑；未调高抓取频率或改屏蔽/拒绝链接配置。
- [x] IndexNow 页面目前仍为含 `Get Started` 的介绍/接入引导，未显示本次 6 页的可核实提交统计或密钥验证结果。现有协议 API 已发送一次，因此未重复装插件、重新配置账号或再发通知；仍按 HTTP 202 的实际回执记录密钥验证待完成。
- [x] Site Explorer（Indexed URLs 与 All URLs 都已检查）、Recommendations、Backlinks 已实际打开，均显示 `No data available`。这不是全站确认未收录、没有技术问题或没有外链；待属性数据处理完成后再查看，不为了生成报告改账户配置。
- [x] Search Performance 显示 `Please check back in 48 hours while we prepare the data for your site`，尚不能记录可靠的展示/点击/排名基线；这是稍后人工复查提示，不是安排了定时任务。
- [x] AI Performance 已查看：图表范围 `July 06, 2026 → October 05, 2026`，显示 `Citations: 0 / Cited Pages: 0`，查询表与结果区 `No data available`，页面提示数据只是总体活动的样本，后续可能修订。周期尚未覆盖本次 10 月 6 日新增工具上线，不能把这些零值解释为所有 AI 平台从未引用本站；它也不是全部 ChatGPT 答案报告。
- [x] Site Scan 已打开配置核对：当前 `Quota left : 0 pages.`，因此未启动扫描、未勾选邮件通知或改抓取配置；不可绕过额度。
- [ ] Site Scan 额度可用后，对当前 sitemap 的 87 页做一次有范围的扫描，先看可用额度再设页数；优先核对标题/描述长度及真实图片 alt 问题。
- [x] Keyword Research 已查询 `claude code cost calculator`，默认 All/All/All、3 M：趋势显示 `Bing doesn’t have enough data to show trend here`，建议关键词表 `No data available`，但能看到 Top 10 竞争页面。不能把缺数据写成搜索量为 0，更不能换算成 Google 月量/KD。竞品表保存于 `/tmp/sv-bing-indexnow/keyword-cost-table.txt`。
- [x] `claude code token counter` 同样缺趋势与关键词建议数据，但有 Top 10 竞争页（包括官方 token counting、实时用量扩展、文本 tokenizer）。记录在 `/tmp/sv-bing-indexnow/keyword-token-table.txt`；本站读取保存用量的功能要继续明确区别于提示词分词与实时监控。
- [x] 扩展查询 `claude code`，默认 All/All/All、3 M。Bing 相关词表的 **Impressions** 显示：`claude code install` 75K、`claude code download` 65.3K、`claude code cli` 65.6K、`claude code desktop` 23.9K。这里只记录 Bing 在所选周期显示的原始指标，不是 Google 月搜索量、KD 或本站展示量；相关表也包含 `cloud ai` 等噪声，不据此批量造页面。原始表保存在 `/tmp/sv-bing-indexnow/keyword-claude-code.json`。
- [ ] 数据充足后，针对 usage / history 等真正匹配本站功能的词继续研究；不拿 Claude CLI 安装意图冒充 Sessions Viewer 安装意图。

### 本轮可采取的后续动作

1. **先处理有证据的内容项**：英文两页最终 title 为 83 / 80 字符，description 为 172 / 183 字符，且 Bing 实时报长度提示。后续获准修改时精简，保留准确的“API 等价估算”和“保存用量统计”边界；这不是阻断收录的证据。中文/日文不要机械套用英文字符阈值。
2. **Logo 保留可访问性语义**：6 页唯一图片为 `/logo.png`，均显式 `alt=""`，其所属链接已有 `Sessions Viewer` 文字；属有文字标签的品牌装饰图，不是忘记 alt 属性。不为了让扫描器变绿重复朗读品牌；后续真正有内容含义的图片才应补有意义的 alt。
3. **约 48 小时后人工复查**：Search Performance 数据准备提示、sitemap Processing、IndexNow 验证/日志、6 页抓取/索引状态、Site Explorer 与外链。不能把等待报告当作一定会收录；这里没有设定自动任务或自动重发。
4. **Site Scan 有额度才跑**：只扫当前 sitemap 范围，先核对页数/额度，再看真实问题实例；本轮额度 0，因此没有全站扫描报告。
5. **有数据再优化**：从真实 usage / history 查询及页面展示/点击选下一步；AI 报告仅用其实际覆盖的渠道和样本，不泛化为所有 AI 引用。保留 Google 未完成清单，需另获明确指令才申请。

以上是复查与决策清单，不是授权自动开发、发布、申请或重试。

通知的 6 个 URL 对应上方 Google 待办中的 A、C 组；**Bing 通知不勾选 Google 的申请清单**。完整请求/响应证据保存在 `/tmp/sv-bing-indexnow/`，结果为 `submission-result.json`；此处没有安排自动重发或后台轮询。

## 3. 观察搜索表现（上线后 2–4 周）

- [ ] 取得用户授权后，记录 Search Console 当前索引状态与效果报告基线；标明报告日期范围和本次上线日期，不用历史的「3 页已收录」代替当前结果。
- [ ] 按新工具 URL 和词群观察：`claude code cost calculator` / cost / calculator；`claude code token counter` / token / usage；旧统计页的 usage tracker / Codex token usage；旧指南的 history viewer / history search。
- [ ] 记录展示量、点击、CTR、平均排名和真实出现的查询词。先检查是否收录以及 Google 选择的 canonical，再解释没有展示的原因。
- [ ] 2 周左右做首次观察，4 周左右再复盘；有足够历史数据时比较相等长度的时间窗口（例如前后 28 天）。新页面没有发布前基线，不伪造增长；小样本不轻易归因。
- [ ] 根据实际查询和低点击页面，决定是否改标题、说明、示例或内链；不要因为暂时零展示就批量新增近似页面或重复申请。

观察频率是人工复盘建议，**没有安排自动定时任务**。未安装新分析埋点；下载转化、工具完成率和 AI 引用未被测量，不把它们当作已验证结果。关键词联想和 ccusage 下载量是需求线索，不是月搜索量或 KD。

## 4. 有数据后再决定是否扩展

- [ ] 若 Codex 用量/成本查询有持续展示或用户需求，再评估 Codex 成本工具；先核对价格来源、模型匹配、输入格式与缓存口径，再由用户确认实施，不现在凭猜测开发。
- [ ] 对确有需求的现有页优先补有用内容，避免为同义词分别造薄页面；继续保持中英日一致。
- [ ] 按官方价格的真实变化复核计算器预设；修改后同步来源、核对日期、测试和部署。不每次构建机械刷新日期，也不假设所有模型的缓存读取都是输入价的 0.1 倍。

选词依据与页面映射见 `docs/seo-keyword-research.md`。排名、流量和 AI 引用均无保证；上述扩展项目前是待决策事项，不是授权开发清单。

## 后续结果记录

每完成一项再勾选，并记录日期、URL／报告范围、可核实的结果及下一步。不要把「发布成功」「HTTP 200」「已请求编入索引」「已收录」混为同一状态。

| 日期 | 项目 / URL / 范围 | 实际结果 | 下一步 |
| --- | --- | --- | --- |
| 2026-10-06 | 新增工具三语共 6 页、线上 sitemap | 6 页均 HTTP 200；sitemap 87 URL，6 页全部在内 | 真实页面验收；恢复额度并获明确指令后申请收录 |
| 2026-10-06 | Bing sitemap / IndexNow | Imported / Processing；一次通知 6 URL，HTTP 202，验证待完成 | 稍后人工复查，不重复提交 |
| 2026-10-06 | 6 个新工具 URL 的 Bing Index | 全部 Discovered but not crawled，发现日期 06 Oct 2026 | 等实际抓取/索引，未点 Request indexing |
| 2026-10-06 | Live URL / robots / 线上元信息 | 英文两页、日语 Token 页可索引；成本页 Bingbot robots Allowed；6 页 canonical/hreflang/robots 正确 | 精简英文长标题/说明；装饰 Logo 不盲改 |
| 2026-10-06 | Bing 全站与表现工具 | Search Performance 需准备 48h；Site Explorer 两种范围、Recommendations、Backlinks 无数据；Site Scan 0 页额度 | 数据/额度可用后人工复查；没有全站扫描结果 |
| 2026-10-06 | Bing Keyword Research / AI Performance | 广义词有 Bing 3 M Impressions；两个长尾词缺趋势；AI 样本报告截止 10/5，不能验证新工具上线效果 | 保留来源、周期与意图；不当作 Google 月量或全平台 AI 引用 |

如果再次达到配额或出现验证码，立即停止，保留未勾选项，等待用户下一次明确指令；不要重复此前 7 页成功请求。
