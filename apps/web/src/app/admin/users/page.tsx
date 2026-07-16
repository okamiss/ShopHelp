'use client';

import { CopyOutlined, EditOutlined, KeyOutlined, SearchOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import type { AdminUser } from '@/lib/types';
import { copyText, formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [editForm] = Form.useForm<{ name: string; email: string }>();
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [resetResult, setResetResult] = useState<{ name: string; password: string } | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [actionKey, setActionKey] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', keyword, page],
    queryFn: () => adminApi.users({ keyword: keyword || undefined, page, pageSize: 20 }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] });

  const openEdit = (user: AdminUser) => {
    setEditing(user);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const values = await editForm.validateFields();
    setModalSaving(true);
    try {
      await adminApi.updateUser(editing.id, values);
      message.success('用户资料已更新');
      setEditing(null);
      await refresh();
    } catch (error) {
      message.error(errorMessage(error, '更新用户失败'));
    } finally {
      setModalSaving(false);
    }
  };

  const changeStatus = async (user: AdminUser) => {
    const nextStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    setActionKey(`status-${user.id}`);
    try {
      await adminApi.updateUserStatus(user.id, nextStatus);
      message.success(nextStatus === 'DISABLED' ? '用户已禁用' : '用户已启用');
      await refresh();
    } catch (error) {
      message.error(errorMessage(error, '更新用户状态失败'));
    } finally {
      setActionKey('');
    }
  };

  const resetPassword = async (user: AdminUser) => {
    setActionKey(`reset-${user.id}`);
    try {
      const result = await adminApi.resetUserPassword(user.id);
      setResetResult({ name: user.name, password: result.temporaryPassword });
      await refresh();
    } catch (error) {
      message.error(errorMessage(error, '重置密码失败'));
    } finally {
      setActionKey('');
    }
  };

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
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value: AdminUser['status']) => (
        <Tag color={value === 'ACTIVE' ? 'success' : 'error'}>{value === 'ACTIVE' ? '正常' : '已禁用'}</Tag>
      ),
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
    {
      title: '改密要求',
      dataIndex: 'mustChangePassword',
      width: 100,
      render: (value: boolean) => (value ? <Tag color="warning">待改密</Tag> : '-'),
    },
    { title: '注册时间', dataIndex: 'createdAt', width: 110, render: (v) => formatDate(v) },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 260,
      render: (_, record) => {
        const protectedAdmin = record.platformRole === 'ADMIN';
        return (
          <Space size={4} wrap>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
              编辑
            </Button>
            <Popconfirm
              title={record.status === 'ACTIVE' ? '确认禁用该用户？' : '确认启用该用户？'}
              okText="确认"
              cancelText="取消"
              disabled={protectedAdmin}
              onConfirm={() => changeStatus(record)}
            >
              <Button
                type="link"
                size="small"
                danger={record.status === 'ACTIVE'}
                disabled={protectedAdmin}
                loading={actionKey === `status-${record.id}`}
              >
                {record.status === 'ACTIVE' ? '禁用' : '启用'}
              </Button>
            </Popconfirm>
            <Popconfirm
              title="确认重置该用户密码？"
              description="系统将生成一次性临时密码，并要求用户登录后立即修改。"
              okText="确认重置"
              cancelText="取消"
              disabled={protectedAdmin}
              onConfirm={() => resetPassword(record)}
            >
              <Button
                type="link"
                size="small"
                icon={<KeyOutlined />}
                disabled={protectedAdmin}
                loading={actionKey === `reset-${record.id}`}
              >
                重置密码
              </Button>
            </Popconfirm>
            {protectedAdmin && <Typography.Text type="secondary">受保护</Typography.Text>}
          </Space>
        );
      },
    },
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
        scroll={{ x: 1180 }}
      />

      <Modal
        title={`编辑用户 · ${editing?.name ?? ''}`}
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={saveEdit}
        confirmLoading={modalSaving}
        destroyOnHidden
      >
        <Form
          key={editing?.id}
          form={editForm}
          layout="vertical"
          initialValues={editing ? { name: editing.name, email: editing.email } : undefined}
          preserve={false}
        >
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input maxLength={32} />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="临时密码已生成"
        open={!!resetResult}
        closable={false}
        mask={{ closable: false }}
        footer={
          <Button type="primary" onClick={() => setResetResult(null)}>
            我已保存，关闭
          </Button>
        }
      >
        <Typography.Paragraph>
          用户 <Typography.Text strong>{resetResult?.name}</Typography.Text> 的临时密码仅在本弹窗展示一次：
        </Typography.Paragraph>
        <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
          <Typography.Text code copyable={false} style={{ fontSize: 18 }}>
            {resetResult?.password}
          </Typography.Text>
          <Button
            icon={<CopyOutlined />}
            onClick={async () => {
              const ok = await copyText(resetResult?.password ?? '');
              ok ? message.success('临时密码已复制') : message.error('复制失败，请手动复制');
            }}
          >
            复制
          </Button>
        </div>
        <Typography.Text type="warning">用户使用临时密码登录后，将被要求立即修改密码。</Typography.Text>
      </Modal>
    </div>
  );
}
