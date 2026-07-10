import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GenerationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from './llm/llm.service';
import { buildSystemPrompt, buildUserPrompt, BuildPromptInput } from './prompts/prompt-builder';
import {
  GenerateCopywritingDto,
  GenerateFollowUpDto,
  GenerateReplyDto,
  QueryGenerationsDto,
} from './dto/generate.dto';
import { UsageService } from './usage.service';

const generationSelect = {
  id: true,
  type: true,
  scenario: true,
  inputParams: true,
  output: true,
  provider: true,
  model: true,
  tokensUsed: true,
  isFavorite: true,
  createdAt: true,
  customer: { select: { id: true, name: true } },
  user: { select: { id: true, name: true } },
} satisfies Prisma.AiGenerationSelect;

@Injectable()
export class GenerationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly usage: UsageService,
  ) {}

  async generateCopywriting(merchantId: string, userId: string, dto: GenerateCopywritingDto) {
    return this.generate(merchantId, userId, {
      type: GenerationType.COPYWRITING,
      scenario: dto.scenario,
      input: dto.input,
      productId: dto.productId,
      customerId: dto.customerId,
    });
  }

  async generateReply(merchantId: string, userId: string, dto: GenerateReplyDto) {
    return this.generate(merchantId, userId, {
      type: GenerationType.REPLY,
      scenario: dto.scenario,
      input: dto.input,
      productId: dto.productId,
      customerId: dto.customerId,
    });
  }

  async generateFollowUp(merchantId: string, userId: string, dto: GenerateFollowUpDto) {
    return this.generate(merchantId, userId, {
      type: GenerationType.FOLLOW_UP,
      scenario: 'follow_up',
      input: dto.input,
      customerId: dto.customerId,
    });
  }

  private async generate(
    merchantId: string,
    userId: string,
    params: { type: GenerationType; scenario: string; input?: string; productId?: string; customerId?: string },
  ) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) throw new NotFoundException('商家不存在');

    const promptInput: BuildPromptInput = {
      scenarioKey: params.scenario,
      userInput: params.input,
      merchant,
    };

    if (params.productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: params.productId, merchantId },
      });
      if (!product) throw new BadRequestException('关联产品不存在');
      promptInput.product = product;
    }

    if (params.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: params.customerId, merchantId },
        include: {
          tags: { select: { name: true } },
          notes: { orderBy: { createdAt: 'desc' }, take: 5, select: { content: true, createdAt: true } },
        },
      });
      if (!customer) throw new BadRequestException('关联客户不存在');
      promptInput.customer = { ...customer, recentNotes: customer.notes };
    }

    const result = await this.llm.generateStructured({
      system: buildSystemPrompt(promptInput),
      user: buildUserPrompt(promptInput),
    });

    const generation = await this.prisma.aiGeneration.create({
      data: {
        merchantId,
        userId,
        type: params.type,
        scenario: params.scenario,
        inputParams: {
          input: params.input ?? null,
          productId: params.productId ?? null,
          customerId: params.customerId ?? null,
        },
        output: result.output as unknown as Prisma.InputJsonValue,
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokensUsed,
        customerId: params.customerId,
      },
      select: generationSelect,
    });

    await this.usage.record(merchantId, params.type, result.tokensUsed);
    return generation;
  }

  async list(merchantId: string, query: QueryGenerationsDto) {
    const { type, scenario, favorite, page = 1, pageSize = 10 } = query;
    const where: Prisma.AiGenerationWhereInput = {
      merchantId,
      ...(type && { type }),
      ...(scenario && { scenario }),
      ...(favorite && { isFavorite: true }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.aiGeneration.findMany({
        where,
        select: generationSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.aiGeneration.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async setFavorite(merchantId: string, generationId: string, isFavorite: boolean) {
    const found = await this.prisma.aiGeneration.findFirst({
      where: { id: generationId, merchantId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('生成记录不存在');
    return this.prisma.aiGeneration.update({
      where: { id: generationId },
      data: { isFavorite },
      select: generationSelect,
    });
  }
}
