'use client';
import React, { useState, useEffect, useRef } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { listWorkflowsDetail } from '@/app/api/workflowAPI';
import styles from '@/app/main/assets/Playground.module.scss';
import Executor from '@/app/main/components/Executor';
import Monitor from '@/app/main/components/Monitor';
import { useSearchParams } from 'next/navigation';

interface PlaygroundProps {
    activeTab: 'executor' | 'monitoring';
    onTabChange: (tab: 'executor' | 'monitoring') => void;
}
interface Workflow {
    filename: string;
    workflow_id: string;
    node_count: number;
    last_modified: string;
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

const Playground: React.FC<PlaygroundProps> = ({ activeTab, onTabChange }) => {
    const searchParams = useSearchParams();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
        null,
    );
    const [workflowListLoading, setWorkflowListLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadWorkflowList();
    }, []);

    useEffect(() => {
        const workflowName = searchParams.get('workflowName');
        const workflowId = searchParams.get('workflowId');

        if (workflowName && workflowId && workflows.length > 0) {
            // Find the workflow in the loaded list
            const workflow = workflows.find(
                (w) =>
                    w.filename.replace('.json', '') === workflowName &&
                    w.workflow_id === workflowId,
            );

            if (workflow) {
                setSelectedWorkflow(workflow);
                // 무조건 executor 탭으로 전환
                onTabChange('executor');
            } else {
                console.log(
                    `Workflow not found with name=${workflowName} and id=${workflowId}`,
                );
            }
        }
    }, [workflows, searchParams, onTabChange]);

    const loadWorkflowList = async () => {
        try {
            setWorkflowListLoading(true);
            setError(null);
            const workflowList = await listWorkflowsDetail();
            setWorkflows(workflowList as Workflow[]);
            setSelectedWorkflow(null);
        } catch (err) {
            setError('워크플로우 목록을 불러오는데 실패했습니다.');
        } finally {
            setWorkflowListLoading(false);
        }
    };

    const loadChatLogs = async (workflow: Workflow) => {
        try {
            setSelectedWorkflow(workflow);
            // 워크플로우 선택 시 항상 executor 탭으로 전환
            onTabChange('executor');
        } catch (err) {
            setError('워크플로우 셋팅에 문제가 발생했습니다.');
        } finally {
            setWorkflowListLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR');
    };

    return (
        <>
            <div className={styles.monitoringContainer}>
                <div className={styles.workflowList}>
                    <div className={styles.workflowListHeader}>
                        <h3>워크플로우 목록</h3>
                        <button
                            className={`${styles.workflowRefreshButton} ${workflowListLoading ? styles.spinning : ''}`}
                            onClick={loadWorkflowList}
                            disabled={workflowListLoading}
                        >
                            <FiRefreshCw />
                        </button>
                    </div>

                    {workflowListLoading ? (
                        <div className={styles.workflowLoading}>
                            <div className={styles.loadingSpinner}></div>
                            <span>워크플로우를 불러오는 중...</span>
                        </div>
                    ) : workflows.length === 0 ? (
                        <div className={styles.emptyState}>
                            저장된 워크플로우가 없습니다
                        </div>
                    ) : (
                        <div className={styles.workflowItems}>
                            {workflows.map((workflow) => (
                                <div
                                    key={workflow.filename}
                                    className={`${styles.workflowItem} ${selectedWorkflow?.filename === workflow.filename ? styles.selected : ''}`}
                                    onClick={() => loadChatLogs(workflow)}
                                >
                                    <div className={styles.workflowName}>
                                        {workflow.filename.replace('.json', '')}
                                    </div>
                                    <div className={styles.workflowInfo}>
                                        <span>
                                            {workflow.node_count}개 노드
                                        </span>
                                        <span>
                                            {formatDate(workflow.last_modified)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {activeTab === 'executor' ? (
                    <Executor workflow={selectedWorkflow} />
                ) : (
                    <Monitor workflow={selectedWorkflow} />
                )}
            </div>
        </>
    );
};

export default Playground;
