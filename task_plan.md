# Task Plan — 店小智（ShopHelp）AI 私域经营助手

## Goal

从零搭建面向中小商家的 AI 私域经营助手 Web 后台：AI 文案生成（10 场景）、AI 客户回复（12 场景）、客户管理、跟进任务、今日待办、套餐用量、平台管理后台。

- 完整计划快照：`C:\Users\Administrator\.claude\plans\ai-mvp-moonlit-curry.md`
- **v1.0 MVP（Phase 1–12）**：已完成交付。Owner：Claude Code（直接实现，经用户确认）
- **v1.1 迭代（Phase 13–17）**：账号体系分离 + 平台管理增强。**Owner：Codex（实现）/ Reviewer：Claude Code（审查）**，经用户确认
- Reviewer（最终）：用户（hanyongle1108@gmail.com）
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

---

## v1.1 迭代：账号体系分离 + 平台管理增强（Phase 13–17，Owner: Codex）

### 背景与用户决策

v1.0 的三类缺口：①管理员和商家共用 /login；②管理后台只读，无法操作商家/用户（套餐开通管理、封停禁用、编辑、重置密码）；③商家端没有修改密码。用户已确认（2026-07-16）：

- 重置密码方式 = **生成随机临时密码**（弹窗一次性展示，用户下次登录强制改密）
- 纳入：**管理端操作审计日志**、**套餐到期自动降级**
- 不做：多商家切换器、客户 CSV 导出、邮件重置链接（后续版本）

### 总体设计约定（Codex 必读）

- 遵循既有约定：Controller→Service 分层、租户隔离、DTO + class-validator、Swagger 标注、中文错误文案
- **安全红线**：
  1. 临时密码明文只出现在一次 API 响应中，不落日志、不落审计 detail
  2. 所有 admin 写接口必须在 PlatformAdminGuard 内 + 全部落审计
  3. 禁止对任何 `platformRole=ADMIN` 的账号执行禁用/重置密码（含自己）→ 400
  4. JwtAuthGuard 实时状态查询只 select 必要字段（status）
- **开发环境红线**：dev server 运行中不要跑 `next build`（共用 .next 会损坏 dev 缓存，v1.0 已踩坑）；API watch 运行中 prisma generate 会 EPERM，migration 前先停 API 进程

### Phase 13: v1.1 数据层 — Status: complete
- `apps/api/prisma/schema.prisma`：
  - User 增加 `status UserStatus @default(ACTIVE)`（ACTIVE|DISABLED）、`mustChangePassword Boolean @default(false)`
  - Merchant 增加 `status MerchantStatus @default(ACTIVE)`（ACTIVE|SUSPENDED）
  - 新模型 AdminAuditLog → `admin_audit_logs`：id/adminId(String? 系统操作为 null)/action(String)/targetType(String)/targetId(String)/detail(Json?)/createdAt；索引 `[createdAt]`、`[targetType, targetId]`
- migration 命名 `v1_1_account_admin`
- `packages/shared/src/enums.ts`：新增 UserStatus/MerchantStatus 枚举 + 中文 label；新增 AUDIT_ACTIONS 常量（MERCHANT_UPDATE/MERCHANT_STATUS/MERCHANT_SUBSCRIPTION/USER_UPDATE/USER_STATUS/USER_RESET_PASSWORD/SUBSCRIPTION_EXPIRED）
- **验收**：`pnpm db:migrate` 成功；`pnpm db:seed` 幂等重跑成功；`pnpm -r lint` 全绿

### Phase 14: v1.1 API 账号安全 — Status: complete
- `src/auth/`：
  - 新增 POST /auth/admin/login：仅 platformRole=ADMIN 可登录，否则 403「请使用商家端登录」
  - POST /auth/login 改造：拒绝 ADMIN 账号（403「请使用管理员入口登录」）；拒绝 status=DISABLED（403「账号已被禁用」）；refresh 同样校验
  - 新增 POST /auth/change-password：{oldPassword, newPassword(min 8)}，bcrypt 校验旧密码，成功后清 mustChangePassword
  - login/me 响应带出 mustChangePassword
- `src/common/guards/jwt-auth.guard.ts`：verify 通过后查 user.status（select 单字段），DISABLED → 401「账号已被禁用」
- **验收（curl）**：ADMIN 走 /auth/login 403；普通用户走 /auth/admin/login 403；DISABLED 用户登录/带旧 token 请求均被拒；改密后旧密码登录失败、新密码成功且 mustChangePassword 已清

### Phase 15: v1.1 API 管理扩展 — Status: complete
- `src/common/guards/merchant.guard.ts`：merchant.status=SUSPENDED 时普通成员访问 403，响应体带 `code: 'MERCHANT_SUSPENDED'`；平台管理员不受限
- `src/admin/` 新增接口（全部落审计）：
  - PATCH /admin/merchants/:id（编辑资料，复用 UpdateMerchantDto）
  - PATCH /admin/merchants/:id/status {status}
  - PATCH /admin/merchants/:id/subscription {plan, dailyGenerationLimit?, monthlyGenerationLimit?, expiresAt?}（缺省限额按 shared PLANS 默认值）
  - PATCH /admin/users/:id（name/email，email 冲突 409）
  - PATCH /admin/users/:id/status {status}（ADMIN 目标 → 400）
  - POST /admin/users/:id/reset-password：crypto 生成 12 位随机密码 → bcrypt 落库 + mustChangePassword=true，明文仅本次响应返回（ADMIN 目标 → 400）
  - GET /admin/audit-logs（分页，筛 targetType/action）
