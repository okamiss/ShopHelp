'use client';

import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import type { Product } from '@/lib/types';
import { useMerchantId } from '@/hooks/use-merchant-id';

export default function ProductsPage() {
  const merchantId = useMerchantId();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form] = Form.useForm();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', merchantId],
    queryFn: () => productApi.list(merchantId),
    enabled: Boolean(merchantId),
  });

  useEffect(() => {
    if (!formOpen) return;
    if (editing) {
      form.setFieldsValue({ ...editing, price: editing.price != null ? Number(editing.price) : undefined });
    } else {
      form.resetFields();
    }
  }, [formOpen, editing, form]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products', merchantId] });

  const save = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      return editing ? productApi.update(merchantId, editing.id, values) : productApi.create(merchantId, values);
    },
    onSuccess: () => {
      message.success(editing ? '已更新' : '已创建');
      setFormOpen(false);
      invalidate();
    },
    onError: (e) => {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error(errorMessage(e));
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => productApi.remove(merchantId, id),
    onSuccess: () => {
      message.success('已删除');
      invalidate();
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) =>
      productApi.update(merchantId, id, { status: on ? 'ON' : 'OFF' }),
    onSuccess: invalidate,
    onError: (e) => message.error(errorMessage(e)),
  });

  const columns: ColumnsType<Product> = [
    { title: '名称', dataIndex: 'name', render: (v) => <span className="font-medium">{v}</span> },
    { title: '分类', dataIndex: 'category', width: 100, render: (v) => (v ? <Tag>{v}</Tag> : '-') },
    {
      title: '价格',
      dataIndex: 'price',
      width: 120,
      render: (v, r) => (v != null ? `¥${Number(v)}${r.unit ? ` / ${r.unit}` : ''}` : '-'),
    },
    {
      title: '卖点',
      dataIndex: 'sellingPoints',
      render: (v: string | null) =>
        v ? (
          <span className="text-xs text-gray-500">
            {v.split('\n').slice(0, 2).join('；')}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: '上架',
      dataIndex: 'status',
      width: 80,
      render: (v, r) => (
        <Switch size="small" checked={v === 'ON'} onChange={(on) => toggleStatus.mutate({ id: r.id, on })} />
      ),
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="link"
            onClick={() => {
              setEditing(record);
              setFormOpen(true);
            }}
          >
            编辑
          </Button>
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
            产品服务
          </Typography.Title>
          <Typography.Text type="secondary">维护好产品卖点，AI 生成的文案会更有说服力</Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          新增产品/服务
        </Button>
      </div>

      <Table rowKey="id" loading={isLoading} columns={columns} dataSource={products ?? []} pagination={false} />

      <Modal
        title={editing ? `编辑 · ${editing.name}` : '新增产品/服务'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={() => save.mutate()}
        confirmLoading={save.isPending}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请填写名称' }]}>
            <Input placeholder="如：日式手绘美甲" />
          </Form.Item>
          <div className="grid grid-cols-3 gap-x-4">
            <Form.Item name="category" label="分类">
              <Input placeholder="如：美甲" />
            </Form.Item>
            <Form.Item name="price" label="价格（元）">
              <InputNumber min={0} precision={2} className="w-full" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="unit" label="单位">
              <Select
                allowClear
                placeholder="如：次"
                options={['次', '小时', '份', '季', '年', '件'].map((u) => ({ value: u, label: u }))}
              />
            </Form.Item>
          </div>
          <Form.Item name="description" label="介绍">
            <Input.TextArea rows={2} placeholder="一句话介绍" maxLength={1000} />
          </Form.Item>
          <Form.Item name="sellingPoints" label="卖点（每行一条，AI 生成文案时使用）">
            <Input.TextArea rows={3} placeholder={'进口材料不伤甲\n设计师 1v1 定制款式\n维持 4-6 周'} maxLength={1000} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
