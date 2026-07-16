'use client';

import { EditOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { findIndustry, INDUSTRIES, PLANS, PlanType } from '@shophelp/shared';
import { adminApi, merchantApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import type { AdminMerchant, Merchant } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface SubscriptionFormValues {
  plan: PlanType;
  dailyGenerationLimit: number;
  monthlyGenerationLimit: number;
  expiresAt: Dayjs | null;
}

export default function AdminMerchantsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [editForm] = Form.useForm<Partial<Merchant>>();
  const [subscriptionForm] = Form.useForm<SubscriptionFormValues>();
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED' | undefined>();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ merchant: AdminMerchant; values: Partial<Merchant> } | null>(null);
  const [subscriptionEdit, setSubscriptionEdit] = useState<{
    merchant: AdminMerchant;
    values: SubscriptionFormValues;
  } | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [actionKey, setActionKey] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-merchants', keyword, status, page],
    queryFn: () => adminApi.merchants({ keyword: keyword || undefined, status, page, pageSize: 20 }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-merchants'] });

  const openEdit = async (merchant: AdminMerchant) => {
    setActionKey(`edit-${merchant.id}`);
    try {
      const detail = await merchantApi.get(merchant.id);
      setEditing({ merchant, values: detail });
    } catch (error) {
      message.error(errorMessage(error, '读取商家资料失败'));
    } finally {
      setActionKey('');
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    const values = await editForm.validateFields();
    setModalSaving(true);
    try {
      await adminApi.updateMerchant(editing.merchant.id, values);
      message.success('商家资料已更新');
      setEditing(null);
      await refresh();
    } catch (error) {
      message.error(errorMessage(error, '更新商家失败'));
    } finally {
      setModalSaving(false);
    }
  };

  const openSubscription = (merchant: AdminMerchant) => {
    const current = merchant.subscription;
    const plan = current?.plan ?? PlanType.FREE;
    setSubscriptionEdit({
      merchant,
      values: {
        plan,
        dailyGenerationLimit: current?.dailyGenerationLimit ?? PLANS[plan].dailyGenerationLimit,
        monthlyGenerationLimit: current?.monthlyGenerationLimit ?? PLANS[plan].monthlyGenerationLimit,
        expiresAt: current?.expiresAt ? dayjs(current.expiresAt) : null,
      },
    });
  };

  const saveSubscription = async () => {
    if (!subscriptionEdit) return;
    const values = await subscriptionForm.validateFields();
    setModalSaving(true);
    try {
      await adminApi.updateSubscription(subscriptionEdit.merchant.id, {
        plan: values.plan,
        dailyGenerationLimit: values.dailyGenerationLimit,
        monthlyGenerationLimit: values.monthlyGenerationLimit,
        expiresAt: values.expiresAt?.toISOString() ?? null,
      });
      message.success('套餐已调整');
      setSubscriptionEdit(null);
      await refresh();
    } catch (error) {
      message.error(errorMessage(error, '调整套餐失败'));
    } finally {
      setModalSaving(false);
    }
  };

  const changeStatus = async (merchant: AdminMerchant) => {
    const nextStatus = merchant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setActionKey(`status-${merchant.id}`);
    try {
      await adminApi.updateMerchantStatus(merchant.id, nextStatus);
      message.success(nextStatus === 'SUSPENDED' ? '商家已封停' : '商家已恢复');
      await refresh();
    } catch (error) {
      message.error(errorMessage(error, '更新商家状态失败'));
    } finally {
      setActionKey('');
    }
  };

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
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value: AdminMerchant['status']) => (
        <Tag color={value === 'ACTIVE' ? 'success' : 'error'}>{value === 'ACTIVE' ? '正常' : '已封停'}</Tag>
      ),
    },
    {
      title: '套餐',
      dataIndex: 'subscription',
      width: 140,
      render: (s: AdminMerchant['subscription']) =>
        s ? (
          <div>
            <Tag color={s.plan === 'PRO' ? 'gold' : 'default'}>{PLANS[s.plan].label}</Tag>
            <div className="mt-1 text-xs text-gray-400">
              {s.dailyGenerationLimit}/日 · {s.monthlyGenerationLimit}/月
            </div>
          </div>
        ) : (
          '-'
        ),
    },
    { title: '客户数', width: 80, render: (_, r) => r._count.customers },
    { title: '成员数', width: 80, render: (_, r) => r._count.members },
    { title: 'AI 生成', width: 80, render: (_, r) => r._count.generations },
    { title: '注册时间', dataIndex: 'createdAt', width: 110, render: (v) => formatDate(v) },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 240,
      render: (_, record) => (
        <Space size={4} wrap>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            loading={actionKey === `edit-${record.id}`}
            onClick={() => openEdit(record)}
          >
            编辑
          </Button>
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => openSubscription(record)}>
            套餐
          </Button>
          <Popconfirm
            title={record.status === 'ACTIVE' ? '确认封停该商家？' : '确认恢复该商家？'}
            description={record.status === 'ACTIVE' ? '封停后普通成员将无法访问业务功能。' : undefined}
            okText="确认"
            cancelText="取消"
            onConfirm={() => changeStatus(record)}
          >
            <Button
              type="link"
              size="small"
              danger={record.status === 'ACTIVE'}
              loading={actionKey === `status-${record.id}`}
            >
              {record.status === 'ACTIVE' ? '封停' : '恢复'}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={4} style={{ margin: 0 }}>
          商家管理（{data?.total ?? 0}）
        </Typography.Title>
        <Space>
          <Select
            allowClear
            placeholder="全部状态"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={[
              { value: 'ACTIVE', label: '正常' },
              { value: 'SUSPENDED', label: '已封停' },
            ]}
            style={{ width: 120 }}
          />
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
        </Space>
      </div>
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={{ current: page, pageSize: 20, total: data?.total ?? 0, onChange: setPage }}
        scroll={{ x: 1280 }}
      />

      <Modal
        title={`编辑商家 · ${editing?.merchant.name ?? ''}`}
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={saveEdit}
        confirmLoading={modalSaving}
        destroyOnHidden
        width={680}
      >
        <Form
          key={editing?.merchant.id}
          form={editForm}
          layout="vertical"
          initialValues={editing?.values}
          preserve={false}
        >
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="name" label="商家名称" rules={[{ required: true, message: '请输入商家名称' }]}>
              <Input maxLength={64} />
            </Form.Item>
            <Form.Item name="industry" label="行业" rules={[{ required: true, message: '请选择行业' }]}>
              <Select options={INDUSTRIES.map((item) => ({ value: item.key, label: `${item.emoji} ${item.label}` }))} />
            </Form.Item>
            <Form.Item name="phone" label="联系电话">
              <Input maxLength={32} />
            </Form.Item>
            <Form.Item name="businessHours" label="营业时间">
              <Input maxLength={100} />
            </Form.Item>
          </div>
          <Form.Item name="address" label="地址">
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="description" label="商家介绍">
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="brandTone" label="品牌语气">
            <Input.TextArea rows={2} maxLength={200} />
          </Form.Item>
          <Form.Item name="targetCustomers" label="目标客群">
            <Input.TextArea rows={2} maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`调整套餐 · ${subscriptionEdit?.merchant.name ?? ''}`}
        open={!!subscriptionEdit}
        onCancel={() => setSubscriptionEdit(null)}
        onOk={saveSubscription}
        confirmLoading={modalSaving}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">
          当前套餐：
          {subscriptionEdit?.merchant.subscription ? PLANS[subscriptionEdit.merchant.subscription.plan].label : '未开通'}
        </Typography.Paragraph>
        <Form
          key={subscriptionEdit?.merchant.id}
          form={subscriptionForm}
          layout="vertical"
          initialValues={subscriptionEdit?.values}
          preserve={false}
        >
          <Form.Item name="plan" label="套餐" rules={[{ required: true }]}>
            <Select
              options={Object.values(PlanType).map((plan) => ({ value: plan, label: PLANS[plan].label }))}
              onChange={(plan: PlanType) => {
                subscriptionForm.setFieldsValue({
                  dailyGenerationLimit: PLANS[plan].dailyGenerationLimit,
                  monthlyGenerationLimit: PLANS[plan].monthlyGenerationLimit,
                });
              }}
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="dailyGenerationLimit" label="每日生成限额" rules={[{ required: true }]}>
              <InputNumber min={1} precision={0} className="w-full" />
            </Form.Item>
            <Form.Item name="monthlyGenerationLimit" label="每月生成限额" rules={[{ required: true }]}>
              <InputNumber min={1} precision={0} className="w-full" />
            </Form.Item>
          </div>
          <Form.Item name="expiresAt" label="有效期至">
            <DatePicker showTime allowClear className="w-full" format="YYYY-MM-DD HH:mm" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
