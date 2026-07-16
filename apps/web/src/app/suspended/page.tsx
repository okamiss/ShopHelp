'use client';

import { Button, Result } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function SuspendedPage() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Result
        status="warning"
        title="商家已被平台封停"
        subTitle="当前商家暂时无法使用业务功能。如有疑问，请联系平台客服处理。"
        extra={[
          <Button key="retry" onClick={() => router.replace('/dashboard')}>
            重新尝试
          </Button>,
          <Button
            key="logout"
            type="primary"
            onClick={() => {
              clear();
              router.replace('/login');
            }}
          >
            退出登录
          </Button>,
        ]}
      />
    </div>
  );
}
