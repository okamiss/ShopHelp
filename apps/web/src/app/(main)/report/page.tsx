'use client';

import { BarChartOutlined } from '@ant-design/icons';
import { Card, Typography } from 'antd';

export default function ReportPage() {
  return (
    <div>
      <div className="mb-4">
        <Typography.Title level={4} style={{ marginBottom: 4 }}>
          经营日报
        </Typography.Title>
        <Typography.Text type="secondary">每天一份 AI 生成的经营总结与建议</Typography.Text>
      </div>
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChartOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
          <Typography.Title level={5} className="mt-4" style={{ marginTop: 16 }}>
            经营日报即将上线
          </Typography.Title>
          <Typography.Text type="secondary">
            上线后每天自动汇总：新增客户、成交转化、AI 使用情况，并给出第二天的经营建议
          </Typography.Text>
        </div>
      </Card>
    </div>
  );
}
