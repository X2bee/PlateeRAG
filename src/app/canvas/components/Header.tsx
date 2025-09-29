import React, { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/canvas/assets/Header.module.scss';
import { LuPanelRightOpen, LuSave, LuCheck, LuX, LuPencil, LuFileText, LuArrowLeft, LuHistory, LuUsers } from "react-icons/lu";
import { getWorkflowName, saveWorkflowName } from '@/app/_common/utils/workflowStorage';
import { FiUpload } from 'react-icons/fi';
import { BiCodeAlt } from "react-icons/bi";
import { showHistoryClearWarningKo } from '@/app/_common/utils/toastUtilsKo';
import { devLog } from '@/app/_common/utils/logger';

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
    isOwner = true
}) => {
    const [workflowName, setWorkflowName] = useState<string>('Workflow');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editValue, setEditValue] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

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
        setEditValue(workflowName);
        setIsEditing(true);
    };

    const handleSaveClick = (): void => {
        const trimmedValue = editValue.trim();
        const finalValue = trimmedValue || 'Workflow';

        setWorkflowName(finalValue);
        saveWorkflowName(finalValue);

        devLog.log('Header: Workflow name changed to:', finalValue);

        // Notify parent component of changes
        if (onWorkflowNameChange) {
            onWorkflowNameChange(finalValue);
        }

        setIsEditing(false);
    };

    const handleCancelClick = (): void => {
        setEditValue(workflowName);
        setIsEditing(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            handleSaveClick();
        } else if (e.key === 'Escape') {
            handleCancelClick();
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setEditValue(e.target.value);
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
