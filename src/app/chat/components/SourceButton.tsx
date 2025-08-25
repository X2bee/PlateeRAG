'use client';

import React from 'react';
import { FiFileText, FiExternalLink } from 'react-icons/fi';
import { SourceInfo } from '../types/source';
import styles from '../assets/SourceButton.module.scss';

interface SourceButtonProps {
  sourceInfo: SourceInfo;
  onViewSource: (sourceInfo: SourceInfo) => void;
  className?: string;
}

const SourceButton: React.FC<SourceButtonProps> = ({
  sourceInfo,
  onViewSource,
  className = ''
}) => {
  const handleClick = () => {
    onViewSource(sourceInfo);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FiFileText className={styles.sourceIcon} />;
      default:
        return <FiExternalLink className={styles.sourceIcon} />;
    }
  };

  return (
    <button
      className={`${styles.sourceButton} ${className}`}
      onClick={handleClick}
      title={`출처: ${sourceInfo.file_name} (페이지 ${sourceInfo.page_number})`}
    >
      {getFileIcon(sourceInfo.file_name)}
      <span className={styles.sourceText}>
        {sourceInfo.file_name}
      </span>
      <span className={styles.sourceLocation}>
        p.{sourceInfo.page_number}
      </span>
    </button>
  );
};

export default SourceButton;