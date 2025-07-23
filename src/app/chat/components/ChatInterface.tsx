'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FiSend,
    FiArrowLeft,
    FiMessageSquare,
    FiClock,
    FiPlus,
    FiFolder,
    FiImage,
    FiMic,
    FiBookmark,
    FiX,
} from 'react-icons/fi';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { getWorkflowIOLogs, executeWorkflowById } from '@/app/api/workflowAPI';
import { MessageRenderer } from '@/app/_common/components/ChatParser';
import toast from 'react-hot-toast';
import CollectionModal from '@/app/chat/components/CollectionModal';
import { IOLog, ChatInterfaceProps } from './types';
import ChatHeader from './ChatHeader';
import { ChatArea } from './ChatArea';
import { DeploymentModal } from './DeploymentModal';
import { generateInteractionId, normalizeWorkflowName } from '@/app/api/interactionAPI';


const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode, workflow, onBack, onChatStarted, hideBackButton = false, existingChatData }) => {
    const [ioLogs, setIOLogs] = useState<IOLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [showDeploymentModal, setShowDeploymentModal] = useState(false);


    const messagesRef = useRef<HTMLDivElement>(null);
    const attachmentButtonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadChatLogs = async () => {
            try {
                setLoading(true);
                setError(null);

                const interactionId = existingChatData?.interactionId || 'default';
                const workflowName = existingChatData?.workflowName || workflow.name;
                const workflowId = existingChatData?.workflowId || workflow.id;

                const logs = await getWorkflowIOLogs(workflowName, workflowId, interactionId);
                setIOLogs((logs as any).in_out_logs || []);
                setPendingLogId(null);
            } catch (err) {
                setError('채팅 기록을 불러오는데 실패했습니다.');
                setIOLogs([]);
            } finally {
                setLoading(false);
            }
        };
        if (mode === 'existing' && workflow?.id && existingChatData?.interactionId) {
            loadChatLogs();
        }
    }, [mode, existingChatData?.interactionId, workflow.id, workflow.name, existingChatData?.workflowName, existingChatData?.workflowId]);

    useEffect(() => {
        scrollToBottom();
    }, [ioLogs]);

    // localStorage에서 선택된 컬렉션 정보 가져오기
    useEffect(() => {
        const checkSelectedCollection = () => {
            try {
                const storedCollection = localStorage.getItem('selectedCollection');
                if (storedCollection) {
                    const collectionData = JSON.parse(storedCollection);
                    setSelectedCollection(collectionData.name);
                } else {
                    setSelectedCollection(null);
                }
            } catch (err) {
                console.error('Failed to load selected collection:', err);
                setSelectedCollection(null);
            }
        };

        checkSelectedCollection();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'selectedCollection') {
                checkSelectedCollection();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        if (!showCollectionModal) {
            const checkSelectedCollection = () => {
                try {
                    const storedCollection = localStorage.getItem('selectedCollection');
                    if (storedCollection) {
                        const collectionData = JSON.parse(storedCollection);
                        setSelectedCollection(collectionData.name);
                    } else {
                        setSelectedCollection(null);
                    }
                } catch (err) {
                    console.error('Failed to load selected collection:', err);
                    setSelectedCollection(null);
                }
            };
            checkSelectedCollection();
        }
    }, [showCollectionModal]);

    const scrollToBottom = () => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    /**
     * 메시지 콘텐츠를 렌더링하는 헬퍼 함수
     */
    const renderMessageContent = (content: string, isUserMessage: boolean = false) => {
        if (!content) return null;

        return (
            <MessageRenderer
                content={content}
                isUserMessage={isUserMessage}
            />
        );
    };

    const executeWorkflow = async () => {
        if (!inputMessage.trim()) {
            return;
        }

        setError(null);
        setExecuting(true);
        const tempId = `pending-${Date.now()}`;
        setPendingLogId(tempId);

        // 임시 메시지 추가
        setIOLogs((prev) => [
            ...prev,
            {
                log_id: tempId,
                workflow_name: workflow.name,
                workflow_id: workflow.id,
                input_data: inputMessage,
                output_data: '',
                updated_at: new Date().toISOString(),
            },
        ]);

        const currentMessage = inputMessage;
        setInputMessage('');

        try {
            const interactionId = existingChatData?.interactionId || generateInteractionId();
            const workflowName = existingChatData?.workflowName || workflow.name;
            const workflowId = existingChatData?.workflowId || workflow.id;

            const result: any = await executeWorkflowById(
                workflowName,
                workflowId,
                currentMessage,
                interactionId,
                selectedCollection as any,
            );

            // 결과로 임시 메시지 업데이트 (chatAPI 응답 형식)
            setIOLogs((prev) =>
                prev.map((log) =>
                    String(log.log_id) === tempId
                        ? {
                                ...log,
                                output_data: result.outputs
                                    ? JSON.stringify(result.outputs)
                                    : result.message || '처리 완료',
                                updated_at: new Date().toISOString(),
                            }
                        : log,
                ),
            );

            toast.success('메시지가 성공적으로 전송되었습니다!');
            setPendingLogId(null);

            // 기존 채팅 데이터가 있는 경우 localStorage 업데이트
            if (existingChatData) {
                const currentChatData = {
                    interactionId: existingChatData.interactionId,
                    workflowId: existingChatData.workflowId,
                    workflowName: existingChatData.workflowName,
                    startedAt: new Date().toISOString(),
                };
                localStorage.setItem('currentChatData', JSON.stringify(currentChatData));
            } else {
                const currentChatData = {
                    interactionId: interactionId,
                    workflowId: workflow.id,
                    workflowName: normalizeWorkflowName(workflow.name),
                    startedAt: new Date().toISOString(),
                };
                localStorage.setItem('currentChatData', JSON.stringify(currentChatData));
            }
            if (onChatStarted) {
                onChatStarted();
            }
        } catch (err) {
            // 에러로 임시 메시지 업데이트
            setIOLogs((prev) =>
                prev.map((log) =>
                    String(log.log_id) === tempId
                        ? {
                              ...log,
                              output_data: err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.',
                              updated_at: new Date().toISOString(),
                          }
                        : log,
                ),
            );
            setPendingLogId(null);
            toast.error('메시지 처리 중 오류가 발생했습니다.');
        } finally {
            setExecuting(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !executing) {
            e.preventDefault();
            executeWorkflow();
        }
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
        // TODO: 다른 옵션들에 대한 구현
    };

    const handleRemoveCollection = () => {
        localStorage.removeItem('selectedCollection');
        setSelectedCollection(null);
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
            ></ChatHeader>

            {/* Chat Area */}
            <div className={styles.chatContainer}>
                {/* Chat Area */}
                <ChatArea
                    mode={mode}
                    loading={loading}
                    ioLogs={ioLogs}
                    workflow={workflow}
                    executing={executing}
                    setInputMessage={setInputMessage}
                    messagesRef={messagesRef}
                    pendingLogId={pendingLogId}
                    renderMessageContent={renderMessageContent}
                    formatDate={formatDate}
                ></ChatArea>

                <>
                    {/* Input Area */}
                    <div className={styles.inputArea} style={{ pointerEvents: loading ? 'none' : 'auto' }}>
                        <div className={styles.inputContainer}>
                            <input
                                type="text"
                                placeholder="메시지를 입력하세요..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={executing}
                                className={styles.messageInput}
                            />
                            <div className={styles.buttonGroup}>
                                {selectedCollection && (
                                    <div className={styles.selectedCollection}>
                                        <FiBookmark className={styles.collectionIcon} />
                                        <span className={styles.collectionName}>{selectedCollection}</span>
                                        <button
                                            className={styles.removeCollectionButton}
                                            onClick={handleRemoveCollection}
                                            title="컬렉션 해제"
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                )}
                                <div className={styles.attachmentWrapper} ref={attachmentButtonRef}>
                                    <button
                                        onClick={handleAttachmentClick}
                                        className={`${styles.attachmentButton} ${showAttachmentMenu ? styles.active : ''}`}
                                        disabled={executing}
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
                                    onClick={executeWorkflow}
                                    disabled={executing || !inputMessage.trim()}
                                    className={`${styles.sendButton} ${executing || !inputMessage.trim() ? styles.disabled : ''}`}
                                >
                                    {executing ? (
                                        <div className={styles.miniSpinner}></div>
                                    ) : (
                                        <FiSend />
                                    )}
                                </button>
                            </div>
                        </div>
                        {executing && (
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
                        {error && (
                            <p className={styles.errorNote}>{error}</p>
                        )}
                    </div>
                </>
            </div>
            <DeploymentModal
                isOpen={showDeploymentModal}
                onClose={() => setShowDeploymentModal(false)}
                workflow={workflow}
            />

            {/* Collection Modal */}
            <CollectionModal
                isOpen={showCollectionModal}
                onClose={() => setShowCollectionModal(false)}
            />
        </div>
    );
};

export default ChatInterface;
