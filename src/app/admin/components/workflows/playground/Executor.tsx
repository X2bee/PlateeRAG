'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
    FiMessageSquare,
    FiClock,
} from 'react-icons/fi';
import { getIOLogsAdmin } from '@/app/admin/api/workflow';
import styles from '@/app/admin/assets/playground/Executor.module.scss';

interface Workflow {
    workflow_name: string;
    workflow_id: string;
    node_count: number;
    updated_at: string;
    has_startnode: boolean;
    has_endnode: boolean;
}

interface IOLog {
    log_id: number | string;
    workflow_name: string;
    workflow_id: string;
    input_data: string;
    output_data: string;
    updated_at: string;
}

interface WorkflowPartsProps {
    workflow: Workflow | null;
}

const Executor: React.FC<WorkflowPartsProps> = ({ workflow }) => {
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
        null,
    );
    const [ioLogs, setIOLogs] = useState<IOLog[]>([]);
    const [executorLoading, setExecutorLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadExecutorLogs(workflow);
    }, [workflow]);

    const loadExecutorLogs = async (workflow: Workflow | null) => {
        if (workflow) {
            try {
                setExecutorLoading(true);
                setError(null);
                const workflowName = workflow.workflow_name.replace('.json', '');
                const logs = await getIOLogsAdmin(
                    null, // userId - null이면 모든 사용자
                    workflowName,
                    workflow.workflow_id,
                );
                setIOLogs((logs as any).in_out_logs || []);
                setSelectedWorkflow(workflow);
            } catch (err) {
                setError('실행 로그를 불러오는데 실패했습니다.');
                setIOLogs([]);
            } finally {
                setExecutorLoading(false);
            }
        } else {
            setIOLogs([]);
            setSelectedWorkflow(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR');
    };





    return (
        <>
            <div className={styles.executorPanel}>
                {!selectedWorkflow ? (
                    <div className={styles.placeholder}>
                        <h3>워크플로우를 선택하세요</h3>
                        <p>
                            왼쪽에서 워크플로우를 선택하면 실행 로그와 채팅
                            인터페이스가 표시됩니다.
                        </p>
                    </div>
                ) : executorLoading ? (
                    <div className={styles.executorLoading}>
                        <div className={styles.loadingSpinner}></div>
                        <span>실행 로그를 불러오는 중...</span>
                    </div>
                ) : (
                    <div className={styles.logTableData}>
                        <div className={styles.logTableHeader}>
                            <h3>
                                {selectedWorkflow.workflow_name.replace('.json', '')}{' '}
                                - 실행 로그
                            </h3>
                            <div className={styles.headerActions}>
                                <div className={styles.logCount}>
                                    <FiMessageSquare />
                                    <span>{ioLogs.length}개의 로그</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.logTableContainer}>
                            {ioLogs.length === 0 ? (
                                <div className={styles.emptyLogState}>
                                    <FiClock className={styles.emptyIcon} />
                                    <p>실행 로그가 없습니다.</p>
                                    <p>워크플로우 실행 기록이 여기에 표시됩니다.</p>
                                </div>
                            ) : (
                                <div className={styles.logTable}>
                                    <div className={styles.logTableHead}>
                                        <div className={styles.logTableRow}>
                                            <div className={styles.logTableCell}>번호</div>
                                            <div className={styles.logTableCell}>실행 시간</div>
                                            <div className={styles.logTableCell}>입력 데이터</div>
                                            <div className={styles.logTableCell}>출력 데이터</div>
                                        </div>
                                    </div>
                                    <div className={styles.logTableBody}>
                                        {ioLogs.map((log, index) => (
                                            <div key={log.log_id} className={styles.logTableRow}>
                                                <div className={styles.logTableCell}>
                                                    {index + 1}
                                                </div>
                                                <div className={styles.logTableCell}>
                                                    {formatDate(log.updated_at)}
                                                </div>
                                                <div className={styles.logTableCell}>
                                                    <div className={styles.logDataContent}>
                                                        {log.input_data}
                                                    </div>
                                                </div>
                                                <div className={styles.logTableCell}>
                                                    <div className={styles.logDataContent}>
                                                        {log.output_data}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Executor;
