import React, { useState, useEffect, useRef } from 'react';
import styles from '@/app/canvas/assets/Header.module.scss';
import { LuPanelRightOpen, LuSave, LuCheck, LuX, LuPencil, LuFileText } from "react-icons/lu";
import { getWorkflowName, saveWorkflowName } from '@/app/(common)/components/workflowStorage';

const Header = ({ onMenuClick, onSave, onLoad, onExport, onNewWorkflow, workflowName: externalWorkflowName, onWorkflowNameChange }) => {
    const [workflowName, setWorkflowName] = useState('Workflow');
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef(null);

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

    const handleEditClick = () => {
        setEditValue(workflowName);
        setIsEditing(true);
    };

    const handleSaveClick = () => {
        const trimmedValue = editValue.trim();
        const finalValue = trimmedValue || 'Workflow';
        setWorkflowName(finalValue);
        saveWorkflowName(finalValue);
        
        // 부모 컴포넌트에 변경사항 알림
        if (onWorkflowNameChange) {
            onWorkflowNameChange(finalValue);
        }
        
        setIsEditing(false);
    };

    const handleCancelClick = () => {
        setEditValue(workflowName);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSaveClick();
        } else if (e.key === 'Escape') {
            handleCancelClick();
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.leftSection}>
                <div className={styles.logo}>
                    PlateeRAG
                </div>
                <div className={styles.workflowNameSection}>
                    {isEditing ? (
                        <div className={styles.editMode}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
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
                {/* <nav className={styles.nav}>
                    <ul>
                        <li><button type="button">파일</button></li>
                        <li><button type="button">편집</button></li>
                        <li><button type="button">보기</button></li>
                        <li><button type="button">내보내기</button></li>
                        <li><button type="button">도움말</button></li>
                    </ul>
                </nav> */}
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