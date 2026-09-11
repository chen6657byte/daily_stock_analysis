# Daily Stock Analysis 架构分析与 Personal Investment Terminal 演进建议

> 本文面向刚开始学习编程的读者，基于当前仓库代码做“现状盘点 + 演进建议”。本文只描述架构，不改变任何业务代码。
>
> **阅读时最重要的区分：**“当前已经存在”与“未来建议建设”是两回事。文中凡标为“建议”的内容，都不是当前系统已具备的承诺。

## 1. 一句话理解这个项目

Daily Stock Analysis（下文简称 DSA）可以理解成一条“自动研究流水线”：用户给它股票代码，它从多个行情源取数据、搜索新闻、计算技术指标，再把整理好的上下文交给大语言模型（LLM），最后保存结构化结果、生成报告，并按配置推送到消息渠道。

如果把它逐步改造成 Personal Investment Terminal（个人投资终端），不应该推倒重来。当前项目已经拥有数据适配、分析编排、报告历史、组合、告警、Web、桌面端和任务调度等重要地基；主要工作应是把“以一次 AI 报告为中心”的结构，逐步收敛为“以证券、观察清单、投资论点、目标价、决策状态和持仓为中心”的长期数据模型。

## 2. 给初学者的架构解释

### 2.1 分层是什么

程序较大时，不把所有代码写在一个文件，而是按职责分层。DSA 当前大致分为：

```text
用户
  ├─ 命令行 main.py
  ├─ Web / 桌面端
  ├─ REST API
  └─ 聊天机器人
          ↓
入口与接口层（main.py、server.py、api/、bot/）
          ↓
业务编排层（src/core/pipeline.py、src/services/、src/agent/）
          ↓
能力层
  ├─ 行情：data_provider/
  ├─ 新闻：src/search_service.py、src/services/intelligence_service.py
  ├─ AI：src/analyzer.py、src/llm/、src/agent/
  ├─ 报告与通知：src/services/report_renderer.py、src/notification.py
  └─ 调度：src/scheduler.py、src/services/runtime_scheduler.py
          ↓
持久化层（src/storage.py、src/repositories/）
          ↓
SQLite 数据库 + 本地报告/日志/缓存文件
```

可以把各层想成餐厅：

- **入口层**是服务员，负责接单。
- **编排层**是店长，决定先做什么、失败后怎么办、结果交给谁。
- **能力层**是不同工位：采购行情、搜索新闻、AI 分析、排版、配送通知。
- **持久化层**是仓库和账本，让历史结果在程序重启后仍然存在。
- **Web/桌面端**是菜单和展示柜，只通过 API 使用后端能力，而不应自己重复实现投资规则。

### 2.2 当前项目不是单一脚本

虽然 `main.py` 是最明显的入口，但仓库实际上包含四种使用形态：

1. **批处理/命令行**：运行一次或按时间循环分析。
2. **Web API**：FastAPI 暴露分析、历史、组合、告警、选股等接口。
3. **React Web UI**：浏览器中的 Dashboard、报告、历史、组合和设置页面。
4. **Electron 桌面端**：启动打包后的后端，并把同一套 Web UI 放进桌面窗口。

因此未来改造时，核心投资规则应留在后端领域层；CLI、Web、桌面和机器人都只做不同的“入口”。

## 3. 项目目录地图

| 路径 | 当前职责 | 初学者理解 |
| --- | --- | --- |
| `main.py` | CLI、单次分析、市场复盘、服务和调度启动 | 总开关与批处理入口 |
| `server.py` | 初始化并导出 FastAPI `app` | Web 服务器入口 |
| `api/` | REST API、Schema、认证和错误处理 | 前端与后端之间的合同 |
| `bot/` | 飞书、钉钉、Discord 等机器人命令 | 聊天入口 |
| `src/core/` | 股票分析流水线、市场复盘、回测、交易日历 | 主流程指挥中心 |
| `src/services/` | 分析、历史、组合、告警、选股、情报等业务用例 | 可复用业务功能 |
| `src/repositories/` | 封装数据库读写 | 数据库访问员 |
| `src/schemas/` | 报告、决策等稳定数据结构 | 数据格式合同 |
| `src/agent/` | 多 Agent、工具调用、研究、记忆、对话 | 更复杂的 AI 研究团队 |
| `src/llm/` | LiteLLM、本地 CLI 后端、路由、用量统计 | 模型适配层 |
| `data_provider/` | 多行情源与 fallback | 行情插座转换器 |
| `src/storage.py` | SQLAlchemy 模型、SQLite 初始化与迁移 | 当前统一账本 |
| `src/notification.py`、`src/notification_sender/` | 报告格式和多渠道推送 | 配送中心 |
| `apps/dsa-web/` | React + TypeScript + Vite Web UI | 浏览器客户端 |
| `apps/dsa-desktop/` | Electron 包装与后端进程管理 | 桌面客户端外壳 |
| `strategies/` | YAML 策略定义 | 可配置的筛选/分析规则 |
| `templates/` | 报告模板资源 | 报告外观模板 |
| `scripts/`、`.github/workflows/`、`docker/` | CI、发布、日常任务和部署 | 自动化运维 |
| `tests/` | 后端及契约测试 | 防止改坏旧功能的安全网 |

