'use client';

import { PlusOutlined, SearchOutlined, TagsOutlined } from '@ant-design/icons';
import { App, Button, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CUSTOMER_STATUS_LABELS, INTENT_LEVEL_LABELS } from '@shophelp/shared';
import { customerApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import type { Customer } from '@/lib/types';
import { formatDate, fromNowDays, INTENT_COLORS, STATUS_COLORS } from '@/lib/utils';
import { useMerchantId } from '@/hooks/use-merchant-id';
import { CustomerFormModal } from '@/components/customer-form-modal';

export default function CustomersPage() {
  const merchantId = useMerchantId();
  const router = useRouter();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [intentLevel, setIntentLevel] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [tagId, setTagId] = useState<string>();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', merchantId, { keyword, intentLevel, status, tagId, page }],
    queryFn: () => customerApi.list(merchantId, { keyword: keyword || undefined, intentLevel, status, tagId, page, pageSize: 20 }),
    enabled: Boolean(merchantId),
  });

  const { data: tags } = useQuery({
    queryKey: ['tags', merchantId],
    queryFn: () => customerApi.tags(merchantId),
    enabled: Boolean(merchantId),
  });

  const remove = useMutation({
    mutationFn: (id: string) => customerApi.remove(merchantId, id),
    onSuccess: () => {
      message.success('客户已删除');
      queryClient.invalidateQueries({ queryKey: ['customers', merchantId] });
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  const columns: ColumnsType<Customer> = [
    {
      title: '客户',
      dataIndex: 'name',
      render: (_, record) => (
        <Link href={`/customers/${record.id}`} className="font-medium">
          {record.name}
        </Link>
      ),
    },
    {
      title: '联系方式',
      render: (_, r) => (
        <span className="text-xs text-gray-500">
          {r.wechat && <div>微信：{r.wechat}</div>}
          {r.phone && <div>手机：{r.phone}</div>}
          {!r.wechat && !r.phone && '-'}
        </span>
      ),
    },
    {
      title: '意向',
      dataIndex: 'intentLevel',
      width: 90,
      render: (v: string) => <Tag color={INTENT_COLORS[v]}>{v} 级</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: keyof typeof CUSTOMER_STATUS_LABELS) => <Tag color={STATUS_COLORS[v]}>{CUSTOMER_STATUS_LABELS[v]}</Tag>,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      render: (v: Customer['tags']) =>
        v?.length ? v.map((t) => <Tag key={t.id} color={t.color ?? 'default'}>{t.name}</Tag>) : '-',
    },
    { title: '来源', dataIndex: 'source', width: 90, render: (v) => v ?? '-' },
    {
      title: '下次跟进',
      dataIndex: 'nextFollowAt',
      width: 110,
      render: (v) => (v ? formatDate(v) : '-'),
    },
    {
      title: '上次联系',
      dataIndex: 'lastContactAt',
      width: 100,
      render: (v) => fromNowDays(v),
    },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" type="link" onClick={() => router.push(`/customers/${record.id}`)}>
            详情
          </Button>
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
          <Popconfirm title="确定删除该客户？跟进记录将一并删除" onConfirm={() => remove.mutate(record.id)}>
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
            客户管理
          </Typography.Title>
          <Typography.Text type="secondary">共 {data?.total ?? 0} 位客户</Typography.Text>
        </div>
        <Space>
          <Button icon={<TagsOutlined />} onClick={() => setTagManagerOpen(true)}>
            标签管理
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            新增客户
          </Button>
        </Space>
      </div>

      <Space className="mb-4" wrap>
        <Input
          placeholder="搜索姓名/微信/手机"
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
        <Select
          allowClear
          placeholder="意向等级"
          style={{ width: 140 }}
          value={intentLevel}
          onChange={(v) => {
            setIntentLevel(v);
            setPage(1);
          }}
          options={Object.entries(INTENT_LEVEL_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <Select
          allowClear
          placeholder="客户状态"
          style={{ width: 130 }}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={Object.entries(CUSTOMER_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <Select
          allowClear
          placeholder="标签"
          style={{ width: 130 }}
          value={tagId}
          onChange={(v) => {
            setTagId(v);
            setPage(1);
          }}
          options={(tags ?? []).map((t) => ({ value: t.id, label: t.name }))}
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

      <CustomerFormModal open={formOpen} onClose={() => setFormOpen(false)} customer={editing} />
      <TagManagerModal open={tagManagerOpen} onClose={() => setTagManagerOpen(false)} />
    </div>
  );
}

/** 标签管理弹窗：新建 / 删除 */
function TagManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const merchantId = useMerchantId();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [color, setColor] = useState('blue');

  const { data: tags } = useQuery({
    queryKey: ['tags', merchantId],
    queryFn: () => customerApi.tags(merchantId),
    enabled: Boolean(merchantId) && open,
  });

  const create = useMutation({
    mutationFn: () => customerApi.createTag(merchantId, { name: name.trim(), color }),
    onSuccess: () => {
      setName('');
      queryClient.invalidateQueries({ queryKey: ['tags', merchantId] });
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (tagId: string) => customerApi.removeTag(merchantId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', merchantId] });
      queryClient.invalidateQueries({ queryKey: ['customers', merchantId] });
    },
    onError: (e) => message.error(errorMessage(e)),
  });

  const COLORS = ['blue', 'gold', 'pink', 'purple', 'orange', 'green', 'red', 'cyan'];

  return (
    <Modal title="标签管理" open={open} onCancel={onClose} footer={null} width={480}>
      <Space.Compact className="mb-3 w-full" style={{ width: '100%', marginBottom: 12 }}>
        <Select value={color} onChange={setColor} style={{ width: 100 }} options={COLORS.map((c) => ({ value: c, label: <Tag color={c}>{c}</Tag> }))} />
        <Input
          placeholder="新标签名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPressEnter={() => name.trim() && create.mutate()}
          maxLength={16}
        />
        <Button type="primary" loading={create.isPending} disabled={!name.trim()} onClick={() => create.mutate()}>
          添加
        </Button>
      </Space.Compact>
      <div className="flex flex-wrap gap-2">
        {(tags ?? []).map((t) => (
          <Tag
            key={t.id}
            color={t.color ?? 'default'}
            closable
            onClose={(e) => {
              e.preventDefault();
              remove.mutate(t.id);
            }}
          >
            {t.name}（{t._count?.customers ?? 0}）
          </Tag>
        ))}
        {(tags ?? []).length === 0 && <Typography.Text type="secondary">还没有标签</Typography.Text>}
      </div>
    </Modal>
  );
}
