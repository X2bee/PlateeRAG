"use client";
import React, { useState, useEffect, useRef } from "react";
import { FiRefreshCw, FiPlay, FiMessageSquare, FiSend, FiClock } from "react-icons/fi";
import { listWorkflowsDetail, getWorkflowIOLogs } from "@/app/api/workflowAPI";
import styles from "@/app/main/assets/Executor.module.scss";

interface Workflow {
    filename: string;
    workflow_id: string;
    node_count: number;
    last_modified: string;
}

interface IOLog {
    log_id: number;
    workflow_name: string;
    workflow_id: string;
    input_data: string;
    output_data: string;
    updated_at: string;
}

const Executor: React.FC = () => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [ioLogs, setIOLogs] = useState<IOLog[]>([]);
    const [workflowListLoading, setWorkflowListLoading] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // 채팅 메시지 스크롤을 위한 ref
    const chatMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadWorkflowList();
    }, []);

    // 채팅 로그가 변경될 때마다 스크롤을 맨 아래로 이동
    useEffect(() => {
        scrollToBottom();
    }, [ioLogs]);

    const scrollToBottom = () => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    };

    const loadWorkflowList = async () => {
        try {
            setWorkflowListLoading(true);
            setError(null);
            const workflowList = await listWorkflowsDetail();
            setWorkflows(workflowList as Workflow[]);
        } catch (err) {
            setError("워크플로우 목록을 불러오는데 실패했습니다.");
        } finally {
            setWorkflowListLoading(false);
        }
    };

    const loadChatLogs = async (workflow: Workflow) => {
        try {
            setChatLoading(true);
            setError(null);
            
            // .json 확장자 제거
            const workflowName = workflow.filename.replace('.json', '');
            const logs = await getWorkflowIOLogs(workflowName, workflow.workflow_id);
            setIOLogs((logs as any).in_out_logs || []);
            setSelectedWorkflow(workflow);
        } catch (err) {
            setError("실행 로그를 불러오는데 실패했습니다.");
            setIOLogs([]);
        } finally {
            setChatLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR');
    };

    return (
        <div className={styles.monitoringContainer}>
            {/* 워크플로우 목록 */}
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

            {/* 채팅 패널 */}
            <div className={styles.performancePanel}>
                {!selectedWorkflow ? (
                    <div className={styles.placeholder}>
                        <h3>워크플로우를 선택하세요</h3>
                        <p>왼쪽에서 워크플로우를 선택하면 실행 로그와 채팅 인터페이스가 표시됩니다.</p>
                    </div>
                ) : chatLoading ? (
                    <div className={styles.performanceLoading}>
                        <div className={styles.loadingSpinner}></div>
                        <span>실행 로그를 불러오는 중...</span>
                    </div>
                ) : (
                    <div className={styles.performanceData}>
                        <div className={styles.performanceHeader}>
                            <h3>{selectedWorkflow.filename.replace('.json', '')} 실행 로그</h3>
                            <div className={styles.logCount}>
                                <FiMessageSquare />
                                <span>{ioLogs.length}개의 대화</span>
                            </div>
                        </div>

                        <div className={styles.chatContainer}>
                            <div 
                                ref={chatMessagesRef}
                                className={styles.chatMessages}
                            >
                                {ioLogs.length === 0 ? (
                                    <div className={styles.emptyChatState}>
                                        <FiClock className={styles.emptyIcon} />
                                        <p>아직 실행 기록이 없습니다.</p>
                                        <p>워크플로우를 실행해보세요.</p>
                                    </div>
                                ) : (
                                    ioLogs.map((log) => (
                                        <div key={log.log_id} className={styles.chatExchange}>
                                            <div className={styles.userMessage}>
                                                <div className={styles.messageContent}>
                                                    {log.input_data}
                                                </div>
                                                <div className={styles.messageTime}>
                                                    {formatDate(log.updated_at)}
                                                </div>
                                            </div>
                                            <div className={styles.botMessage}>
                                                <div className={styles.messageContent}>
                                                    {log.output_data}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className={styles.chatInputArea}>
                                <div className={styles.inputContainer}>
                                    <input 
                                        type="text" 
                                        placeholder="새로운 실행을 위한 입력... (곧 사용 가능)"
                                        disabled
                                        className={styles.chatInput}
                                    />
                                    <button disabled className={styles.sendButton}>
                                        <FiSend />
                                    </button>
                                </div>
                                <p className={styles.inputNote}>
                                    실행 기능은 다음 업데이트에서 추가될 예정입니다.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Executor;