## 4. 用户要求的关键能力清单

### 4.1 程序入口

| 入口 | 文件 | 用途 |
| --- | --- | --- |
| 主 CLI | `main.py` | 普通分析、`--stocks`、`--dry-run`、市场复盘、调度、启动服务等 |
| API 服务 | `server.py` | 创建配置与日志后导出 `api.app:app` |
| FastAPI 应用 | `api/app.py` | 生命周期、CORS、认证中间件、API 路由、前端静态资源 |
| API v1 聚合 | `api/v1/router.py` | `/auth`、`/agent`、`/analysis`、`/history`、`/stocks`、`/portfolio`、`/alerts`、`/decision-signals`、`/screening` 等 |
| Web | `apps/dsa-web/src/main.tsx`、`App.tsx` | React 启动与页面路由 |
| 桌面端 | `apps/dsa-desktop/main.js` | Electron 启动、管理后端和桌面窗口 |
| Bot | `bot/handler.py`、`bot/dispatcher.py` | 接收消息并分派 analyze/history/market/chat 等命令 |
| GitHub 定时任务 | `.github/workflows/00-daily-analysis.yml` | 云端按 cron 或手动触发日常分析 |

### 4.2 股票数据来源

统一入口是 `data_provider.base.DataFetcherManager`。它根据市场、能力、配置和优先级选择适配器，并在一个来源失败后尝试下一个。不能把包注释里的单一优先级表当作所有请求的固定真相，因为日线、实时行情、指数、基本面和不同市场有各自路由。

当前适配器包括：

- **A 股为主**：Efinance、AkShare、Tushare、PyTDX、Baostock、腾讯直连。
- **美股/港股为主**：Yahoo Finance（yfinance）、Longbridge、Finnhub、Alpha Vantage。
- **港股实时补充**：Futu OpenD。
- **可选聚合源**：TickFlow。
- **台湾机构数据**：`tw_institutional_fetcher.py`。
- **基本面适配**：yfinance 和 Futu fundamental adapters。

`DataFetcherManager` 是未来应该保留的统一边界：上层只请求“某股票的日线/实时价/基本面”，而不直接依赖某家供应商。

### 4.3 新闻数据来源

当前存在两条新闻/情报路径：

1. **按股票主动搜索**：`src/search_service.py`
   - Bocha（博查）
   - Tavily
   - Brave Search
   - SerpAPI（其实现可使用 Google 搜索结果）
   - SearXNG（可自建，也可发现公共实例）
   - `newspaper3k` 用于尝试提取网页正文
   - 服务负责 provider fallback、缓存、新闻时间窗、去重、公司直接新闻/行业新闻/宏观新闻分类和格式化
2. **可配置合规资讯池**：`src/services/intelligence_service.py`
   - RSS / Atom
   - NewsNow API
   - 内置模板包含 SEC、HKEX、MarketWatch，以及财联社、雪球热股、华尔街见闻、金十、格隆汇等 NewsNow 条目
   - 资讯源和采集结果保存到 SQLite

两条路径目前有一定重叠。建设长期终端时应统一为“情报条目 → 证券/市场关联 → 证据质量 → 分析引用”的领域模型，而不是继续增加第三条搜索路径。

### 4.4 LLM / AI 分析模块

当前有“传统单分析器”和“Agent 编排”两套互补路径：

