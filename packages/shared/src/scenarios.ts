import { GenerationType } from './enums';

export interface ScenarioDef {
  /** 场景唯一 key，写入 ai_generations.scenario */
  key: string;
  label: string;
  description: string;
  /** 生成类型归属 */
  type: GenerationType;
  /** 表单占位提示 */
  inputPlaceholder?: string;
  /** 是否建议关联产品 */
  suggestProduct?: boolean;
  /** 是否建议关联客户 */
  suggestCustomer?: boolean;
  emoji: string;
}

/** AI 文案生成场景（10 个） */
export const COPYWRITING_SCENARIOS: ScenarioDef[] = [
  {
    key: 'moments',
    label: '朋友圈文案',
    description: '发朋友圈用的种草/日常经营文案',
    type: GenerationType.COPYWRITING,
    inputPlaceholder: '例如：今天想发一条按摩肩颈放松的朋友圈',
    suggestProduct: true,
    emoji: '🌸',
  },
  {
    key: 'group_notice',
    label: '微信群通知',
    description: '社群里的活动通知、到店提醒',
    type: GenerationType.COPYWRITING,
    inputPlaceholder: '例如：通知群成员本周六店庆全场 8 折',
    suggestProduct: true,
    emoji: '📢',
  },
  {
    key: 'xiaohongshu',
    label: '小红书文案',
    description: '带标题和标签的小红书笔记',
    type: GenerationType.COPYWRITING,
    inputPlaceholder: '例如：写一篇新款美甲款式的种草笔记',
    suggestProduct: true,
    emoji: '📕',
  },
  {
    key: 'douyin_script',
    label: '抖音口播',
    description: '短视频口播脚本，口语化有钩子',
    type: GenerationType.COPYWRITING,
    inputPlaceholder: '例如：拍一条介绍我们家招牌项目的口播',
    suggestProduct: true,
    emoji: '🎬',
  },
  {
    key: 'new_product',
    label: '新品推广',
    description: '新品/新服务上线推广文案',
    type: GenerationType.COPYWRITING,
    inputPlaceholder: '例如：新上了头皮护理项目，需要推广文案',
    suggestProduct: true,
    emoji: '✨',
  },
  {
    key: 'promotion',
    label: '优惠活动',
    description: '限时折扣、拼团、节日活动文案',
    type: GenerationType.COPYWRITING,
    inputPlaceholder: '例如：五一活动充 500 送 100，帮我写活动文案',
    suggestProduct: true,
    emoji: '🎁',
  },
  {
    key: 'repurchase',
    label: '老客户复购',
    description: '唤起老客户再次消费的文案',
    type: GenerationType.COPYWRITING,
    inputPlaceholder: '例如：提醒上月做过护理的客户该续卡了',
    suggestCustomer: true,
    emoji: '🔁',
  },
  {
    key: 'wakeup',
    label: '沉睡客户唤醒',
    description: '很久没来的客户召回文案',
    type: GenerationType.COPYWRITING,
    inputPlaceholder: '例如：3 个月没来的客户，想用体验价召回',
    suggestCustomer: true,
    emoji: '⏰',
  },
  {
    key: 'closing_push',
    label: '客户成交催单',
    description: '临门一脚促成下单的私聊话术',
    type: GenerationType.COPYWRITING,
    inputPlaceholder: '例如：客户咨询过年卡一直没定，帮我催一下单',
    suggestCustomer: true,
    emoji: '🔥',
  },
  {
    key: 'rejection_followup',
    label: '拒绝后跟进',
    description: '客户拒绝后维持关系的跟进话术',
    type: GenerationType.COPYWRITING,
    inputPlaceholder: '例如：客户说不需要了，想保持联系不尬聊',
    suggestCustomer: true,
    emoji: '🤝',
  },
];

/** AI 客户回复场景（12 个） */
export const REPLY_SCENARIOS: ScenarioDef[] = [
  {
    key: 'ask_price',
    label: '问价格',
    description: '客户直接问多少钱',
    type: GenerationType.REPLY,
    inputPlaceholder: '粘贴客户原话，例如：你们做一次多少钱？',
    suggestProduct: true,
    emoji: '💰',
  },
  {
    key: 'too_expensive',
    label: '嫌贵',
    description: '客户觉得价格太高',
    type: GenerationType.REPLY,
    inputPlaceholder: '例如：客户说"这也太贵了吧，别家才 99"',
    suggestProduct: true,
    emoji: '😅',
  },
  {
    key: 'want_discount',
    label: '要优惠',
    description: '客户砍价、要折扣',
    type: GenerationType.REPLY,
    inputPlaceholder: '例如：客户问能不能便宜点、送点东西',
    suggestProduct: true,
    emoji: '🏷️',
  },
  {
    key: 'think_about_it',
    label: '考虑一下',
    description: '客户说再想想、再看看',
    type: GenerationType.REPLY,
    inputPlaceholder: '例如：客户说"我考虑一下再联系你"',
    suggestCustomer: true,
    emoji: '🤔',
  },
  {
    key: 'no_reply',
    label: '不回复',
    description: '发了消息客户已读不回',
    type: GenerationType.REPLY,
    inputPlaceholder: '例如：报完价客户 3 天没回消息了',
    suggestCustomer: true,
    emoji: '💬',
  },
  {
    key: 'book_time',
    label: '预约时间',
    description: '客户想约时间到店',
    type: GenerationType.REPLY,
    inputPlaceholder: '例如：客户问明天下午有没有位置',
    emoji: '📅',
  },
  {
    key: 'cancel_booking',
    label: '取消预约',
    description: '客户临时取消或改期',
    type: GenerationType.REPLY,
    inputPlaceholder: '例如：客户说明天来不了了想取消',
    suggestCustomer: true,
    emoji: '🙏',
  },
  {
    key: 'compare_competitor',
    label: '比较竞品',
    description: '客户拿别家对比',
    type: GenerationType.REPLY,
    inputPlaceholder: '例如：客户说别家更便宜/更有名',
    suggestProduct: true,
    emoji: '⚖️',
  },
  {
    key: 'doubt_effect',
    label: '质疑效果',
    description: '客户担心没效果、不靠谱',
    type: GenerationType.REPLY,
    inputPlaceholder: '例如：客户问"真的有用吗？会不会反弹"',
    suggestProduct: true,
    emoji: '🧐',
  },
  {
    key: 'ask_case',
    label: '要案例',
    description: '客户想看效果案例/评价',
    type: GenerationType.REPLY,
    inputPlaceholder: '例如：客户想看之前做过的效果图',
    suggestProduct: true,
    emoji: '📸',
  },
  {
    key: 'ask_address',
    label: '问地址',
    description: '客户问在哪里、怎么去',
    type: GenerationType.REPLY,
    inputPlaceholder: '例如：客户问店在哪、有没有停车位',
    emoji: '📍',
  },
  {
    key: 'ask_process',
    label: '问服务流程',
    description: '客户问怎么做、要多久',
    type: GenerationType.REPLY,
    inputPlaceholder: '例如：客户问第一次来的流程和时长',
    suggestProduct: true,
    emoji: '📋',
  },
];

export const ALL_SCENARIOS: ScenarioDef[] = [...COPYWRITING_SCENARIOS, ...REPLY_SCENARIOS];

export function findScenario(key: string): ScenarioDef | undefined {
  return ALL_SCENARIOS.find((s) => s.key === key);
}
