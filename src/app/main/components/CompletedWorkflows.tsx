"use client";
import React, { useState, useEffect } from "react";
import { FiFolder, FiPlay, FiEdit, FiTrash2, FiUser, FiClock } from "react-icons/fi";
import styles from "@/app/main/assets/CompletedWorkflows.module.scss";
import { listWorkflowsDetail } from "@/app/api/workflowAPI";

interface Workflow {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    lastModified?: string;
    author: string;
    nodeCount: number;
    status: "active" | "draft" | "archived";
    filename?: string;
    error?: string;
}

interface WorkflowDetailResponse {
    filename: string;
    workflow_id: string;
    node_count: number;
    last_modified: string;
    error?: string;
}

const CompletedWorkflows: React.FC = () => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "active" | "draft" | "archived">("all");

    // 워크플로우 목록을 가져오는 함수
    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // 워크플로우 상세 정보 가져오기
            const workflowDetails = await listWorkflowsDetail() as WorkflowDetailResponse[];
            
            // API 응답을 UI에서 사용할 형태로 변환
            const transformedWorkflows: Workflow[] = workflowDetails.map((detail: WorkflowDetailResponse) => {
                return {
                    id: detail.workflow_id,
                    name: detail.filename.replace('.json', '') || detail.workflow_id,
                    author: "AI-LAB",
                    nodeCount: detail.node_count,
                    lastModified: detail.last_modified,
                    status: detail.error ? "draft" as const : "active" as const, // 에러가 있으면 draft로 표시
                    filename: detail.filename,
                    error: detail.error,
                };
            });
            
            setWorkflows(transformedWorkflows);
            
        } catch (error) {
            console.error("Failed to fetch workflows:", error);
            setError("워크플로우를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 워크플로우 목록 로드
    useEffect(() => {
        fetchWorkflows();
    }, []);

    const filteredWorkflows = workflows.filter(workflow =>
        filter === "all" || workflow.status === filter
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return styles.statusActive;
            case "draft": return styles.statusDraft;
            case "archived": return styles.statusArchived;
            default: return styles.statusActive;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "active": return "활성";
            case "draft": return "초안";
            case "archived": return "보관됨";
            default: return "활성";
        }
    };

    return (
        <div className={styles.container}>
            {/* Header with Filters */}
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h2>완성된 워크플로우</h2>
                    <p>저장된 워크플로우를 확인하고 관리하세요.</p>
                </div>

                <div className={styles.filters}>
                    {["all", "active", "draft", "archived"].map((filterType) => (
                        <button
                            key={filterType}
                            onClick={() => setFilter(filterType as any)}
                            className={`${styles.filterButton} ${filter === filterType ? styles.active : ""}`}
                        >
                            {filterType === "all" ? "전체" :
                                filterType === "active" ? "활성" :
                                    filterType === "draft" ? "초안" : "보관됨"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className={styles.loadingState}>
                    <p>워크플로우를 불러오는 중...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className={styles.errorState}>
                    <p>{error}</p>
                    <button onClick={fetchWorkflows}>다시 시도</button>
                </div>
            )}

            {/* Workflows Grid */}
            {!loading && !error && (
                <div className={styles.workflowsGrid}>
                    {filteredWorkflows.map((workflow) => (
                        <div key={workflow.id} className={styles.workflowCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.workflowIcon}>
                                    <FiFolder />
                                </div>
                                <div className={`${styles.status} ${getStatusColor(workflow.status)}`}>
                                    {getStatusText(workflow.status)}
                                </div>
                            </div>

                            <div className={styles.cardContent}>
                                <h3 className={styles.workflowName}>{workflow.name}</h3>
                                {workflow.description && (
                                    <p className={styles.workflowDescription}>{workflow.description}</p>
                                )}
                                {workflow.error && (
                                    <p className={styles.workflowError}>오류: {workflow.error}</p>
                                )}

                                <div className={styles.workflowMeta}>
                                    <div className={styles.metaItem}>
                                        <FiUser />
                                        <span>{workflow.author}</span>
                                    </div>
                                    {workflow.lastModified && (
                                        <div className={styles.metaItem}>
                                            <FiClock />
                                            <span>{new Date(workflow.lastModified).toLocaleDateString('ko-KR')}</span>
                                        </div>
                                    )}
                                    <div className={styles.metaItem}>
                                        <span>{workflow.nodeCount}개 노드</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <button className={styles.actionButton} title="실행">
                                    <FiPlay />
                                </button>
                                <button className={styles.actionButton} title="편집">
                                    <FiEdit />
                                </button>
                                <button className={`${styles.actionButton} ${styles.danger}`} title="삭제">
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && filteredWorkflows.length === 0 && (
                <div className={styles.emptyState}>
                    <FiFolder className={styles.emptyIcon} />
                    <h3>워크플로우가 없습니다</h3>
                    <p>아직 저장된 워크플로우가 없습니다. 새로운 워크플로우를 만들어보세요.</p>
                </div>
            )}
        </div>
    );
};

export default CompletedWorkflows;