- `src/analyzer.py`：核心 AI 分析器。拼装技术面、行情阶段、新闻和报告要求，调用生成后端，修复/解析 JSON，得到结构化分析结果。
- `src/llm/`：生成后端抽象与实现。
  - `litellm_backend.py` 通过 LiteLLM 适配 OpenAI、Anthropic、Gemini、DeepSeek、Ollama 等兼容渠道。
  - `local_cli_backend.py` 支持 Codex CLI、Claude Code CLI、OpenCode CLI 作为文本生成后端。
  - `backend_factory.py`、`backend_registry.py` 负责选择主后端和 fallback。
  - `usage.py`、`provider_cache.py` 负责用量和缓存诊断。
- `src/agent/`：多 Agent / 工具调用体系。
  - technical、intel、risk、portfolio、decision 等角色。
  - orchestrator/runner/executor 负责编排。
  - tools/ 提供行情、搜索、分析和回测工具。
  - memory/conversation/chat_context 支持对话上下文。
- `src/stock_analyzer.py`：确定性的传统技术分析，是 LLM 之外的事实和 fallback 来源，不应与“AI 推测”混为一谈。

长期终端应坚持：**数据与计算结果是事实层，LLM 是解释与归纳层，最终决策状态必须结构化并可追溯。**

### 4.5 Prompt 位置

Prompt 不是集中在一个文件里；这是当前维护成本较高的地方。主要位置如下：

| Prompt 类型 | 主要位置 |
| --- | --- |
| 单股报告主 Prompt、新闻要求、输出 JSON 要求 | `src/analyzer.py` |
| 报告结构/字段契约 | `src/schemas/report_schema.py` |
| 决策刻度说明 | `src/schemas/decision_scale.py` |
| 市场阶段、市场结构和每日市场上下文片段 | `src/market_phase_prompt.py`、`src/market_structure_prompt.py`、`src/analysis_context_pack_prompt.py` |
| 图片识股 Prompt | `src/services/image_stock_extractor.py` 的 `EXTRACT_PROMPT` |
| 多 Agent 角色 Prompt | `src/agent/agents/base_agent.py`、`technical_agent.py`、`intel_agent.py`、`risk_agent.py`、`portfolio_agent.py`、`decision_agent.py` |
| Agent 汇总/执行 Prompt | `src/agent/executor.py`、`src/agent/agent_backend.py`、`src/agent/chat_executor.py` |
| 策略 Skill Prompt | `src/agent/skills/skill_agent.py` 及 `src/agent/skills/` |
| 选股排序 Prompt | `src/services/screening/ranker.py` |
| Bot 意图分派 Prompt | `bot/dispatcher.py` |

未来应建立 Prompt Registry：每个 Prompt 有稳定 ID、版本、用途、输入 Schema、输出 Schema、适用语言和评测集；但迁移时应先建立索引和测试，不要一次性搬动全部 Prompt。

### 4.6 定时任务实现

定时能力也有多层：

- `src/scheduler.py`：底层 `ScheduleManager`，解析每日多个执行时刻，循环等待并触发任务，也可承载间隔型后台任务。
- `main.py`：`--schedule` 路径，构造实际股票分析任务、交易日过滤、市场复盘和运行时配置刷新。
- `src/services/runtime_scheduler.py`：让 API/Web/Desktop 常驻进程拥有调度能力，并用 owner/lock 语义避免 CLI 与服务重复执行；事件监控也作为后台任务接入。
- `src/services/alert_worker.py`：轮询并评估告警规则。
- `.github/workflows/00-daily-analysis.yml`：GitHub Actions 云端 cron。

未来“定时监控”应基于持久化 job/monitor 定义，而不仅是进程内循环：记录时区、交易日历、上次运行、下次运行、幂等键、失败次数和运行日志。当前 scheduler 可继续作为第一阶段执行器。

### 4.7 数据保存方式

核心存储是 **SQLite + SQLAlchemy**：

- 默认数据库路径来自 `DATABASE_PATH`，默认值为 `./data/stock_analysis.db`。
- `src/storage.py` 定义 ORM 表、数据库初始化和兼容迁移。
- `src/repositories/` 按 analysis、stock、portfolio、alert、backtest、decision signal、intelligence 等领域封装查询。

已存在的主要数据包括：

