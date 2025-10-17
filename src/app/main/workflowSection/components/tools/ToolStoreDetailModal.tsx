'use client';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    FiX,
    FiTool,
    FiUser,
    FiLink,
    FiCode,
    FiInfo,
    FiFilter,
    FiShield,
    FiTag,
} from 'react-icons/fi';
import styles from '@/app/main/workflowSection/assets/ToolStorageDetailModal.module.scss';

interface Tool {
    id: number;
    created_at: string;
    updated_at: string;
    user_id: number;
    function_upload_id: string;
    function_data: {
        function_name: string;
        function_id: string;
        description: string;
        api_header: any;
        api_body: {
            properties: any;
        };
        api_url: string;
        api_method: string;
        api_timeout: number;
        response_filter: boolean;
        response_filter_path: string;
        response_filter_field: string;
        status: string;
    };
    metadata: {
        description: string;
        tags: string[];
        original_function_id: string;
    };
    rating_count: number;
    rating_sum: number;
    username: string;
    full_name: string;
}

interface ToolStoreDetailModalProps {
    tool: Tool;
    isOpen: boolean;
    onClose: () => void;
    onDownload: (tool: Tool) => void;
}

const ToolStoreDetailModal: React.FC<ToolStoreDetailModalProps> = ({ tool, isOpen, onClose, onDownload }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !tool) return null;

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDownload = () => {
        onDownload(tool);
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleModalContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleModalWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'active':
                return styles.statusActive;
            case 'inactive':
                return styles.statusInactive;
            default:
                return styles.statusActive;
        }
    };

    const modalContent = (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div
                className={styles.modalContent}
                onClick={handleModalContentClick}
                onWheel={handleModalWheel}
            >
                {/* Modal Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerLeft}>
                        <div className={styles.toolIcon}>
                            <FiTool />
                        </div>
                        <div className={styles.headerInfo}>
                            <h2 className={styles.modalTitle}>{tool.function_data.function_name}</h2>
                            <div className={styles.headerMeta}>
                                <span className={styles.author}>
                                    <FiUser />
                                    {tool.full_name || tool.username}
                                </span>
                                <div className={`${styles.status} ${getStatusBadgeClass(tool.function_data.status)}`}>
                                    <FiShield />
                                    {tool.function_data.status === 'active' ? '활성' : '비활성'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                {/* Modal Body */}
                <div className={styles.modalBody}>
                    {/* Basic Information - Compact */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FiInfo />
                            기본 정보
                        </h3>
                        <div className={styles.compactInfoGrid}>
                            <div className={styles.compactInfoItem}>
                                <span className={styles.compactLabel}>ID:</span>
                                <span className={styles.compactValue}>{tool.function_data.function_id}</span>
                            </div>
                            <div className={styles.compactInfoItem}>
                                <span className={styles.compactLabel}>작성자:</span>
                                <span className={styles.compactValue}>{tool.full_name || tool.username}</span>
                            </div>
                            <div className={styles.compactInfoItem}>
                                <span className={styles.compactLabel}>상태:</span>
                                <span className={`${styles.compactValue} ${tool.function_data.status === 'active' ? styles.statusActiveText : styles.statusInactiveText}`}>
                                    {tool.function_data.status === 'active' ? '활성' : '비활성'}
                                </span>
                            </div>
                            <div className={styles.compactInfoItem}>
                                <span className={styles.compactLabel}>생성:</span>
                                <span className={styles.compactValue}>{formatDate(tool.created_at)}</span>
                            </div>
                            <div className={styles.compactInfoItem}>
                                <span className={styles.compactLabel}>수정:</span>
                                <span className={styles.compactValue}>{formatDate(tool.updated_at)}</span>
                            </div>
                        </div>
                        {tool.function_data.description && (
                            <div className={styles.descriptionBox}>
                                <p className={styles.description}>{tool.function_data.description}</p>
                            </div>
                        )}
                    </div>

                    {/* API Configuration - Detailed */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FiLink />
                            API 설정
                        </h3>

                        {/* API URL - Single Line */}
                        <div className={styles.apiUrlBox}>
                            <div className={styles.apiUrlLabel}>
                                <FiLink />
                                <span>API URL</span>
                            </div>
                            <div className={styles.apiUrlValue}>{tool.function_data.api_url}</div>
                        </div>

                        {/* API Method & Timeout */}
                        <div className={styles.apiMetaGrid}>
                            <div className={styles.apiMetaItem}>
                                <span className={styles.apiMetaLabel}>HTTP 메서드</span>
                                <span className={styles.apiMetaValue}>{tool.function_data.api_method}</span>
                            </div>
                            <div className={styles.apiMetaItem}>
                                <span className={styles.apiMetaLabel}>타임아웃</span>
                                <span className={styles.apiMetaValue}>{tool.function_data.api_timeout}초</span>
                            </div>
                        </div>

                        {/* API Header */}
                        <div className={styles.codeBlock}>
                            <div className={styles.codeHeader}>
                                <FiCode />
                                <span>API Header</span>
                            </div>
                            <pre className={styles.codeContent}>
                                {(() => {
                                    if (!tool.function_data.api_header) return '{\n  // 헤더 없음\n}';

                                    try {
                                        // api_header가 문자열인 경우 파싱
                                        const parsedHeader = typeof tool.function_data.api_header === 'string'
                                            ? JSON.parse(tool.function_data.api_header)
                                            : tool.function_data.api_header;

                                        return Object.keys(parsedHeader).length > 0
                                            ? JSON.stringify(parsedHeader, null, 2)
                                            : '{\n  // 헤더 없음\n}';
                                    } catch (e) {
                                        // 파싱 실패 시 원본 표시
                                        return typeof tool.function_data.api_header === 'string'
                                            ? tool.function_data.api_header
                                            : JSON.stringify(tool.function_data.api_header, null, 2);
                                    }
                                })()}
                            </pre>
                        </div>

                        {/* API Body */}
                        <div className={styles.codeBlock}>
                            <div className={styles.codeHeader}>
                                <FiCode />
                                <span>API Body</span>
                            </div>
                            <pre className={styles.codeContent}>
                                {(() => {
                                    if (!tool.function_data.api_body) return '{\n  // 바디 없음\n}';

                                    try {
                                        // api_body가 문자열인 경우 파싱
                                        const parsedBody = typeof tool.function_data.api_body === 'string'
                                            ? JSON.parse(tool.function_data.api_body)
                                            : tool.function_data.api_body;

                                        return Object.keys(parsedBody).length > 0
                                            ? JSON.stringify(parsedBody, null, 2)
                                            : '{\n  // 바디 없음\n}';
                                    } catch (e) {
                                        // 파싱 실패 시 원본 표시
                                        return typeof tool.function_data.api_body === 'string'
                                            ? tool.function_data.api_body
                                            : JSON.stringify(tool.function_data.api_body, null, 2);
                                    }
                                })()}
                            </pre>
                        </div>
                    </div>

                    {/* Response Filter */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FiFilter />
                            응답 필터
                        </h3>
                        {tool.function_data.response_filter ? (
                            <div className={styles.filterInfoGrid}>
                                <div className={styles.filterInfoItem}>
                                    <span className={styles.filterLabel}>필터 상태</span>
                                    <span className={styles.filterValueActive}>활성화</span>
                                </div>
                                <div className={styles.filterInfoItem}>
                                    <span className={styles.filterLabel}>필터 경로</span>
                                    <span className={styles.filterValue}>{tool.function_data.response_filter_path || '없음'}</span>
                                </div>
                                <div className={styles.filterInfoItem}>
                                    <span className={styles.filterLabel}>필터 필드</span>
                                    <span className={styles.filterValue}>{tool.function_data.response_filter_field || '없음'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.filterDisabled}>
                                <span>응답 필터가 비활성화되어 있습니다.</span>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    {tool.metadata.tags && tool.metadata.tags.length > 0 && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FiTag />
                                태그
                            </h3>
                            <div className={styles.compactInfoGrid}>
                                {tool.metadata.tags.map((tag, index) => (
                                    <div key={index} className={styles.compactInfoItem}>
                                        <span className={styles.compactValue}>{tag}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rating Information */}
                    {tool.rating_count > 0 && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FiInfo />
                                평가 정보
                            </h3>
                            <div className={styles.compactInfoGrid}>
                                <div className={styles.compactInfoItem}>
                                    <span className={styles.compactLabel}>평점:</span>
                                    <span className={styles.compactValue}>
                                        {(tool.rating_sum / tool.rating_count).toFixed(1)} / 5.0
                                    </span>
                                </div>
                                <div className={styles.compactInfoItem}>
                                    <span className={styles.compactLabel}>평가 수:</span>
                                    <span className={styles.compactValue}>{tool.rating_count}개</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    {tool.metadata && Object.keys(tool.metadata).length > 0 && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FiTag />
                                메타데이터
                            </h3>
                            <div className={styles.codeBlock}>
                                <pre className={styles.codeContent}>
                                    {JSON.stringify(tool.metadata, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className={styles.modalFooter}>
                    <button className={styles.downloadButton} onClick={handleDownload}>
                        다운로드
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ToolStoreDetailModal;
