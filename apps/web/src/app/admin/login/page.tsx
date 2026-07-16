'use client';

import { LockOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export default function AdminLoginPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await authApi.adminLogin(values);
      setSession(result);
      message.success(`欢迎，${result.user.name}`);
      router.replace('/admin');
    } catch (error) {
      message.error(errorMessage(error, '管理员登录失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'radial-gradient(circle at top,#24304d 0%,#111827 48%,#080b12 100%)' }}
    >
      <Card
        className="w-full max-w-[420px] border-0 shadow-2xl"
        styles={{ body: { padding: 36 } }}
      >
        <div className="mb-7 text-center">
          <SafetyCertificateOutlined style={{ fontSize: 42, color: '#6C5CE7' }} />
          <Typography.Title level={3} style={{ margin: '12px 0 4px' }}>
            店小智 · 平台管理
          </Typography.Title>
          <Typography.Text type="secondary">独立管理员入口，仅限平台管理员使用</Typography.Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="管理员邮箱"
            rules={[{ required: true, message: '请输入管理员邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="admin@shophelp.local" size="large" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="管理员密码" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            登录平台管理
          </Button>
        </Form>
        <div className="mt-5 text-center">
          <Link href="/login">返回商家端登录</Link>
        </div>
      </Card>
    </div>
  );
}