- 日线行情 `stock_daily`
- 新闻搜索结果 `news_intel`
- 可配置资讯源及条目 `intelligence_sources`、`intelligence_items`
- 基本面快照 `fundamental_snapshot`
- 分析历史 `analysis_history`（包含原始结果、新闻、上下文快照、理想买点/次买点/止损/止盈）
- 回测结果和汇总
- 组合账户、交易、现金流水、公司行动、持仓、持仓批次、每日快照、汇率
- 对话、Agent provider trace、LLM 用量
- 告警规则、触发、通知、冷却状态
- 结构化决策信号、信号结果和用户反馈

另有本地文件：日志、Markdown/图片报告、股票索引缓存、选股快照与 provider 缓存。它们不是同一种数据，应在未来明确区分“主数据”“可重建缓存”“审计记录”和“导出产物”。

### 4.8 配置文件

| 配置入口 | 作用 |
| --- | --- |
| `.env`（不应提交） | 实际运行配置和密钥 |
| `.env.example` | 环境变量完整示例与说明 |
| `src/config.py` | 把环境变量解析为类型化 `Config`，处理默认值和校验 |
| `src/core/config_registry.py`、`config_manager.py` | Web 可编辑配置的注册、读写和敏感值处理 |
| `strategies/*.yaml` | 策略规则 |
| `pyproject.toml`、`requirements.txt` | Python 工具和依赖 |
| `apps/dsa-web/package.json` | Web 依赖与脚本 |
| `apps/dsa-desktop/package.json` | Electron 构建与发布配置 |
| `docker/docker-compose.yml`、`docker/Dockerfile` | 容器运行配置 |
| `.github/workflows/*.yml` | CI、定时分析、发布和镜像构建 |

注意：当前配置面很大。未来新增 Terminal 配置时，应优先做数据库中的领域设置或现有 Config Registry 项，不应继续散落读取环境变量。

### 4.9 前端 / UI

项目有完整 UI：

- **Web**：React 19 + TypeScript + Vite + Zustand + Axios + React Router + Recharts。
- **页面**：首页分析 Dashboard、Agent Chat、Portfolio、Decision Signals、Stock Screening、Backtest、Alerts、Token Usage、Settings、Login。
- **桌面端**：Electron 复用同一 Web 构建，并携带/启动打包后的 Python 后端。
- **后端托管**：生产模式下 FastAPI 可以直接托管 Vite 构建的静态文件。

首页目前已出现名为 watchlist 的工作区和 `useWatchlist` hook，但其后端操作本质是读取和修改系统配置中的股票列表，并非一个拥有用户、分组、排序、备注、目标价和 thesis 的完整领域模型。

## 5. 一次单股分析的完整运行流程

```text
股票代码 / 名称
  ↓
入口解析与标准化
  main.py / API / Bot
  - 解析市场、资产类型和 canonical code
  - 生成 query_id / task id
  ↓
StockAnalysisPipeline
  src/core/pipeline.py
  ↓
历史行情获取
  DataFetcherManager 按市场和能力选择 provider
  - 失败时 fallback
  - 统一字段
  - 保存 stock_daily
  ↓
实时行情、技术指标、基本面等上下文
  - StockAnalyzer 做确定性计算
  - 可选实时价、筹码、资金流、基本面快照
  ↓
新闻 / 情报
  SearchService 搜索公司、行业、宏观和风险新闻
  + 可选 IntelligenceService 本地资讯池
  - 清洗、分类、去重、时间窗过滤
  - 保存 news_intel / intelligence_items
  ↓
构造 Analysis Context
  把行情、指标、市场阶段、新闻、历史比较等整理为模型输入
  ↓
AI 分析
  - 传统 Analyzer，或 Agent 编排
  - LLM backend 调用模型
  - 解析/校验结构化 JSON
  - 必要时使用确定性 fallback
  ↓
决策与报告
  - 得到评分、趋势、建议、风险和买卖点
  - ReportRenderer/API Schema/通知格式转换成不同展示
  ↓
保存
  - analysis_history
  - context_snapshot（按配置）
  - decision_signals、skill samples、LLM usage 等派生记录
  ↓
输出
  - CLI 日志/本地报告
  - Web Dashboard 与历史 API
  - 可选微信、飞书、钉钉、Telegram、邮件、Discord、Slack、ntfy、Gotify 等通知
```

