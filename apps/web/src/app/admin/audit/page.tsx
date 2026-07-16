'use client';

import { Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { AdminAuditLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const ACTION_LABELS: Record<string, string> = {
  MERCHANT_UPDATE: '编辑商家',
  MERCHANT_STATUS: '商家状态',
  MERCHANT_SUBSCRIPTION: '调整套餐',
  USER_UPDATE: '编辑用户',
  USER_STATUS: '用户状态',
  USER_RESET_PASSWORD: '重置密码',
  SUBSCRIPTION_EXPIRED: '套餐到期降级',
  DAILY_TASKS_RUN: '手动执行每日任务',
};

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [targetType, setTargetType] = useState<string>();
  const [action, setAction] = useState<string>();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, targetType, action],
    queryFn: () => adminApi.auditLogs({ page, pageSize: 20, targetType, action }),
  });

  const columns: ColumnsType<AdminAuditLog> = [
    { title: '时间', dataIndex: 'createdAt', width: 150, render: (value) => formatDate(value, true) },
    {
      title: '操作人',
      dataIndex: 'admin',
      width: 190,
      render: (admin: AdminAuditLog['admin']) =>
        admin ? (
          <span>
            {admin.name} <span className="text-xs text-gray-400">{admin.email}</span>
          </span>
        ) : (
          <Tag>系统</Tag>
        ),
    },
    {
      title: '动作',
      dataIndex: 'action',
      width: 160,
      render: (value: string) => <Tag color="blue">{ACTION_LABELS[value] ?? value}</Tag>,
    },
    {
      title: '对象',
      width: 220,
      render: (_, record) => (
        <div>
          <Tag>{record.targetType}</Tag>
          <Typography.Text code>{record.targetId}</Typography.Text>
        </div>
      ),
    },
    {
      title: '详情',
      dataIndex: 'detail',
      render: (detail: unknown) =>
        detail ? (
          <pre className="m-0 max-w-[520px] overflow-auto whitespace-pre-wrap text-xs">
            {JSON.stringify(detail, null, 2)}
          </pre>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={4} style={{ margin: 0 }}>
          操作审计（{data?.total ?? 0}）
        </Typography.Title>
        <Space>
          <Select
            allowClear
            placeholder="对象类型"
            value={targetType}
            onChange={(value) => {
              setTargetType(value);
              setPage(1);
            }}
            options={[
              { value: 'MERCHANT', label: '商家' },
              { value: 'USER', label: '用户' },
              { value: 'JOB', label: '任务' },
            ]}
            style={{ width: 130 }}
          />
          <Select
            allowClear
            showSearch
            placeholder="动作"
            value={action}
            onChange={(value) => {
              setAction(value);
              setPage(1);
            }}
            options={Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }))}
            style={{ width: 180 }}
          />
        </Space>
      </div>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={{ current: page, pageSize: 20, total: data?.total ?? 0, onChange: setPage }}
        scroll={{ x: 1200 }}
      />
    </div>
  );
}
