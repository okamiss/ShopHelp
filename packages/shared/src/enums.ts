/** 平台级角色（users.platformRole） */
export enum PlatformRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

/** 商家内角色（merchant_members.role） */
export enum MemberRole {
  OWNER = 'OWNER',
  STAFF = 'STAFF',
}

/** 客户意向等级 */
export enum IntentLevel {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

/** 客户状态 */
export enum CustomerStatus {
  UNCONTACTED = 'UNCONTACTED',
  IN_CONTACT = 'IN_CONTACT',
  DEAL = 'DEAL',
  LOST = 'LOST',
  REPURCHASED = 'REPURCHASED',
}

/** AI 生成类型 */
export enum GenerationType {
  COPYWRITING = 'COPYWRITING',
  REPLY = 'REPLY',
  FOLLOW_UP = 'FOLLOW_UP',
}

/** 跟进任务状态 */
export enum FollowTaskStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  SKIPPED = 'SKIPPED',
}

/** 套餐类型 */
export enum PlanType {
  FREE = 'FREE',
  PRO = 'PRO',
}

/** 产品/服务状态 */
export enum ProductStatus {
  ON = 'ON',
  OFF = 'OFF',
}

export const INTENT_LEVEL_LABELS: Record<IntentLevel, string> = {
  [IntentLevel.A]: 'A · 高意向',
  [IntentLevel.B]: 'B · 中意向',
  [IntentLevel.C]: 'C · 低意向',
  [IntentLevel.D]: 'D · 无意向',
};

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  [CustomerStatus.UNCONTACTED]: '未沟通',
  [CustomerStatus.IN_CONTACT]: '沟通中',
  [CustomerStatus.DEAL]: '已成交',
  [CustomerStatus.LOST]: '已流失',
  [CustomerStatus.REPURCHASED]: '已复购',
};

export const FOLLOW_TASK_STATUS_LABELS: Record<FollowTaskStatus, string> = {
  [FollowTaskStatus.PENDING]: '待处理',
  [FollowTaskStatus.DONE]: '已完成',
  [FollowTaskStatus.SKIPPED]: '已跳过',
};

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  [PlanType.FREE]: '免费版',
  [PlanType.PRO]: '专业版',
};

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  [MemberRole.OWNER]: '老板',
  [MemberRole.STAFF]: '员工',
};

export const GENERATION_TYPE_LABELS: Record<GenerationType, string> = {
  [GenerationType.COPYWRITING]: '文案生成',
  [GenerationType.REPLY]: '客户回复',
  [GenerationType.FOLLOW_UP]: '跟进话术',
};
