'use client';

import { SearchOutlined } from '@ant-design/icons';
import { Input, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { findIndustry } from '@shophelp/shared';
import { adminApi } from '@/lib/api';
import type { AdminMerchant } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AdminMerchantsPage() {
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-merchants', keyword, page],
    queryFn: () => adminApi.merchants({ keyword: keyword || undefined, page, pageSize: 20 }),
  });

  const columns: ColumnsType<AdminMerchant> = [
    { title: '商家', dataIndex: 'name', render: (v) => <span className="font-medium">{v}</span> },
    {
      title: '行业',
      dataIndex: 'industry',
      width: 120,
      render: (v: string) => {
        const ind = findIndustry(v);
        return ind ? `${ind.emoji} ${ind.label}` : v;
      },
    },
    {
      title: '老板',
      dataIndex: 'owner',
      render: (o: AdminMerchant['owner']) => (
        <span>
          {o.name} <span className="text-xs text-gray-400">{o.email}</span>
        </span>
      ),
    },
    {
      title: '套餐',
      dataIndex: 'subscription',
      width: 100,
      render: (s: AdminMerchant['subscription']) =>
        s ? <Tag color={s.plan === 'PRO' ? 'gold' : 'default'}>{s.plan}</Tag> : '-',
    },
    { title: '客户数', width: 80, render: (_, r) => r._count.customers },
    { title: '成员数', width: 80, render: (_, r) => r._count.members },
    { title: 'AI 生成', width: 80, render: (_, r) => r._count.generations },
    { title: '注册时间', dataIndex: 'createdAt', width: 110, render: (v) => formatDate(v) },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={4} style={{ margin: 0 }}>
          商家管理（{data?.total ?? 0}）
        </Typography.Title>
        <Input
          placeholder="搜索商家名"
          prefix={<SearchOutlined />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={() => {
            setKeyword(searchInput);
            setPage(1);
          }}
          allowClear
          style={{ width: 220 }}
        />
      </div>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={{ current: page, pageSize: 20, total: data?.total ?? 0, onChange: setPage }}
      />
    </div>
  );
}
