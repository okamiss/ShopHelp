'use client';

import { CheckOutlined, CrownOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Progress, Row, Tag, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import type { PlanDef } from '@shophelp/shared';
import { aiApi, metaApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useMerchantId } from '@/hooks/use-merchant-id';

export default function BillingPage() {
  const merchantId = useMerchantId();
  const { message } = App.useApp();

  const { data: usage } = useQuery({
    queryKey: ['usage', merchantId],
    queryFn: () => aiApi.usage(merchantId),
    enabled: Boolean(merchantId),
  });
  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: metaApi.plans });

  const planList: PlanDef[] = plans ? Object.values(plans) : [];

  return (
    <div>
      <div className="mb-4">
        <Typography.Title level={4} style={{ marginBottom: 4 }}>
          套餐用量
        </Typography.Title>
        <Typography.Text type="secondary">
          当前套餐：{usage?.planLabel ?? '-'}
          {usage?.expiresAt ? ` · 有效期至 ${formatDate(usage.expiresAt)}` : ''}
        </Typography.Text>
      </div>

      <Card size="small" title="本期用量" className="mb-4" style={{ marginBottom: 16 }}>
        <Row gutter={32}>
          <Col span={12}>
            <div className="mb-1 flex justify-between">
              <span>今日 AI 生成</span>
              <span>
                {usage?.dailyUsed ?? 0} / {usage?.dailyLimit ?? 0}
              </span>
            </div>
            <Progress
              percent={usage ? Math.round((usage.dailyUsed / usage.dailyLimit) * 100) : 0}
              status={usage && usage.dailyUsed >= usage.dailyLimit ? 'exception' : 'normal'}
            />
          </Col>
          <Col span={12}>
            <div className="mb-1 flex justify-between">
              <span>本月 AI 生成</span>
              <span>
                {usage?.monthlyUsed ?? 0} / {usage?.monthlyLimit ?? 0}
              </span>
            </div>
            <Progress
              percent={usage ? Math.round((usage.monthlyUsed / usage.monthlyLimit) * 100) : 0}
              strokeColor="#6C5CE7"
              status={usage && usage.monthlyUsed >= usage.monthlyLimit ? 'exception' : 'normal'}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        {planList.map((plan) => {
          const isCurrent = usage?.plan === plan.type;
          return (
            <Col span={12} key={plan.type}>
              <Card
                size="small"
                style={isCurrent ? { borderColor: '#6C5CE7', boxShadow: '0 0 0 1px #6C5CE7 inset' } : undefined}
                title={
                  <span>
                    {plan.type === 'PRO' && <CrownOutlined style={{ color: '#faad14', marginRight: 6 }} />}
                    {plan.label}
                    {isCurrent && (
                      <Tag color="#6C5CE7" style={{ marginLeft: 8 }}>
                        当前套餐
                      </Tag>
                    )}
                  </span>
                }
              >
                <div className="mb-3 text-2xl font-bold">
                  {plan.priceCentsPerMonth === 0 ? '免费' : `¥${plan.priceCentsPerMonth / 100}`}
                  {plan.priceCentsPerMonth > 0 && <span className="text-sm font-normal text-gray-400"> / 月</span>}
                </div>
                <ul className="m-0 list-none space-y-1 p-0" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ padding: '2px 0' }}>
                      <CheckOutlined style={{ color: '#52c41a', marginRight: 6 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  type={plan.type === 'PRO' ? 'primary' : 'default'}
                  block
                  className="mt-4"
                  style={{ marginTop: 16 }}
                  disabled={isCurrent}
                  onClick={() => message.info('微信支付即将上线，如需升级请联系平台客服')}
                >
                  {isCurrent ? '使用中' : plan.type === 'PRO' ? '升级到专业版' : '降级'}
                </Button>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
