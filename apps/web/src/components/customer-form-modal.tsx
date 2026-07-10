'use client';

import { App, DatePicker, Form, Input, Modal, Select, Tag } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { CUSTOMER_STATUS_LABELS, INTENT_LEVEL_LABELS } from '@shophelp/shared';
import { customerApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import type { Customer } from '@/lib/types';
import { useMerchantId } from '@/hooks/use-merchant-id';

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  /** 传入则为编辑 */
  customer?: Customer | null;
  onSaved?: (customer: Customer) => void;
}

export function CustomerFormModal({ open, onClose, customer, onSaved }: CustomerFormModalProps) {
  const merchantId = useMerchantId();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const { data: tags } = useQuery({
    queryKey: ['tags', merchantId],
    queryFn: () => customerApi.tags(merchantId),
    enabled: Boolean(merchantId) && open,
  });

  useEffect(() => {
    if (!open) return;
    if (customer) {
      form.setFieldsValue({
        ...customer,
        tagIds: customer.tags?.map((t) => t.id) ?? [],
        nextFollowAt: customer.nextFollowAt ? dayjs(customer.nextFollowAt) : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, customer, form]);

  const save = useMutation({
    mutationFn: async () => {
      const values = await form.validateFields();
      const payload = {
        ...values,
        nextFollowAt: values.nextFollowAt ? values.nextFollowAt.toISOString() : null,
      };
      return customer
        ? customerApi.update(merchantId, customer.id, payload)
        : customerApi.create(merchantId, payload);
    },
    onSuccess: (data) => {
      message.success(customer ? '客户已更新' : '客户已创建');
      queryClient.invalidateQueries({ queryKey: ['customers', merchantId] });
      queryClient.invalidateQueries({ queryKey: ['customer', merchantId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', merchantId] });
      onSaved?.(data);
      onClose();
    },
    onError: (e) => {
      if ((e as { errorFields?: unknown }).errorFields) return; // 表单校验错误
      message.error(errorMessage(e, '保存失败'));
    },
  });

  return (
    <Modal
      title={customer ? `编辑客户 · ${customer.name}` : '新增客户'}
      open={open}
      onCancel={onClose}
      onOk={() => save.mutate()}
      confirmLoading={save.isPending}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="name" label="客户称呼" rules={[{ required: true, message: '请填写客户称呼' }]}>
            <Input placeholder="如：李小姐" />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Select
              allowClear
              placeholder="选择或输入来源"
              options={['朋友圈', '微信群', '小红书', '抖音', '转介绍', '到店', '其他'].map((s) => ({
                value: s,
                label: s,
              }))}
            />
          </Form.Item>
          <Form.Item name="wechat" label="微信号">
            <Input placeholder="微信号" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="手机号" />
          </Form.Item>
          <Form.Item name="intentLevel" label="意向等级" initialValue="C">
            <Select options={Object.entries(INTENT_LEVEL_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </Form.Item>
          <Form.Item name="status" label="客户状态" initialValue="UNCONTACTED">
            <Select options={Object.entries(CUSTOMER_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          </Form.Item>
        </div>
        <Form.Item name="tagIds" label="标签">
          <Select
            mode="multiple"
            allowClear
            placeholder="选择标签"
            options={(tags ?? []).map((t) => ({
              value: t.id,
              label: <Tag color={t.color ?? 'default'}>{t.name}</Tag>,
            }))}
          />
        </Form.Item>
        <Form.Item name="nextFollowAt" label="下次跟进时间">
          <DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" className="w-full" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="如：看中季卡，嫌有点贵，在对比别家" maxLength={500} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
