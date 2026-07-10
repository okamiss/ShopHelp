'use client';

import { Typography } from 'antd';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { REPLY_SCENARIOS } from '@shophelp/shared';
import { GenerationPanel } from '@/components/generation-panel';

function ReplyContent() {
  const searchParams = useSearchParams();
  const initialScenario = searchParams.get('scenario') ?? undefined;

  return (
    <div>
      <div className="mb-4">
        <Typography.Title level={4} style={{ marginBottom: 4 }}>
          AI 回复助手
        </Typography.Title>
        <Typography.Text type="secondary">
          客户问价、嫌贵、比较竞品……贴上客户原话，AI 帮你得体回复
        </Typography.Text>
      </div>
      <GenerationPanel type="REPLY" scenarios={REPLY_SCENARIOS} initialScenario={initialScenario} inputRequired />
    </div>
  );
}

export default function ReplyPage() {
  return (
    <Suspense>
      <ReplyContent />
    </Suspense>
  );
}
