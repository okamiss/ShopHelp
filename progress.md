# Progress — 店小智 MVP

## Session 2026-07-10（Claude Code / Fable 5）

- 计划已获用户批准（快照：C:\Users\Administrator\.claude\plans\ai-mvp-moonlit-curry.md）
- 用户决策：Claude 直接实现；LLM 默认 DeepSeek + Mock 兜底
- 环境实测通过：Node 22.22.3 / pnpm 11.5.3 / Docker 29 + Compose v5
- Phase 1 完成 ✅：monorepo（@shophelp/shared|api|web）+ docker-compose(pg16+redis7 healthy) + `pnpm install` 548 包成功；shared 构建、web tsc 通过
- Phase 2 完成 ✅：Prisma schema 11 表 + 8 枚举，migration `20260710061208_init` 应用成功；seed 幂等验证（跑两遍无报错）
  - 种子账号：admin@shophelp.local/Admin123456（平台管理员）、demo@shophelp.local/Demo123456（悦颜美甲工作室老板）
  - 注意：prisma seed 配置在 package.json#prisma（Prisma 7 将废弃，暂可用）；apps/api/.env 存 DATABASE_URL 供 Prisma CLI 读取
- Phase 3 完成 ✅：auth(register/login/refresh/me) + merchants(创建/详情/更新/成员) + 全局 JwtAuthGuard(@Public 放行) + MerchantGuard(租户注入+@MemberRoles) + PlatformAdminGuard
  - curl 验收全通：owner patch 200 / 跨租户 403 / 无 token 401 / 平台管理员可读任意商家 200
  - 踩坑记录：@nestjs/jwt v11 expiresIn 类型需 cast JwtSignOptions['expiresIn']；express 5 类型 req.params 为 string|string[] 需归一化；@types/express 需显式安装
  - 租户路由约定：/merchants/:merchantId/*，MerchantGuard 从 params 取 merchantId
- Phase 4 完成 ✅：products/customers(+notes/tags)/follow-tasks 全部 CRUD + 筛选分页
  - curl 验收全通：筛选(intentLevel/keyword)、标签关联、note 自动更新 lastContactAt、任务状态流转、无效标签 400、跨租户 403、删客户级联删任务
  - 注意：API dev 进程运行时 prisma generate 会 EPERM（dll 被占用）——schema 未变时直接 npx tsc 检查即可
- Phase 5 完成 ✅：LlmProvider 接口 + DeepSeekProvider(OpenAI 兼容, response_format=json_object, 60s 超时) + MockProvider + 注册表；22+1(follow_up) 场景 prompt；生成/收藏/历史/用量/QuotaGuard
  - curl 验收全通（mock）：3 版本输出、follow-up 带客户档案、收藏与筛选、用量记账、第 10 次后 429
  - LLM 解析容错：剥 markdown 代码块 + versions 校验 + 失败重试 1 次；DeepSeek 未配 Key 自动回退 mock
  - 测试后遗症处理：demo 商家当日配额被测满，已将其升为 PRO(100/天) 便于后续前端测试
- Phase 6 完成 ✅：dashboard 聚合（待办/待跟进/高意向/最近生成/用量/规则版今日建议）+ admin(stats/merchants/users/usage-trend/手动触发 job) + BullMQ upsertJobScheduler 每日 06:00（Asia/Shanghai）
  - curl 验收全通：聚合字段齐全、非管理员访问 admin 403、每日任务幂等（重复执行 created=0）
  - 「今日 AI 建议」采用规则计算（不烧 LLM 配额），后续可升级为 LLM 生成
  - 后端 Phases 1-6 全部完成，API 层收工
- Phase 7+8 完成 ✅：api-client(单飞 refresh 拦截器)/zustand persist(hydrated 标记防闪跳)/AuthGuard/MainLayout(Sider 导航+管理员入口)/登录/注册/onboarding 三步向导/Dashboard 7 板块
  - `next build` 通过（Next 15.5.20）；Playwright 实测：登录→dashboard 渲染真实数据，截图确认 UI 正常
  - 踩坑：antd v6 中 List 组件已标记废弃（控制台警告，下个大版本移除，暂用）；Tailwind 类与 antd 混用时部分 antd 组件需 style 属性兜底
  - 修复：mock provider 提取【本次需求】会带上尾部指令 → user prompt 尾行改为【输出要求】前缀；清理了 7 条 bash curl 产生的乱码测试记录（Windows curl 中文编码问题，浏览器端无此问题）；补 app/icon.svg
- Phase 9 开始：AI 文案中心 + 回复助手
