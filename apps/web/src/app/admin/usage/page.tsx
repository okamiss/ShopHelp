'use client';

import { Card, Progress, Select, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

interface TrendRow {
  date: string;
  count: number;
  tokensUsed: number;
}

export default function AdminUsagePage() {
  const [days, setDays] = useState(14);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-usage-trend', days],
    queryFn: () => adminApi.usageTrend(days),
  });

  const maxCount = useMemo(() => Math.max(1, ...(data ?? []).map((r) => r.count)), [data]);

  const columns: ColumnsType<TrendRow> = [
    { title: '日期', dataIndex: 'date', width: 120 },
    {
      title: '生成次数',
      dataIndex: 'count',
      render: (v: number) => (
        <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Progress
            percent={Math.round((v / maxCount) * 100)}
            showInfo={false}
            style={{ width: 200, margin: 0 }}
            strokeColor="#6C5CE7"
          />
          <span>{v}</span>
        </div>
      ),
    },
    { title: 'tokens 消耗', dataIndex: 'tokensUsed', width: 140 },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={4} style={{ margin: 0 }}>
          平台用量趋势
        </Typography.Title>
        <Select
          value={days}
          onChange={setDays}
          options={[7, 14, 30].map((d) => ({ value: d, label: `近 ${d} 天` }))}
          style={{ width: 120 }}
        />
      </div>
      <Card size="small">
        <Table
          rowKey="date"
          size="small"
          loading={isLoading}
          columns={columns}
          dataSource={data ?? []}
          pagination={false}
          locale={{ emptyText: '暂无用量数据' }}
        />
      </Card>
    </div>
  );
}