关键稳定性语义是：单个股票、单个数据源、可选增强能力或单个通知渠道失败，不应不加区分地拖垮整批任务；但降级必须在报告和诊断里可见，不能把“缺数据”伪装成“分析成功且信息完整”。

## 6. 模块分级：保留、重构、候选删除

这里的分类针对“建设 Personal Investment Terminal”的目标，而不是评价原项目代码质量。

### A. 可以直接保留并继续演进

| 模块 | 保留理由 |
| --- | --- |
| `data_provider/base.py` 的统一接口和 fallback 思路 | 终端必须隔离供应商差异；这是最有价值的边界之一 |
| 大部分 `data_provider/*_fetcher.py` | 已覆盖 A/H/美股和实时/日线能力；先通过使用率和质量指标决定去留 |
| `src/core/trading_calendar.py`、市场识别/代码规范化 | 调度、历史和券商接入都依赖统一交易日与证券标识 |
| `src/storage.py` 中已有行情、分析历史、组合、告警、信号数据 | 已覆盖 Terminal 的大量基础对象，适合渐进迁移 |
| `src/repositories/` 与 `src/services/` 分层方向 | API 不直接写 SQL 的方向正确 |
| `api/` 的版本化 REST 边界 | Web、桌面和未来移动端可复用 |
| `apps/dsa-web/` 的路由、组件库、状态与 API 分层 | 已经是 Terminal UI 的可用底座 |
| `apps/dsa-desktop/` | 适合个人本地部署、SQLite 和本地券商网关场景 |
| `analysis_history`、Decision Signal、Alert、Backtest | 可直接支撑分析历史、决策追踪、监控和复盘 |
| `src/llm/` 的 backend abstraction | 避免领域逻辑绑定某个模型厂商 |
| 测试、CI、Docker 和配置校验 | 长期维护的必要护栏 |

“直接保留”不代表永远不改，而是应保持公开契约，采用小步兼容式演进。

### B. 需要重构，但不要立刻重写

| 模块 | 当前问题 | 建议方向 |
| --- | --- | --- |
| `src/core/pipeline.py` | 文件很大，同时负责获取、增强、搜索、AI、保存和诊断 | 拆成显式 stage；用 typed context 在 stage 间传递；先抽接口再搬代码 |
| `src/storage.py` | 模型、迁移、查询兼容逻辑集中在超大文件 | 模型按领域拆包，引入正式迁移工具；Repository 逐步成为唯一读写入口 |
| `src/config.py` / `.env` | 配置项很多，运行配置、密钥、用户偏好和领域数据容易混在一起 | 环境变量只保留部署/密钥；watchlist、偏好、monitor 等进入数据库 |
| Prompt 分布 | Prompt、Schema、guardrail 散落多文件，版本难追踪 | Prompt Registry + 版本 + 输入输出 Schema + eval；保持现有行为迁移 |
| `src/search_service.py` | 搜索 provider、正文抓取、缓存、分类和业务查询集中 | 拆 provider adapter、retrieval、normalization、evidence ranking |
| `src/analyzer.py` 与 `src/agent/` | 两套分析路径有重复语义，fallback 边界复杂 | 共享同一 Research Context 和 Decision Schema；区分 deterministic 与 generative stage |
| Watchlist | 当前主要映射到全局配置中的股票列表 | 建立持久化实体、条目、分组、排序、标签和用户作用域 |
| 报告/通知格式 | 多消费端容易分别拼装同一业务概念 | 先形成 canonical report DTO，再由 Web/Markdown/通知 renderer 转换 |
| 调度 | 同时有 CLI loop、runtime scheduler、Actions cron | 统一 job 定义、幂等和 run history；不同 runner 只负责执行 |
| 证券代码 | 多市场别名和旧 `code` 字段仍存在迁移语义 | 建立 Instrument 主表与稳定 instrument_id，外部 symbol 放映射表 |
| SQLite 自愈迁移 | 单用户方便，但 schema 继续增长后风险上升 | 保留 SQLite，改用 Alembic 等显式、可回滚、可测试迁移 |

### C. 后续可以删除的候选项

此组不是“现在就删”。先加 telemetry、完成替代、经过至少一个稳定周期，再做删除决策。

