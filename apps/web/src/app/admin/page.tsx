'use client';

import { AppstoreOutlined, RobotOutlined, ShopOutlined, TeamOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Col, Row, Spin, Statistic } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats });

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const items = [
    { title: '商家总数', value: data.merchantCount, icon: <ShopOutlined /> },
    { title: '用户总数', value: data.userCount, icon: <UserOutlined /> },
    { title: '客户总数', value: data.customerCount, icon: <TeamOutlined /> },
    { title: 'AI 生成总数', value: data.generationCount, icon: <RobotOutlined /> },
    { title: '今日生成', value: data.todayGenerations, icon: <ThunderboltOutlined /> },
    { title: '今日 tokens', value: data.todayTokens, icon: <AppstoreOutlined /> },
  ];

  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col span={8} key={item.title}>
          <Card size="small">
            <Statistic title={item.title} value={item.value} prefix={item.icon} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
