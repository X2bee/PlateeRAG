import React from 'react';
import { FiDownload } from 'react-icons/fi';
import styles from './download.module.scss';

interface DownloadButtonProps {
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    title?: string;
    className?: string;
}

/**
 * 재사용 가능한 다운로드 아이콘 버튼 컴포넌트
 * - 36x36px 정사각형 아이콘 버튼
 * - 다운로드 중 펄스 애니메이션
 * - 일관된 스타일링
 */
const DownloadButton: React.FC<DownloadButtonProps> = ({
    onClick,
    loading = false,
    disabled = false,
    title = '다운로드',
    className = '',
}) => {
    return (
        <button
            className={`${styles.downloadButton} ${loading ? styles.downloading : ''} ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
            title={title}
            type="button"
        >
            <FiDownload />
        </button>
    );
};

export default DownloadButton;
