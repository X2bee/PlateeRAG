'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebarManager } from '@/app/_common/hooks/useSidebarManager';
import { getWorkflowIOLogs, loadWorkflow } from '@/app/api/workflowAPI';
import { loadWorkflow as loadWorkflowDeploy } from '@/app/api/workflow/workflowDeployAPI';
import { MessageRenderer } from '@/app/_common/components/ChatParser';
import CollectionModal from '@/app/chat/components/CollectionModal';
import { IOLog, ChatInterfaceProps } from './types';
import ChatHeader from './ChatHeader';
import { DeploymentModal } from './DeploymentModal';
import ChatToolsDisplay from './ChatToolsDisplay';
import { generateInteractionId } from '@/app/api/interactionAPI';
import { devLog } from '@/app/_common/utils/logger';
import { WorkflowData } from '@/app/canvas/types';
import { SourceInfo } from '../types/source';
import { ChatContainer, ChatContainerRef } from './ChatContainer';
import { useWorkflowExecution } from '../hooks/useWorkflowExecution';
import { useCollectionManagement } from '../hooks/useCollectionManagement';
import { useScrollManagement } from '../hooks/useScrollManagement';

interface NewChatInterfaceProps extends ChatInterfaceProps {
    onStartNewChat?: (message: string) => void;
    initialMessageToExecute?: string | null;
    user_id?: number | string;
}