| 候选 | 何时可删 | 为什么不是现在删 |
| --- | --- | --- |
| 长期不可用、数据质量差或零使用率的行情 provider | 有 provider 成功率/延迟/用户使用数据，并保留至少两个可靠来源后 | fallback 是当前稳定性基础 |
| 公共 SearXNG 自动发现 | 已部署可信自建搜索或稳定付费搜索后 | 公共实例有隐私与稳定性风险，但仍是无密钥 fallback |
| `newspaper3k` 正文抓取路径 | 搜索 provider 摘要/许可数据能覆盖需求后 | 当前仍可补充正文证据 |
| 重复的 legacy Analyzer 或 Agent 路径之一 | 二者已统一到同一上下文、Schema、评测，所有入口完成迁移后 | 直接删会破坏报告/API/回退契约 |
| `main.py` 中与新持久化 Job Runner 重复的循环调度 | 新 runner 支持桌面、服务和 CLI，且完成迁移后 | 现有 `--schedule` 仍是用户入口 |
| 用环境变量保存 watchlist 的兼容路径 | 数据库 Watchlist 已迁移且旧版本兼容窗口结束后 | 当前 Web 和 CLI 仍依赖配置语义 |
| 一次性兼容迁移、自愈 backfill 和旧字段双写 | 数据迁移完成、schema version 可证明且发布窗口结束后 | 过早删除会损坏旧数据库升级 |
| 未再使用的报告 renderer/模板 | 所有通知、Web、Bot 消费端切到 canonical DTO 后 | 需要先做调用图和快照对比 |

删除原则：**以运行证据和契约迁移为依据，不以文件看起来旧或复杂为依据。**

## 7. 面向 Personal Investment Terminal 的能力落点

### 7.1 Watchlist

**现有可复用：**

- `apps/dsa-web/src/hooks/useWatchlist.ts`
- `HomeStockWorkspace.tsx`
- system config API 中的 watchlist 操作
- 股票搜索、代码规范化、行情获取、定时分析

**缺口：**当前更像一个全局股票代码列表，不是正式业务实体。

**建议新增领域模型：**

```text
watchlists
  id, owner_id, name, description, is_default, created_at

watchlist_items
  id, watchlist_id, instrument_id, rank, status,
  target_price, currency, thesis_id, tags, note,
  added_at, reviewed_at
```

不要把 target price、thesis 等继续塞进逗号分隔的环境变量。

### 7.2 Target Price

**现有可复用：**`analysis_history` 已有 ideal_buy、secondary_buy、stop_loss、take_profit；报告 Schema、sniper point 工具和 Decision Signal 也已有价格区间概念。

**关键区分：**“AI 本次报告给出的理想买点”不是“用户认可并维护的目标价”。建议建立独立、可版本化实体：

```text
price_targets
  id, instrument_id, owner_id, target_type,
  price, currency, valid_from, valid_until,
  thesis_revision_id, source_type(user/model/import),
  source_report_id, confidence, status, created_at
```

这样能保存 bull/base/bear 三种目标价，也能回答“目标价是谁在何时、基于哪版 thesis 修改的”。

### 7.3 Investment Thesis

**现有可复用：**研究产物、分析上下文快照、新闻证据、Agent research、历史比较和报告摘要。

**建议：**Thesis 应是用户拥有、AI 协助维护的版本化文档，而不是每次报告里的一段不可编辑文字：

```text
investment_theses
  id, instrument_id, owner_id, title, status, current_revision_id

thesis_revisions
  id, thesis_id, version, summary, bull_case, base_case, bear_case,
  catalysts_json, risks_json, invalidation_conditions_json,
  valuation_json, author_type, source_report_id, created_at
```

新闻或财报只生成“建议更新”，用户确认后才成为新 revision。这样可防止 LLM 每次运行悄悄改变长期投资逻辑。

### 7.4 WAIT / WATCH / BUY ZONE

**现有可复用：**operation advice、decision action/scale、Decision Signal、phase decision、ideal/secondary buy、止损止盈、告警规则。

**建议语义：**

- `WAIT`：当前不满足关注/买入前提；记录原因与重新评估条件。
- `WATCH`：论点成立但价格、催化剂或风险条件尚未满足。
- `BUY_ZONE`：价格进入预先定义的区间，且 thesis 未失效；它不是自动下单指令。

建议由确定性 Policy Engine 根据持久化条件计算状态，LLM 只能提供候选解释：

