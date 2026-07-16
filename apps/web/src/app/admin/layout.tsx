'use client';

import { LogoutOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, Typography } from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { useAuthStore } from '@/stores/auth-store';

const { Header, Content } = Layout;

const ADMIN_MENU = [
  { key: '/admin', label: <Link href="/admin">总览</Link> },
  { key: '/admin/merchants', label: <Link href="/admin/merchants">商家</Link> },
  { key: '/admin/users', label: <Link href="/admin/users">用户</Link> },
  { key: '/admin/usage', label: <Link href="/admin/usage">用量</Link> },
  { key: '/admin/audit', label: <Link href="/admin/audit">审计</Link> },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear } = useAuthStore();
  const isAdmin = user?.platformRole === 'ADMIN';

  useEffect(() => {
    if (user && !isAdmin) router.replace('/admin/login');
  }, [user, isAdmin, router]);

  if (!isAdmin) return null;

  const selected = ADMIN_MENU.map((i) => i.key)
    .filter((k) => pathname === k || pathname.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center gap-6 bg-white" style={{ background: '#fff', display: 'flex', alignItems: 'center', gap: 24, borderBottom: '1px solid #f0f0f0' }}>
        <Typography.Text strong>🛠️ 店小智 · 平台管理</Typography.Text>
        <Menu mode="horizontal" selectedKeys={selected ? [selected] : []} items={ADMIN_MENU} style={{ flex: 1, borderBottom: 'none' }} />
        <Button
          size="small"
          icon={<LogoutOutlined />}
          onClick={() => {
            clear();
            router.replace('/admin/login');
          }}
        >
          退出管理
        </Button>
      </Header>
      <Content style={{ padding: 24 }}>{children}</Content>
    </Layout>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <AuthGuard requireMerchant={false} loginPath="/admin/login">
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
