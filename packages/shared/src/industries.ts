export interface IndustryDef {
  key: string;
  label: string;
  emoji: string;
}

/** 预置行业列表（merchants.industry 存 key） */
export const INDUSTRIES: IndustryDef[] = [
  { key: 'beauty_salon', label: '美容美发', emoji: '💇' },
  { key: 'nail_lash', label: '美甲美睫', emoji: '💅' },
  { key: 'fitness_yoga', label: '健身瑜伽', emoji: '🧘' },
  { key: 'education', label: '教育培训', emoji: '📚' },
  { key: 'mother_baby', label: '母婴亲子', emoji: '🍼' },
  { key: 'food_beverage', label: '餐饮美食', emoji: '🍜' },
  { key: 'pet_service', label: '宠物服务', emoji: '🐾' },
  { key: 'photography', label: '摄影写真', emoji: '📷' },
  { key: 'housekeeping', label: '家政服务', emoji: '🧹' },
  { key: 'auto_service', label: '汽车服务', emoji: '🚗' },
  { key: 'retail', label: '零售电商', emoji: '🛍️' },
  { key: 'medical_beauty', label: '医美口腔', emoji: '🦷' },
  { key: 'other', label: '其他', emoji: '🏪' },
];

export function findIndustry(key: string): IndustryDef | undefined {
  return INDUSTRIES.find((i) => i.key === key);
}