```text
decision_state = policy(
  active_thesis,
  latest_price,
  price_zone,
  invalidation_conditions,
  portfolio_exposure,
  data_freshness
)
```

状态变更写入 append-only history，并由 Alert Worker 发事件。不要只依赖自由文本 `operation_advice`。

### 7.5 分析历史

**现有基础最成熟：**`analysis_history`、history API/Repository/Service、Web HistoryList/TrendDrawer、context snapshot、Decision Signal outcome 和回测。

**建议增强：**

- 用 `instrument_id` 替代仅靠字符串 code 关联。
- 保存 prompt version、model/provider、数据 as-of 时间、数据质量和引用证据 ID。
- 分离 immutable analysis run 与用户可编辑 annotation。
- 报告之间建立 supersedes/comparison 关系。
- 提供可重放性：能知道当时模型看到了哪些数据，而不是拿今天的数据解释旧报告。

### 7.6 Dashboard

**现有可复用：**首页 Dashboard、report components、stock pool Zustand store、Recharts、Portfolio、Decision Signals、Alerts 和任务流可视化。

**建议 Dashboard 信息架构：**

1. 今日总览：净值、现金、风险敞口、市场状态。
2. Watchlist：最新价、目标价差、WAIT/WATCH/BUY ZONE、thesis 新鲜度。
3. 需要行动：进入区间、thesis 失效、数据过期、财报临近。
4. 组合：持仓、成本、盈亏、集中度和币种。
5. 研究：最新分析、证据变化、待确认 thesis 更新。
6. 系统健康：数据源、调度、模型用量和失败任务。

UI 只展示后端 canonical DTO，不在 React 组件里重新计算交易状态。

### 7.7 定时监控

**现有可复用：**ScheduleManager、RuntimeSchedulerService、Alert Worker、告警表、通知、交易日历、GitHub cron。

**建议两类任务分开：**

- **采集任务**：按市场/频率更新价格、基本面和新闻。
- **评估任务**：对 watchlist/portfolio 运行规则，仅在状态变化或冷却期结束后通知。

每次运行必须有 `monitor_run` 记录；使用 `(monitor_id, scheduled_for)` 幂等键避免 CLI、API 和 Actions 重复触发。桌面本地运行适合秒/分钟级监控，GitHub Actions 更适合日级批处理，不能假设其 cron 精准到分钟。

### 7.8 IBKR 接入

**当前状态：没有发现 Interactive Brokers / IBKR 专用实现。** 当前 `src/brokers/` 只有 Futu portfolio 读取；但已有完整 Portfolio 数据库模型、导入服务和 API，因此不必从零开始。

建议新增 `src/brokers/base.py`（或 protocols）和 `src/brokers/ibkr/`，先做**只读同步**：

```text
BrokerAdapter
  list_accounts()
  list_positions(account)
  list_trades(account, since)
  get_cash_balances(account)
  get_instrument_metadata(symbol)
```

阶段顺序：

1. IBKR 连接健康检查与账户发现。
2. 只读持仓/现金/成交同步到现有 Portfolio 服务。
3. symbol → instrument_id 映射和币种/汇率对账。
4. 幂等增量同步、差异报告、人工确认。
5. 只有在审计、风控、权限和 paper account 验证完成后，才单独设计下单；不要让 LLM 直接拥有交易权限。

Futu 当前代码可作为“如何隔离 SDK、校验账户和安全关闭连接”的参考，但不要复制其环境变量读取和 provider-specific 类型到通用 Portfolio 领域。

## 8. 推荐的目标架构

```text
Clients
  Web / Electron / CLI / Bot
              ↓
Versioned API + Application Services
              ↓
Domain
  Instrument ─ Watchlist ─ Thesis ─ PriceTarget ─ DecisionState
       │            │          │           │             │
       └──────── Portfolio ─ Monitor ─ Alert ─ AnalysisRun
              ↓
Ports (稳定接口)
  MarketData / News / LLM / Broker / Notification / Repository / Scheduler
              ↓
Adapters (可替换实现)
  AkShare/Tushare/...  Tavily/RSS/...  LiteLLM  Futu/IBKR  SQLite
```

核心原则：

