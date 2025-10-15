'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../../assets/WorkflowStoreDetailModal.module.scss';
import {
    IoClose,
    IoCopy,
    IoCalendar,
    IoPerson,
    IoCheckmark
} from 'react-icons/io5';
import WorkflowStoreMiniCanvas from './WorkflowStoreMiniCanvas';

interface Workflow {
    id: number;
    created_at: string;
    updated_at: string;
    current_version: number;
    description: string;
    edge_count: number;
    full_name?: string;
    has_endnode: boolean;
    has_startnode: boolean;
    is_completed: boolean;
    is_template: boolean;
    latest_version: number;
    metadata?: any;
    workflow_data?: any; // API에서 제공하는 워크플로우 전체 데이터 (nodes, edges, view 포함)
    node_count: number;
    tags?: string[] | null;
    user_id?: number;
    username?: string;
    workflow_id: string;
    workflow_name: string;
    workflow_upload_name: string;
}

interface WorkflowStoreDetailModalProps {
    workflow: Workflow;
    isOpen: boolean;
    onClose: () => void;
    onCopy?: (workflow: Workflow) => void;
}

const WorkflowStoreDetailModal: React.FC<WorkflowStoreDetailModalProps> = ({
    workflow,
    isOpen,
    onClose,
    onCopy
}) => {
    const [copied, setCopied] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleClose = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setIsAnimating(false);
        setTimeout(() => {
            onClose();
        }, 200);
    };

    const handleCopyWorkflow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('=== handleCopyWorkflow clicked ===');
        console.log('onCopy exists:', !!onCopy);
        console.log('workflow:', workflow);

        if (onCopy) {
            onCopy(workflow);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    // modalContainer에서 모든 이벤트 차단하여 Canvas로 전파 방지
    const handleContainerMouseEvent = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    // 헤더와 푸터에서 추가 차단
    const handleSectionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    const modalContent = (
        <div
            className={`${styles.modalOverlay} ${isAnimating ? styles.fadeIn : ''}`}
            onClick={handleBackdropClick}
        >
            <div
                className={`${styles.modalContainer} ${isAnimating ? styles.slideIn : ''}`}
                onMouseDown={handleContainerMouseEvent}
                onMouseUp={handleContainerMouseEvent}
                onMouseMove={handleContainerMouseEvent}
                onClick={handleContainerMouseEvent}
            >
                {/* Header */}
                <div className={styles.modalHeader} onClick={handleSectionClick}>
                    <div className={styles.headerLeft}>
                        <h2 className={styles.workflowTitle}>{workflow.workflow_upload_name}</h2>
                        <div className={styles.workflowMeta}>
                            {workflow.is_template && (
                                <span className={styles.templateBadge}>템플릿</span>
                            )}
                            <span className={styles.versionBadge}>v{workflow.current_version}</span>
                            <div className={styles.metaItem}>
                                <IoCalendar className={styles.metaIcon} />
                                <span>{formatDate(workflow.created_at)}</span>
                            </div>
                            {workflow.user_id && workflow.username && (
                                <div className={styles.metaItem}>
                                    <IoPerson className={styles.metaIcon} />
                                    <span>{workflow.full_name || workflow.username}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.headerRight}>
                        <div className={styles.statsCompact}>
                            <div className={styles.statCompact}>
                                <span className={styles.statLabel}>노드</span>
                                <span className={styles.statValue}>{workflow.node_count}</span>
                            </div>
                            <div className={styles.statCompact}>
                                <span className={styles.statLabel}>엣지</span>
                                <span className={styles.statValue}>{workflow.edge_count}</span>
                            </div>
                            <div className={styles.statCompact}>
                                <span className={styles.statLabel}>시작</span>
                                <span className={styles.statValue}>{workflow.has_startnode ? '✓' : '✗'}</span>
                            </div>
                            <div className={styles.statCompact}>
                                <span className={styles.statLabel}>종료</span>
                                <span className={styles.statValue}>{workflow.has_endnode ? '✓' : '✗'}</span>
                            </div>
                        </div>
                        <button className={styles.closeButton} onClick={handleClose} title="닫기">
                            <IoClose />
                        </button>
                    </div>
                </div>

                {/* Body - Full Canvas */}
                <div className={styles.modalBody}>
                    <WorkflowStoreMiniCanvas workflowData={workflow.workflow_data || {}} />
                </div>

                {/* Footer */}
                <div className={styles.modalFooter} onClick={handleSectionClick}>
                    <div className={styles.footerLeft}>
                        {workflow.description && (
                            <p className={styles.description}>{workflow.description}</p>
                        )}
                    </div>
                    <div className={styles.footerRight}>
                        <button className={styles.cancelButton} onClick={handleClose}>
                            닫기
                        </button>
                        {onCopy && (
                            <button
                                className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                                onClick={handleCopyWorkflow}
                            >
                                {copied ? (
                                    <>
                                        <IoCheckmark />
                                        <span>복사 완료!</span>
                                    </>
                                ) : (
                                    <>
                                        <IoCopy />
                                        <span>워크플로우 복사</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null;
};

export default WorkflowStoreDetailModal;
