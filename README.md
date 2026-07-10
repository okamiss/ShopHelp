# 店小智 ShopHelp — AI 私域经营助手

面向中小商家的 AI 经营助手 Web 后台：帮老板生成朋友圈/社群/小红书文案、客户回复话术、客户跟进提醒和每日经营待办。

## 功能一览

- **AI 文案中心**：朋友圈、微信群通知、小红书、抖音口播、新品推广、优惠活动、老客复购、沉睡唤醒、成交催单、拒绝跟进（10 场景），每次输出 3 个版本 + 适用场景标注 + AI 推荐 + 一键复制 + 收藏为话术
- **AI 回复助手**：问价格、嫌贵、要优惠、考虑一下、不回复、预约/取消、比较竞品、质疑效果、要案例、问地址、问流程（12 场景），自动带入商家资料/产品卖点/客户档案
- **客户管理**：意向等级 A/B/C/D、状态流转（未沟通/沟通中/已成交/已流失/已复购）、标签、跟进时间线、下次跟进时间、客户详情页一键生成 AI 跟进话术
- **跟进任务与今日待办**：手工任务 + 每天 06:00 自动为到期客户生成待办（BullMQ）
- **Dashboard**：今日待办、待跟进客户、高意向客户、今日 AI 建议、快捷生成、最近生成、套餐用量
- **套餐与用量**：FREE/PRO 套餐，日/月生成次数限额（超限 429），用量记账
- **平台管理后台**：商家/用户/用量总览（平台管理员）

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Next.js 15 (App Router) + TypeScript + Ant Design v6 + Tailwind v4 + Zustand + TanStack Query |
| 后端 | NestJS 11 + TypeScript + Swagger |
| 数据 | PostgreSQL 16 + Prisma 6；Redis 7 + BullMQ |
| AI | 统一 LlmProvider（默认 DeepSeek，内置 Mock 兜底；预留 OpenAI/通义/腾讯混元） |
| 部署 | Docker Compose |

Monorepo 结构：

```
apps/api        NestJS 后端（prisma/ 含 schema 与 seed）
apps/web        Next.js 前端
packages/shared 前后端共享的枚举 / AI 场景 / 套餐定义
scripts/        smoke-test.mjs 冒烟测试
```

## 本地开发

前置：Node ≥ 22、pnpm ≥ 11、Docker

```bash
# 1. 启动 Postgres + Redis
docker compose up -d

# 2. 安装依赖
pnpm install

# 3. 配置环境（首次）
cp .env.example .env          # Windows: Copy-Item .env.example .env
# apps/api/.env 只需 DATABASE_URL（Prisma CLI 用），已有默认值

# 4. 建表 + 种子数据
pnpm db:migrate
pnpm db:seed

# 5. 同时启动 API(3001) 和 Web(3000)
pnpm dev
```

访问 http://localhost:3000 ，Swagger 文档在 http://localhost:3001/docs 。

### 种子账号

| 角色 | 账号 | 密码 |
| --- | --- | --- |
| 平台管理员 | admin@shophelp.local | Admin123456 |
| 演示商家老板 | demo@shophelp.local | Demo123456 |

### 接入 DeepSeek

默认 `LLM_PROVIDER=mock`（返回演示数据，无需 Key 即可跑通全流程）。要用真实模型，在根目录 `.env` 修改：

```env
LLM_PROVIDER="deepseek"
DEEPSEEK_API_KEY="sk-..."
```

Key 缺失时自动回退 mock，不会报错。新增供应商实现 `apps/api/src/ai/llm/llm-provider.interface.ts` 并在 `LlmService` 注册即可。

### 冒烟测试

```bash
pnpm smoke      # 需要 API 已启动
```

覆盖：注册 → 建商家 → 产品/客户/标签/任务 → AI 生成（3 版本）→ 收藏 → 用量 → dashboard → 跨租户 403 → admin 权限。

## 生产部署

```bash
# NEXT_PUBLIC_API_URL 改成浏览器可访问的 API 地址
NEXT_PUBLIC_API_URL=https://api.example.com \
docker compose -f docker-compose.prod.yml up -d --build
```

上线前务必修改 `docker-compose.prod.yml` 中的 JWT 秘钥与数据库口令。首次启动后执行种子（可选）：

```bash
docker compose -f docker-compose.prod.yml exec api pnpm prisma:seed
```

## 架构要点

- **多租户**：所有业务表带 `merchant_id`，路由约定 `/merchants/:merchantId/*`，`MerchantGuard` 校验成员身份并注入租户上下文；平台管理员可越权查看
- **守卫链**：全局 `JwtAuthGuard`（`@Public()` 放行）→ `MerchantGuard`（+`@MemberRoles` 老板专属操作）→ `QuotaGuard`（AI 接口配额）
- **AI 输出契约**：`{ versions: [{title, scene, content}] ×3, recommendedIndex, tips }`，JSON 解析容错 + 失败重试
- **每日任务**：BullMQ repeatable job（06:00 Asia/Shanghai）扫描 `nextFollowAt` 生成 AUTO 待办，幂等

## 预留扩展点（本期未实现）

- **微信小程序**：`users.wechatOpenId` 字段已建，auth 模块预留登录策略位；API 全部 RESTful 可直接复用
- **微信支付**：`subscriptions.lastOrderId` 已预留，billing 升级入口已占位
- **SaaS 知识库集成**（`D:\000000code\AIcode01\SaasLibrary`）：`LlmProvider` 接口对齐其 ChatProvider 设计，后续通过 HTTP 调用其 RAG 检索接口，把商家知识库检索结果拼入生成上下文
- **员工数据权限**：`customers.assignedToId` 已落库，第一版全员可见，后续启用按员工过滤
