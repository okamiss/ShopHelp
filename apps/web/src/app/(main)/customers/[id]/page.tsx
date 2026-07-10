'use client';

import { ArrowLeftOutlined, EditOutlined, PlusOutlined, RobotOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Input,
  List,
  Row,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CUSTOMER_STATUS_LABELS, FOLLOW_TASK_STATUS_LABELS } from '@shophelp/shared';
import { aiApi, customerApi, taskApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import type { Generation } from '@/lib/types';
import { formatDate, fromNowDays, INTENT_COLORS, STATUS_COLORS } from '@/lib/utils';
import { useMerchantId } from '@/hooks/use-merchant-id';
import { CustomerFormModal } from '@/components/customer-form-modal';
import { GenerationResult } from '@/components/generation-result';

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const merchantId = useMerchantId();
  const router = useRouter();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiResult, setAiResult] = useState<Generation | null>(null);

  const queryKey = ['customer', merchantId, customerId];
  const { data: customer, isLoading } = useQuery({
    queryKey,
    queryFn: () => customerApi.get(merchantId, customerId),
    enabled: Boolean(merchantId && customerId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['customers', merchantId] });
  };

  const addNote = useMutation({
    mutationFn: () => customerApi.addNote(merchantId, customerId, noteContent.trim()),
    onSuccess: () => {
      message.success('跟进记录已添加');
      setNoteContent('');
      invalidate();
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  const generateFollowUp = useMutation({
    mutationFn: () => aiApi.followUp(merchantId, { customerId }),
    onSuccess: (data) => {
      setAiResult(data);
      invalidate();
    },
    onError: (e) => message.error(errorMessage(e, '生成失败')),
  });

  const favorite = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => aiApi.favorite(merchantId, id, next),
    onSuccess: (data) => {
      setAiResult(data);
      invalidate();
    },
  });

  const doneTask = useMutation({
    mutationFn: (taskId: string) => taskApi.update(merchantId, taskId, { status: 'DONE' }),
    onSuccess: () => {
      message.success('任务已完成');
      invalidate();
    },
  });

  if (isLoading || !customer) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/customers')}>
            返回
          </Button>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {customer.name}
          </Typography.Title>
          <Tag color={INTENT_COLORS[customer.intentLevel]}>{customer.intentLevel} 级意向</Tag>
          <Tag color={STATUS_COLORS[customer.status]}>{CUSTOMER_STATUS_LABELS[customer.status]}</Tag>
          {customer.tags.map((t) => (
            <Tag key={t.id} color={t.color ?? 'default'}>
              {t.name}
            </Tag>
          ))}
        </Space>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>
            编辑资料
          </Button>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            loading={generateFollowUp.isPending}
            onClick={() => {
              setAiDrawerOpen(true);
              if (!aiResult) generateFollowUp.mutate();
            }}
          >
            AI 跟进话术
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={9}>
          <Card size="small" title="客户资料">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="微信号">{customer.wechat ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="手机号">{customer.phone ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="来源">{customer.source ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="下次跟进">{customer.nextFollowAt ? formatDate(customer.nextFollowAt, true) : '未设置'}</Descriptions.Item>
              <Descriptions.Item label="上次联系">{fromNowDays(customer.lastContactAt)}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDate(customer.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="备注">{customer.remark ?? '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card size="small" title="相关任务" className="mt-4" style={{ marginTop: 16 }}>
            {customer.followTasks.length === 0 ? (
              <Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={customer.followTasks}
                renderItem={(t) => (
                  <List.Item
                    actions={
                      t.status === 'PENDING'
                        ? [
                            <Button key="done" size="small" type="link" onClick={() => doneTask.mutate(t.id)}>
                              完成
                            </Button>,
                          ]
                        : undefined
                    }
                  >
                    <List.Item.Meta
                      title={t.title}
                      description={`${formatDate(t.dueDate)} · ${FOLLOW_TASK_STATUS_LABELS[t.status]}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col span={15}>
          <Card size="small" title="跟进记录">
            <Space.Compact className="mb-4 w-full" style={{ width: '100%', marginBottom: 16 }}>
              <Input
                placeholder="记录这次沟通了什么…"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                onPressEnter={() => noteContent.trim() && addNote.mutate()}
                maxLength={1000}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={addNote.isPending}
                disabled={!noteContent.trim()}
                onClick={() => addNote.mutate()}
              >
                添加
              </Button>
            </Space.Compact>
            {customer.notes.length === 0 ? (
              <Empty description="还没有跟进记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Timeline
                items={customer.notes.map((n) => ({
                  children: (
                    <div>
                      <div className="text-sm">{n.content}</div>
                      <div className="text-xs text-gray-400">
                        {formatDate(n.createdAt, true)}
                        {n.createdBy ? ` · ${n.createdBy.name}` : ''}
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>

          <Card size="small" title="该客户的 AI 生成记录" className="mt-4" style={{ marginTop: 16 }}>
            {customer.generations.length === 0 ? (
              <Empty description="暂无记录，点右上角「AI 跟进话术」试试" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={customer.generations}
                renderItem={(g) => {
                  const rec = g.output.versions[g.output.recommendedIndex] ?? g.output.versions[0];
                  return (
                    <List.Item
                      className="cursor-pointer"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setAiResult(g as Generation);
                        setAiDrawerOpen(true);
                      }}
                    >
                      <List.Item.Meta
                        title={
                          <span>
                            <Tag>{g.scenario === 'follow_up' ? '跟进话术' : g.scenario}</Tag>
                            <span className="text-xs text-gray-400">{formatDate(g.createdAt, true)}</span>
                          </span>
                        }
                        description={<span className="line-clamp-1">{rec?.content}</span>}
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <CustomerFormModal open={editOpen} onClose={() => setEditOpen(false)} customer={customer} />

      <Drawer
        title={`AI 跟进话术 · ${customer.name}`}
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        width={560}
        extra={
          <Button
            type="primary"
            ghost
            icon={<RobotOutlined />}
            loading={generateFollowUp.isPending}
            onClick={() => generateFollowUp.mutate()}
          >
            重新生成
          </Button>
        }
      >
        {generateFollowUp.isPending ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <Spin size="large" />
            <Typography.Text type="secondary">AI 正在分析客户档案，生成跟进建议…</Typography.Text>
          </div>
        ) : aiResult ? (
          <GenerationResult
            generation={aiResult}
            favoritePending={favorite.isPending}
            onToggleFavorite={(next) => favorite.mutate({ id: aiResult.id, next })}
          />
        ) : (
          <Empty description="点击右上角生成" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Drawer>
    </div>
  );
}
