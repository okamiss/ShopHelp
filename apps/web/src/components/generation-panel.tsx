'use client';

import { HistoryOutlined, StarFilled, ThunderboltOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Empty, Input, List, Pagination, Row, Select, Spin, Switch, Tag, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { ScenarioDef } from '@shophelp/shared';
import { aiApi, customerApi, productApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import type { Generation } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useMerchantId } from '@/hooks/use-merchant-id';
import { GenerationResult } from './generation-result';

interface GenerationPanelProps {
  type: 'COPYWRITING' | 'REPLY';
  scenarios: ScenarioDef[];
  /** 从 URL 带入的初始场景 */
  initialScenario?: string;
  /** 输入框是否必填（回复助手需要客户原话） */
  inputRequired?: boolean;
}

export function GenerationPanel({ type, scenarios, initialScenario, inputRequired }: GenerationPanelProps) {
  const merchantId = useMerchantId();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [scenarioKey, setScenarioKey] = useState(initialScenario ?? scenarios[0]?.key);
  const [input, setInput] = useState('');
  const [productId, setProductId] = useState<string>();
  const [customerId, setCustomerId] = useState<string>();
  const [current, setCurrent] = useState<Generation | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  useEffect(() => {
    if (initialScenario && scenarios.some((s) => s.key === initialScenario)) {
      setScenarioKey(initialScenario);
    }
  }, [initialScenario, scenarios]);

  const scenario = useMemo(() => scenarios.find((s) => s.key === scenarioKey), [scenarios, scenarioKey]);

  const { data: products } = useQuery({
    queryKey: ['products', merchantId],
    queryFn: () => productApi.list(merchantId),
    enabled: Boolean(merchantId),
  });
  const { data: customers } = useQuery({
    queryKey: ['customers', merchantId, 'options'],
    queryFn: () => customerApi.list(merchantId, { pageSize: 100 }),
    enabled: Boolean(merchantId),
  });

  const historyQueryKey = ['generations', merchantId, type, favoriteOnly, historyPage];
  const { data: history } = useQuery({
    queryKey: historyQueryKey,
    queryFn: () =>
      aiApi.generations(merchantId, {
        type,
        favorite: favoriteOnly || undefined,
        page: historyPage,
        pageSize: 5,
      }),
    enabled: Boolean(merchantId),
  });

  const generate = useMutation({
    mutationFn: () => {
      const payload = { scenario: scenarioKey, input: input || undefined, productId, customerId };
      return type === 'COPYWRITING'
        ? aiApi.copywriting(merchantId, payload)
        : aiApi.reply(merchantId, { ...payload, input });
    },
    onSuccess: (data) => {
      setCurrent(data);
      queryClient.invalidateQueries({ queryKey: ['generations', merchantId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', merchantId] });
    },
    onError: (e) => message.error(errorMessage(e, '生成失败，请稍后重试')),
  });

  const favorite = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => aiApi.favorite(merchantId, id, next),
    onSuccess: (data) => {
      if (current?.id === data.id) setCurrent(data);
      queryClient.invalidateQueries({ queryKey: ['generations', merchantId] });
      message.success(data.isFavorite ? '已收藏为话术' : '已取消收藏');
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  const onGenerate = () => {
    if (inputRequired && !input.trim()) {
      message.warning('请先填写客户说了什么');
      return;
    }
    generate.mutate();
  };

  return (
    <Row gutter={16}>
      {/* 左侧：场景 + 表单 */}
      <Col span={9}>
        <Card size="small" title="1️⃣ 选择场景">
          <div className="grid grid-cols-2 gap-2">
            {scenarios.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setScenarioKey(s.key)}
                className="cursor-pointer rounded-lg border p-2 text-left transition-all"
                style={{
                  borderColor: scenarioKey === s.key ? '#6C5CE7' : '#e5e7eb',
                  background: scenarioKey === s.key ? '#f3f0ff' : '#fff',
                }}
              >
                <div className="text-sm font-medium">
                  {s.emoji} {s.label}
                </div>
                <div className="mt-0.5 text-xs text-gray-400">{s.description}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card size="small" title="2️⃣ 补充信息" className="mt-4" style={{ marginTop: 16 }}>
          <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <Typography.Text className="mb-1 block text-xs" type="secondary">
                {type === 'REPLY' ? '客户说了什么（必填）' : '想说点什么（选填）'}
              </Typography.Text>
              <Input.TextArea
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={scenario?.inputPlaceholder}
                maxLength={500}
                showCount
              />
            </div>
            <div>
              <Typography.Text className="mb-1 block text-xs" type="secondary">
                关联产品/服务（选填，AI 会带入卖点）
              </Typography.Text>
              <Select
                allowClear
                className="w-full"
                style={{ width: '100%' }}
                placeholder="选择产品"
                value={productId}
                onChange={setProductId}
                options={(products ?? []).map((p) => ({ value: p.id, label: p.name }))}
              />
            </div>
            <div>
              <Typography.Text className="mb-1 block text-xs" type="secondary">
                关联客户（选填，AI 会参考客户档案）
              </Typography.Text>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                className="w-full"
                style={{ width: '100%' }}
                placeholder="选择客户"
                value={customerId}
                onChange={setCustomerId}
                options={(customers?.items ?? []).map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
            <Button
              type="primary"
              size="large"
              block
              icon={<ThunderboltOutlined />}
              loading={generate.isPending}
              onClick={onGenerate}
            >
              {generate.isPending ? 'AI 创作中…' : '生成 3 个版本'}
            </Button>
          </div>
        </Card>
      </Col>

      {/* 右侧：结果 + 历史 */}
      <Col span={15}>
        <Card size="small" title="3️⃣ 生成结果" style={{ minHeight: 200 }}>
          {generate.isPending ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3">
              <Spin size="large" />
              <Typography.Text type="secondary">AI 正在为你创作 3 个版本…</Typography.Text>
            </div>
          ) : current ? (
            <GenerationResult
              generation={current}
              favoritePending={favorite.isPending}
              onToggleFavorite={(next) => favorite.mutate({ id: current.id, next })}
            />
          ) : (
            <Empty description="选择场景并点击生成，结果会出现在这里" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>

        <Card
          size="small"
          className="mt-4"
          style={{ marginTop: 16 }}
          title={
            <span>
              <HistoryOutlined className="mr-1" /> 生成历史
            </span>
          }
          extra={
            <span className="flex items-center gap-2">
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                只看收藏
              </Typography.Text>
              <Switch
                size="small"
                checked={favoriteOnly}
                onChange={(v) => {
                  setFavoriteOnly(v);
                  setHistoryPage(1);
                }}
              />
            </span>
          }
        >
          {!history || history.items.length === 0 ? (
            <Empty description="暂无记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <>
              <List
                size="small"
                dataSource={history.items}
                renderItem={(g) => {
                  const recommended = g.output.versions[g.output.recommendedIndex] ?? g.output.versions[0];
                  const scenarioDef = scenarios.find((s) => s.key === g.scenario);
                  return (
                    <List.Item
                      className="cursor-pointer"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setCurrent(g)}
                      actions={[
                        <Button
                          key="fav"
                          size="small"
                          type="text"
                          icon={g.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarFilled style={{ color: '#d9d9d9' }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            favorite.mutate({ id: g.id, next: !g.isFavorite });
                          }}
                        />,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <span>
                            <Tag>{scenarioDef ? `${scenarioDef.emoji} ${scenarioDef.label}` : g.scenario}</Tag>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              {formatDate(g.createdAt, true)}
                            </Typography.Text>
                          </span>
                        }
                        description={<span className="line-clamp-1">{recommended?.content}</span>}
                      />
                    </List.Item>
                  );
                }}
              />
              <div className="mt-2 text-right">
                <Pagination
                  size="small"
                  current={historyPage}
                  pageSize={5}
                  total={history.total}
                  onChange={setHistoryPage}
                  hideOnSinglePage
                />
              </div>
            </>
          )}
        </Card>
      </Col>
    </Row>
  );
}
