# Findings — 店小智 MVP

## 环境（2026-07-10 实测）

- Node v22.22.3 / pnpm 11.5.3 / Docker 29.6.1 + Compose v5.3.0，全部可用
- 平台 Windows 11，Shell 为 PowerShell 5.1

## SaasLibrary（D:\000000code\AIcode01\SaasLibrary）约定 — 新项目对齐依据

- 包名 `ai-company-assistant`，pnpm monorepo：apps/api + apps/web + packages/shared
- **API 栈及版本**（直接复用这些已验证版本）：@nestjs/* 11.1.26、@nestjs/config 4.0.4、@nestjs/jwt 11.0.2、@nestjs/swagger 11.4.4、@nestjs/bullmq 11.0.4、bullmq 5.78.0、ioredis 5.11.1、prisma/@prisma/client 6.19.2、bcryptjs 3.0.3、class-validator 0.15.1、helmet 8、vitest 4.1.8、tsx 4.22.4、@nestjs/cli 11.0.23
- **Web 栈**：SaasLibrary 用 Vite SPA（react 19.2.7、antd 6.4.3、zustand 5、@tanstack/react-query 5.101、axios 1.17）；本项目按需求改用 Next.js App Router，但组件库版本对齐
- **架构规则**（ARCHITECTURE.md）：所有业务表必须带 company_id（本项目为 merchantId）且查询必须带租户条件，禁止裸 findMany/findFirst；Controller→Service→Repository，Controller 禁止直接访问 Prisma；AI 走 Provider Pattern（ChatProvider/EmbeddingProvider），便于切换 DeepSeek/OpenAI/阿里百炼/智谱
- **RAG 链路**：Document→Chunk→Embedding→pgvector→Retrieval→LLM（后续集成点：调用其检索接口增强店小智生成上下文）
- shared 包用 tsc 构建 dist + d.ts（SaasLibrary 为 ESM 且只有 web 引用；本项目 shared 需同时供 NestJS(CJS) 与 Next 使用，故输出 CJS）
- pnpm-workspace.yaml 使用 `allowBuilds` 白名单（prisma/@prisma/client/@prisma/engines/esbuild 等）+ `overrides` 固定 @types/node 22.19.0
- 根 scripts 惯例：dev = `pnpm --parallel -r --filter "./apps/*" run dev`；db:* 代理到 api 包；scripts/smoke-test.mjs 做冒烟

## 技术决策

- LLM 默认 DeepSeek（用户已有 Key），OpenAI 兼容 chat/completions；MockProvider 返回结构化假数据保证无 Key 可跑
- DeepSeek JSON 输出：response_format json_object + prompt 内给出 JSON 模板，解析失败重试 1 次后降级
- antd v6 + Tailwind v4 共存：不引入 Tailwind preflight（只 import theme + utilities 两层），避免重置样式打架 antd
- Next.js 15（App Router）+ @ant-design/nextjs-registry 做 SSR 样式收集；如 registry 与 antd6 不兼容则退化为纯 client 渲染
- BullMQ repeatable job（每天 06:00）扫描 nextFollowAt/follow_tasks 生成今日待办与 AI 建议；AI 生成本身走同步 HTTP
- 员工权限第一版简化为全员可见（customers.assignedToId 先落库不启用过滤）

## v1.1 设计决策（2026-07-16，Codex 实现时参照）

- 登录入口彻底分离：/auth/login 拒绝 ADMIN、/auth/admin/login 只收 ADMIN；前端 /admin/login 独立页面，商家侧边栏移除管理入口
- 封停传播机制：MerchantGuard 查 merchant.status，403 响应带 code=MERCHANT_SUSPENDED，前端 axios 拦截器统一识别跳 /suspended
- 禁用传播机制：JwtAuthGuard 每请求实时查 user.status（单字段 select，索引主键查询开销可接受），避免 30 分钟 access token 残留窗口
- 重置密码：crypto 随机 12 位 → bcrypt 落库 + mustChangePassword=true；明文只在响应出现一次；前端强制改密 Modal 不可关闭
- 审计：admin_audit_logs 表 adminId 可空（null=系统操作，如套餐到期降级）；所有 admin 写操作必落审计，detail 禁含明文密码
- 套餐到期降级挂在现有 BullMQ 每日任务里（daily-tasks.service.ts），非新队列
- 既有 `POST /admin/jobs/daily-tasks/run` 也属于 admin 写接口，v1.1 增加 `DAILY_TASKS_RUN` 审计动作；套餐到期降级另记 `SUBSCRIPTION_EXPIRED` 系统审计，重复触发不重复写入

## antd v6 浏览器自动化要点（2026-07-16，Phase 16 验收踩坑总结）

- 两字中文按钮的可访问名带空格：「确 认」「取 消」「确 定」「登 录」——Playwright `getByRole('button', {name})` 必须用正则 `/确\s*认/` 或带空格字面量
- Alert 组件 `message` prop 已废弃 → 用 `title`（v1.1 强制改密弹窗已按新 API 写）
- 拦截器触发的强制跳转（如封停跳 /suspended）会打断 page.goto 的 load 等待——测试里用 `waitUntil:'commit'` + `waitForURL`
- v6 类名变化：Modal 内容容器 `ant-modal-content` → `ant-modal-container`；Popconfirm 根类 `.ant-popconfirm`（同时保留 `.ant-popover`）
- Select 下拉：`role=option` 节点是隐藏的 a11y 列表不可点击；可见项是 `.ant-select-item-option[title="选项文案"]`
- 固定右列（fixed: 'right'）上的 Popconfirm 在 1280 默认视口下确认按钮会溢出视口——自动化用 ≥1720 宽视口
- E2E 脚本必须开头做 API 状态复位（上次中断的残留会让断言与初始态假设错位）
- 本地无 Playwright MCP 时的替代：scratchpad 装 playwright-core + `channel:'msedge'` 走系统 Edge，免下载浏览器

## 集成点备忘（后续阶段）

- SaasLibrary 聊天集成路由形态：`/chat-integrations/{provider}/{id}/events`，多租户凭 integration.companyId，不信任回调 payload——将来店小智接企业微信可复用此模式
