'use client';

import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, List, Modal, Popconfirm, Select, Tabs, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { INDUSTRIES, MEMBER_ROLE_LABELS } from '@shophelp/shared';
import { merchantApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import { useMerchantId } from '@/hooks/use-merchant-id';
import { useAuthStore } from '@/stores/auth-store';
import { ChangePasswordForm } from '@/components/change-password-form';

export default function SettingsPage() {
  const merchantId = useMerchantId();
  const memberships = useAuthStore((s) => s.memberships);
  const isOwner = memberships.find((m) => m.merchant.id === merchantId)?.role === 'OWNER';

  return (
    <div>
      <div className="mb-4">
        <Typography.Title level={4} style={{ marginBottom: 4 }}>
          设置
        </Typography.Title>
        <Typography.Text type="secondary">商家资料会直接影响 AI 生成内容的贴合度</Typography.Text>
      </div>
      <Tabs
        items={[
          { key: 'profile', label: '商家资料', children: <MerchantProfileTab isOwner={isOwner} /> },
          { key: 'members', label: '成员管理', children: <MembersTab isOwner={isOwner} /> },
          { key: 'security', label: '账号安全', children: <SecurityTab /> },
        ]}
      />
    </div>
  );
}

function SecurityTab() {
  return (
    <Card size="small" title="修改密码">
      <ChangePasswordForm />
    </Card>
  );
}

function MerchantProfileTab({ isOwner }: { isOwner: boolean }) {
  const merchantId = useMerchantId();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const { data: merchant } = useQuery({
    queryKey: ['merchant', merchantId],
    queryFn: () => merchantApi.get(merchantId),
    enabled: Boolean(merchantId),
  });

  useEffect(() => {
    if (merchant) form.setFieldsValue(merchant);
  }, [merchant, form]);

  const save = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      return merchantApi.update(merchantId, values);
    },
    onSuccess: () => {
      message.success('商家资料已保存');
      queryClient.invalidateQueries({ queryKey: ['merchant', merchantId] });
    },
    onError: (e) => {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error(errorMessage(e));
    },
  });

  return (
    <Card size="small">
      <Form form={form} layout="vertical" disabled={!isOwner} className="max-w-2xl" style={{ maxWidth: 640 }}>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="name" label="店铺名称" rules={[{ required: true, message: '请填写店铺名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="industry" label="行业" rules={[{ required: true }]}>
            <Select options={INDUSTRIES.map((i) => ({ value: i.key, label: `${i.emoji} ${i.label}` }))} />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input />
          </Form.Item>
          <Form.Item name="businessHours" label="营业时间">
            <Input />
          </Form.Item>
        </div>
        <Form.Item name="address" label="地址">
          <Input />
        </Form.Item>
        <Form.Item name="description" label="店铺简介">
          <Input.TextArea rows={2} maxLength={500} />
        </Form.Item>
        <Form.Item name="brandTone" label="品牌语气（AI 生成会遵循）">
          <Input.TextArea rows={2} maxLength={200} placeholder="如：亲切自然，像闺蜜聊天，不做作不硬广" />
        </Form.Item>
        <Form.Item name="targetCustomers" label="目标客群">
          <Input.TextArea rows={2} maxLength={200} />
        </Form.Item>
        {isOwner ? (
          <Button type="primary" loading={save.isPending} onClick={() => save.mutate()}>
            保存
          </Button>
        ) : (
          <Typography.Text type="secondary">仅商家老板可修改资料</Typography.Text>
        )}
      </Form>
    </Card>
  );
}

function MembersTab({ isOwner }: { isOwner: boolean }) {
  const merchantId = useMerchantId();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: members } = useQuery({
    queryKey: ['members', merchantId],
    queryFn: () => merchantApi.members(merchantId),
    enabled: Boolean(merchantId),
  });

  const add = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      return merchantApi.addMember(merchantId, values);
    },
    onSuccess: () => {
      message.success('成员已添加');
      setAddOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['members', merchantId] });
    },
    onError: (e) => {
      if ((e as { errorFields?: unknown }).errorFields) return;
      message.error(errorMessage(e));
    },
  });

  const remove = useMutation({
    mutationFn: (memberId: string) => merchantApi.removeMember(merchantId, memberId),
    onSuccess: () => {
      message.success('成员已移除');
      queryClient.invalidateQueries({ queryKey: ['members', merchantId] });
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  return (
    <Card
      size="small"
      title={`成员（${members?.length ?? 0}）`}
      extra={
        isOwner && (
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
            添加成员
          </Button>
        )
      }
    >
      <List
        size="small"
        dataSource={members ?? []}
        renderItem={(m) => (
          <List.Item
            actions={
              isOwner && m.role !== 'OWNER'
                ? [
                    <Popconfirm key="rm" title="确定移除该成员？" onConfirm={() => remove.mutate(m.id)}>
                      <Button size="small" type="link" danger>
                        移除
                      </Button>
                    </Popconfirm>,
                  ]
                : undefined
            }
          >
            <List.Item.Meta
              title={
                <span>
                  {m.user.name} <Tag color={m.role === 'OWNER' ? 'gold' : 'blue'}>{MEMBER_ROLE_LABELS[m.role]}</Tag>
                </span>
              }
              description={m.user.email}
            />
          </List.Item>
        )}
      />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        说明：第一版所有成员可见全部客户，按员工分配客户的权限控制将在后续版本提供
      </Typography.Text>

      <Modal
        title="添加成员"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={() => add.mutate()}
        confirmLoading={add.isPending}
        okText="添加"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="email"
            label="成员邮箱（需已注册店小智）"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
          >
            <Input placeholder="staff@example.com" />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="STAFF">
            <Select
              options={[
                { value: 'STAFF', label: '员工' },
                { value: 'OWNER', label: '老板' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
