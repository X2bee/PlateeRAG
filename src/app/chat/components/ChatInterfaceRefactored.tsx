'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebarManager } from '@/app/_common/hooks/useSidebarManager';
import {
    FiSend,
    FiPlus,
    FiFolder,
    FiImage,
    FiMic,
    FiBookmark,
    FiX,
} from 'react-icons/fi';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { getWorkflowIOLogs, loadWorkflow } from '@/app/api/workflowAPI';
import { loadWorkflow as loadWorkflowDeploy } from '@/app/api/workflow/workflowDeployAPI';
import { MessageRenderer } from '@/app/_common/components/ChatParser';
import CollectionModal from '@/app/chat/components/CollectionModal';
import { IOLog, ChatInterfaceProps } from './types';
import ChatHeader from './ChatHeader';
import { ChatArea } from './ChatArea';
import { DeploymentModal } from './DeploymentModal';
import ChatToolsDisplay from './ChatToolsDisplay';
import { generateInteractionId } from '@/app/api/interactionAPI';
import { devLog } from '@/app/_common/utils/logger';
import { WorkflowData } from '@/app/canvas/types';
import { SourceInfo } from '../types/source';
import dynamic from 'next/dynamic';
import ResizablePanel from './ResizablePanel';
import { useWorkflowExecution } from '../hooks/useWorkflowExecution';
import { useCollectionManagement } from '../hooks/useCollectionManagement';
import { useScrollManagement } from '../hooks/useScrollManagement';
import { useInputHandling } from '../hooks/useInputHandling';

// Dynamic import to prevent SSR issues with PDF components
const SidePanelPDFViewer = dynamic(() => import('./PDFViewer/SidePanelPDFViewer'), {
    ssr: false,
    loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>PDF 뷰어를 로드하는 중...</div>
});

interface NewChatInterfaceProps extends ChatInterfaceProps {
    onStartNewChat?: (message: string) => void;
    initialMessageToExecute?: string | null;
    user_id?: number | string;
}