const ChatInterfaceRefactored2: React.FC<NewChatInterfaceProps> = ({
    mode,
    workflow,
    onBack,
    hideBackButton = false,
    existingChatData,
    onStartNewChat,
    initialMessageToExecute,
    user_id,
}) => {
    const router = useRouter();
    const chatContainerRef = useRef<ChatContainerRef>(null);

    const [ioLogs, setIOLogs] = useState<IOLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [showDeploymentModal, setShowDeploymentModal] = useState(false);
    const [workflowContentDetail, setWorkflowContentDetail] = useState<WorkflowData | null>(null);
    const [additionalParams, setAdditionalParams] = useState<Record<string, Record<string, any>>>({});
    const [showPDFViewer, setShowPDFViewer] = useState(false);
    const [currentSourceInfo, setCurrentSourceInfo] = useState<SourceInfo | null>(null);
    const [panelSplit, setPanelSplit] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('chatPanelSplit');
            return saved ? parseFloat(saved) : 65;
        }
        return 65;
    });

    const hasExecutedInitialMessage = useRef(false);
    const messagesRef = useRef<HTMLDivElement>(null);

    useSidebarManager(showDeploymentModal || showCollectionModal);

    // Hook 사용
    const collectionManagement = useCollectionManagement(showCollectionModal);
    const scrollManagement = useScrollManagement({ messagesRef, executing: false });

    // 워크플로우 실행을 위한 헬퍼 함수
    const getValidAdditionalParams = useCallback(() => {
        const validParams: Record<string, Record<string, any>> = {};

        Object.keys(additionalParams).forEach(toolId => {
            const toolParams = additionalParams[toolId];
            if (toolParams && typeof toolParams === 'object') {
                const validToolParams: Record<string, any> = {};

                Object.keys(toolParams).forEach(paramKey => {
                    const paramValue = toolParams[paramKey];
                    if (paramValue !== null && paramValue !== '' && paramValue !== undefined) {
                        validToolParams[paramKey] = paramValue;
                    }
                });

                if (Object.keys(validToolParams).length > 0) {
                    validParams[toolId] = validToolParams;
                }
            }
        });

        return Object.keys(validParams).length > 0 ? validParams : null;
    }, [additionalParams]);

    const workflowExecution = useWorkflowExecution({
        workflow,
        existingChatData,
        workflowContentDetail,
        selectedCollection: collectionManagement.selectedCollection,
        getValidAdditionalParams,
        user_id,
        setIOLogs,
        scrollToBottom: scrollManagement.scrollToBottom
    });

    const handleViewSource = (sourceInfo: SourceInfo, messageContent?: string) => {
        const enrichedSourceInfo = scrollManagement.handleViewSource(sourceInfo, messageContent);

        setCurrentSourceInfo(enrichedSourceInfo);
        setShowPDFViewer(true);
        setPanelSplit(65);
        localStorage.setItem('chatPanelSplit', '65');

        setTimeout(() => {
            if (!scrollManagement.isUserScrolling) {
                scrollManagement.restoreScrollPosition();
            }
        }, 150);
    };

    const handleSendMessage = useCallback(() => {
        if (mode === 'new-default' || mode === 'new-workflow') {
            if (onStartNewChat) {
                // ChatInput 내부의 inputMessage를 사용하도록 수정 필요
                // 이 부분은 ChatInput 컴포넌트에서 메시지를 전달받아야 함
                console.log('Starting new chat flow');
            }
        } else if (mode === 'deploy') {
            workflowExecution.executeWorkflowDeploy();
        } else {
            workflowExecution.executeWorkflow();
        }
    }, [mode, onStartNewChat, workflowExecution]);

    const handlePDFViewerClose = useCallback(() => {
        if (!scrollManagement.isUserScrolling) {
            scrollManagement.saveScrollPosition();
        }

        setShowPDFViewer(false);
        setCurrentSourceInfo(null);
        setPanelSplit(100);
        localStorage.setItem('chatPanelSplit', '100');

        setTimeout(() => {
            if (!scrollManagement.isUserScrolling) {
                scrollManagement.restoreScrollPosition();
            }
        }, 150);
    }, [scrollManagement]);

    const handlePanelResize = useCallback((size: number) => {
        scrollManagement.setIsResizing(true);
        setPanelSplit(size);
        localStorage.setItem('chatPanelSplit', size.toString());

        setTimeout(() => {
            scrollManagement.setIsResizing(false);
        }, 100);
    }, [scrollManagement]);

    // showPDFViewer가 false일 때 패널 크기를 100%로 설정
    useEffect(() => {
        if (!showPDFViewer) {
            setPanelSplit(100);
            localStorage.setItem('chatPanelSplit', '100');
        }
    }, [showPDFViewer]);

    // workflow 데이터 로드
    useEffect(() => {
        if (workflow && workflow.id && workflow.id !== "default_mode") {
            const loadWorkflowContent = async () => {
                if (user_id) {
                    try {
                        const workflowData = await loadWorkflowDeploy(workflow.name, user_id);
                        setWorkflowContentDetail(workflowData);
                        localStorage.setItem('workflowContentDetail', JSON.stringify(workflowData));
                        devLog.log('Successfully loaded workflow content detail:', workflowData);
                    } catch (error) {
                        devLog.error('Failed to load workflow content detail:', error);
                    }
                } else {
                    try {
                        const workflowData = await loadWorkflow(workflow.name);
                        setWorkflowContentDetail(workflowData);
                        localStorage.setItem('workflowContentDetail', JSON.stringify(workflowData));
                        devLog.log('Successfully loaded workflow content detail:', workflowData);
                    } catch (error) {
                        devLog.error('Failed to load workflow content detail:', error);
                    }
                }
            };

            setLoading(true);
            loadWorkflowContent();
            setLoading(false);
        }
    }, [workflow, user_id]);

    useEffect(() => {
        if (mode === 'existing' && existingChatData?.interactionId && !initialMessageToExecute) {
            setLoading(true);
            getWorkflowIOLogs(existingChatData.workflowName, existingChatData.workflowId, existingChatData.interactionId)
                .then(logs => {
                    setIOLogs((logs as any).in_out_logs || []);
                })
                .catch(err => {
                    setIOLogs([]);
                })
                .finally(() => {
                    setLoading(false);
                    workflowExecution.executeWorkflow();
                });
        }
    }, [mode, existingChatData, workflowExecution]);

    useEffect(() => {
        if (initialMessageToExecute && !hasExecutedInitialMessage.current) {
            hasExecutedInitialMessage.current = true;
            // TODO: ChatInput 컴포넌트로 초기 메시지 전달
            
            const newSearchParams = new URLSearchParams(window.location.search);
            newSearchParams.delete('initial_message');
            newSearchParams.delete('initial_message_id');
            router.replace(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false });
        }
    }, [initialMessageToExecute, workflowExecution.executeWorkflow, router]);

    useEffect(() => {
        scrollManagement.scrollToBottom();
    }, [ioLogs, scrollManagement.scrollToBottom]);

    // ioLogs 변경 시 강제 스크롤 (스트리밍 중에도 작동)
    useEffect(() => {
        const timer = setTimeout(() => {
            scrollManagement.scrollToBottom();
        }, 100);
        return () => clearTimeout(timer);
    }, [ioLogs, workflowExecution.executing, scrollManagement.scrollToBottom]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderMessageContent = (content: string, isUserMessage: boolean = false) => {
        if (!content) return null;

        const handleViewSourceWithContext = (sourceInfo: SourceInfo) => {
            handleViewSource(sourceInfo, content);
        };

        return (
            <MessageRenderer
                content={content}
                isUserMessage={isUserMessage}
                onViewSource={handleViewSourceWithContext}
            />
        );
    };

    const handleAttachmentClick = () => {
        setShowAttachmentMenu(!showAttachmentMenu);
    };

    const handleAttachmentOption = (option: string) => {
        console.log('Selected option:', option);
        setShowAttachmentMenu(false);

        if (option === 'collection') {
            setShowCollectionModal(true);
        }
    };

    // 첨부 메뉴 외부 클릭 시 닫기 (이 로직은 ChatInput 내부로 이동해야 함)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // TODO: ChatInput 컴포넌트로 이동
        };

        if (showAttachmentMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAttachmentMenu]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <ChatHeader
                mode={mode}
                workflow={workflow}
                ioLogs={ioLogs}
                onBack={onBack}
                hideBackButton={hideBackButton}
                onDeploy={() => setShowDeploymentModal(true)}
            />

            <ChatToolsDisplay
                workflowContentDetail={workflowContentDetail}
                additionalParams={additionalParams}
                onAdditionalParamsChange={setAdditionalParams}
            />

            <ChatContainer
                ref={chatContainerRef}
                showPDFViewer={showPDFViewer}
                panelSplit={panelSplit}
                setPanelSplit={setPanelSplit}
                onPanelResize={handlePanelResize}
                mode={mode}
                loading={loading}
                ioLogs={ioLogs}
                workflow={workflow}
                executing={workflowExecution.executing}
                setInputMessage={() => {/* 더 이상 사용하지 않음 */}}
                messagesRef={messagesRef}
                pendingLogId={workflowExecution.pendingLogId}
                renderMessageContent={renderMessageContent}
                formatDate={formatDate}
                selectedCollections={collectionManagement.selectedCollection}
                collectionMapping={collectionManagement.collectionMapping}
                onRemoveCollection={collectionManagement.removeCollection}
                showAttachmentMenu={showAttachmentMenu}
                onAttachmentClick={handleAttachmentClick}
                onAttachmentOption={handleAttachmentOption}
                onSendMessage={handleSendMessage}
                initialMessage={initialMessageToExecute || undefined}
                currentSourceInfo={currentSourceInfo}
                user_id={user_id}
                onPDFViewerClose={handlePDFViewerClose}
                error={workflowExecution.error}
            />

            <DeploymentModal
                isOpen={showDeploymentModal}
                onClose={() => setShowDeploymentModal(false)}
                workflow={workflow}
                workflowDetail={workflowContentDetail}
            />

            <CollectionModal
                isOpen={showCollectionModal}
                onClose={() => setShowCollectionModal(false)}
                onSelectCollections={collectionManagement.handleCollectionsSelect}
                selectedCollections={collectionManagement.selectedCollection}
            />
        </div>
    );
};

export default ChatInterfaceRefactored2;