import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { GenerationOutput } from '@shophelp/shared';
import { DeepSeekProvider } from './deepseek.provider';
import { LlmChatOptions, LlmProvider } from './llm-provider.interface';
import { MockProvider } from './mock.provider';

export interface StructuredResult {
  output: GenerationOutput;
  provider: string;
  model: string;
  tokensUsed: number;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  /** Provider 注册表：新增供应商（OpenAI/通义/混元）在此登记 */
  private readonly registry: Record<string, LlmProvider>;

  constructor(
    private readonly config: ConfigService,
    deepseek: DeepSeekProvider,
    private readonly mock: MockProvider,
  ) {
    this.registry = {
      [deepseek.name]: deepseek,
      [mock.name]: mock,
    };
  }

  /** 当前生效的 provider：配置了且可用则用之，否则回退 mock */
  activeProvider(): LlmProvider {
    const wanted = this.config.get<string>('LLM_PROVIDER', 'mock').toLowerCase();
    const provider = this.registry[wanted];
    if (!provider) {
      this.logger.warn(`未知 LLM_PROVIDER "${wanted}"，回退 mock`);
      return this.mock;
    }
    if (!provider.isConfigured()) {
      this.logger.warn(`Provider "${wanted}" 未配置（缺少 API Key），回退 mock`);
      return this.mock;
    }
    return provider;
  }

  /** 生成结构化输出：解析失败自动重试一次 */
  async generateStructured(options: LlmChatOptions): Promise<StructuredResult> {
    const provider = this.activeProvider();

    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const result = await provider.chatJson(options);
      const parsed = this.tryParse(result.content);
      if (parsed) {
        return {
          output: parsed,
          provider: provider.name,
          model: result.model,
          tokensUsed: result.tokensUsed,
        };
      }
      lastError = new Error('模型输出无法解析为结构化 JSON');
      this.logger.warn(`第 ${attempt} 次生成解析失败，provider=${provider.name}`);
    }
    throw new BadGatewayException(lastError?.message ?? 'AI 生成失败，请稍后重试');
  }

  private tryParse(content: string): GenerationOutput | null {
    // 容错：剥掉可能存在的 markdown 代码块包裹
    const cleaned = content
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');
    try {
      const parsed = JSON.parse(cleaned) as GenerationOutput;
      if (!Array.isArray(parsed.versions) || parsed.versions.length < 1) return null;
      const versions = parsed.versions
        .filter((v) => v && typeof v.content === 'string' && v.content.trim())
        .map((v) => ({
          title: String(v.title ?? '推荐版本'),
          scene: String(v.scene ?? ''),
          content: String(v.content).trim(),
        }));
      if (versions.length < 1) return null;
      const recommendedIndex =
        Number.isInteger(parsed.recommendedIndex) &&
        (parsed.recommendedIndex as number) >= 0 &&
        (parsed.recommendedIndex as number) < versions.length
          ? (parsed.recommendedIndex as number)
          : 0;
      return { versions, recommendedIndex, tips: parsed.tips ? String(parsed.tips) : undefined };
    } catch {
      return null;
    }
  }
}
