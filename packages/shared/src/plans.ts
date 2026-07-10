import { PlanType } from './enums';

export interface PlanDef {
  type: PlanType;
  label: string;
  /** 每日 AI 生成次数上限 */
  dailyGenerationLimit: number;
  /** 每月 AI 生成次数上限 */
  monthlyGenerationLimit: number;
  /** 客户数量上限，-1 表示不限 */
  customerLimit: number;
  /** 成员数量上限 */
  memberLimit: number;
  /** 月价（分），0 表示免费；预留微信支付 */
  priceCentsPerMonth: number;
  features: string[];
}

export const PLANS: Record<PlanType, PlanDef> = {
  [PlanType.FREE]: {
    type: PlanType.FREE,
    label: '免费版',
    dailyGenerationLimit: 10,
    monthlyGenerationLimit: 100,
    customerLimit: 100,
    memberLimit: 2,
    priceCentsPerMonth: 0,
    features: ['每天 10 次 AI 生成', '每月 100 次 AI 生成', '最多 100 位客户', '最多 2 名成员'],
  },
  [PlanType.PRO]: {
    type: PlanType.PRO,
    label: '专业版',
    dailyGenerationLimit: 100,
    monthlyGenerationLimit: 2000,
    customerLimit: -1,
    memberLimit: 10,
    priceCentsPerMonth: 9900,
    features: ['每天 100 次 AI 生成', '每月 2000 次 AI 生成', '客户数量不限', '最多 10 名成员', '优先客服支持'],
  },
};
