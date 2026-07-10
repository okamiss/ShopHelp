'use client';

import { SearchOutlined } from '@ant-design/icons';
import { Input, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { AdminUser } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', keyword, page],
    queryFn: () => adminApi.users({ keyword: keyword || undefined, page, pageSize: 20 }),
  });

  const columns: ColumnsType<AdminUser> = [
    { title: '姓名', dataIndex: 'name', render: (v) => <span className="font-medium">{v}</span> },
    { title: '邮箱', dataIndex: 'email' },
    {
      title: '平台角色',
      dataIndex: 'platformRole',
      width: 110,
      render: (v: string) => (v === 'ADMIN' ? <Tag color="red">平台管理员</Tag> : <Tag>普通用户</Tag>),
    },
    {
      title: '所属商家',
      dataIndex: 'memberships',
      render: (ms: AdminUser['memberships']) =>
        ms.length
          ? ms.map((m) => (
              <Tag key={m.merchant.id} color={m.role === 'OWNER' ? 'gold' : 'blue'}>
                {m.merchant.name}（{m.role === 'OWNER' ? '老板' : '员工'}）
              </Tag>
            ))
          : '-',
    },
    { title: '注册时间', dataIndex: 'createdAt', width: 110, render: (v) => formatDate(v) },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={4} style={{ margin: 0 }}>
          用户管理（{data?.total ?? 0}）
        </Typography.Title>
        <Input
          placeholder="搜索邮箱/姓名"
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
