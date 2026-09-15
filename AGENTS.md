# AGENTS.md

本文件用于约束本仓库的默认开发流程，目标是减少重复沟通、减少返工，并让改动和当前项目结构保持一致。

如果本文件与仓库中的脚本、工作流、代码现状不一致，以实际可执行内容为准，并在相关改动中顺手修正文档，避免规则继续漂移。

## 1. 硬规则

- 遵循现有目录边界：
  - 后端逻辑优先放在 `src/`、`data_provider/`、`api/`、`bot/`
  - Web 前端改动在 `apps/dsa-web/`
  - 桌面端改动在 `apps/dsa-desktop/`
  - 部署与流水线改动在 `scripts/`、`.github/workflows/`、`docker/`
- 未经明确确认，不执行 `git commit`、`git tag`、`git push`。
- commit message 使用英文，不添加 `Co-Authored-By`。
- 不写死密钥、账号、路径、模型名、端口或环境差异逻辑。
- 优先复用现有模块、配置入口、脚本和测试，不新增平行实现。
- 默认稳定性优先于“顺手优化”；非当前任务直接需要的重构、抽象和基础设施迁移一律克制。
- 新增配置项时，必须同步更新 `.env.example` 和相关文档。
- 涉及用户可见能力、CLI/API 行为、部署方式、通知方式、报告结构变化时，必须同步更新相关文档与 `docs/CHANGELOG.md`。
- 修改报告格式、报告渲染效果或 Web UI 界面时，PR 描述必须附受影响报告 / 页面截图；涉及前后差异时优先附前后对比，无法截图时说明原因与替代可视证据。
- Issue / PR 过程截图、审查截图、一次性验收截图和临时可视证据不得作为仓库文件合入；应放在 PR 描述、PR 评论、GitHub 附件、Actions artifact 或外部可访问证据链接中。产品长期文档确需保留的示意图除外，但文件名和文档语义必须脱离具体 issue / PR 编号。
- `docs/CHANGELOG.md` 的 `[Unreleased]` 段使用**扁平格式**：每条独立一行，格式为 `- [类型] 描述`，类型取值：`新功能`/`改进`/`修复`/`文档`/`测试`/`chore`；**禁止在 `[Unreleased]` 内新增 `### 类目标题`**，以减少并发 PR 的 merge 冲突。发版时由 maintainer 汇总整理成带标题的正式格式。
- `README.md` 只用于项目定位、核心能力总览、快速开始、主要入口、赞助/合作等首页级信息；非必要不更新 README，避免持续膨胀。
- 更细的模块行为、页面交互、专题配置、排障说明、字段契约、实现语义和边界条件，优先更新对应 `docs/*.md` 或专题文档，不写入 README。
- 变更中英双语文档之一时，需评估另一份是否需要同步；若未同步，交付说明里要写明原因。
- 注释、docstring、日志文案以清晰准确为准，不强制要求英文，但应与文件语境保持一致。

## 1.1 PR 标题规范（非阻断建议）

- 推荐使用 `<类型>: <修改内容>` 作为 PR 标题，例如 `fix: 修复大盘分析历史记录丢失`，优先类型为 `fix`/`feat`/`refactor`/`docs`/`chore`/`test`/`ci`。
- 标题应描述实际变更内容，建议不添加 `[codex]`、`codex`、`autocode`、`copilot` 或其他工具/agent 来源前缀。
- 该规范仅用于协作可读性与一致性提示，不应单独作为 review process blocker。

## 1.2 贡献质量底线

- 本仓库不接受以堆叠代码量、扩大 diff 面、补丁式响应 review 来替代真实设计收敛的 PR。
- 贡献质量以是否解决明确问题、是否最小化影响面、是否保持现有契约一致、是否覆盖真实风险路径为准；不以新增行数、文件数量、功能宣传或“看起来完整”为准。
- 请不要把本仓库当作低成本试验场、简历展示场或 contribution farming 场所。任何 PR 都必须证明作者理解当前系统契约，并完成基本自审、集成和验证。
- 使用 AI 辅助开发本身不是问题；问题是提交 AI 生成后未经人工语义审查、未验证、未收敛的代码。此类 PR 会按低质量提交处理。
- review 反馈后，不接受只在被指出的位置追加局部 patch。作者必须重新检查同一业务语义涉及的所有入口、配置、测试、文档、workflow 和用户可见路径。
- 如果一个 PR 在多轮 review 后仍持续出现同类契约漂移、重复 fallback、测试绕过真实风险层、PR body 与实际 diff 不一致等问题，维护者可以要求关闭重做，而不是继续逐点 review。

