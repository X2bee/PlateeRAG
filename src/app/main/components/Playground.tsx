"use client";
import React, { useState, useEffect, useRef } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { listWorkflowsDetail } from "@/app/api/workflowAPI";
import styles from "@/app/main/assets/Executor.module.scss";
import Executor from "@/app/main/components/Executor";
import Monitor from "@/app/main/components/Monitor";

interface PlaygroundProps {
    activeTab: 'executor' | 'monitoring';
    onTabChange: (tab: 'executor' | 'monitoring') => void;
}
interface Workflow {
    filename: string;
    workflow_id: string;
    node_count: number;
    last_modified: string;
}

interface IOLog {
    log_id: number | string;
    workflow_name: string;
    workflow_id: string;
    input_data: string;
    output_data: string;
    updated_at: string;
}

const Playground: React.FC<PlaygroundProps> = ({
    activeTab,
    onTabChange
}) => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [workflowListLoading, setWorkflowListLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        loadWorkflowList();
    }, []);

    const loadWorkflowList = async () => {
        try {
            setWorkflowListLoading(true);
            setError(null);
            const workflowList = await listWorkflowsDetail();
            setWorkflows(workflowList as Workflow[]);
            setSelectedWorkflow(null);
        } catch (err) {
            setError("워크플로우 목록을 불러오는데 실패했습니다.");
        } finally {
            setWorkflowListLoading(false);
        }
    };

    const loadChatLogs = async (workflow: Workflow) => {
        try {
            setSelectedWorkflow(workflow);
        } catch (err) {
            setError("워크플로우 셋팅에 문제가 발생했습니다.");
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
                        <h3>워크플로우 실행</h3>
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
                                    key={workflow.workflow_id}
                                    className={`${styles.workflowItem} ${selectedWorkflow?.workflow_id === workflow.workflow_id ? styles.selected : ''}`}
                                    onClick={() => loadChatLogs(workflow)}
                                >
                                    <div className={styles.workflowName}>
                                        {workflow.filename.replace('.json', '')}
                                    </div>
                                    <div className={styles.workflowInfo}>
                                        <span>{workflow.node_count}개 노드</span>
                                        <span>{formatDate(workflow.last_modified)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {activeTab === 'executor' ? <Executor workflow={selectedWorkflow} /> : <Monitor workflow={selectedWorkflow} />}
            </div>
        </>
    );
};

export default Playground;