1. **Instrument first**：稳定证券 ID 是所有数据的连接点。
2. **事实与意见分离**：价格/成交/财报是事实；thesis/AI 总结是意见。
3. **用户意图与模型建议分离**：用户 target 与模型估值不可互相覆盖。
4. **版本化**：Thesis、Prompt、Decision Policy 都可追踪版本。
5. **事件化但不过度微服务化**：单机模块化单体足够，先用同一 SQLite/进程内事件；不要为了“架构先进”拆微服务。
6. **只读券商优先**：Portfolio synchronization 与 order execution 是两种风险等级。
7. **可观察降级**：fallback 可以发生，但来源、新鲜度和缺失必须对用户可见。

## 9. 建议演进路线（避免推倒重来）

### Phase 0：建立基线

- 为核心流程画契约测试：给定固定行情/新闻 fixture，验证 context、decision 和 report。
- 记录 provider 成功率、延迟、数据新鲜度和 fallback。
- 建立 Prompt 清单和版本字段，但先不搬 Prompt。
- 明确 code/canonical_id 的现状与 Instrument 迁移方案。

### Phase 1：Terminal 核心数据模型

- 新增 Instrument、Watchlist/Item、Thesis/Revision、PriceTarget、DecisionStateHistory。
- 从现有 stock list 兼容导入默认 Watchlist；保留旧接口一段时间。
- 复用 history、decision signal 和 alerts，不复制平行表。

### Phase 2：Dashboard 与监控闭环

- 提供单一 Terminal Overview API。
- 将 WAIT/WATCH/BUY ZONE 做成 deterministic policy。
- 状态变化进入 alert/event；Dashboard 显示原因、数据时间和证据。
- 建立持久化 monitor run 与幂等调度。

### Phase 3：研究与 Prompt 治理

- Analyzer 与 Agent 共享 Research Context、Evidence 与 Decision DTO。
- Thesis 更新改为“AI 建议 → 用户确认 → 新 revision”。
- Prompt Registry、回归 eval、成本/用量和模型 fallback 可视化。

### Phase 4：券商同步

- 抽象 BrokerAdapter。
- 用现有 Futu 路径验证接口。
- 接 IBKR paper/read-only，完成对账、幂等和 symbol mapping。
- 实盘下单另立项目决策与安全评审，默认不做。

### Phase 5：收敛与删除

- 根据 telemetry 删除低价值 provider 和完成迁移的 legacy 路径。
- 把 SQLite migration 正式化。
- 只有当个人单机边界真的不够时，再评估 PostgreSQL、队列或服务拆分。

## 10. 主要风险与护栏

| 风险 | 护栏 |
| --- | --- |
| AI 把猜测当事实 | 所有结论引用 evidence ID；显示数据 as-of 和质量 |
| 目标价被新报告静默覆盖 | 用户值与模型建议分表/分 source；修改产生版本 |
| 多调度器重复执行 | 持久化 job + 幂等键 + owner lease |
| provider fallback 导致口径漂移 | 保存 provider、调整方式、币种、时区和字段质量 |
| 多市场代码冲突 | Instrument ID + provider symbol mapping |
| SQLite 并发和迁移风险 | 单 writer 策略、WAL/事务、显式迁移、备份恢复测试 |
| 通知疲劳 | 状态变化通知、severity、cooldown、quiet hours |
| 券商接入扩大风险 | 只读优先、最小权限、本地密钥、paper account、完整审计 |
| 前端重复业务规则 | 规则只在后端，前端展示 canonical DTO |
| 大规模重构造成回归 | expand-contract、小步迁移、双读/双写有明确退出期限 |

## 11. 当前结论

DSA 已经远超“每天跑一次的股票脚本”，它具备 Personal Investment Terminal 所需的大多数技术积木。最值得保留的是多数据源适配、分析历史、Portfolio、Decision Signal、Alert、API、Web 和桌面端；最需要重构的是超大 Pipeline/Storage/Search/Config、分散 Prompt，以及两套 AI 分析路径之间的契约。

第一步不应接 IBKR，也不应重写 UI；应先建立 **Instrument + 持久化 Watchlist + Thesis Revision + User Price Target + Decision State History**。这些对象稳定后，Dashboard、定时监控和券商同步才有可靠的落点。

本文建议保持“模块化单体 + SQLite + 可替换适配器”的部署形态，直到真实使用数据证明需要更复杂的基础设施。对个人终端而言，可理解、可备份、可回滚通常比微服务数量更重要。
