import React from 'react';
import { FiUpload } from 'react-icons/fi';
import styles from './upload.module.scss';

interface UploadButtonProps {
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
    title?: string;
    className?: string;
    children?: React.ReactNode;
}

/**
 * 재사용 가능한 업로드/배포 아이콘 버튼 컴포넌트
 * - 36x36px 정사각형 아이콘 버튼
 * - 업로드 중 펄스 애니메이션
 * - 일관된 스타일링 (옅은 초록색)
 */
const UploadButton: React.FC<UploadButtonProps> = ({
    onClick,
    loading = false,
    disabled = false,
    title = '업로드',
    className = '',
    children,
}) => {
    return (
        <button
            className={`${styles.uploadButton} ${loading ? styles.uploading : ''} ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
            title={title}
            type="button"
        >
            <FiUpload />
            {children && <span className={styles.buttonText}>{children}</span>}
        </button>
    );
};

export default UploadButton;
