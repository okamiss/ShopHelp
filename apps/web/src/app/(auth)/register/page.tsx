'use client';

import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { name: string; email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await authApi.register(values);
      setSession(result);
      message.success('注册成功，先来创建你的店铺吧');
      router.replace('/onboarding');
    } catch (e) {
      message.error(errorMessage(e, '注册失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg,#6C5CE7 0%,#a29bfe 100%)' }}>
      <Card className="w-[400px] shadow-xl" styles={{ body: { padding: 32 } }}>
        <div className="mb-6 text-center">
          <div className="text-4xl">🧠</div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            注册店小智
          </Typography.Title>
          <Typography.Text type="secondary">3 分钟拥有自己的 AI 经营助手</Typography.Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="name" label="你的称呼" rules={[{ required: true, message: '请输入称呼' }]}>
            <Input prefix={<UserOutlined />} placeholder="如：王老板" size="large" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@example.com" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }, { min: 8, message: '密码至少 8 位' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="至少 8 位" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            注册并创建店铺
          </Button>
        </Form>
        <div className="mt-4 text-center">
          <Typography.Text type="secondary">
            已有账号？<Link href="/login">直接登录</Link>
          </Typography.Text>
        </div>
      </Card>
    </div>
  );
}
