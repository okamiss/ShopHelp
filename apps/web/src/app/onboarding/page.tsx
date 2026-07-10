'use client';

import { App, Button, Card, Form, Input, Steps, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi, merchantApi, metaApi } from '@/lib/api';
import { errorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

interface OnboardingData {
  name?: string;
  industry?: string;
  description?: string;
  address?: string;
  phone?: string;
  businessHours?: string;
  brandTone?: string;
  targetCustomers?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const { hydrated, accessToken, setMemberships, setActiveMerchant } = useAuthStore();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({});
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const { data: industries } = useQuery({ queryKey: ['industries'], queryFn: metaApi.industries });

  useEffect(() => {
    if (hydrated && !accessToken) router.replace('/login');
  }, [hydrated, accessToken, router]);

  const next = async () => {
    const values = await form.validateFields();
    const merged = { ...data, ...values };
    setData(merged);
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    // 最后一步：创建商家
    setSubmitting(true);
    try {
      const merchant = await merchantApi.create(merged as { name: string; industry: string });
      const me = await authApi.me();
      setMemberships(me.memberships);
      setActiveMerchant(merchant.id);
      message.success('店铺创建成功，开始体验吧！');
      router.replace('/dashboard');
    } catch (e) {
      message.error(errorMessage(e, '创建失败'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-2xl shadow-lg" styles={{ body: { padding: 32 } }}>
        <div className="mb-6 text-center">
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            初始化你的店铺
          </Typography.Title>
          <Typography.Text type="secondary">这些信息会用于 AI 生成更贴合你店铺的内容</Typography.Text>
        </div>

        <Steps
          current={step}
          items={[{ title: '基本信息' }, { title: '店铺资料' }, { title: '品牌语气' }]}
          className="mb-8"
          style={{ marginBottom: 32 }}
        />

        <Form form={form} layout="vertical" initialValues={data} key={step}>
          {step === 0 && (
            <>
              <Form.Item name="name" label="店铺名称" rules={[{ required: true, message: '请填写店铺名称' }]}>
                <Input placeholder="如：悦颜美甲工作室" size="large" />
              </Form.Item>
              <Form.Item name="industry" label="所属行业" rules={[{ required: true, message: '请选择行业' }]}>
                <IndustryPicker industries={industries ?? []} />
              </Form.Item>
            </>
          )}
          {step === 1 && (
            <>
              <Form.Item name="description" label="一句话介绍你的店">
                <Input.TextArea rows={2} placeholder="如：社区型美甲美睫工作室，主打日式款式与轻奢体验" />
              </Form.Item>
              <Form.Item name="address" label="店铺地址">
                <Input placeholder="如：幸福路 88 号 2 楼" />
              </Form.Item>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="phone" label="联系电话">
                  <Input placeholder="如：138-0000-0000" />
                </Form.Item>
                <Form.Item name="businessHours" label="营业时间">
                  <Input placeholder="如：10:00-21:00（周一店休）" />
                </Form.Item>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <Form.Item
                name="brandTone"
                label="品牌语气"
                tooltip="AI 生成的所有文案都会遵循这个语气"
              >
                <Input.TextArea rows={2} placeholder="如：亲切自然，像闺蜜聊天，不做作不硬广" />
              </Form.Item>
              <Form.Item name="targetCustomers" label="目标客群">
                <Input.TextArea rows={2} placeholder="如：25-40 岁女性，注重生活品质，复购意愿强" />
              </Form.Item>
            </>
          )}
        </Form>

        <div className="mt-4 flex justify-between">
          <Button disabled={step === 0} onClick={() => setStep(step - 1)}>
            上一步
          </Button>
          <Button type="primary" onClick={next} loading={submitting}>
            {step === 2 ? '完成创建' : '下一步'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** 行业选择卡片组（受控组件，接入 Form.Item） */
function IndustryPicker({
  industries,
  value,
  onChange,
}: {
  industries: { key: string; label: string; emoji: string }[];
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {industries.map((ind) => (
        <button
          key={ind.key}
          type="button"
          onClick={() => onChange?.(ind.key)}
          className="cursor-pointer rounded-lg border p-3 text-center transition-all"
          style={{
            borderColor: value === ind.key ? '#6C5CE7' : '#e5e7eb',
            background: value === ind.key ? '#f3f0ff' : '#fff',
          }}
        >
          <div className="text-xl">{ind.emoji}</div>
          <div className="mt-1 text-xs">{ind.label}</div>
        </button>
      ))}
    </div>
  );
}
