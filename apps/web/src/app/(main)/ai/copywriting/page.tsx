'use client';

import { Typography } from 'antd';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { COPYWRITING_SCENARIOS } from '@shophelp/shared';
import { GenerationPanel } from '@/components/generation-panel';

function CopywritingContent() {
  const searchParams = useSearchParams();
  const initialScenario = searchParams.get('scenario') ?? undefined;

  return (
    <div>
      <div className="mb-4">
        <Typography.Title level={4} style={{ marginBottom: 4 }}>
          AI 文案中心
        </Typography.Title>
        <Typography.Text type="secondary">
          朋友圈、社群、小红书、抖音……选个场景，AI 一次给你 3 个版本
        </Typography.Text>
      </div>
      <GenerationPanel type="COPYWRITING" scenarios={COPYWRITING_SCENARIOS} initialScenario={initialScenario} />
    </div>
  );
}

export default function CopywritingPage() {
  return (
    <Suspense>
      <CopywritingContent />
    </Suspense>
  );
}
