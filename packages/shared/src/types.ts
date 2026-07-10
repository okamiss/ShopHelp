/** LLM 结构化输出：每次生成 ≥3 个版本 */
export interface GenerationVersion {
  /** 版本小标题，如「亲切口语版」 */
  title: string;
  /** 适用场景说明，如「适合发早上的朋友圈」 */
  scene: string;
  /** 正文内容 */
  content: string;
}

export interface GenerationOutput {
  versions: GenerationVersion[];
  /** 推荐版本下标（0-based） */
  recommendedIndex: number;
  /** 使用小贴士 */
  tips?: string;
}

/** 统一 API 响应包装 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
