import { Injectable } from '@nestjs/common';
import { LlmChatOptions, LlmChatResult, LlmProvider } from './llm-provider.interface';

/**
 * Mock Provider：无 API Key 时保证全流程可跑通。
 * 从 user prompt 中提取场景与输入，返回结构化假数据。
 */
@Injectable()
export class MockProvider implements LlmProvider {
  readonly name = 'mock';

  isConfigured(): boolean {
    return true;
  }

  async chatJson(options: LlmChatOptions): Promise<LlmChatResult> {
    await new Promise((r) => setTimeout(r, 300));

    const inputMatch = options.user.match(/【本次需求】([\s\S]*?)(?=【|$)/);
    const hint = (inputMatch?.[1] ?? '').trim().slice(0, 40) || '本次经营内容';

    const output = {
      versions: [
        {
          title: '亲切口语版',
          scene: '适合发朋友圈或私聊，像朋友之间的分享',
          content: `【演示数据】围绕「${hint}」的亲切版文案：姐妹们，${hint}真的值得安排一波～我们最近反馈特别好，想了解的私我，先到先约哦！`,
        },
        {
          title: '专业种草版',
          scene: '适合小红书/社群，突出专业感和卖点',
          content: `【演示数据】围绕「${hint}」的专业版文案：为什么最近这么多人来做？三个理由：1）效果看得见 2）体验超预期 3）性价比在线。详情欢迎咨询～`,
        },
        {
          title: '限时行动版',
          scene: '适合催单/活动场景，制造紧迫感',
          content: `【演示数据】围绕「${hint}」的行动版文案：本周仅剩少量名额！现在预约立享专属福利，错过等下月。回复"预约"马上安排！`,
        },
      ],
      recommendedIndex: 0,
      tips: '当前为 Mock 演示数据。在 .env 配置 DEEPSEEK_API_KEY 并将 LLM_PROVIDER 设为 deepseek 后即可生成真实内容。',
    };

    return {
      content: JSON.stringify(output),
      tokensUsed: 0,
      model: 'mock-v1',
    };
  }
}