## 2. AI 协作资产治理

- `AGENTS.md` 是仓库内 AI 协作规则的唯一真源。
- `CLAUDE.md` 必须是指向 `AGENTS.md` 的软链接，用于兼容 Claude 生态。
- `.github/copilot-instructions.md` 与 `.github/instructions/*.instructions.md` 是 GitHub Copilot / Coding Agent 的镜像或分层补充；若与本文件冲突，以 `AGENTS.md` 为准。
- 仓库协作 skill 存放在 `.claude/skills/`，分析产物存放在 `.claude/reviews/`；前者可以入库，后者默认视为本地产物。
- 根目录 `SKILL.md` 与 `docs/openclaw-skill-integration.md` 属于产品或外部集成说明，不是仓库协作规则真源。
- 若未来新增 `.agents/skills/` 或其他 agent 专用目录，必须先明确单一真源，再通过脚本或镜像同步；禁止手工长期维护多份同义内容。
- 修改 AI 协作治理资产时，执行：

```bash
python scripts/check_ai_assets.py
```

## 3. 仓库速览

- 项目定位：股票智能分析系统，覆盖 A 股、港股、美股。
- 主流程：抓取数据 -> 技术分析/新闻检索 -> LLM 分析 -> 生成报告 -> 通知推送。
- 关键入口：
  - `main.py`：分析任务主入口
  - `server.py`：FastAPI 服务入口
  - `apps/dsa-web/`：Web 前端
  - `apps/dsa-desktop/`：Electron 桌面端
  - `.github/workflows/`：CI、发布、每日任务
- 核心职责：
  - `src/core/`：主流程编排
  - `src/services/`：业务服务层
  - `src/repositories/`：数据访问层
  - `src/reports/`：报告生成
  - `src/schemas/`：Schema / 数据结构
  - `data_provider/`：多数据源适配与 fallback
  - `api/`：FastAPI API
  - `bot/`：机器人接入
  - `scripts/`：本地脚本
  - `.github/scripts/`：GitHub 自动化脚本
  - `tests/`：pytest 测试
  - `docs/`：文档与说明

## 4. 常用命令

### 运行应用

```bash
python main.py
python main.py --debug
python main.py --dry-run
python main.py --stocks 600519,hk00700,AAPL
python main.py --market-review
python main.py --schedule
python main.py --serve
python main.py --serve-only
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### 后端验证

```bash
pip install -r requirements.txt
pip install flake8 pytest
./scripts/ci_gate.sh
python -m pytest -m "not network"
python -m py_compile <changed_python_files>
```

### Web / Desktop

```bash
cd apps/dsa-web
npm ci
npm run lint
npm run build

