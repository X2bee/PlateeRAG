import React, { useState, useEffect, useRef } from 'react';
import styles from '@/app/(canvas)/assets/Header.module.scss';
import { LuPanelRightOpen, LuSave, LuFolderOpen, LuCheck, LuX, LuPencil, LuDownload } from "react-icons/lu";
import { getWorkflowName, saveWorkflowName } from '@/app/services/workflowStorage';

const Header = ({ onMenuClick, onSave, onLoad, onExport }) => {
    const [workflowName, setWorkflowName] = useState('Workflow');
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        const savedName = getWorkflowName();
        setWorkflowName(savedName);
    }, []);

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