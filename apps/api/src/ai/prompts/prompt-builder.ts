import { CUSTOMER_STATUS_LABELS, CustomerStatus, findIndustry, findScenario } from '@shophelp/shared';
import { SCENARIO_GUIDES } from './scenario-guides';

export interface MerchantContext {
  name: string;
  industry: string;
  description?: string | null;
  address?: string | null;
  businessHours?: string | null;
  brandTone?: string | null;
  targetCustomers?: string | null;
}

export interface ProductContext {
  name: string;
  category?: string | null;
  price?: unknown;
  unit?: string | null;
  description?: string | null;
  sellingPoints?: string | null;
}

export interface CustomerContext {
  name: string;
  intentLevel: string;
  status: string;
  source?: string | null;
  remark?: string | null;
  lastContactAt?: Date | null;
  tags?: { name: string }[];
  recentNotes?: { content: string; createdAt: Date }[];
}

export interface BuildPromptInput {
  scenarioKey: string;
  userInput?: string;
  merchant: MerchantContext;
  product?: ProductContext | null;
  customer?: CustomerContext | null;
}

const OUTPUT_SPEC = `你必须输出一个 JSON 对象（不要任何其他文字、不要 markdown 代码块），结构如下：
{
  "versions": [
    { "title": "版本小标题（如：亲切口语版）", "scene": "适用场景说明（一句话）", "content": "正文内容" },
    { "title": "...", "scene": "...", "content": "..." },
    { "title": "...", "scene": "...", "content": "..." }
  ],
  "recommendedIndex": 0,
  "tips": "给老板的一句使用建议"
}
要求：versions 恰好 3 个版本且风格明显不同；recommendedIndex 是最推荐版本的下标（0-2）；所有内容用简体中文。`;

export function buildSystemPrompt(input: BuildPromptInput): string {
  const industry = findIndustry(input.merchant.industry)?.label ?? input.merchant.industry;
  const scenario = findScenario(input.scenarioKey);
  const guide = SCENARIO_GUIDES[input.scenarioKey] ?? '';

  const lines = [
    `你是一位深耕中国本地生活/私域运营的金牌文案与销售话术专家，正在为一家小微商家服务。`,
    ``,
    `【商家档案】`,
    `- 店名：${input.merchant.name}`,
    `- 行业：${industry}`,
  ];
  if (input.merchant.description) lines.push(`- 简介：${input.merchant.description}`);
  if (input.merchant.address) lines.push(`- 地址：${input.merchant.address}`);
  if (input.merchant.businessHours) lines.push(`- 营业时间：${input.merchant.businessHours}`);
  if (input.merchant.brandTone) lines.push(`- 品牌语气：${input.merchant.brandTone}（所有输出必须符合这个语气）`);
  if (input.merchant.targetCustomers) lines.push(`- 目标客群：${input.merchant.targetCustomers}`);

  lines.push(``, `【任务场景】${scenario ? `${scenario.label} —— ${scenario.description}` : input.scenarioKey}`);
  if (guide) lines.push(`【场景要求】${guide}`);
  lines.push(``, OUTPUT_SPEC);
  return lines.join('\n');
}

export function buildUserPrompt(input: BuildPromptInput): string {
  const sections: string[] = [];

  if (input.product) {
    const p = input.product;
    const parts = [`名称：${p.name}`];
    if (p.category) parts.push(`分类：${p.category}`);
    if (p.price != null) parts.push(`价格：${String(p.price)}元${p.unit ? `/${p.unit}` : ''}`);
    if (p.description) parts.push(`介绍：${p.description}`);
    if (p.sellingPoints) parts.push(`卖点：${p.sellingPoints.replace(/\n/g, '；')}`);
    sections.push(`【关联产品/服务】\n${parts.join('\n')}`);
  }

  if (input.customer) {
    const c = input.customer;
    const statusLabel = CUSTOMER_STATUS_LABELS[c.status as CustomerStatus] ?? c.status;
    const parts = [
      `称呼：${c.name}`,
      `意向等级：${c.intentLevel}（A 最高 D 最低）`,
      `当前状态：${statusLabel}`,
    ];
    if (c.source) parts.push(`来源：${c.source}`);
    if (c.tags?.length) parts.push(`标签：${c.tags.map((t) => t.name).join('、')}`);
    if (c.remark) parts.push(`备注：${c.remark}`);
    if (c.lastContactAt) parts.push(`上次联系：${c.lastContactAt.toISOString().slice(0, 10)}`);
    if (c.recentNotes?.length) {
      parts.push(
        `最近跟进记录：\n${c.recentNotes
          .map((n) => `  - ${n.createdAt.toISOString().slice(0, 10)}：${n.content}`)
          .join('\n')}`,
      );
    }
    sections.push(`【客户档案】\n${parts.join('\n')}`);
  }

  sections.push(`【本次需求】\n${input.userInput?.trim() || '（无补充说明，按场景要求生成）'}`);
  sections.push(`【输出要求】请严格按照 system 中的 JSON 结构输出。`);
  return sections.join('\n\n');
}