const ChatInterface: React.FC<NewChatInterfaceProps> = ({
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
    const attachmentButtonRef = useRef<HTMLDivElement>(null);

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

    const inputHandling = useInputHandling({
        executing: workflowExecution.executing,
        mode,
        onSendMessage: () => {
            if (mode === 'new-default' || mode === 'new-workflow') {
                handleStartNewChatFlow();
            } else if (mode === 'deploy') {
                workflowExecution.executeWorkflowDeploy(undefined, inputHandling.inputMessage);
            } else {
                workflowExecution.executeWorkflow(undefined, inputHandling.inputMessage);
            }
            inputHandling.setInputMessage('');
        }
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
            inputHandling.setInputMessage(initialMessageToExecute);

            const newSearchParams = new URLSearchParams(window.location.search);
            newSearchParams.delete('initial_message');
            newSearchParams.delete('initial_message_id');
            router.replace(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false });
        }
    }, [initialMessageToExecute, workflowExecution.executeWorkflow, router, inputHandling]);

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

    const handleStartNewChatFlow = useCallback(() => {
        if (!inputHandling.inputMessage.trim() || !onStartNewChat) return;
        const messageToSend = inputHandling.inputMessage;
        inputHandling.setInputMessage('');
        onStartNewChat(messageToSend);
    }, [inputHandling.inputMessage, inputHandling.setInputMessage, onStartNewChat]);

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

    // 첨부 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attachmentButtonRef.current && !attachmentButtonRef.current.contains(event.target as Node)) {
                setShowAttachmentMenu(false);
            }
        };

        if (showAttachmentMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAttachmentMenu]);

    return (
        <div className={styles.container}>
            <ChatHeader
                mode={mode}
                workflow={workflow}
                ioLogs={ioLogs}
                onBack={onBack}
                hideBackButton={hideBackButton}
                onDeploy={() => setShowDeploymentModal(true)}
            />

            {/* Chat Tools Display */}
            <ChatToolsDisplay
                workflowContentDetail={workflowContentDetail}
                additionalParams={additionalParams}
                onAdditionalParamsChange={setAdditionalParams}
            />

            {/* Chat Area with Resizable Panel */}
            <div className={styles.chatContainer}>
                {showPDFViewer && currentSourceInfo ? (
                    <ResizablePanel
                        defaultSplit={panelSplit}
                        minSize={30}
                        maxSize={80}
                        direction="horizontal"
                        onResize={(size) => {
                            scrollManagement.setIsResizing(true);
                            setPanelSplit(size);
                            localStorage.setItem('chatPanelSplit', size.toString());

                            setTimeout(() => {
                                scrollManagement.setIsResizing(false);
                            }, 100);
                        }}
                    >
                        <div className={styles.chatContent}>
                            {/* Chat Area */}
                            <ChatArea
                                mode={mode}
                                loading={loading}
                                ioLogs={ioLogs}
                                workflow={workflow}
                                executing={workflowExecution.executing}
                                setInputMessage={inputHandling.setInputMessage}
                                messagesRef={messagesRef}
                                pendingLogId={workflowExecution.pendingLogId}
                                renderMessageContent={renderMessageContent}
                                formatDate={formatDate}
                            />

                            <>
                                {/* Collections Display Area */}
                                {collectionManagement.selectedCollection.length > 0 && (
                                    <div className={styles.collectionsDisplayArea}>
                                        <div className={styles.collectionsLabel}>
                                            <FiBookmark className={styles.labelIcon} />
                                            <span>선택된 컬렉션</span>
                                        </div>
                                        <div className={styles.selectedCollections}>
                                            {collectionManagement.selectedCollection.map((collection, index) => (
                                                <div key={index} className={styles.selectedCollection}>
                                                    <FiBookmark className={styles.collectionIcon} />
                                                    <span className={styles.collectionName}>
                                                        {collectionManagement.collectionMapping[collection] || collection}
                                                    </span>
                                                    <button
                                                        className={styles.removeCollectionButton}
                                                        onClick={() => collectionManagement.removeCollection(index)}
                                                        title="컬렉션 해제"
                                                    >
                                                        <FiX />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Input Area */}
                                <div className={styles.inputArea} style={{ pointerEvents: loading ? 'none' : 'auto' }}>
                                    <div className={styles.inputContainer}>
                                        <textarea
                                            ref={inputHandling.textareaRef}
                                            placeholder="메시지를 입력하세요..."
                                            value={inputHandling.inputMessage}
                                            onChange={inputHandling.handleInputChange}
                                            onKeyDown={inputHandling.handleKeyPress}
                                            onCompositionStart={inputHandling.handleCompositionStart}
                                            onCompositionEnd={inputHandling.handleCompositionEnd}
                                            disabled={workflowExecution.executing}
                                            className={styles.messageInput}
                                            rows={1}
                                        />
                                        <div className={styles.buttonGroup}>
                                            <div className={styles.attachmentWrapper} ref={attachmentButtonRef}>
                                                <button
                                                    onClick={handleAttachmentClick}
                                                    className={`${styles.attachmentButton} ${showAttachmentMenu ? styles.active : ''}`}
                                                    disabled={workflowExecution.executing}
                                                >
                                                    <FiPlus />
                                                </button>
                                                {showAttachmentMenu && (
                                                    <div className={styles.attachmentMenu}>
                                                        <button
                                                            className={styles.attachmentOption}
                                                            onClick={() => handleAttachmentOption('collection')}
                                                        >
                                                            <FiBookmark />
                                                            <span>컬렉션</span>
                                                        </button>
                                                        <button
                                                            className={`${styles.attachmentOption} ${styles.disabled}`}
                                                            disabled
                                                        >
                                                            <FiFolder />
                                                            <span>파일</span>
                                                        </button>
                                                        <button
                                                            className={`${styles.attachmentOption} ${styles.disabled}`}
                                                            disabled
                                                        >
                                                            <FiImage />
                                                            <span>사진</span>
                                                        </button>
                                                        <button
                                                            className={`${styles.attachmentOption} ${styles.disabled}`}
                                                            disabled
                                                        >
                                                            <FiMic />
                                                            <span>음성</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (mode === 'new-default' || mode === 'new-workflow') {
                                                        handleStartNewChatFlow();
                                                    } else if (mode === 'deploy') {
                                                        workflowExecution.executeWorkflowDeploy(undefined, inputHandling.inputMessage);
                                                    } else {
                                                        workflowExecution.executeWorkflow(undefined, inputHandling.inputMessage);
                                                    }
                                                    inputHandling.setInputMessage('');
                                                }}
                                                disabled={workflowExecution.executing || !inputHandling.inputMessage.trim()}
                                                className={`${styles.sendButton} ${workflowExecution.executing || !inputHandling.inputMessage.trim() ? styles.disabled : ''}`}
                                            >
                                                {workflowExecution.executing ? <div className={styles.miniSpinner}></div> : <FiSend />}
                                            </button>
                                        </div>
                                    </div>
                                    {workflowExecution.executing && (
                                        mode === "new-default" ? (
                                            <p className={styles.executingNote}>
                                                일반 채팅을 실행 중입니다...
                                            </p>
                                        ) : (
                                            <p className={styles.executingNote}>
                                                워크플로우를 실행 중입니다...
                                            </p>
                                        )
                                    )}
                                    {workflowExecution.error && (
                                        <p className={styles.errorNote}>{workflowExecution.error}</p>
                                    )}
                                </div>
                            </>
                        </div>

                        {/* Side Panel for PDF Viewer */}
                        <div className={styles.sidePanel}>
                            <SidePanelPDFViewer
                                sourceInfo={currentSourceInfo}
                                mode={mode}
                                userId={user_id}
                                onClose={() => {
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
                                }}
                            />
                        </div>
                    </ResizablePanel>
                ) : (
                    <div className={styles.chatContent}>
                        <ChatArea
                            mode={mode}
                            loading={loading}
                            ioLogs={ioLogs}
                            workflow={workflow}
                            executing={workflowExecution.executing}
                            setInputMessage={inputHandling.setInputMessage}
                            messagesRef={messagesRef}
                            pendingLogId={workflowExecution.pendingLogId}
                            renderMessageContent={renderMessageContent}
                            formatDate={formatDate}
                        />

                        <>
                            {/* Collections Display Area */}
                            {collectionManagement.selectedCollection.length > 0 && (
                                <div className={styles.collectionsDisplayArea}>
                                    <div className={styles.collectionsLabel}>
                                        <FiBookmark className={styles.labelIcon} />
                                        <span>선택된 컬렉션</span>
                                    </div>
                                    <div className={styles.selectedCollections}>
                                        {collectionManagement.selectedCollection.map((collection, index) => (
                                            <div key={index} className={styles.selectedCollection}>
                                                <FiBookmark className={styles.collectionIcon} />
                                                <span className={styles.collectionName}>
                                                    {collectionManagement.collectionMapping[collection] || collection}
                                                </span>
                                                <button
                                                    className={styles.removeCollectionButton}
                                                    onClick={() => collectionManagement.removeCollection(index)}
                                                    title="컬렉션 해제"
                                                >
                                                    <FiX />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Input Area */}
                            <div className={styles.inputArea} style={{ pointerEvents: loading ? 'none' : 'auto' }}>
                                <div className={styles.inputContainer}>
                                    <textarea
                                        ref={inputHandling.textareaRef}
                                        placeholder="메시지를 입력하세요..."
                                        value={inputHandling.inputMessage}
                                        onChange={inputHandling.handleInputChange}
                                        onKeyDown={inputHandling.handleKeyPress}
                                        onCompositionStart={inputHandling.handleCompositionStart}
                                        onCompositionEnd={inputHandling.handleCompositionEnd}
                                        disabled={workflowExecution.executing}
                                        className={styles.messageInput}
                                        rows={1}
                                    />
                                    <div className={styles.buttonGroup}>
                                        <div className={styles.attachmentWrapper} ref={attachmentButtonRef}>
                                            <button
                                                onClick={handleAttachmentClick}
                                                className={`${styles.attachmentButton} ${showAttachmentMenu ? styles.active : ''}`}
                                                disabled={workflowExecution.executing}
                                            >
                                                <FiPlus />
                                            </button>
                                            {showAttachmentMenu && (
                                                <div className={styles.attachmentMenu}>
                                                    <button
                                                        className={styles.attachmentOption}
                                                        onClick={() => handleAttachmentOption('collection')}
                                                    >
                                                        <FiBookmark />
                                                        <span>컬렉션</span>
                                                    </button>
                                                    <button
                                                        className={`${styles.attachmentOption} ${styles.disabled}`}
                                                        disabled
                                                    >
                                                        <FiFolder />
                                                        <span>파일</span>
                                                    </button>
                                                    <button
                                                        className={`${styles.attachmentOption} ${styles.disabled}`}
                                                        disabled
                                                    >
                                                        <FiImage />
                                                        <span>사진</span>
                                                    </button>
                                                    <button
                                                        className={`${styles.attachmentOption} ${styles.disabled}`}
                                                        disabled
                                                    >
                                                        <FiMic />
                                                        <span>음성</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (mode === 'new-default' || mode === 'new-workflow') {
                                                    handleStartNewChatFlow();
                                                } else if (mode === 'deploy') {
                                                    workflowExecution.executeWorkflowDeploy(undefined, inputHandling.inputMessage);
                                                } else {
                                                    workflowExecution.executeWorkflow(undefined, inputHandling.inputMessage);
                                                }
                                                inputHandling.setInputMessage('');
                                            }}
                                            disabled={workflowExecution.executing || !inputHandling.inputMessage.trim()}
                                            className={`${styles.sendButton} ${workflowExecution.executing || !inputHandling.inputMessage.trim() ? styles.disabled : ''}`}
                                        >
                                            {workflowExecution.executing ? <div className={styles.miniSpinner}></div> : <FiSend />}
                                        </button>
                                    </div>
                                </div>
                                {workflowExecution.executing && (
                                    mode === "new-default" ? (
                                        <p className={styles.executingNote}>
                                            일반 채팅을 실행 중입니다...
                                        </p>
                                    ) : (
                                        <p className={styles.executingNote}>
                                            워크플로우를 실행 중입니다...
                                        </p>
                                    )
                                )}
                                {workflowExecution.error && (
                                    <p className={styles.errorNote}>{workflowExecution.error}</p>
                                )}
                            </div>
                        </>
                    </div>
                )}
            </div>

            <DeploymentModal
                isOpen={showDeploymentModal}
                onClose={() => setShowDeploymentModal(false)}
                workflow={workflow}
                workflowDetail={workflowContentDetail}
            />

            {/* Collection Modal */}
            <CollectionModal
                isOpen={showCollectionModal}
                onClose={() => setShowCollectionModal(false)}
                onSelectCollections={collectionManagement.handleCollectionsSelect}
                selectedCollections={collectionManagement.selectedCollection}
            />
        </div>
    );
};

export default ChatInterface;