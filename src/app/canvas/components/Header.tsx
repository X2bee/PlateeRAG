import React, { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/canvas/assets/Header.module.scss';
import { LuPanelRightOpen, LuSave, LuCheck, LuX, LuPencil, LuFileText, LuArrowLeft, LuHistory, LuUsers } from "react-icons/lu";
import { getWorkflowName, saveWorkflowName } from '@/app/_common/utils/workflowStorage';
import { FiUpload, FiCopy } from 'react-icons/fi';
import { BiCodeAlt } from "react-icons/bi";
import { showHistoryClearWarningKo, showSuccessToastKo, showErrorToastKo, showWorkflowOverwriteConfirmKo } from '@/app/_common/utils/toastUtilsKo';
import { devLog } from '@/app/_common/utils/logger';
import { renameWorkflow, duplicateWorkflow, loadWorkflow } from '@/app/_common/api/workflow/workflowAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';

interface HeaderProps {
    onMenuClick: () => void;
    onSave: () => void;
    onLoad: () => void;
    onExport: () => void;
    onNewWorkflow: () => void;
    onBack?: () => void;
    workflowName?: string;
    onWorkflowNameChange?: (name: string) => void;
    onDeploy: () => void;
    isDeploy?: boolean;
    handleExecute?: () => void;
    isLoading?: boolean;
    onHistoryClick?: () => void;
    historyCount?: number;
    isHistoryPanelOpen?: boolean;
    isOwner?: boolean;
    userId?: string;
    onLoadWorkflow?: (workflowData: any, workflowName?: string) => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({
    onMenuClick,
    onSave,
    onNewWorkflow,
    onBack,
    workflowName: externalWorkflowName,
    onWorkflowNameChange,
    onDeploy,
    isDeploy,
    handleExecute,
    isLoading,
    onHistoryClick,
    historyCount = 0,
    isHistoryPanelOpen = false,
    isOwner = true,
    userId,
    onLoadWorkflow
}) => {
    const [workflowName, setWorkflowName] = useState<string>('Workflow');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editValue, setEditValue] = useState<string>('');
    const [oldWorkflowName, setOldWorkflowName] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { user } = useAuth();

    const handleBackClick = (): void => {
        try {
            // 히스토리가 있는 경우 경고 표시
            if (historyCount > 0) {
                showHistoryClearWarningKo(
                    () => {
                        // 확인 시 뒤로가기 실행
                        if (onBack) {
                            onBack();
                        } else {
                            router.back();
                        }
                    }
                );
            } else {
                // 히스토리가 없으면 바로 뒤로가기
                if (onBack) {
                    onBack();
                } else {
                    router.back();
                }
            }
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        if (externalWorkflowName) {
            setWorkflowName(externalWorkflowName);
        } else {
            const savedName = getWorkflowName();
            setWorkflowName(savedName);
        }
    }, [externalWorkflowName]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleEditClick = (): void => {
        setOldWorkflowName(workflowName);
        setEditValue(workflowName);
        setIsEditing(true);
    };

    const handleSaveClick = async (): Promise<void> => {
        const trimmedValue = editValue.trim();
        const finalValue = trimmedValue || 'Workflow';

        // 이름이 변경되지 않은 경우
        if (finalValue === oldWorkflowName) {
            setIsEditing(false);
            return;
        }

        try {
            // API를 통해 워크플로우 이름 변경
            await renameWorkflow(oldWorkflowName, finalValue);

            setWorkflowName(finalValue);
            saveWorkflowName(finalValue);

            devLog.log('Header: Workflow name changed from:', oldWorkflowName, 'to:', finalValue);

            // Notify parent component of changes
            if (onWorkflowNameChange) {
                onWorkflowNameChange(finalValue);
            }

            showSuccessToastKo('워크플로우 이름이 변경되었습니다.');
            setIsEditing(false);
        } catch (error) {
            devLog.error('Failed to rename workflow:', error);

            // 에러 메시지 파싱
            const errorMessage = error instanceof Error ? error.message : String(error);

            if (errorMessage.includes('already exists')) {
                showErrorToastKo('이미 존재하는 이름입니다. 다른 이름으로 시도하세요.');
            } else {
                showErrorToastKo('워크플로우 이름 변경에 실패했습니다.');
            }

            // 실패 시 원래 이름으로 되돌림
            setEditValue(oldWorkflowName);
        }
    };

    const handleCancelClick = (): void => {
        setEditValue(workflowName);
        setIsEditing(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            void handleSaveClick();
        } else if (e.key === 'Escape') {
            handleCancelClick();
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setEditValue(e.target.value);
    };

    const handleDuplicate = async (): Promise<void> => {
        // 먼저 저장 + 복사 확인 메시지 표시
        showWorkflowOverwriteConfirmKo(
            workflowName,
            async () => {
                // 승인 시 저장 없이 바로 복사 + 로드 진행
                // isOwner가 true면 현재 로그인한 사용자의 워크플로우, false면 다른 사용자의 워크플로우
                const sourceUserId = isOwner ? user?.user_id : userId;

                if (!sourceUserId) {
                    showErrorToastKo('워크플로우 복사에 실패했습니다: 사용자 정보가 없습니다.');
                    return;
                }

                try {
                    // 원본 워크플로우의 소유자 ID로 복사 API 호출
                    const result = await duplicateWorkflow(workflowName, sourceUserId);

                    // 복사 성공 메시지 표시
                    showSuccessToastKo(`"${workflowName}" 워크플로우가 성공적으로 복사되었습니다!`);

                    // 복사된 workflow의 filename을 사용해서 로드
                    if (result && (result as any).filename) {
                        const newWorkflowName = (result as any).filename;
                        const currentUserId = user?.user_id;

                        devLog.log('Loading duplicated workflow:', newWorkflowName);

                        // loadWorkflow API를 호출해서 데이터 가져오기
                        const workflowData = await loadWorkflow(newWorkflowName, currentUserId);

                        // onLoadWorkflow 함수를 통해 Canvas 상태 업데이트
                        if (onLoadWorkflow && workflowData) {
                            await onLoadWorkflow(workflowData, newWorkflowName);
                        }
                    }
                } catch (error) {
                    console.error('Failed to duplicate workflow:', error);
                    showErrorToastKo(`워크플로우 복사에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        );
    };

    return (
        <header className={styles.header}>
            <div className={styles.leftSection}>
                <button onClick={handleBackClick} className={styles.backButton} title="뒤로가기">
                    <LuArrowLeft />
                </button>
                <div className={styles.logo}>
                    XGEN
                </div>
                <div className={styles.workflowNameSection}>
                    {isEditing ? (
                        <div className={styles.editMode}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className={styles.workflowInput}
                                placeholder="Workflow name..."
                            />
                            <button
                                onClick={handleSaveClick}
                                className={`${styles.editButton} ${styles.saveButton}`}
                                title="Save name"
                            >
                                <LuCheck />
                            </button>
                            <button
                                onClick={handleCancelClick}
                                className={`${styles.editButton} ${styles.cancelButton}`}
                                title="Cancel"
                            >
                                <LuX />
                            </button>
                        </div>
                    ) : (
                        <div className={styles.displayMode}>
                            <span className={styles.workflowName}>{workflowName}</span>
                            {!isOwner && (
                                <span
                                    className={styles.sharedIndicator}
                                    title="공유받은 워크플로우입니다. 이름을 수정할 수 없습니다."
                                >
                                    <LuUsers />
                                </span>
                            )}
                            {isOwner && (
                                <button
                                    onClick={handleEditClick}
                                    className={styles.editButton}
                                    title="Edit workflow name"
                                >
                                    <LuPencil />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.rightSection}>
                {isDeploy ? (
                    <button className={styles.deployButton} onClick={onDeploy} disabled={!isDeploy}>
                        <FiUpload />
                        <span>배포하기</span>
                    </button>)
                    : (
                        <button className={styles.deployTestButton} onClick={handleExecute} disabled={isLoading}>
                            <BiCodeAlt />
                            <span>배포 테스트</span>
                        </button>
                    )}
                <button onClick={onNewWorkflow} className={styles.menuButton} title="New Workflow">
                    <LuFileText />
                </button>
                <button onClick={onSave} className={styles.menuButton} title="Save Workflow">
                    <LuSave />
                </button>
                <button onClick={handleDuplicate} className={styles.menuButton} title="워크플로우 복사">
                    <FiCopy />
                </button>
                {onHistoryClick && (
                    <button
                        onClick={onHistoryClick}
                        className={`${styles.menuButton} ${isHistoryPanelOpen ? styles.active : ''}`}
                        title="작업 히스토리"
                    >
                        <LuHistory />
                        {historyCount > 0 && (
                            <span className={styles.historyBadge}>{historyCount}</span>
                        )}
                    </button>
                )}
                <button onClick={onMenuClick} className={styles.menuButton}>
                    <LuPanelRightOpen />
                </button>
            </div>
        </header>
    );
};

export default Header;
