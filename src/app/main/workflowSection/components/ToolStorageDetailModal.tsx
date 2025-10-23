'use client';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    FiX,
    FiTool,
    FiUser,
    FiClock,
    FiLink,
    FiCode,
    FiSettings,
    FiInfo,
    FiFilter,
    FiShield,
    FiTag,
    FiUsers,
} from 'react-icons/fi';
import styles from '@/app/main/workflowSection/assets/ToolStorageDetailModal.module.scss';

interface ToolData {
    id: number;
    created_at: string;
    updated_at: string;
    function_name: string;
    function_id: string;
    description: string;
    api_url: string;
    api_method: string;
    api_timeout: number;
    api_header: any;
    api_body: any;
    static_body?: any;
    body_type?: string;
    response_filter: boolean;
    response_filter_path: string;
    response_filter_field: string;
    status: string;
    metadata: any;
    user_id: number;
    username: string;
    full_name: string;
    is_shared: boolean;
    share_group: string | null;
    share_permissions: string;
}

interface ToolStorageDetailModalProps {
    tool: ToolData | null;
    isOpen: boolean;
    onClose: () => void;
}

const ToolStorageDetailModal: React.FC<ToolStorageDetailModalProps> = ({
    tool,
    isOpen,
    onClose,
}) => {
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
                            <h2 className={styles.modalTitle}>{tool.function_name}</h2>
                            <div className={styles.headerMeta}>
                                <span className={styles.author}>
                                    <FiUser />
                                    {tool.full_name || tool.username}
                                </span>
                                <div className={`${styles.status} ${getStatusBadgeClass(tool.status)}`}>
                                    <FiShield />
                                    {tool.status === 'active' ? '활성' : '비활성'}
                                </div>
                                {tool.is_shared && (
                                    <div className={styles.sharedBadge}>
                                        <FiUsers />
                                        공유됨
                                    </div>
                                )}
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
                                <span className={styles.compactValue}>{tool.function_id}</span>
                            </div>
                            <div className={styles.compactInfoItem}>
                                <span className={styles.compactLabel}>작성자:</span>
                                <span className={styles.compactValue}>{tool.full_name || tool.username}</span>
                            </div>
                            <div className={styles.compactInfoItem}>
                                <span className={styles.compactLabel}>상태:</span>
                                <span className={`${styles.compactValue} ${tool.status === 'active' ? styles.statusActiveText : styles.statusInactiveText}`}>
                                    {tool.status === 'active' ? '활성' : '비활성'}
                                </span>
                            </div>
                            <div className={styles.compactInfoItem}>
                                <span className={styles.compactLabel}>생성:</span>
                                <span className={styles.compactValue}>{formatDate(tool.created_at)}</span>
                            </div>
                        </div>
                        {tool.description && (
                            <div className={styles.descriptionBox}>
                                <p className={styles.description}>{tool.description}</p>
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
                            <div className={styles.apiUrlValue}>{tool.api_url}</div>
                        </div>

                        {/* API Method & Timeout */}
                        <div className={styles.apiMetaGrid}>
                            <div className={styles.apiMetaItem}>
                                <span className={styles.apiMetaLabel}>HTTP 메서드</span>
                                <span className={styles.apiMetaValue}>{tool.api_method}</span>
                            </div>
                            <div className={styles.apiMetaItem}>
                                <span className={styles.apiMetaLabel}>타임아웃</span>
                                <span className={styles.apiMetaValue}>{tool.api_timeout}초</span>
                            </div>
                            {tool.body_type && (
                                <div className={styles.apiMetaItem}>
                                    <span className={styles.apiMetaLabel}>Body Type</span>
                                    <span className={styles.apiMetaValue}>{tool.body_type}</span>
                                </div>
                            )}
                        </div>

                        {/* API Header */}
                        <div className={styles.codeBlock}>
                            <div className={styles.codeHeader}>
                                <FiCode />
                                <span>API Header</span>
                            </div>
                            <pre className={styles.codeContent}>
                                {(() => {
                                    if (!tool.api_header) return '{\n  // 헤더 없음\n}';

                                    try {
                                        // api_header가 문자열인 경우 파싱
                                        const parsedHeader = typeof tool.api_header === 'string'
                                            ? JSON.parse(tool.api_header)
                                            : tool.api_header;

                                        return Object.keys(parsedHeader).length > 0
                                            ? JSON.stringify(parsedHeader, null, 2)
                                            : '{\n  // 헤더 없음\n}';
                                    } catch (e) {
                                        // 파싱 실패 시 원본 표시
                                        return typeof tool.api_header === 'string'
                                            ? tool.api_header
                                            : JSON.stringify(tool.api_header, null, 2);
                                    }
                                })()}
                            </pre>
                        </div>

                        {/* API Body */}
                        <div className={styles.codeBlock}>
                            <div className={styles.codeHeader}>
                                <FiCode />
                                <span>API Schema</span>
                            </div>
                            <pre className={styles.codeContent}>
                                {(() => {
                                    if (!tool.api_body) return '{\n  // 바디 없음\n}';

                                    try {
                                        // api_body가 문자열인 경우 파싱
                                        const parsedBody = typeof tool.api_body === 'string'
                                            ? JSON.parse(tool.api_body)
                                            : tool.api_body;

                                        return Object.keys(parsedBody).length > 0
                                            ? JSON.stringify(parsedBody, null, 2)
                                            : '{\n  // 바디 없음\n}';
                                    } catch (e) {
                                        // 파싱 실패 시 원본 표시
                                        return typeof tool.api_body === 'string'
                                            ? tool.api_body
                                            : JSON.stringify(tool.api_body, null, 2);
                                    }
                                })()}
                            </pre>
                        </div>

                        {/* Static Body */}
                        <div className={styles.codeBlock}>
                            <div className={styles.codeHeader}>
                                <FiCode />
                                <span>API Static Body</span>
                            </div>
                            <pre className={styles.codeContent}>
                                {(() => {
                                    if (!tool.static_body) return '{\n  // 정적 바디 없음\n}';

                                    try {
                                        // static_body가 문자열인 경우 파싱
                                        const parsedStaticBody = typeof tool.static_body === 'string'
                                            ? JSON.parse(tool.static_body)
                                            : tool.static_body;

                                        return Object.keys(parsedStaticBody).length > 0
                                            ? JSON.stringify(parsedStaticBody, null, 2)
                                            : '{\n  // 정적 바디 없음\n}';
                                    } catch (e) {
                                        // 파싱 실패 시 원본 표시
                                        return typeof tool.static_body === 'string'
                                            ? tool.static_body
                                            : JSON.stringify(tool.static_body, null, 2);
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
                        {tool.response_filter ? (
                            <div className={styles.filterInfoGrid}>
                                <div className={styles.filterInfoItem}>
                                    <span className={styles.filterLabel}>필터 상태</span>
                                    <span className={styles.filterValueActive}>활성화</span>
                                </div>
                                <div className={styles.filterInfoItem}>
                                    <span className={styles.filterLabel}>필터 경로</span>
                                    <span className={styles.filterValue}>{tool.response_filter_path || '없음'}</span>
                                </div>
                                <div className={styles.filterInfoItem}>
                                    <span className={styles.filterLabel}>필터 필드</span>
                                    <span className={styles.filterValue}>{tool.response_filter_field || '없음'}</span>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.filterDisabled}>
                                <span>응답 필터가 비활성화되어 있습니다.</span>
                            </div>
                        )}
                    </div>

                    {/* Sharing Information */}
                    {tool.is_shared && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FiUsers />
                                공유 정보
                            </h3>
                            <div className={styles.compactInfoGrid}>
                                <div className={styles.compactInfoItem}>
                                    <span className={styles.compactLabel}>공유 그룹:</span>
                                    <span className={styles.compactValue}>{tool.share_group || '없음'}</span>
                                </div>
                                <div className={styles.compactInfoItem}>
                                    <span className={styles.compactLabel}>권한:</span>
                                    <span className={styles.compactValue}>{tool.share_permissions}</span>
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
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ToolStorageDetailModal;
