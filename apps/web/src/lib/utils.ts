import dayjs from 'dayjs';

export function formatDate(value?: string | Date | null, withTime = false): string {
  if (!value) return '-';
  return dayjs(value).format(withTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD');
}

export function fromNowDays(value?: string | Date | null): string {
  if (!value) return '从未';
  const days = dayjs().startOf('day').diff(dayjs(value).startOf('day'), 'day');
  if (days <= 0) return '今天';
  if (days === 1) return '昨天';
  return `${days} 天前`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 兼容非 https / 旧浏览器
    try {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}

export const INTENT_COLORS: Record<string, string> = {
  A: 'red',
  B: 'orange',
  C: 'blue',
  D: 'default',
};

export const STATUS_COLORS: Record<string, string> = {
  UNCONTACTED: 'default',
  IN_CONTACT: 'processing',
  DEAL: 'success',
  LOST: 'error',
  REPURCHASED: 'purple',
};
