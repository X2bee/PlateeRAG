'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiChevronDown, FiMessageSquare, FiX, FiCheck } from 'react-icons/fi';
import { LuWorkflow } from 'react-icons/lu';
import { listWorkflows } from '@/app/api/workflow/workflowAPI';
import { showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import { devLog } from '@/app/_common/utils/logger';
import styles from '../assets/SessionWorkflowSelector.module.scss';

interface Workflow {
    id: string;
    name: string;
    description?: string;
    author: string;
    nodeCount: number;
    status: 'active' | 'draft' | 'archived';
}

interface SessionWorkflowSelectorProps {
    currentWorkflow: Workflow | null;
    onWorkflowChange: (workflow: Workflow | null) => void;
    sessionId: string;
}

const DEFAULT_WORKFLOW: Workflow = {
    id: "default_mode",
    name: "일반 채팅",
    description: "기본 대화 모드",
    author: "system",
    nodeCount: 0,
    status: 'active',
};

const SessionWorkflowSelector: React.FC<SessionWorkflowSelectorProps> = ({
    currentWorkflow,
    onWorkflowChange,
    sessionId
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // 워크플로우 목록 로드
    const loadWorkflows = useCallback(async () => {
        setLoading(true);
        try {
            const workflowList = await listWorkflows();
            const formattedWorkflows: Workflow[] = workflowList.map((wf: any) => ({
                id: wf.id,
                name: wf.name,
                description: wf.description || '',
                author: wf.author || 'Unknown',
                nodeCount: wf.nodeCount || 0,
                status: wf.status || 'active'
            }));
            
            // 기본 워크플로우를 맨 앞에 추가
            setWorkflows([DEFAULT_WORKFLOW, ...formattedWorkflows]);
        } catch (error) {
            devLog.error('Failed to load workflows:', error);
            showErrorToastKo('워크플로우 목록을 불러오는데 실패했습니다.');
            // 오류 시에도 기본 워크플로우는 표시
            setWorkflows([DEFAULT_WORKFLOW]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen && workflows.length === 0) {
            loadWorkflows();
        }
    }, [isOpen, workflows.length, loadWorkflows]);

    // 검색 필터링
    const filteredWorkflows = workflows.filter(workflow =>
        workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.author?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 워크플로우 선택
    const handleSelectWorkflow = useCallback((workflow: Workflow) => {
        onWorkflowChange(workflow);
        setIsOpen(false);
        setSearchTerm('');
    }, [onWorkflowChange]);

    // 드롭다운 열기/닫기
    const toggleDropdown = useCallback(() => {
        setIsOpen(!isOpen);
    }, [isOpen]);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest(`.${styles.selector}`)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const displayWorkflow = currentWorkflow || DEFAULT_WORKFLOW;

    return (
        <div className={styles.selector}>
            <button 
                className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
                onClick={toggleDropdown}
                type="button"
            >
                <div className={styles.triggerContent}>
                    <div className={styles.workflowIcon}>
                        {displayWorkflow.id === 'default_mode' ? (
                            <FiMessageSquare />
                        ) : (
                            <LuWorkflow />
                        )}
                    </div>
                    <div className={styles.workflowInfo}>
                        <span className={styles.workflowName}>{displayWorkflow.name}</span>
                        <span className={styles.workflowDescription}>
                            {displayWorkflow.description || `by ${displayWorkflow.author}`}
                        </span>
                    </div>
                </div>
                <FiChevronDown className={styles.chevron} />
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <div className={styles.searchBox}>
                            <input
                                type="text"
                                placeholder="워크플로우 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className={styles.clearSearch}
                                >
                                    <FiX />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.workflowList}>
                        {loading ? (
                            <div className={styles.loading}>
                                <div className={styles.spinner}></div>
                                워크플로우 로딩 중...
                            </div>
                        ) : filteredWorkflows.length === 0 ? (
                            <div className={styles.noResults}>
                                검색 결과가 없습니다.
                            </div>
                        ) : (
                            filteredWorkflows.map((workflow) => {
                                const isSelected = workflow.id === displayWorkflow.id;
                                return (
                                    <button
                                        key={workflow.id}
                                        className={`${styles.workflowOption} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => handleSelectWorkflow(workflow)}
                                        type="button"
                                    >
                                        <div className={styles.optionIcon}>
                                            {workflow.id === 'default_mode' ? (
                                                <FiMessageSquare />
                                            ) : (
                                                <LuWorkflow />
                                            )}
                                        </div>
                                        <div className={styles.optionInfo}>
                                            <div className={styles.optionName}>{workflow.name}</div>
                                            <div className={styles.optionDescription}>
                                                {workflow.description || `by ${workflow.author}`}
                                            </div>
                                            <div className={styles.optionMeta}>
                                                {workflow.nodeCount > 0 && (
                                                    <span>{workflow.nodeCount}개 노드</span>
                                                )}
                                                <span className={styles.status}>{workflow.status}</span>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className={styles.checkIcon}>
                                                <FiCheck />
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionWorkflowSelector;