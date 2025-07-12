"use client";
import React, { useState, useEffect } from "react";
import { FiFolder, FiPlay, FiEdit, FiTrash2, FiUser } from "react-icons/fi";
import styles from "@/app/main/assets/CompletedWorkflows.module.scss";
import { listWorkflows, loadWorkflow } from "@/app/api/workflowAPI";

interface Workflow {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    lastModified?: string;
    author: string;
    nodeCount: number;
    status: "active" | "draft" | "archived";
}

interface WorkflowData {
    id?: string;
    name?: string;
    description?: string;
    contents?: {
        nodes?: any[];
        [key: string]: any;
    };
    [key: string]: any;
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
            
            // 워크플로우 파일 목록 가져오기
            const workflowNames = await listWorkflows();
            
            // 각 워크플로우의 상세 정보 로드
            const workflowPromises = workflowNames.map(async (name: string) => {
                try {
                    // const workflowData = await loadWorkflow(name) as WorkflowData;
                    
                    // 노드 개수 계산
                    const nodeCount = workflowData.contents?.nodes?.length || 0;
                    
                    return {
                        id: workflowData.id || name,
                        name: workflowData.name || name.replace('.json', ''),
                        description: workflowData.description,
                        author: "AI-LAB", // 모든 생성자를 AI-LAB으로 설정
                        nodeCount: nodeCount,
                        status: "active" as const, // 일단 모든 워크플로우를 active로 설정
                    };
                } catch (error) {
                    console.error(`Failed to load workflow ${name}:`, error);
                    return {
                        id: name,
                        name: name.replace('.json', ''),
                        author: "AI-LAB",
                        nodeCount: 0,
                        status: "active" as const,
                    };
                }
            });
            
            const loadedWorkflows = await Promise.all(workflowPromises);
            setWorkflows(loadedWorkflows);
            
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

                                <div className={styles.workflowMeta}>
                                    <div className={styles.metaItem}>
                                        <FiUser />
                                        <span>{workflow.author}</span>
                                    </div>
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
