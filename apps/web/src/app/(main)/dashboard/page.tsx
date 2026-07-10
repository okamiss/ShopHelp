'use client';

import {
  BulbOutlined,
  CheckOutlined,
  CopyOutlined,
  FireOutlined,
  RightOutlined,
  RocketOutlined,
  StarFilled,
  TeamOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Col, Empty, List, Progress, Row, Spin, Statistic, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { COPYWRITING_SCENARIOS, CUSTOMER_STATUS_LABELS } from '@shophelp/shared';
import { dashboardApi, taskApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import { copyText, formatDate, fromNowDays, INTENT_COLORS, STATUS_COLORS } from '@/lib/utils';
import { useMerchantId } from '@/hooks/use-merchant-id';

export default function DashboardPage() {
  const merchantId = useMerchantId();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', merchantId],
    queryFn: () => dashboardApi.summary(merchantId),
    enabled: Boolean(merchantId),
  });

  const doneTask = useMutation({
    mutationFn: (taskId: string) => taskApi.update(merchantId, taskId, { status: 'DONE' }),
    onSuccess: () => {
      message.success('已完成');
      queryClient.invalidateQueries({ queryKey: ['dashboard', merchantId] });
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const { stats, usage } = data;

  return (
    <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 统计行 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="客户总数" value={stats.customerTotal} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="成交/复购客户" value={stats.dealCount} prefix={<FireOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="待办任务" value={stats.pendingTaskCount} prefix={<CheckOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="今日 AI 生成" value={usage.dailyUsed} suffix={`/ ${usage.dailyLimit}`} prefix={<RocketOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* 今日 AI 建议 */}
      <Card
        size="small"
        title={
          <span>
            <BulbOutlined className="mr-1" style={{ color: '#faad14' }} /> 今日 AI 建议
          </span>
        }
      >
        <ul className="m-0 list-none space-y-1 p-0" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {data.suggestions.map((s, i) => (
            <li key={i} className="text-sm" style={{ padding: '4px 0' }}>
              👉 {s}
            </li>
          ))}
        </ul>
      </Card>

      <Row gutter={16}>
        {/* 今日待办 */}
        <Col span={12}>
          <Card
            size="small"
            title="今日待办"
            extra={<Link href="/tasks">全部 <RightOutlined /></Link>}
            style={{ height: '100%' }}
          >
            {data.todayTasks.length === 0 ? (
              <Empty description="今天没有待办，轻松一下" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={data.todayTasks}
                renderItem={(task) => (
                  <List.Item
                    actions={[
                      <Button
                        key="done"
                        size="small"
                        type="text"
                        icon={<CheckOutlined />}
                        onClick={() => doneTask.mutate(task.id)}
                      >
                        完成
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          {task.title}
                          {task.source === 'AUTO' && <Tag className="ml-2" color="purple">自动</Tag>}
                        </span>
                      }
                      description={task.customer ? (
                        <Link href={`/customers/${task.customer.id}`}>客户：{task.customer.name}</Link>
                      ) : task.note}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        {/* 待跟进客户 */}
        <Col span={12}>
          <Card
            size="small"
            title="待跟进客户"
            extra={<Link href="/customers">全部 <RightOutlined /></Link>}
            style={{ height: '100%' }}
          >
            {data.followUpCustomers.length === 0 ? (
              <Empty description="暂无到期跟进" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={data.followUpCustomers}
                renderItem={(c) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Link href={`/customers/${c.id}`}>
                          {c.name} <Tag color={INTENT_COLORS[c.intentLevel]}>{c.intentLevel} 级</Tag>
                          <Tag color={STATUS_COLORS[c.status]}>{CUSTOMER_STATUS_LABELS[c.status]}</Tag>
                        </Link>
                      }
                      description={`计划跟进：${formatDate(c.nextFollowAt)} · 上次联系：${fromNowDays(c.lastContactAt)}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 高意向客户 */}
        <Col span={8}>
          <Card size="small" title={<span><FireOutlined style={{ color: '#f5222d' }} /> 高意向客户</span>} style={{ height: '100%' }}>
            {data.highIntentCustomers.length === 0 ? (
              <Empty description="暂无 A 级客户" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={data.highIntentCustomers}
                renderItem={(c) => (
                  <List.Item>
                    <Link href={`/customers/${c.id}`} className="w-full">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-gray-400">{c.remark || '——'}</div>
                    </Link>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        {/* 快捷生成 */}
        <Col span={8}>
          <Card size="small" title="快捷生成文案" style={{ height: '100%' }}>
            <div className="grid grid-cols-2 gap-2">
              {COPYWRITING_SCENARIOS.slice(0, 6).map((s) => (
                <Link key={s.key} href={`/ai/copywriting?scenario=${s.key}`}>
                  <Button block>
                    {s.emoji} {s.label}
                  </Button>
                </Link>
              ))}
            </div>
          </Card>
        </Col>
        {/* 套餐用量 */}
        <Col span={8}>
          <Card size="small" title="套餐用量" extra={<Link href="/billing">详情 <RightOutlined /></Link>} style={{ height: '100%' }}>
            <div className="mb-1 flex justify-between text-sm">
              <span>今日生成</span>
              <span>
                {usage.dailyUsed} / {usage.dailyLimit}
              </span>
            </div>
            <Progress percent={Math.round((usage.dailyUsed / usage.dailyLimit) * 100)} showInfo={false} />
            <div className="mb-1 mt-3 flex justify-between text-sm">
              <span>本月生成</span>
              <span>
                {usage.monthlyUsed} / {usage.monthlyLimit}
              </span>
            </div>
            <Progress percent={Math.round((usage.monthlyUsed / usage.monthlyLimit) * 100)} showInfo={false} strokeColor="#6C5CE7" />
            <div className="mt-3">
              <Tag color={usage.plan === 'PRO' ? 'gold' : 'default'}>{usage.planLabel}</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 最近生成记录 */}
      <Card size="small" title="最近生成记录" extra={<Link href="/ai/copywriting">去生成 <RightOutlined /></Link>}>
        {data.recentGenerations.length === 0 ? (
          <Empty description="还没有生成过内容，去 AI 文案中心试试" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            dataSource={data.recentGenerations}
            renderItem={(g) => {
              const recommended = g.output.versions[g.output.recommendedIndex] ?? g.output.versions[0];
              return (
                <List.Item
                  actions={[
                    <Button
                      key="copy"
                      size="small"
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={async () => {
                        const ok = await copyText(recommended.content);
                        ok ? message.success('已复制推荐版本') : message.error('复制失败');
                      }}
                    >
                      复制
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <span>
                        {g.isFavorite && <StarFilled style={{ color: '#faad14' }} className="mr-1" />}
                        <Tag>{g.scenario}</Tag>
                        <span className="text-xs text-gray-400">{formatDate(g.createdAt, true)}</span>
                      </span>
                    }
                    description={<span className="line-clamp-1">{recommended?.content}</span>}
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
}
