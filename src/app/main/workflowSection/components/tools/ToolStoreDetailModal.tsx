'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from '../../assets/ToolStoreModal.module.scss';

interface Tool {
    id: number;
    function_id: string;
    function_upload_id: string;
    function_name: string;
    description: string;
    created_at: string;
    updated_at: string;
    user_id?: number;
    username?: string;
    full_name?: string;
    is_template: boolean;
    is_shared: boolean;
    tags?: string[] | null;
    metadata?: any;
    rating_count?: number;
    rating_sum?: number;
    parameter_count?: number;
}

interface ToolStoreDetailModalProps {
    tool: Tool;
    isOpen: boolean;
    onClose: () => void;
    onDownload: (tool: Tool) => void;
}

const ToolStoreDetailModal: React.FC<ToolStoreDetailModalProps> = ({ tool, isOpen, onClose, onDownload }) => {
    if (!isOpen || !tool) return null;

    const handleDownload = () => {
        onDownload(tool);
    };

    return createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{tool.function_upload_id}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <IoClose />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.section}>
                        <h3>도구 정보</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>함수명:</span>
                                <span className={styles.value}>{tool.function_name}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>작성자:</span>
                                <span className={styles.value}>{tool.full_name || tool.username || '알 수 없음'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>생성일:</span>
                                <span className={styles.value}>
                                    {new Date(tool.created_at).toLocaleDateString('ko-KR')}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>파라미터 수:</span>
                                <span className={styles.value}>{tool.parameter_count || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3>설명</h3>
                        <p className={styles.description}>{tool.description || '설명이 없습니다.'}</p>
                    </div>

                    {tool.tags && tool.tags.length > 0 && (
                        <div className={styles.section}>
                            <h3>태그</h3>
                            <div className={styles.tags}>
                                {tool.tags.map((tag, index) => (
                                    <span key={index} className={styles.tag}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        닫기
                    </button>
                    <button className={styles.downloadButton} onClick={handleDownload}>
                        다운로드
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ToolStoreDetailModal;
