"use client";
import React, { useState } from 'react';
import styles from '@/app/canvas/assets/ExecutionPanel.module.scss';
import { LuPlay, LuTrash2, LuCircleX, LuChevronUp, LuChevronDown } from 'react-icons/lu';
import type {
    ExecutionError,
    ExecutionSuccess,
    ExecutionOutput,
    OutputRendererProps,
    ExecutionPanelProps
} from '@/app/canvas/types';

// Type guard functions
const hasError = (output: ExecutionOutput): output is ExecutionError => {
    return output !== null && 'error' in output;
};

const hasOutputs = (output: ExecutionOutput): output is ExecutionSuccess => {
    return output !== null && 'outputs' in output;
};

const OutputRenderer: React.FC<OutputRendererProps> = ({ output }) => {
    if (!output) {
        return <div className={styles.placeholder}>Click &apos;Run&apos; to execute the workflow.</div>;
    }

    if (hasError(output)) {
        return (
            <div className={`${styles.resultContainer} ${styles.error}`}>
                <div className={styles.status}>
                    <LuCircleX />
                    <span>Execution Failed</span>
                </div>
                <div className={styles.message}>{output.error}</div>
            </div>
        );
    }

    if (hasOutputs(output)) {
        return (
            <div className={`${styles.resultContainer} ${styles.success}`}>
                <div className={styles.outputDataSection}>
                    <pre className={styles.outputContent}>
                        {JSON.stringify(output.outputs, null, 2)}
                    </pre>
                </div>
            </div>
        );
    }

    // Fallback for unexpected output format
    return (
        <div className={styles.placeholder}>
            Unexpected output format.
        </div>
    );
};

const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ 
    onExecute, 
    onClear, 
    output, 
    isLoading 
}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(true);

    const toggleExpanded = (): void => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`${styles.executionPanel} ${!isExpanded ? styles.collapsed : ''}`}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <button
                        onClick={toggleExpanded}
                        className={styles.toggleButton}
                        title={isExpanded ? "Collapse Panel" : "Expand Panel"}
                    >
                        {isExpanded ? <LuChevronUp /> : <LuChevronDown />}
                    </button>
                    <h4>Execution</h4>
                </div>
                <div className={styles.actions} style={{ display: isExpanded ? 'flex' : 'none' }}>
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
            {isExpanded && (
                <div className={styles.outputContainer}>
                    <pre>
                        <OutputRenderer output={output} />
                    </pre>
                </div>
            )}
        </div>
    );
};

export default ExecutionPanel;