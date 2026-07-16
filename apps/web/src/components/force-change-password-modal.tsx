'use client';

import { Alert, Modal } from 'antd';
import { useAuthStore } from '@/stores/auth-store';
import { ChangePasswordForm } from './change-password-form';

/** 强制改密：mustChangePassword=true 时挂载不可关闭弹窗，改密成功后自动消失 */
export function ForceChangePasswordModal() {
  const mustChange = useAuthStore((s) => Boolean(s.user?.mustChangePassword));

  return (
    <Modal
      title="请设置新密码"
      open={mustChange}
      closable={false}
      keyboard={false}
      mask={{ closable: false }}
      footer={null}
      destroyOnHidden
    >
      <Alert
        type="warning"
        showIcon
        title="你的密码已被管理员重置"
        description="为了账号安全，请立即设置新密码后再继续使用。"
        className="mb-4"
        style={{ marginBottom: 16 }}
      />
      <ChangePasswordForm submitText="设置新密码并继续" />
    </Modal>
  );
}
