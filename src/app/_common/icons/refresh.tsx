import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import styles from './refresh.module.scss';

interface RefreshButtonProps {
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    title?: string;
    className?: string;
}

/**
 * 재사용 가능한 새로고침 아이콘 버튼 컴포넌트
 * - 36x36px 정사각형 아이콘 버튼
 * - 로딩 중 회전 애니메이션
 * - 일관된 스타일링
 */
const RefreshButton: React.FC<RefreshButtonProps> = ({
    onClick,
    loading = false,
    disabled = false,
    title = '새로고침',
    className = '',
}) => {
    return (
        <button
            className={`${styles.refreshButton} ${loading ? styles.spinning : ''} ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
            title={title}
            type="button"
        >
            <FiRefreshCw />
        </button>
    );
};

export default RefreshButton;
