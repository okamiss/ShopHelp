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
- Phase 9 完成 ✅（Codex 会话执行运行时验收）：文案中心实际生成 3 版本、剪贴板复制与首版一致、收藏状态持久化且 favorite=true 历史可查、too_expensive 回复场景落库 3 版本；期间发现并处理了卡死的 Web 进程与 Prisma DLL 锁问题

## Session 2026-07-10（Claude / Phase 10-12 收尾交付）

- Phase 10+11 完成 ✅：客户列表(筛选/标签管理弹窗)/客户详情(时间线+AI 跟进话术 Drawer)/产品/任务/套餐/设置(资料+成员)/日报占位/admin 4 页（layout+总览+商家+用户+用量）
- 全量 `pnpm build` 通过：shared + api(nest build) + web(next build, 20 路由全绿)
- Phase 12 完成 ✅：
  - apps/api/Dockerfile + apps/web/Dockerfile(standalone) + docker-compose.prod.yml（JWT/LLM 环境变量透传，NEXT_PUBLIC_API_URL 构建参数）
  - README.md（快速开始/种子账号/DeepSeek 接入/冒烟/生产部署/架构要点/扩展点）
  - scripts/smoke-test.mjs：17/17 全通过（注册→建商家→产品/客户/标签/任务→AI 3 类生成→收藏→用量→dashboard→跨租户 403→admin 403）
  - Playwright 浏览器走查：客户列表/详情(AI 跟进话术实际生成)/产品/任务/套餐/设置/日报全部可达；新号注册→onboarding 三步向导→dashboard 全流程通过；admin 总览+商家列表真实数据渲染
  - 修复 3 个走查发现的问题：dev 运行中跑 build 导致 .next 损坏(清理重启)；管理员登录误导向 onboarding(改跳 /admin)；antd v6 废弃告警(Timeline content / Drawer size)
- **12/12 阶段全部完成，MVP 交付**。代码未提交 git（等用户指示）
- 遗留说明：antd v6 List 组件废弃告警未处理（仍可用，替换属大版本重构）；DeepSeek 真实调用未验证（用户填 Key 后 LLM_PROVIDER=deepseek 即切换，未配置时自动回退 mock）

## Session 2026-07-16（Claude / v1.1 迭代规划）

- 用户提出 v1.1 需求：①管理员登录独立页面；②管理后台可操作商家/用户（套餐开通管理、封停禁用、编辑、重置密码）；③商家端修改密码；由 **Codex 实现**
- 用户决策：重置密码=生成随机临时密码（一次性展示+强制改密）；纳入审计日志+套餐到期自动降级；不做多商家切换器/CSV 导出/邮件重置
- Claude 已将 Phase 13–17 详细方案（含接口清单、验收标准、安全红线、开发环境红线）写入 task_plan.md，等待 Codex 开发
- 注意事项已写入 task_plan「总体设计约定」：临时密码不落审计、ADMIN 账号保护、dev 运行中禁跑 next build、migration 前停 API 进程

## Session 2026-07-16（Codex / v1.1 Phase 13–17 实现）

- 已按 planning-with-files 完成会话追赶并重读 task_plan.md / findings.md / progress.md；确认本次严格执行 Phase 13→17。
- 创建 v1.0 迭代基线提交 `f4a5b26`；接手时工作区原本已 clean，因此该提交仅记录基线边界及首次命令踩坑。
- CodeGraph 索引已存在且为最新（105 files / 1,107 nodes / 1,985 edges）；Postgres、Redis 容器均 healthy。
- 检测到 Web dev(3000) 与 API watch(3001) 正在运行；Phase 13 migration 前将只停止 API 进程，避免 Prisma engine DLL 的 EPERM。
- Phase 13 完成 ✅：Prisma 新增 UserStatus/MerchantStatus、用户禁用与强制改密字段、商家封停字段、admin_audit_logs（含操作人可空关系与要求索引）；shared 新增状态枚举/中文标签/AUDIT_ACTIONS。
  - migration `20260716080749_v1_1_account_admin` 创建并应用成功；`pnpm db:seed` 连续两次成功；`pnpm -r lint` 全绿。
  - 踩坑：只停止 3001 的业务子进程会被 Nest watch 父进程拉起，仍导致 Prisma DLL EPERM；需停止完整 API watch 分支。根级并行 dev 随之结束，因此当前 3000/3001 均已停止。
