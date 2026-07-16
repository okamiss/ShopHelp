#!/usr/bin/env node
/**
 * 店小智冒烟测试：注册 → 建商家 → 产品/客户/标签/跟进 → AI 生成 → 收藏 → 用量 → dashboard → 租户隔离
 * 用法：node scripts/smoke-test.mjs [API_URL]
 */
const API = process.argv[2] ?? process.env.API_URL ?? 'http://localhost:3001';

let passed = 0;
let failed = 0;

function ok(name, cond, extra = '') {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}${extra ? ` — ${extra}` : ''}`);
  } else {
    failed++;
    console.error(`  ❌ ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

async function req(method, path, { token, body, expectStatus } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (expectStatus && res.status !== expectStatus) {
    throw new Error(`${method} ${path} → ${res.status}（期望 ${expectStatus}）: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return { status: res.status, data };
}

async function main() {
  console.log(`🚬 冒烟测试目标：${API}\n`);
  const stamp = Date.now();

  // 1. health
  const health = await req('GET', '/health');
  ok('health 检查', health.data.status === 'ok');

  // 2. 注册 + 建商家
  const email = `smoke-${stamp}@test.local`;
  const reg = await req('POST', '/auth/register', {
    body: { email, password: 'Smoke123456', name: '冒烟老板' },
    expectStatus: 201,
  });
  const token = reg.data.accessToken;
  ok('注册', Boolean(token));

  const merchant = await req('POST', '/merchants', {
    token,
    body: { name: `冒烟测试店-${stamp}`, industry: 'beauty_salon', brandTone: '亲切自然' },
    expectStatus: 201,
  });
  const mid = merchant.data.id;
  ok('创建商家（自动 FREE 套餐）', merchant.data.subscription?.plan === 'FREE');

  // 3. 产品
  const product = await req('POST', `/merchants/${mid}/products`, {
    token,
    body: { name: '冒烟洗剪吹', price: 88, unit: '次', sellingPoints: '总监操刀\n免费造型建议' },
    expectStatus: 201,
  });
  ok('创建产品', Boolean(product.data.id));

  // 4. 标签 + 客户 + 跟进记录
  const tag = await req('POST', `/merchants/${mid}/tags`, {
    token,
    body: { name: '冒烟标签', color: 'blue' },
    expectStatus: 201,
  });
  const customer = await req('POST', `/merchants/${mid}/customers`, {
    token,
    body: { name: '冒烟客户', intentLevel: 'A', status: 'IN_CONTACT', tagIds: [tag.data.id] },
    expectStatus: 201,
  });
  const cid = customer.data.id;
  ok('创建客户（带标签）', customer.data.tags?.[0]?.name === '冒烟标签');

  await req('POST', `/merchants/${mid}/customers/${cid}/notes`, {
    token,
    body: { content: '冒烟跟进记录' },
    expectStatus: 201,
  });
  const detail = await req('GET', `/merchants/${mid}/customers/${cid}`, { token, expectStatus: 200 });
  ok('跟进记录 + lastContactAt 自动更新', detail.data.notes.length === 1 && Boolean(detail.data.lastContactAt));

  // 5. 跟进任务
  const task = await req('POST', `/merchants/${mid}/follow-tasks`, {
    token,
    body: { title: '冒烟任务', customerId: cid, dueDate: new Date().toISOString().slice(0, 10) },
    expectStatus: 201,
  });
  const doneTask = await req('PATCH', `/merchants/${mid}/follow-tasks/${task.data.id}`, {
    token,
    body: { status: 'DONE' },
    expectStatus: 200,
  });
  ok('任务创建与完成', doneTask.data.status === 'DONE');

  // 6. AI 生成（3 版本）
  const gen = await req('POST', `/merchants/${mid}/ai/copywriting`, {
    token,
    body: { scenario: 'moments', input: '冒烟测试文案', productId: product.data.id },
    expectStatus: 201,
  });
  ok(
    `AI 文案生成（provider=${gen.data.provider}）`,
    Array.isArray(gen.data.output?.versions) && gen.data.output.versions.length >= 3,
    `${gen.data.output?.versions?.length ?? 0} 个版本`,
  );

  const reply = await req('POST', `/merchants/${mid}/ai/reply`, {
    token,
    body: { scenario: 'too_expensive', input: '客户说太贵了', customerId: cid },
    expectStatus: 201,
  });
  ok('AI 回复生成', reply.data.output?.versions?.length >= 3);

  const followUp = await req('POST', `/merchants/${mid}/ai/follow-up`, {
    token,
    body: { customerId: cid },
    expectStatus: 201,
  });
  ok('AI 跟进话术', followUp.data.output?.versions?.length >= 3);

  // 7. 收藏 + 历史
  const fav = await req('PATCH', `/merchants/${mid}/ai/generations/${gen.data.id}/favorite`, {
    token,
    body: { isFavorite: true },
    expectStatus: 200,
  });
  ok('收藏为话术', fav.data.isFavorite === true);
  const favList = await req('GET', `/merchants/${mid}/ai/generations?favorite=true`, { token, expectStatus: 200 });
  ok('收藏历史可查', favList.data.items.some((g) => g.id === gen.data.id));

  // 8. 用量
  const usage = await req('GET', `/merchants/${mid}/ai/usage`, { token, expectStatus: 200 });
  ok('用量记账', usage.data.dailyUsed === 3, `dailyUsed=${usage.data.dailyUsed}`);

  // 9. dashboard 聚合
  const dash = await req('GET', `/merchants/${mid}/dashboard`, { token, expectStatus: 200 });
  const dashKeys = ['todayTasks', 'followUpCustomers', 'highIntentCustomers', 'recentGenerations', 'usage', 'stats', 'suggestions'];
  ok('dashboard 字段齐全', dashKeys.every((k) => k in dash.data));

  // 10. 租户隔离
  const reg2 = await req('POST', '/auth/register', {
    body: { email: `smoke2-${stamp}@test.local`, password: 'Smoke123456', name: '隔离用户' },
    expectStatus: 201,
  });
  const cross = await req('GET', `/merchants/${mid}/customers`, { token: reg2.data.accessToken });
  ok('跨租户访问被拒（403）', cross.status === 403);

  // 11. admin（v1.1 起管理员走独立入口 /auth/admin/login）
  const adminLogin = await req('POST', '/auth/admin/login', {
    body: { email: 'admin@shophelp.local', password: 'Admin123456' },
  });
  if (adminLogin.status === 200 || adminLogin.status === 201) {
    const adminToken = adminLogin.data.accessToken;
    const stats = await req('GET', '/admin/stats', { token: adminToken, expectStatus: 200 });
    ok('平台管理员统计', stats.data.merchantCount >= 1);
    const denied = await req('GET', '/admin/stats', { token });
    ok('普通用户访问 admin 被拒（403）', denied.status === 403);

    // ---------- v1.1 账号体系与平台管理 ----------
    console.log('\n—— v1.1 用例 ——');

    // v1.1-1 双入口隔离
    const adminViaNormal = await req('POST', '/auth/login', {
      body: { email: 'admin@shophelp.local', password: 'Admin123456' },
    });
    ok('v1.1 管理员走商家入口被拒（403）', adminViaNormal.status === 403);
    const userViaAdmin = await req('POST', '/auth/admin/login', { body: { email, password: 'Smoke123456' } });
    ok('v1.1 普通用户走管理员入口被拒（403）', userViaAdmin.status === 403);

    // v1.1-2 封停传播与恢复
    await req('PATCH', `/admin/merchants/${mid}/status`, { token: adminToken, body: { status: 'SUSPENDED' }, expectStatus: 200 });
    const suspended = await req('GET', `/merchants/${mid}/customers`, { token });
    ok('v1.1 封停后成员业务 403 且 code=MERCHANT_SUSPENDED', suspended.status === 403 && suspended.data.code === 'MERCHANT_SUSPENDED');
    const adminBypass = await req('GET', `/merchants/${mid}/customers`, { token: adminToken });
    ok('v1.1 管理员访问被封停商家不受限', adminBypass.status === 200);
    await req('PATCH', `/admin/merchants/${mid}/status`, { token: adminToken, body: { status: 'ACTIVE' }, expectStatus: 200 });
    const restored = await req('GET', `/merchants/${mid}/customers`, { token });
    ok('v1.1 恢复后成员业务访问正常', restored.status === 200);

    // v1.1-3 套餐调整同步
    await req('PATCH', `/admin/merchants/${mid}/subscription`, {
      token: adminToken,
      body: { plan: 'PRO', dailyGenerationLimit: 55, monthlyGenerationLimit: 555 },
      expectStatus: 200,
    });
    const usageAfter = await req('GET', `/merchants/${mid}/ai/usage`, { token, expectStatus: 200 });
    ok('v1.1 套餐调整后商家侧限额同步', usageAfter.data.dailyLimit === 55 && usageAfter.data.monthlyLimit === 555);

    // v1.1-4 禁用/启用
    const user2Id = reg2.data.user.id;
    await req('PATCH', `/admin/users/${user2Id}/status`, { token: adminToken, body: { status: 'DISABLED' }, expectStatus: 200 });
    const disabledLogin = await req('POST', '/auth/login', {
      body: { email: `smoke2-${stamp}@test.local`, password: 'Smoke123456' },
    });
    ok('v1.1 禁用后登录被拒（403）', disabledLogin.status === 403);
    await req('PATCH', `/admin/users/${user2Id}/status`, { token: adminToken, body: { status: 'ACTIVE' }, expectStatus: 200 });

    // v1.1-5 重置密码全流转
    const reset = await req('POST', `/admin/users/${user2Id}/reset-password`, { token: adminToken, expectStatus: 201 });
    const tempPassword = reset.data.temporaryPassword;
    ok('v1.1 重置返回 12 位临时密码', typeof tempPassword === 'string' && tempPassword.length === 12);
    const oldPw = await req('POST', '/auth/login', { body: { email: `smoke2-${stamp}@test.local`, password: 'Smoke123456' } });
    ok('v1.1 重置后旧密码失效', oldPw.status === 401 || oldPw.status === 403);
    const tempLogin = await req('POST', '/auth/login', { body: { email: `smoke2-${stamp}@test.local`, password: tempPassword } });
    ok('v1.1 临时密码可登且 mustChangePassword=true', (tempLogin.status === 200 || tempLogin.status === 201) && tempLogin.data.user?.mustChangePassword === true);
    const changed = await req('POST', '/auth/change-password', {
      token: tempLogin.data.accessToken,
      body: { oldPassword: tempPassword, newPassword: 'Smoke123456' },
    });
    const backLogin = await req('POST', '/auth/login', { body: { email: `smoke2-${stamp}@test.local`, password: 'Smoke123456' } });
    ok('v1.1 change-password 后新密可登且改密标记清除', changed.status < 300 && (backLogin.status === 200 || backLogin.status === 201) && backLogin.data.user?.mustChangePassword === false);

    // v1.1-6 ADMIN 账号保护
    const adminUsers = await req('GET', '/admin/users?keyword=admin@shophelp.local', { token: adminToken });
    const adminId = adminUsers.data.items?.[0]?.id;
    const protectStatus = await req('PATCH', `/admin/users/${adminId}/status`, { token: adminToken, body: { status: 'DISABLED' } });
    const protectReset = await req('POST', `/admin/users/${adminId}/reset-password`, { token: adminToken });
    ok('v1.1 禁用/重置 ADMIN 账号被拒（400）', protectStatus.status === 400 && protectReset.status === 400);

    // v1.1-7 审计落库且不含明文
    const audit = await req('GET', '/admin/audit-logs?pageSize=50', { token: adminToken, expectStatus: 200 });
    const actions = new Set(audit.data.items.map((i) => i.action));
    ok(
      'v1.1 审计含状态/套餐/禁用/重置动作',
      ['MERCHANT_STATUS', 'MERCHANT_SUBSCRIPTION', 'USER_STATUS', 'USER_RESET_PASSWORD'].every((a) => actions.has(a)),
    );
    const leaked = audit.data.items.some((i) => JSON.stringify(i.detail ?? {}).includes(tempPassword));
    ok('v1.1 审计 detail 不含临时密码明文', !leaked);
  } else {
    console.log('  ⚠️ 未找到种子管理员，跳过 admin 与 v1.1 检查');
  }

  console.log(`\n结果：${passed} 通过，${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(`\n💥 冒烟测试中断：${e.message}`);
  process.exit(1);
});