cd ../dsa-desktop
npm install
npm run build
```

### PR / CI 证据

```bash
gh pr view <pr_number>
gh pr checks <pr_number>
gh run view <run_id> --log-failed
```

## 5. 默认工作流

1. 先判断任务类型：`fix / feat / refactor / docs / chore / test / review`
2. 先读现有实现、配置、测试、脚本、工作流和文档，再动手修改。
3. 识别改动边界：后端 / API / Web / Desktop / Workflow / Docs / AI 协作资产。
4. 先判断是否命中高风险区域：配置语义、API / Schema、数据源 fallback、报告结构、认证、调度、发布流程、桌面端启动链路。
5. 只做和当前任务直接相关的最小改动，不顺手夹带无关重构。
6. 如果发现文档、脚本、工作流描述不一致，优先信任实际代码与工作流，再决定是否顺手修正文档。
7. 改完后按下面的验证矩阵执行检查。
8. 最终交付默认要说明：
   - 改了什么
   - 为什么这么改
   - 验证情况
   - 未验证项
   - 风险点
   - 回滚方式

## 6. 验证矩阵

### CI 覆盖原则

当前仓库 CI 主要包含：

| 检查项 | 来源 | 说明 | 是否阻断 |
| --- | --- | --- | --- |
| `ai-governance` | `.github/workflows/ci.yml` | 校验 `AGENTS.md` / `CLAUDE.md` / `.github` 指令 / `.claude/skills` 关系 | 是 |
| `backend-gate` | `.github/workflows/ci.yml` | 执行 `./scripts/ci_gate.sh` | 是 |
| `docker-build` | `.github/workflows/ci.yml` | Docker 构建与关键模块导入 smoke | 是 |
| `web-gate` | `.github/workflows/ci.yml` | 前端改动时执行 `npm run lint` + `npm run build` | 是（触发时） |
| `network-smoke` | `.github/workflows/network-smoke.yml` | `pytest -m network` + `scripts/test.sh quick` | 否，观测项 |
| `pr-review` | `.github/workflows/pr-review.yml` | PR 静态检查 + AI 审查 + 自动标签 | 否，辅助项 |

若 PR 上已有对应 CI 结果，可直接引用 CI 结论；若 CI 未覆盖改动面，或本地与 CI 环境差异较大，需要补充说明本地验证与缺口。

### 按改动面执行

- Python 后端改动：
  - 适用范围：`main.py`、`src/`、`data_provider/`、`api/`、`bot/`、`tests/`
  - 优先执行：`./scripts/ci_gate.sh`
  - 最低要求：`python -m py_compile <changed_python_files>`
  - 若影响 API、任务编排、报告生成、通知发送、数据源 fallback、认证、调度，交付说明中要写明是否覆盖了对应路径。

- Web 前端改动：
  - 适用范围：`apps/dsa-web/`
  - 默认执行：`cd apps/dsa-web && npm ci && npm run lint && npm run build`
  - 若涉及 API 联调、路由、状态管理、Markdown/图表渲染或认证状态，交付说明中要明确说明联动面和未覆盖风险。

- 桌面端改动：
  - 适用范围：`apps/dsa-desktop/`、`scripts/run-desktop.ps1`、`scripts/build-desktop*.ps1`、`scripts/build-*.sh`、`docs/desktop-package.md`
  - 默认执行：先构建 Web，再构建桌面端
  - 如受平台限制未能完整验证，需要明确说明是否验证了 Web 构建产物、Electron 构建以及 Release 工作流影响。

- API / Schema / 认证联动改动：
  - 适用范围：`api/**`、`src/schemas/**`、`src/services/**`、`apps/dsa-web/**`、`apps/dsa-desktop/**`
  - 至少覆盖对应后端验证 + 受影响客户端构建验证。
  - 若涉及登录、Cookie、会话、轮询状态、字段增删或枚举变化，必须明确写出兼容性影响。

- 文档与治理文件改动：
  - 适用范围：`README.md`、`docs/**`、`AGENTS.md`、`.github/copilot-instructions.md`、`.github/instructions/**`、`.claude/skills/**`
  - 不强制代码测试。
  - 需确认命令、配置项、文件名、工作流名称与实际仓库一致。
  - 改动 AI 协作治理资产时，执行 `python scripts/check_ai_assets.py`。

- 工作流 / 脚本 / Docker 改动：
  - 适用范围：`.github/**`、`scripts/**`、`docker/**`
  - 运行最接近改动面的本地验证。
  - 交付时说明影响了哪条流水线、发布路径或部署路径。
  - 若未执行 Docker / GitHub Actions 相关验证，明确说明原因与潜在风险。

- 网络或三方依赖相关改动：
  - 先跑离线或确定性检查。
  - 优先确认 timeout、retry、fallback、异常文案、降级路径是否仍然成立。
  - 若未执行在线验证，必须明确写出原因。

## 7. 稳定性护栏

- 配置与运行入口：
  - 修改 `.env` 语义、默认值、CLI 参数、服务启动方式、调度语义时，要同时评估本地运行、Docker、GitHub Actions、API、Web、Desktop 的影响。
  - 新配置优先做到“不配置也可运行，配置后增强能力”，避免叠加开关和互斥模式。

- 数据源与 fallback：
  - 修改 `data_provider/` 时，要关注数据源优先级、失败降级、字段标准化、缓存与超时策略。
  - 单一数据源失败不应拖垮整个分析流程，除非需求明确要求 fail-fast。

- API / Web / Desktop 兼容：
  - 改 API / Schema / 认证 / 报告载荷时，要同时检查后端、Web、Desktop 的兼容性。
  - 默认优先追加字段、保留旧字段或提供兼容层，避免无提示破坏现有客户端。

- 报告 / Prompt / 通知：
  - 修改报告结构、Prompt、提取器、通知模板、机器人链路时，要检查上游输入与下游消费方是否仍兼容。
  - 单一通知渠道失败不应拖垮整个分析主流程，除非需求明确要求 fail-fast。
  - 修改 `src/services/image_stock_extractor.py` 中 `EXTRACT_PROMPT` 时，要在 PR 描述中附完整最新 prompt。

- 工作流 / 发布 / 打包：
  - 修改自动 tag、Release、Docker 发布、日常分析或桌面端打包流程时，要评估触发条件、产物路径、权限边界和回滚方式。
  - 自动 tag 默认保持 opt-in：只有 commit title 含 `#patch`、`#minor`、`#major` 才触发版本号更新，除非需求明确要求改变发布策略。

## 8. Issue / PR / Skill 工作流

- 仓库内已有以下 skill，可优先复用：
  - `.claude/skills/analyze-issue/SKILL.md`
  - `.claude/skills/analyze-pr/SKILL.md`
  - `.claude/skills/fix-issue/SKILL.md`
- 如果任务明确是 issue 分析、PR 审查、issue 修复，优先按对应 skill 执行，并将产物保存到 `.claude/reviews/`。
- skill 中的命令、模板、验证顺序和交付结构必须与 `AGENTS.md` 保持一致。
- 每次进行 PR 创建 / 更新、PR 审查或 issue 分析前，必须先同步最新代码基线：先检查工作区状态并执行 `git fetch --all --prune`；若工作区干净且当前分支可 fast-forward，则执行 `git pull --ff-only`。如存在本地改动、冲突状态、未跟踪风险文件或无法 fast-forward，不得强行切分支、stash、reset 或覆盖本地状态；PR 审查 / issue 分析可改用已 fetch 的远端 refs/PR head 做分析，并在分析文档中明确记录未更新本地工作树的原因、当前本地 HEAD 与使用的远端基线；PR 创建 / 更新应先说明当前分支与目标基线差异，必要时请求用户确认 rebase、merge 或继续基于当前分支推进。
- skill 默认优先读取 CI / 工作流证据，再决定是否补本地验证。
- 除上述 PR 创建 / 更新、PR 审查 / issue 分析的安全 fast-forward 同步外，skill 不得默认执行 `git pull`、`git push`、`git tag`、`gh pr create` 等会改变远端或当前分支状态的操作；这些操作必须要求用户确认。
- PR 审查默认顺序：
  1. 必要性
  2. 关联性
  3. 标题建议（`<类型>: <修改内容>`，且不含工具/agent 前缀；不作为硬性阻断项）
  4. 描述完整性（对照 `.github/PULL_REQUEST_TEMPLATE.md`）
  5. 验证证据
  6. 实现正确性
  7. 合入判定
- 对 `fix` 类 PR，必须说明：原问题、根因、修复点、回归风险。
- 合入阻断条件：
  - 正确性或安全性问题
  - 阻断型 CI 未通过
  - PR 描述与实际改动内容实质性矛盾
  - 缺少回滚方案
  - 反复出现未收敛的契约漂移、补丁堆叠或验证证据失真

## 8.1 Review 反馈处理与补丁堆叠禁止

当你处理 review 反馈时，禁止只在 reviewer 点名的位置追加局部 patch 后声称“已全部修复”。你必须先重新理解 reviewer 指出的业务契约，再检查同一语义涉及的所有入口、配置、测试、文档、workflow 和用户可见路径。

收到 review 反馈后，必须按以下顺序处理：

1. 逐条列出 reviewer 指出的原问题。
2. 说明根因，不能只描述“改了哪几行”。
3. 找出同一语义影响的所有相关路径，例如 runtime、API/Web、CLI、diagnostics、workflow、docs、tests。
4. 修复完整契约，而不是只修复当前失败测试或当前评论行。
5. 补充能覆盖 reviewer 反例的回归测试、最终入口验证，或明确说明无法验证的原因。
6. 同步更新 PR body，保证 scope、验证结果、兼容性、风险和回滚方案与当前 head 一致。

如果你无法完成上述收敛，不要继续堆叠补丁，不要声称 ready for merge。应主动说明当前 PR 需要拆分、关闭重做，或请求维护者确认新的最小范围。

以下行为会被视为低质量 PR：

- 用 broad fallback、静默降级、`return False/None/[]` 掩盖不清晰的契约。
- 测试 mock 掉真实风险层，只证明局部实现通过。
- CI 通过后声称问题已关闭，但没有覆盖 reviewer 指出的反例。
- PR body 与实际 diff、验证结果或兼容风险不一致。
- review 后继续追加零散 patch，而不是重新收敛完整语义。
- 同一业务语义在 runtime、Web/API、docs、workflow、tests 中表现不一致。

CI 通过只能说明自动检查通过，不能替代人工语义收敛，也不能单独证明 reviewer 指出的反例已经关闭。

## 9. 交付与发布

- 默认交付结构：
  - `改了什么`
  - `为什么这么改`
  - `验证情况`
  - `未验证项`
  - `风险点`
  - `回滚方式`
- 如果是 `docs` 任务，可直接写：`Docs only, tests not run`，但仍需说明是否核对了命令和文件名。
- 自动 tag 默认不触发，只有 commit title 包含 `#patch`、`#minor`、`#major` 才会触发版本号更新。
- 手动打 tag 必须使用 annotated tag。
- 用户可见变更优先通过 PR 合入，并补齐 label 与验证说明。

## 10. 个人长期维护模式

本节补充个人长期维护原则，不重复前述贡献、CI 和发布规则。优先级为：用户本次明确指令 → 本文件中最具体的规则 → 其他仓库文档。代码用于确认技术事实，不能扩大用户授权；无关的文档漂移只记录，不顺手修改。

### 10.1 长期目标与协作边界

- 以长期可理解、可升级、可回滚、可替换为首要目标；新能力应能单独测试、关闭、替换或删除，个人定制不得散落在构建产物和隐蔽位置。
- 默认用简明中文沟通，先说结果和影响，再说明必要技术细节。证据不足时明确写“暂不判断”，不把推测写成事实。
- 用户决定产品取舍、投资语义、数据来源、成本、隐私、自动化程度和不可逆操作；普通实现细节按现有架构处理。
- “只检查”“只报告原因”“视觉修改”“不动现有功能”等范围声明是硬边界。中高风险改动先给简短变更卡，写明目标、模块落点、保持不变项、验证和回滚；普通低风险实现无需用长计划拖延。
- 不擅自提交、推送、合并、发布、自动交易、删除用户数据、重置配置或覆盖安装目录。

### 10.2 源码、产物与运行数据

- **源码仓库**必须有可验证的 `HEAD`、远端、分支和状态，是长期修改的唯一真源；`dist/`、`build/`、打包静态资源、`app.asar` 和后端可执行包只用于核验。
- 安装文件、`.env`、数据库、日志、自选股、持仓和缓存属于运行态，未经部署或修复授权不覆盖。
- 不直接修改 `node_modules/`、`static/assets/`、`resources/app.asar`、安装包 `_internal/` 等生成物；紧急产物补丁必须回写源码并验证，否则标记为临时补丁。
- 只有安装产物、源码快照或无有效 `HEAD` 时停止写入，只提供只读分析和可审查方案。

### 10.3 架构、配置与规模

- 依赖方向为：入口或界面 → 用例服务 → 领域规则或仓储接口 → 外部适配器；下层不得反向依赖 API、页面或桌面壳。
- 新功能先明确触发入口、输入输出、规则归属、数据来源、失败表现、旧行为和回滚方式；跨层功能形成可追踪的垂直链路，每层只做本层工作。
- 新数据源、通知和模型渠道复用现有接口与集中注册点；新分析能力进入独立 service、schema 或既有 Agent skill/tool。`pipeline.py` 只编排，`App.tsx` 只保留路由和懒加载，Electron 只做系统集成。
- 只有出现第二个真实实现、需要独立替换或测试隔离确有价值时，才新增接口、基类、注册器或抽象层；不得为假想未来创建空框架。
- 新配置必须只有一个权威定义，并同步处理默认值、类型、校验、敏感性、界面可见性、`.env.example`、导入导出和文档。
- `config_registry.py`、`system_config_service.py` 等巨型文件冻结增长。预警线：新生产文件 400 行、React 页面/组件 300 行、函数 60 行；巨型文件预计新增约 100 行生产逻辑时先提出模块落点。超出不是机械阻断，但需说明理由。
- 不用 `misc.py`、`helpers.py`、`common.py`、`utils.ts` 收纳无关逻辑；同一业务规则出现第二份时收敛到权威实现。
- 新依赖必须证明现有标准库和已安装依赖不能合理解决问题，并评估体积、许可证、更新与离线影响。功能开关只用于真实渐进发布、成本控制或可选能力；临时兼容层、旧字段和弃用开关应写明删除条件。
- 新表或字段必须提供幂等迁移、旧数据读取路径和失败恢复办法。改变已有字段含义时优先新增版本化字段或显式迁移，不静默重解释历史数据。用户自选股、持仓、配置、报告历史和密钥不得成为测试数据或被初始化逻辑覆盖。

### 10.4 产品契约与执行

- 不伪造行情、新闻、财务数据、回测结果、模型来源或验证状态；明确区分实时、延迟、缓存、历史和缺失。失败不得伪装为空结果，fallback 保留来源、时间、原因和字段语义。
- 修改评分、买卖信号、风险等级、回测口径、Prompt 或报告字段前，先固定旧语义与样例。分析功能不得在用户不知情时演变为下单或自动交易功能。
- API 优先追加兼容字段；删除或改名需要迁移期和客户端联动。后端 schema 变化应同步检查 Web `types/`、`api/`、页面消费方和桌面启动链路。
- Web 视觉修改优先通过现有 token、主题层和共享组件完成，不改变路由、状态、API 或交互语义。`apps/dsa-web/src/financial-theme.css` 是个人视觉定制的集中入口，同类覆盖不要重新散落到页面组件。
- 打包版本、Web 构建版本、更新源与 changelog 必须一致；不能仅凭文件夹名或构建成功声称版本一致。
- 最小化读取密钥、账户和个人数据，不展示、提交或记录真实密钥和完整持仓；日志脱敏但不吞错，测试使用最小假数据，截图避开真实账户和持仓。
- 改动前确认源码、提交、分支、远端和状态，并检查目标入口、下游、测试和稳定契约。一次变更只解决一个主要目的，不夹带无关修复。
- 不用 broad fallback、吞错、重复重试或 mock 掉真实风险层来换取测试通过；至少一项测试覆盖真实模块边界，并按第 6 节执行最接近风险的验证。
- 除无有效源码仓库外，遇到以下情况也停止写入并先报告：源码与运行安装版无法对应；用户数据或密钥可能被覆盖且无可靠恢复路径；修改会改变投资信号、交易动作、数据口径或自动化范围而用户尚未决定；需要破坏兼容、重写数据库、强制更新、推送、合并或发布但未获授权；一个任务已演变成多个无法用同一回滚点恢复的独立重构。
- 停止时先完成仍可安全完成的只读分析，给出具体阻点和选择，不只说“需要更多信息”。
- 交付需说明用户可见变化、模块落点、保持不变项、验证与缺口、风险、回滚，以及对同步、更新、配置、数据库和个人数据的影响；简单任务合并说明。

### 10.5 准则维护

- 本节只记录长期稳定原则，不记录单次任务过程、当前安装版本、固定提交号或容易漂移的文件行数。
- 大版本升级后核对目录、入口、命令、工作流和巨型文件清单；能合并进旧规则时不新增同义规则，接近指令大小上限时优先压缩去重。只有用户的明确新指令可以降低这些边界。
