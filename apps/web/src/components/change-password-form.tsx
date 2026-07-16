'use client';

import { LockOutlined } from '@ant-design/icons';
import { App, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  submitText?: string;
}

/** 修改密码表单：设置页「账号安全」与强制改密弹窗共用 */
export function ChangePasswordForm({ onSuccess, submitText = '修改密码' }: ChangePasswordFormProps) {
  const { message } = App.useApp();
  const updateUser = useAuthStore((s) => s.updateUser);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { oldPassword: string; newPassword: string }) => {
    setLoading(true);
    try {
      await authApi.changePassword({ oldPassword: values.oldPassword, newPassword: values.newPassword });
      updateUser({ mustChangePassword: false });
      form.resetFields();
      message.success('密码已修改');
      onSuccess?.();
    } catch (e) {
      message.error(errorMessage(e, '修改密码失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false} className="max-w-sm" style={{ maxWidth: 380 }}>
      <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="当前密码（临时密码也填这里）" />
      </Form.Item>
      <Form.Item
        name="newPassword"
        label="新密码"
        rules={[{ required: true, message: '请输入新密码' }, { min: 8, message: '密码至少 8 位' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="至少 8 位" />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="确认新密码"
        dependencies={['newPassword']}
        rules={[
          { required: true, message: '请再次输入新密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="再次输入新密码" />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loading}>
        {submitText}
      </Button>
    </Form>
  );
}
