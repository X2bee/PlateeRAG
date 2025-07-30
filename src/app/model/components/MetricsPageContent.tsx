import React from 'react';
import { METRICS_URL } from '@/app/config';

// 웹사이트의 URL을 정의합니다.
const websiteUrl = METRICS_URL;

// WebsiteViewer 컴포넌트를 정의합니다.
const MetricsPageContent: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe
        src={websiteUrl}
        title="Polar MLflow"
        style={{
          width: '100%',
          height: '100%',
          border: 'none', // iframe의 테두리를 제거합니다.
        }}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default MetricsPageContent;