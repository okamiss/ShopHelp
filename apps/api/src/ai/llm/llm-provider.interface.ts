export interface LlmChatOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmChatResult {
  /** 模型原始返回文本（要求为 JSON 字符串） */
  content: string;
  tokensUsed: number;
  model: string;
}

/**
 * 统一 LLM Provider 接口（对齐 SaasLibrary ChatProvider 设计）。
 * 新增供应商（OpenAI/通义/腾讯混元）实现本接口并在 LlmService 注册即可。
 */
export interface LlmProvider {
  readonly name: string;
  /** 是否已配置可用（如 API Key 是否存在） */
  isConfigured(): boolean;
  chatJson(options: LlmChatOptions): Promise<LlmChatResult>;
}