- 新增 `src/admin/audit.service.ts`：log(adminId, action, targetType, targetId, detail?)
- `src/jobs/daily-tasks.service.ts` 追加：plan=PRO && expiresAt<now → 降 FREE + 限额重置 FREE 默认 + 审计(adminId=null, SUBSCRIPTION_EXPIRED)，幂等
- **验收（curl）**：封停商家后其成员任意业务接口 403 且 code=MERCHANT_SUSPENDED、管理员仍可访问；套餐调整后 /ai/usage 限额同步变化；重置密码流转完整；对 ADMIN 操作 400；每个写操作在 /admin/audit-logs 可查；构造过期 PRO 订阅 → 手动触发 /admin/jobs/daily-tasks/run 降级生效且重复触发不重复记账

### Phase 16: v1.1 Web 管理端 — Status: complete
- 新增 `src/app/admin/login/page.tsx`：深色调视觉区分 + 「平台管理」标识，调 authApi.adminLogin，成功 → /admin
- `src/app/admin/layout.tsx`：未登录跳 /admin/login（AuthGuard 加 loginPath prop 复用）
- `src/components/main-layout.tsx`：移除侧边栏「平台管理」入口
- `src/lib/api.ts`：authApi.adminLogin + adminApi 补齐新接口封装；`src/lib/types.ts` 同步 status 字段
- admin/merchants/page.tsx：状态列 + 状态筛选；行操作：编辑 Modal、套餐 Modal（plan Select/限额 InputNumber/有效期 DatePicker/展示当前套餐）、封停/恢复 Popconfirm
- admin/users/page.tsx：状态列；行操作：编辑、禁用/启用、重置密码（结果 Modal 一次性展示临时密码 + 复制按钮 + 强制改密提示）；ADMIN 行操作置灰
- 新增 admin/audit/page.tsx（时间/操作人/动作/对象/详情表格），layout 菜单加「审计」
- **验收（浏览器）**：/admin/login 独立登录可用且普通账号被拒；商家封停/恢复、套餐调整、用户禁用、重置密码全部走通；审计页有对应记录；商家端侧边栏无管理入口

### Phase 17: v1.1 Web 商家端 + 回归交付 — Status: pending
- settings 页新增「账号安全」Tab：修改密码表单（旧密码+新密码+确认一致性校验）
- 强制改密：auth store 存 mustChangePassword，主布局挂不可关闭 Modal，改密成功后清除
- `src/lib/api-client.ts` 拦截器识别 code=MERCHANT_SUSPENDED → 跳转新增 `/suspended` 占位页（Result：商家已被平台封停，请联系客服）
- 扩展 `scripts/smoke-test.mjs` ≥6 条新用例：admin 双入口隔离/封停后成员 403/禁用登录拒绝/重置密码旧密失效+临时密可登+mustChangePassword=true/套餐调整生效/审计落库
- **验收**：改密与强制改密全流程浏览器走通；封停提示页生效；`pnpm -r lint && pnpm build` 全绿（先停 dev 进程）；冒烟脚本新旧用例全部通过（原 17 项回归不破）

## 预留扩展点（本期不做）

