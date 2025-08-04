import React from 'react';
import { METRICS_URL } from '@/app/config';
import styles from '@/app/model/assets/ModelPage.module.scss'

// 웹사이트의 URL을 정의합니다.
const websiteUrl = METRICS_URL;

// WebsiteViewer 컴포넌트를 정의합니다.
const MetricsPageContent: React.FC = () => {
  return (
    <div className={styles.modelContainer}>
        <iframe
          src={websiteUrl}
          title="Polar MLflow"
          className={styles.modelSection}
          sandbox="allow-scripts allow-same-origin"
        />
    </div>
  );
};

export default MetricsPageContent;