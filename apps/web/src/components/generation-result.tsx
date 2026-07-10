'use client';

import { CopyOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { App, Button, Card, Tag, Tooltip, Typography } from 'antd';
import type { Generation } from '@/lib/types';
import { copyText } from '@/lib/utils';

/** 3 版本结果卡片组：标注适用场景、推荐版本、一键复制、收藏 */
export function GenerationResult({
  generation,
  onToggleFavorite,
  favoritePending,
}: {
  generation: Generation;
  onToggleFavorite?: (next: boolean) => void;
  favoritePending?: boolean;
}) {
  const { message } = App.useApp();
  const { output } = generation;

  const copy = async (content: string) => {
    const ok = await copyText(content);
    ok ? message.success('已复制到剪贴板') : message.error('复制失败');
  };

  return (
    <div className="space-y-3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="flex items-center justify-between">
        <Typography.Text type="secondary">
          由 {generation.provider === 'mock' ? 'Mock 演示' : generation.provider} 生成 · 共 {output.versions.length} 个版本
        </Typography.Text>
        {onToggleFavorite && (
          <Tooltip title={generation.isFavorite ? '取消收藏' : '收藏为常用话术'}>
            <Button
              size="small"
              type={generation.isFavorite ? 'primary' : 'default'}
              ghost={generation.isFavorite}
              icon={generation.isFavorite ? <StarFilled /> : <StarOutlined />}
              loading={favoritePending}
              onClick={() => onToggleFavorite(!generation.isFavorite)}
            >
              {generation.isFavorite ? '已收藏' : '收藏'}
            </Button>
          </Tooltip>
        )}
      </div>

      {output.versions.map((version, index) => (
        <Card
          key={index}
          size="small"
          style={
            index === output.recommendedIndex
              ? { borderColor: '#6C5CE7', boxShadow: '0 0 0 1px #6C5CE7 inset' }
              : undefined
          }
          title={
            <span>
              {version.title}
              {index === output.recommendedIndex && (
                <Tag color="#6C5CE7" className="ml-2" style={{ marginLeft: 8 }}>
                  AI 推荐
                </Tag>
              )}
            </span>
          }
          extra={
            <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copy(version.content)}>
              复制
            </Button>
          }
        >
          {version.scene && (
            <Typography.Text type="secondary" className="mb-2 block text-xs" style={{ display: 'block', marginBottom: 8 }}>
              💡 {version.scene}
            </Typography.Text>
          )}
          <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
            {version.content}
          </Typography.Paragraph>
        </Card>
      ))}

      {output.tips && (
        <Card size="small" style={{ background: '#fffbe6', borderColor: '#ffe58f' }}>
          <Typography.Text style={{ fontSize: 13 }}>📌 {output.tips}</Typography.Text>
        </Card>
      )}
    </div>
  );
}
