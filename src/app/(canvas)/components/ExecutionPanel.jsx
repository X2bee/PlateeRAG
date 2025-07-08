"use client";
import React from 'react';
import styles from '@/app/(canvas)/assets/ExecutionPanel.module.scss';
import { LuPlay, LuTrash2 } from 'react-icons/lu';

const ExecutionPanel = ({ onExecute, onClear, output, isLoading }) => {
    return (
        <div className={styles.executionPanel}>
            <div className={styles.header}>
                <h4>Execution</h4>
                <div className={styles.actions}>
                    <button
                        onClick={onClear}
                        className={styles.actionButton}
                        title="Clear Output"
                        disabled={isLoading}
                    >
                        <LuTrash2 />
                        <span>Clear</span>
                    </button>
                    <button
                        onClick={onExecute}
                        className={`${styles.actionButton} ${styles.runButton}`}
                        title="Run Workflow"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className={styles.loader}></div>
                        ) : (
                            <>
                                <LuPlay />
                                <span>Run</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            <div className={styles.outputContainer}>
                <pre>
                    {output ? JSON.stringify(output, null, 2) : "Click 'Run' to execute the workflow."}
                </pre>
            </div>
        </div>
    );
};

export default ExecutionPanel;