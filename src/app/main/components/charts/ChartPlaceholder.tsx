import React from 'react';
import { FiPieChart } from 'react-icons/fi';
import styles from '@/app/main/assets/ChartDashboard.module.scss';

interface ChartPlaceholderProps {
  title: string;
}

const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({ title }) => {
  return (
    <div className={styles.chartPlaceholder}>
      <FiPieChart size={40} />
      <h3>{title}</h3>
      <p>표시할 데이터가 없습니다.</p>
      <p className={styles.placeholderSubtext}>선택한 기간에 해당하는 실행 로그가 없습니다.</p>
    </div>
  );
};

export default ChartPlaceholder;