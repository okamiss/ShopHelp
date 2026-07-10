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

  // 11. admin（种子管理员存在则测，不存在则跳过）
  const adminLogin = await req('POST', '/auth/login', {
    body: { email: 'admin@shophelp.local', password: 'Admin123456' },
  });
  if (adminLogin.status === 200 || adminLogin.status === 201) {
    const stats = await req('GET', '/admin/stats', { token: adminLogin.data.accessToken, expectStatus: 200 });
    ok('平台管理员统计', stats.data.merchantCount >= 1);
    const denied = await req('GET', '/admin/stats', { token });
    ok('普通用户访问 admin 被拒（403）', denied.status === 403);
  } else {
    console.log('  ⚠️ 未找到种子管理员，跳过 admin 检查');
  }

  console.log(`\n结果：${passed} 通过，${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(`\n💥 冒烟测试中断：${e.message}`);
  process.exit(1);
});