- Phase 14 完成 ✅：新增 `/auth/admin/login` 与 `/auth/change-password`；商家/管理员登录入口双向隔离；login/refresh 校验 DISABLED；login/me 返回 mustChangePassword；JwtAuthGuard 每请求通过 UsersService 单字段 select 实时检查用户状态。
  - curl 验收 13 项通过：双入口隔离、管理员登录、禁用用户登录/旧 access token/refresh 拒绝、改密旧密失效/新密成功/强制改密标记清除、种子密码恢复；`pnpm -r lint` 全绿。
  - 验收后 demo 用户已恢复 ACTIVE、mustChangePassword=false、密码 `Demo123456`；API watch 已停止。
  - 踩坑：Windows PowerShell 直接把 JSON 字符串传给 curl.exe 会破坏引号，最终改用临时 UTF-8 JSON 文件；后台进程清理需避免命令行模糊匹配当前 shell。
- Phase 15 完成 ✅：MerchantGuard 增加 SUSPENDED 传播与 `MERCHANT_SUSPENDED` code；admin 增加商家编辑/状态/套餐、用户编辑/状态/重置密码、审计列表；新增 AuditService；daily-tasks 增加过期 PRO 自动降 FREE。
  - 所有 admin 写接口均落审计，包括既有手动 daily-tasks；商家/用户/订阅写入与审计在同一事务；临时密码仅响应一次，审计 detail 仅记录 mustChangePassword，不含明文。
  - curl 验收 40 项通过：封停传播且管理员豁免、套餐限额同步、邮箱冲突 409、用户禁用、ADMIN 禁用/重置 400、临时密码完整流转、全部审计动作可查、过期降级与重复触发幂等。
  - 验收后 demo 恢复 ACTIVE、mustChangePassword=false、密码 `Demo123456`；商家恢复 ACTIVE；原套餐恢复 PRO/100/2000/无到期。`pnpm -r lint` 全绿，API 已停止。
  - 踩坑：shared 新导出需先刷新 dist，否则直接 `pnpm -r lint` 时 API 读取旧类型声明。
- Phase 16 阻塞 ⛔：管理端功能代码与 `pnpm -r lint` 已通过，但真实浏览器验收在 Ant Design Popconfirm 的 Playwright 定位上连续 3 次失败（最终失败点为重置密码确认按钮被判定在视口外）。
  - 已严格停止，Phase 16 保持 pending，未提交 Phase 16，也未开始 Phase 17；完整错误过程已写入 task_plan.md。
  - 浏览器脚本 finally 与收尾检查确认 demo 商家恢复 ACTIVE/PRO/100/2000、demo 用户恢复 ACTIVE、mustChangePassword=false，种子密码 `Demo123456` 可登录；3000/3001 已停止。

## Session 2026-07-16（Claude / 接手 Phase 16 验收 + Phase 17）

- 接手 Codex 阻塞：Phase 16 代码审阅通过（守卫 loginPath 复用、审计页、adminApi 封装均符合约定）
- Popconfirm 三连败根因查明（详见 task_plan Errors 表 + findings「antd v6 浏览器自动化要点」）：可访问名空格「确 认」/ 1280 视口下固定右列弹层溢出 / v6 类名 ant-modal-container
- Phase 16 完成 ✅：scratchpad/phase16-e2e.mjs（playwright-core + 系统 Edge + 1720 视口 + API 状态复位）24/24 通过：
  - 管理员独立登录、双入口 403 隔离、封停/恢复 + MERCHANT_SUSPENDED 传播 + 管理员豁免、套餐 Modal 调整 PRO 55/555 且商家侧 usage 同步、用户禁用/启用、重置密码全流转（临时密码 12 位/旧密失效/mustChangePassword）、ADMIN 行保护（UI 置灰 + API 400）、审计页与审计 API、审计不含明文、商家侧边栏无管理入口
  - 测试数据已复位（商家 ACTIVE/FREE 10-100，boss2 恢复原密码 ACTIVE）