- 微信小程序：users.wechatOpenId 字段 + auth 预留策略位
- 微信支付：billing 模块 PaymentProvider 接口占位
- SaasLibrary 知识库：LlmProvider 对齐其 ChatProvider，后续 HTTP 调其 RAG 检索做上下文增强
- 邮件重置密码链接（需 SMTP）、多商家切换器、客户 CSV 导出、管理员 2FA

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| @nestjs/jwt v11 `expiresIn` 类型不接受 string | 1 | cast 为 `JwtSignOptions['expiresIn']` |
| express 5 类型 `req.params` 为 `string\|string[]` | 1 | MerchantGuard 内归一化取值；显式安装 @types/express |
| API dev 进程运行时 `prisma generate` EPERM（engine DLL 被锁） | 1 | schema 未变时直接 `npx tsc` 检查；全量构建前先停 API watch 进程 |
| bash curl 提交中文导致 mock 输入乱码 | 1 | 属 Windows curl 编码问题，浏览器端正常；清理 7 条脏记录 |
| /customers 500：dev ENOENT `.next/server/vendor-chunks/antd@...` | 1 | 根因：`next dev` 运行中执行了 `next build`（共用 `.next`）。杀 3000 端口旧进程 → 删 `.next` → 重启 dev。教训：dev 运行时不要跑 `next build` |
| 平台管理员登录被引导到 /onboarding | 1 | 登录跳转补充：无商家且 platformRole=ADMIN → /admin |
| PowerShell `if (git diff --cached --quiet)` 未按原生命令退出码判断，基线空提交未创建 | 1 | 改用先执行命令、再读取 `$LASTEXITCODE` 的显式判断 |
| PowerShell 端口检查脚本在 `foreach` 后直接接管道触发 `EmptyPipeElement` 解析错误 | 1 | 先把循环结果赋给数组变量，再单独 `Format-Table` |
| Phase 13 `pnpm -r lint` 的 API prelint 执行 `prisma generate` 时 EPERM，3001 端口虽已停止但 DLL 仍被占用 | 1 | 发现 Nest watch 父进程会重拉 API 子进程；停止完整 API watch 分支后重跑 lint 通过 |
| Phase 14 curl 验收脚本 cleanup 在仓库根目录 `require('bcryptjs')` 失败，掩盖测试结果 | 1 | bcryptjs 是 API workspace 依赖；改为在 `apps/api` 工作目录生成恢复 hash，并先核对/恢复 demo 状态 |
| Phase 14 Windows PowerShell 向 `curl.exe --data-binary` 传 JSON 字符串时引号被参数层破坏，发送非法 JSON | 2 | 第 1 次去掉手写转义仍失败；第 2 次后改用临时 UTF-8 JSON 文件 + `--data-binary @file`，完整 curl 验收通过 |
| Phase 14 curl 验收把 NestJS POST 成功响应预期为 200，实际默认是 201 | 1 | 将 login/admin login/change-password 的成功断言统一改为 201 |
| Phase 14 停 API 时按命令行模糊匹配进程，过滤文本命中当前 PowerShell 自身并提前终止 | 1 | 改为从 3001 监听 PID 读取明确父链，只停止该固定进程树 |
| Phase 14 清理后 3001 业务进程成为孤儿，父链查询未判空导致 WMI `Invalid query` | 1 | 已明确孤儿监听 PID 16960，直接停止并验证端口释放 |
| Phase 15 `pnpm -r lint` 时 API 看不到 shared 新增 `AUDIT_ACTIONS`，因 shared lint 不产出且 dist 尚未刷新 | 1 | 先执行 `pnpm --filter @shophelp/shared build` 刷新 dist，再原样重跑全仓 lint |
| Phase 16 Context7 未暴露 `resolve-library-id/query-docs`，资源/模板为空且无 CLI | 1 | 改用 Next.js 与 Ant Design 官方文档作为只读替代，并以仓库锁定版本与现有模式为准 |
| Phase 16 `codegraph files` 使用了不存在的 `--depth` 参数 | 1 | 先查看该命令 help，再按支持的参数读取索引文件树 |
| Phase 16 调整 Modal 表单初始值的合并补丁因 users 页上下文不匹配而未应用 | 1 | 分别读取 merchants/users 局部片段，拆成小补丁精确修改 |
| Phase 16 dev server 浏览器验收时 `agent-browser` CLI 未安装 | 1 | 改用已安装的 in-app Browser 控制技能；若连接不可用则使用仓库 Playwright |
| Phase 16 in-app Browser 所需的 Node browser-control 工具未在会话中暴露 | 1 | 按 Browser 技能要求停止该路径，改用仓库既有 Playwright 做真实浏览器走查 |
| Phase 16 `npx --package=playwright node -e require('playwright')` 无法解析一次性包 | 1 | 改用 Playwright test runner CLI 执行临时 spec，不从项目脚本直接 require |
| Phase 16 通过 PowerShell stdin 传入 Playwright 脚本时中文正则被转成 `????`，触发 SyntaxError | 1 | 改用 `apply_patch` 创建 UTF-8 临时脚本，执行完成后删除，避免管道编码破坏源码 |
| Phase 16 浏览器脚本按商家名关键字“示例”预筛选后未找到 demo 账号所属商家 | 1 | 不假设种子商家名称；先读取管理员商家全集，再按 owner.email 精确定位 `demo@shophelp.local` |
| Phase 16 管理登录页背景断言读取了 Next 根容器 `body > div`，未命中实际带渐变样式的内层容器 | 1 | 改为按 `style*="radial-gradient"` 定位真实视觉容器，保留独立深色登录页验收 |
| Phase 16 Playwright 定位 Ant Design Popconfirm 主按钮连续失败：可访问名分隔、旧弹层退场、重置密码弹层按钮视口定位 | 3 | 已按约定停止 Phase 16 验收并汇报；未绕过浏览器验收，Phase 16 保持 pending |
| （Claude 接手复盘）Popconfirm 三连败根因确认 | 4 | ①antd 给两字中文按钮可访问名插空格「确 认」→ 定位必须用 `/确\s*认/` 正则；②默认 1280 视口下固定右列弹出的确认按钮 x≈1660 在视口外 → 用 1720 宽视口；③antd v6 类名 `ant-modal-content`→`ant-modal-container`、Select 可见下拉项为 `.ant-select-item-option[title=...]`（role=option 是隐藏 a11y 列表）。验收脚本 24/24 通过（scratchpad/phase16-e2e.mjs，含 API 状态复位保证可重入） |
