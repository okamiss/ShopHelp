# Task Plan — 店小智（ShopHelp）AI 私域经营助手 MVP

## Goal

从零搭建面向中小商家的 AI 私域经营助手 Web 后台：AI 文案生成（10 场景）、AI 客户回复（12 场景）、客户管理、跟进任务、今日待办、套餐用量、平台管理后台。

- 完整计划快照：`C:\Users\Administrator\.claude\plans\ai-mvp-moonlit-curry.md`
- Owner：Claude Code（本次由 Claude 直接实现，经用户确认）
- Reviewer：用户（hanyongle1108@gmail.com）；后续迭代可切回 Codex 实现 + Claude 审查
- LLM：默认 DeepSeek（OpenAI 兼容 API），内置 MockProvider 无 Key 兜底

## 技术基线（对齐 SaasLibrary 约定）

- pnpm monorepo：`apps/api`（NestJS 11 + Prisma 6 + BullMQ）+ `apps/web`（Next.js 15 App Router + antd v6 + Tailwind v4）+ `packages/shared`
- 多租户：业务表全部带 `merchantId`，查询必须租户隔离；Controller → Service 分层，Controller 不直接碰 Prisma
- 包名前缀 `@shophelp/*`；Node ≥22、pnpm 11

## Phases

### Phase 1: 脚手架 — Status: complete
- planning 三件套、pnpm workspace、tsconfig.base、.env.example、docker-compose(pg16+redis7)
- packages/shared（枚举/场景常量/输出类型，CJS 构建）
- apps/api NestJS 骨架（main/app.module/health）、apps/web Next.js 骨架（layout/globals，Tailwind 无 preflight）
- **验收**：`pnpm install` 成功；`docker compose up -d` 两容器 healthy；`pnpm -r lint` 通过

### Phase 2: 数据层 — Status: complete
- Prisma schema 11 表：users/merchants/merchant_members/products/customers/customer_notes/customer_tags/ai_generations/follow_tasks/subscriptions/usage_records
- migrate + seed（平台管理员、演示商家含产品/客户/标签/任务、FREE/PRO 套餐、行业列表）
- **验收**：`prisma migrate dev` 成功建表；seed 幂等执行成功

### Phase 3: API 核心 — Status: complete
- auth（注册/登录/refresh/me，JWT access+refresh，bcryptjs）
- merchants（创建商家/选行业/资料配置/成员管理）
- 守卫链：JwtGuard → MerchantGuard（租户注入）→ RolesGuard
- **验收**：注册→登录→建商家→改资料 API 全通；非成员访问他人商家 403；Swagger 可浏览

### Phase 4: API 业务 — Status: complete
- products CRUD；customers CRUD + 意向 A/B/C/D + 状态流转 + 标签 + 跟进记录 + nextFollowAt；follow-tasks CRUD
- **验收**：CRUD 全通；跨租户读写被拒；列表支持筛选分页

### Phase 5: API AI — Status: complete
- LlmProvider 接口 + DeepSeekProvider + MockProvider（注册表模式，预留 OpenAI/通义/混元）
- 22 个场景 Prompt 模板（拼接商家资料/产品/客户上下文），输出 JSON `{versions[≥3], recommendedIndex, tips}`
- POST /ai/copywriting、/ai/reply、/ai/follow-up；生成历史/收藏；QuotaGuard 配额 + usage_records 记账
- **验收**：Mock 与 DeepSeek 均产出 3 版本结构化 JSON；超配额返回 429；记录落 ai_generations

### Phase 6: API 聚合 — Status: complete
- dashboard 聚合接口（今日待办/待跟进/高意向/最近生成/用量/今日 AI 建议）
- admin 模块（商家/用户/用量，PLATFORM_ADMIN）；BullMQ 每日任务生成今日待办
- **验收**：聚合接口字段齐全；普通用户访问 admin 403

### Phase 7: Web 基座 — Status: complete
- Next.js + antd v6(zhCN) + Tailwind(无 preflight) + axios(refresh 拦截器) + TanStack Query + Zustand
- 登录/注册页、主布局（Sider 导航）、路由守卫
- **验收**：未登录跳 /login；登录后进入主布局；`pnpm --filter web build` 通过

### Phase 8: Web 引导+首页 — Status: complete（onboarding 新号全流程留待 Phase 12 端到端验证）
- onboarding 三步向导（建商家→选行业→资料配置）；Dashboard 首页 7 个板块
- **验收**：新账号注册后强制走完引导；首页各板块数据来自聚合接口

### Phase 9: Web AI — Status: complete
- AI 文案中心（10 场景卡片）+ AI 回复助手（12 场景）：表单→3 版本卡片（适用场景/推荐标/复制/收藏）→历史
- **验收**：端到端生成、复制、收藏、历史回看全通

### Phase 10: Web 业务页 — Status: complete
- 客户列表（筛选/意向/状态/标签）、客户详情（时间线+AI 跟进话术）、产品页、跟进任务页
- **验收**：增删改查全通；客户详情可一键生成跟进话术并落历史

### Phase 11: Web 收尾 — Status: complete
- 套餐页（用量进度）、设置页（商家资料/成员）、经营日报占位页、平台管理后台 3 页
- **验收**：14 个页面全部可达且无 500

### Phase 12: 交付 — Status: complete
- docker-compose.prod.yml + Dockerfile、README、scripts/smoke-test.mjs、Playwright 端到端、`pnpm -r lint && build` 全绿
- **验收**：冒烟脚本全通；浏览器端到端走查通过

## 预留扩展点（本期不做）

- 微信小程序：users.wechatOpenId 字段 + auth 预留策略位
- 微信支付：billing 模块 PaymentProvider 接口占位
- SaasLibrary 知识库：LlmProvider 对齐其 ChatProvider，后续 HTTP 调其 RAG 检索做上下文增强

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| @nestjs/jwt v11 `expiresIn` 类型不接受 string | 1 | cast 为 `JwtSignOptions['expiresIn']` |
| express 5 类型 `req.params` 为 `string\|string[]` | 1 | MerchantGuard 内归一化取值；显式安装 @types/express |
| API dev 进程运行时 `prisma generate` EPERM（engine DLL 被锁） | 1 | schema 未变时直接 `npx tsc` 检查；全量构建前先停 API watch 进程 |
| bash curl 提交中文导致 mock 输入乱码 | 1 | 属 Windows curl 编码问题，浏览器端正常；清理 7 条脏记录 |
| /customers 500：dev ENOENT `.next/server/vendor-chunks/antd@...` | 1 | 根因：`next dev` 运行中执行了 `next build`（共用 `.next`）。杀 3000 端口旧进程 → 删 `.next` → 重启 dev。教训：dev 运行时不要跑 `next build` |
| 平台管理员登录被引导到 /onboarding | 1 | 登录跳转补充：无商家且 platformRole=ADMIN → /admin |
