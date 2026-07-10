'use client';

import { CheckOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import { App, Button, DatePicker, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FOLLOW_TASK_STATUS_LABELS } from '@shophelp/shared';
import { customerApi, taskApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import type { FollowTask } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useMerchantId } from '@/hooks/use-merchant-id';

const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: 'processing',
  DONE: 'success',
  SKIPPED: 'default',
};

export default function TasksPage() {
  const merchantId = useMerchantId();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<string>();
  const [date, setDate] = useState<string>();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', merchantId, { status, date, page }],
    queryFn: () => taskApi.list(merchantId, { status, date, page, pageSize: 20 }),
    enabled: Boolean(merchantId),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', merchantId, 'options'],
    queryFn: () => customerApi.list(merchantId, { pageSize: 100 }),
    enabled: Boolean(merchantId) && formOpen,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', merchantId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', merchantId] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      return taskApi.create(merchantId, {
        ...values,
        dueDate: values.dueDate.format('YYYY-MM-DD'),
      });
    },
    onSuccess: () => {
      message.success('任务已创建');
      setFormOpen(false);
      form.resetFields();
      invalidate();
    },
    onError: (e) => {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error(errorMessage(e));
    },
  });

  const setTaskStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) => taskApi.update(merchantId, id, { status: next }),
    onSuccess: invalidate,
    onError: (e) => message.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => taskApi.remove(merchantId, id),
    onSuccess: () => {
      message.success('已删除');
      invalidate();
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  const columns: ColumnsType<FollowTask> = [
    {
      title: '任务',
      dataIndex: 'title',
      render: (v, r) => (
        <div>
          <span className="font-medium">{v}</span>
          {r.source === 'AUTO' && <Tag color="purple" className="ml-2" style={{ marginLeft: 8 }}>自动</Tag>}
          {r.note && <div className="text-xs text-gray-400">{r.note}</div>}
        </div>
      ),
    },
    {
      title: '关联客户',
      dataIndex: 'customer',
      width: 140,
      render: (c: FollowTask['customer']) => (c ? <Link href={`/customers/${c.id}`}>{c.name}</Link> : '-'),
    },
    {
      title: '到期日',
      dataIndex: 'dueDate',
      width: 120,
      render: (v, r) => {
        const overdue = r.status === 'PENDING' && dayjs(v).isBefore(dayjs(), 'day');
        return <span style={overdue ? { color: '#f5222d' } : undefined}>{formatDate(v)}{overdue ? '（逾期）' : ''}</span>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: keyof typeof FOLLOW_TASK_STATUS_LABELS) => (
        <Tag color={TASK_STATUS_COLORS[v]}>{FOLLOW_TASK_STATUS_LABELS[v]}</Tag>
      ),
    },
    {
      title: '操作',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'PENDING' && (
            <>
              <Button
                size="small"
                type="link"
                icon={<CheckOutlined />}
                onClick={() => setTaskStatus.mutate({ id: record.id, next: 'DONE' })}
              >
                完成
              </Button>
              <Button
                size="small"
                type="link"
                icon={<StopOutlined />}
                onClick={() => setTaskStatus.mutate({ id: record.id, next: 'SKIPPED' })}
              >
                跳过
              </Button>
            </>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => remove.mutate(record.id)}>
            <Button size="small" type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 4 }}>
            跟进任务
          </Typography.Title>
          <Typography.Text type="secondary">每天早上系统会自动为到期客户生成待办</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
          新建任务
        </Button>
      </div>

      <Space className="mb-4">
        <Select
          allowClear
          placeholder="状态"
          style={{ width: 120 }}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={Object.entries(FOLLOW_TASK_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <DatePicker
          placeholder="按日期筛选"
          onChange={(d) => {
            setDate(d ? d.format('YYYY-MM-DD') : undefined);
            setPage(1);
          }}
        />
      </Space>

      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total ?? 0,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />

      <Modal
        title="新建跟进任务"
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={() => create.mutate()}
        confirmLoading={create.isPending}
        okText="创建"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="title" label="任务内容" rules={[{ required: true, message: '请填写任务内容' }]}>
            <Input placeholder="如：跟进李小姐季卡意向" maxLength={200} />
          </Form.Item>
          <Form.Item name="customerId" label="关联客户（选填）">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="选择客户"
              options={(customers?.items ?? []).map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="dueDate" label="到期日期" rules={[{ required: true, message: '请选择日期' }]} initialValue={dayjs()}>
            <DatePicker className="w-full" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="备注（选填）">
            <Input.TextArea rows={2} maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
