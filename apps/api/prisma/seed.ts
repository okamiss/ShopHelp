import { PrismaClient, PlatformRole, MemberRole, IntentLevel, CustomerStatus, PlanType, GenerationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const passwordAdmin = await bcrypt.hash('Admin123456', 10);
  const passwordDemo = await bcrypt.hash('Demo123456', 10);

  // 平台管理员
  await prisma.user.upsert({
    where: { email: 'admin@shophelp.local' },
    update: {},
    create: {
      email: 'admin@shophelp.local',
      passwordHash: passwordAdmin,
      name: '平台管理员',
      platformRole: PlatformRole.ADMIN,
    },
  });

  // 演示商家老板
  const demoOwner = await prisma.user.upsert({
    where: { email: 'demo@shophelp.local' },
    update: {},
    create: {
      email: 'demo@shophelp.local',
      passwordHash: passwordDemo,
      name: '王老板',
      platformRole: PlatformRole.USER,
    },
  });

  // 演示商家（幂等：按 owner + name 查找）
  let merchant = await prisma.merchant.findFirst({
    where: { ownerId: demoOwner.id, name: '悦颜美甲工作室' },
  });
  if (!merchant) {
    merchant = await prisma.merchant.create({
      data: {
        name: '悦颜美甲工作室',
        industry: 'nail_lash',
        description: '社区型美甲美睫工作室，主打日式款式与轻奢体验',
        address: '幸福路 88 号 2 楼',
        phone: '138-0000-0000',
        businessHours: '10:00 - 21:00（周一店休）',
        brandTone: '亲切自然，像闺蜜聊天，不做作不硬广',
        targetCustomers: '25-40 岁女性，注重生活品质，复购意愿强',
        ownerId: demoOwner.id,
        members: {
          create: { userId: demoOwner.id, role: MemberRole.OWNER },
        },
        subscription: {
          create: {
            plan: PlanType.FREE,
            dailyGenerationLimit: 10,
            monthlyGenerationLimit: 100,
          },
        },
      },
    });
  }

  const merchantId = merchant.id;

  // 产品
  const productNames = await prisma.product.findMany({ where: { merchantId }, select: { name: true } });
  if (productNames.length === 0) {
    await prisma.product.createMany({
      data: [
        {
          merchantId,
          name: '日式手绘美甲',
          category: '美甲',
          price: 198,
          unit: '次',
          description: '进口甲油胶，款式每月上新',
          sellingPoints: '进口材料不伤甲\n设计师 1v1 定制款式\n维持 4-6 周',
          sortOrder: 1,
        },
        {
          merchantId,
          name: '轻奢美睫嫁接',
          category: '美睫',
          price: 268,
          unit: '次',
          description: '0.05 超软睫毛，自然浓密可选',
          sellingPoints: '嫁接后自然翘\n不闷眼不刺激\n免费补睫一次',
          sortOrder: 2,
        },
        {
          merchantId,
          name: '季卡会员（美甲×4）',
          category: '卡项',
          price: 588,
          unit: '季',
          description: '一季度 4 次任意款式美甲，另赠手部护理',
          sellingPoints: '单次立省 50+\n赠手部深层护理\n可转赠闺蜜',
          sortOrder: 3,
        },
      ],
    });
  }

  // 标签
  for (const t of [
    { name: '老客户', color: 'gold' },
    { name: '宝妈', color: 'pink' },
    { name: '上班族', color: 'blue' },
    { name: '价格敏感', color: 'orange' },
    { name: '闺蜜团', color: 'purple' },
  ]) {
    await prisma.customerTag.upsert({
      where: { merchantId_name: { merchantId, name: t.name } },
      update: {},
      create: { merchantId, ...t },
    });
  }
  const tags = await prisma.customerTag.findMany({ where: { merchantId } });
  const tagId = (name: string) => tags.find((t) => t.name === name)?.id as string;

  // 客户
  const customerCount = await prisma.customer.count({ where: { merchantId } });
  if (customerCount === 0) {
    const customersData = [
      {
        name: '李小姐',
        wechat: 'lixiaojie88',
        phone: '139-1111-2222',
        source: '朋友圈',
        intentLevel: IntentLevel.A,
        status: CustomerStatus.IN_CONTACT,
        remark: '看中季卡，嫌有点贵，在对比别家',
        nextFollowAt: daysFromNow(0),
        lastContactAt: daysFromNow(-2),
        tagNames: ['上班族', '价格敏感'],
        note: '第一次到店做了日式手绘，很满意，问了季卡价格',
      },
      {
        name: '张姐',
        wechat: 'zhangjie_666',
        source: '转介绍',
        intentLevel: IntentLevel.A,
        status: CustomerStatus.DEAL,
        remark: '季卡会员，还剩 2 次',
        nextFollowAt: daysFromNow(3),
        lastContactAt: daysFromNow(-7),
        tagNames: ['老客户', '闺蜜团'],
        note: '成交季卡，喜欢裸色系，下次推荐新款贴钻',
      },
      {
        name: '陈女士',
        wechat: 'chen_mm',
        source: '抖音',
        intentLevel: IntentLevel.B,
        status: CustomerStatus.IN_CONTACT,
        remark: '咨询过美睫，说带娃没时间，周末有空',
        nextFollowAt: daysFromNow(1),
        lastContactAt: daysFromNow(-5),
        tagNames: ['宝妈'],
        note: '抖音看到视频来咨询，发过价目表',
      },
      {
        name: '刘同学',
        source: '小红书',
        intentLevel: IntentLevel.C,
        status: CustomerStatus.UNCONTACTED,
        remark: '小红书私信问了地址还没回访',
        nextFollowAt: daysFromNow(0),
        tagNames: [],
        note: null,
      },
      {
        name: '赵阿姨',
        wechat: 'zhao_ayi',
        source: '到店',
        intentLevel: IntentLevel.D,
        status: CustomerStatus.LOST,
        remark: '嫌价格贵，去了平价店',
        lastContactAt: daysFromNow(-45),
        tagNames: ['价格敏感'],
        note: '做过一次基础款，后来没再来',
      },
      {
        name: '孙小姐',
        wechat: 'sunxj',
        source: '朋友圈',
        intentLevel: IntentLevel.B,
        status: CustomerStatus.REPURCHASED,
        remark: '做过 3 次，节前会来做新款',
        nextFollowAt: daysFromNow(14),
        lastContactAt: daysFromNow(-20),
        tagNames: ['老客户'],
        note: '对新品敏感，每次上新都会问',
      },
    ];

    for (const c of customersData) {
      const { tagNames, note, ...data } = c;
      const created = await prisma.customer.create({
        data: {
          merchantId,
          ...data,
          tags: { connect: tagNames.map((n) => ({ id: tagId(n) })) },
        },
      });
      if (note) {
        await prisma.customerNote.create({
          data: { merchantId, customerId: created.id, content: note, createdById: demoOwner.id },
        });
      }
    }
  }

  // 今日跟进任务
  const taskCount = await prisma.followTask.count({ where: { merchantId } });
  if (taskCount === 0) {
    const liXiaojie = await prisma.customer.findFirst({ where: { merchantId, name: '李小姐' } });
    const liuTongxue = await prisma.customer.findFirst({ where: { merchantId, name: '刘同学' } });
    await prisma.followTask.createMany({
      data: [
        {
          merchantId,
          customerId: liXiaojie?.id,
          title: '跟进李小姐季卡意向，发一个限时优惠',
          dueDate: today(),
          createdById: demoOwner.id,
        },
        {
          merchantId,
          customerId: liuTongxue?.id,
          title: '回复刘同学的小红书私信，发定位和款式图',
          dueDate: today(),
          createdById: demoOwner.id,
        },
        {
          merchantId,
          title: '发一条朋友圈：本周新款展示',
          dueDate: today(),
          createdById: demoOwner.id,
        },
      ],
    });
  }

  // 示例生成记录
  const genCount = await prisma.aiGeneration.count({ where: { merchantId } });
  if (genCount === 0) {
    await prisma.aiGeneration.create({
      data: {
        merchantId,
        userId: demoOwner.id,
        type: GenerationType.COPYWRITING,
        scenario: 'moments',
        inputParams: { input: '本周新款日式手绘上新', scenario: 'moments' },
        output: {
          versions: [
            {
              title: '闺蜜种草版',
              scene: '适合工作日晚上发，配 9 宫格新款图',
              content:
                '本周新款终于做完了💅 这次的日式手绘真的绝，裸色打底+手绘小花，上手温柔到犯规～\n姐妹们冲鸭，本周预约还有位置！',
            },
            {
              title: '简洁通知版',
              scene: '适合发在客户群，信息清晰',
              content: '【新款上架】日式手绘系列本周上新，共 6 款。老客户预约享 9 折，位置有限，先约先得～',
            },
            {
              title: '故事氛围版',
              scene: '适合周末早上发，营造生活感',
              content:
                '给自己一点小确幸，从一双好看的手开始✨\n新款日式手绘，每一笔都是设计师手绘的温柔。这周末，来店里坐坐？',
            },
          ],
          recommendedIndex: 0,
          tips: '发朋友圈建议配真实款式图，9-12 点或 20-22 点发布效果更好',
        },
        provider: 'mock',
        model: 'mock-v1',
        tokensUsed: 0,
      },
    });
  }

  console.log('[seed] done.');
  console.log('[seed] 平台管理员: admin@shophelp.local / Admin123456');
  console.log('[seed] 演示老板:   demo@shophelp.local / Demo123456（商家：悦颜美甲工作室）');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
