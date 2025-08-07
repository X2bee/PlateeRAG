import React, { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import styles from '@/app/canvas/assets/Header.module.scss';
import { LuPanelRightOpen, LuSave, LuCheck, LuX, LuPencil, LuFileText } from "react-icons/lu";
import { getWorkflowName, saveWorkflowName } from '@/app/_common/utils/workflowStorage';
import { FiUpload } from 'react-icons/fi';
import { BiCodeAlt } from "react-icons/bi";

// Type definitions
interface HeaderProps {
    onMenuClick: () => void;
    onSave: () => void;
    onLoad: () => void;
    onExport: () => void;
    onNewWorkflow: () => void;
    workflowName?: string;
    onWorkflowNameChange?: (name: string) => void;
    onDeploy: () => void;
    isDeploy?: boolean;
    handleExecute?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    onMenuClick,
    onSave,
    onLoad,
    onExport,
    onNewWorkflow,
    workflowName: externalWorkflowName,
    onWorkflowNameChange,
    onDeploy,
    isDeploy,
    handleExecute
}) => {
    const [workflowName, setWorkflowName] = useState<string>('Workflow');
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editValue, setEditValue] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

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
                <Link href="/main" className={styles.logoLink}>
                    <div className={styles.logo}>
                        XGen
                    </div>
                </Link>
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
                            <button
                                onClick={handleEditClick}
                                className={styles.editButton}
                                title="Edit workflow name"
                            >
                                <LuPencil />
                            </button>
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
                        <button className={styles.deployTestButton} onClick={handleExecute} disabled={isDeploy}>
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
                <button onClick={onMenuClick} className={styles.menuButton}>
                    <LuPanelRightOpen />
                </button>
            </div>
        </header>
    );
};

export default Header;
