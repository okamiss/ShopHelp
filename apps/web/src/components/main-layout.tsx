'use client';

import {
  AppstoreOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CommentOutlined,
  CrownOutlined,
  DashboardOutlined,
  EditOutlined,
  LogoutOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Tag, Typography } from 'antd';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { ForceChangePasswordModal } from './force-change-password-modal';

const { Sider, Header, Content } = Layout;

const MENU_ITEMS = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: <Link href="/dashboard">今日经营</Link> },
  { key: '/ai/copywriting', icon: <EditOutlined />, label: <Link href="/ai/copywriting">AI 文案中心</Link> },
  { key: '/ai/reply', icon: <CommentOutlined />, label: <Link href="/ai/reply">AI 回复助手</Link> },
  { key: '/customers', icon: <TeamOutlined />, label: <Link href="/customers">客户管理</Link> },
  { key: '/products', icon: <AppstoreOutlined />, label: <Link href="/products">产品服务</Link> },
  { key: '/tasks', icon: <CalendarOutlined />, label: <Link href="/tasks">跟进任务</Link> },
  { key: '/report', icon: <BarChartOutlined />, label: <Link href="/report">经营日报</Link> },
  { key: '/billing', icon: <CrownOutlined />, label: <Link href="/billing">套餐用量</Link> },
  { key: '/settings', icon: <SettingOutlined />, label: <Link href="/settings">设置</Link> },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, memberships, activeMerchantId, clear } = useAuthStore();

  const activeMerchant = memberships.find((m) => m.merchant.id === activeMerchantId);

  const selectedKey = useMemo(() => {
    const match = MENU_ITEMS.map((i) => i.key)
      .filter((key) => pathname === key || pathname.startsWith(`${key}/`))
      .sort((a, b) => b.length - a.length)[0];
    return match ?? '/dashboard';
  }, [pathname]);

  return (
    <Layout className="h-dvh overflow-hidden">
      <Sider theme="light" width={216} className="h-full shrink-0 overflow-y-auto border-r border-gray-100">
        <div className="flex items-center gap-2 px-5 py-4">
          <span className="text-2xl">🧠</span>
          <div>
            <div className="text-base font-bold leading-tight">店小智</div>
            <div className="text-xs text-gray-400">AI 私域经营助手</div>
          </div>
        </div>
        <Menu mode="inline" selectedKeys={[selectedKey]} items={MENU_ITEMS} className="border-none" />
      </Sider>
      <Layout className="min-h-0 min-w-0">
        <Header className="shrink-0 flex items-center justify-between border-b border-gray-100 bg-white px-6" style={{ background: '#fff', paddingInline: 24 }}>
          <div className="flex items-center gap-2">
            <ShopOutlined className="text-gray-400" />
            <Typography.Text strong>{activeMerchant?.merchant.name ?? '未选择商家'}</Typography.Text>
            {activeMerchant && (
              <Tag color={activeMerchant.role === 'OWNER' ? 'gold' : 'blue'}>
                {activeMerchant.role === 'OWNER' ? '老板' : '员工'}
              </Tag>
            )}
          </div>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: () => {
                    clear();
                    router.replace('/login');
                  },
                },
              ],
            }}
          >
            <div className="flex cursor-pointer items-center gap-2">
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user?.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="min-h-0 flex-1 overflow-auto p-6" style={{ padding: 24 }}>
          {children}
        </Content>
      </Layout>
      <ForceChangePasswordModal />
    </Layout>
  );
}
