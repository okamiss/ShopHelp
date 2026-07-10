import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmChatOptions, LlmChatResult, LlmProvider } from './llm-provider.interface';

interface OpenAiCompatibleResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { total_tokens?: number };
  model?: string;
  error?: { message?: string };
}

/** DeepSeek（OpenAI 兼容 chat/completions） */
@Injectable()
export class DeepSeekProvider implements LlmProvider {
  readonly name = 'deepseek';

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('DEEPSEEK_API_KEY'));
  }

  async chatJson(options: LlmChatOptions): Promise<LlmChatResult> {
    const baseUrl = this.config.get<string>('DEEPSEEK_BASE_URL', 'https://api.deepseek.com');
    const model = this.config.get<string>('DEEPSEEK_MODEL', 'deepseek-chat');
    const apiKey = this.config.get<string>('DEEPSEEK_API_KEY');

    let res: Response;
    try {
      res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: options.system },
            { role: 'user', content: options.user },
          ],
          response_format: { type: 'json_object' },
          temperature: options.temperature ?? 0.8,
          max_tokens: options.maxTokens ?? 2000,
        }),
        signal: AbortSignal.timeout(60_000),
      });
    } catch (e) {
      throw new BadGatewayException(`DeepSeek 请求失败：${(e as Error).message}`);
    }

    const data = (await res.json().catch(() => ({}))) as OpenAiCompatibleResponse;
    if (!res.ok) {
      throw new BadGatewayException(`DeepSeek 返回错误（${res.status}）：${data.error?.message ?? '未知错误'}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new BadGatewayException('DeepSeek 返回内容为空');

    return {
      content,
      tokensUsed: data.usage?.total_tokens ?? 0,
      model: data.model ?? model,
    };
  }
}
