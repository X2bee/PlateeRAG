import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import ResizablePanel from '../ResizablePanel';
import { ChatArea } from '../ChatArea';
import { CollectionDisplay } from '../CollectionDisplay';
import { ChatInput, ChatInputRef } from '../ChatInput';
import { SourceInfo } from '../../types/source';
import { IOLog } from '../types';
import styles from '../../assets/ChatInterface.module.scss';

// Dynamic import to prevent SSR issues with PDF components
const SidePanelPDFViewer = dynamic(() => import('../PDFViewer/SidePanelPDFViewer'), {
    ssr: false,
    loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>PDF 뷰어를 로드하는 중...</div>
});

interface ChatContainerProps {
    // Layout props
    showPDFViewer: boolean;
    panelSplit: number;
    setPanelSplit: (size: number) => void;
    onPanelResize: (size: number) => void;
    
    // Chat Area props
    mode: "existing" | "new-workflow" | "new-default" | "deploy";
    loading: boolean;
    ioLogs: IOLog[];
    workflow: any;
    executing: boolean;
    setInputMessage: (message: string) => void;
    messagesRef: React.RefObject<HTMLDivElement | null>;
    pendingLogId: string | null;
    renderMessageContent: (content: string, isUserMessage?: boolean) => React.ReactNode;
    formatDate: (dateString: string) => string;
    
    // Collection props
    selectedCollections: string[];
    collectionMapping: { [key: string]: string };
    onRemoveCollection: (index: number) => void;
    
    // Input props
    showAttachmentMenu: boolean;
    onAttachmentClick: () => void;
    onAttachmentOption: (option: string) => void;
    onSendMessage: (message: string) => void;
    onShiftEnter?: () => void;
    initialMessage?: string;
    
    // PDF Viewer props
    currentSourceInfo: SourceInfo | null;
    user_id?: number | string;
    onPDFViewerClose: () => void;
    
    // Error handling
    error: string | null;
}

interface ChatContainerRef {
    setInputMessage: (message: string) => void;
    getInputMessage: () => string;
    clearInputMessage: () => void;
}

const ChatContainer = forwardRef<ChatContainerRef, ChatContainerProps>((
    {
        showPDFViewer,
        panelSplit,
        setPanelSplit,
        onPanelResize,
        mode,
        loading,
        ioLogs,
        workflow,
        executing,
        setInputMessage,
        messagesRef,
        pendingLogId,
        renderMessageContent,
        formatDate,
        selectedCollections,
        collectionMapping,
        onRemoveCollection,
        showAttachmentMenu,
        onAttachmentClick,
        onAttachmentOption,
        onSendMessage,
        onShiftEnter,
        initialMessage,
        currentSourceInfo,
        user_id,
        onPDFViewerClose,
        error,
    },
    ref
) => {
    const chatInputRef = useRef<ChatInputRef>(null);

    useImperativeHandle(ref, () => ({
        setInputMessage: (message: string) => {
            chatInputRef.current?.setMessage(message);
        },
        getInputMessage: () => {
            return chatInputRef.current?.getMessage() || '';
        },
        clearInputMessage: () => {
            chatInputRef.current?.clearMessage();
        },
    }), []);
    const renderChatContent = () => (
        <div className={styles.chatContent}>
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
            />

            <CollectionDisplay
                selectedCollections={selectedCollections}
                collectionMapping={collectionMapping}
                onRemoveCollection={onRemoveCollection}
            />

            <ChatInput
                ref={chatInputRef}
                executing={executing}
                mode={mode}
                loading={loading}
                showAttachmentMenu={showAttachmentMenu}
                onAttachmentClick={onAttachmentClick}
                onAttachmentOption={onAttachmentOption}
                onSendMessage={onSendMessage}
                onShiftEnter={onShiftEnter}
                initialMessage={initialMessage}
            />

            {error && (
                <p className={styles.errorNote}>{error}</p>
            )}
        </div>
    );

    if (showPDFViewer && currentSourceInfo) {
        return (
            <div className={styles.chatContainer}>
                <ResizablePanel
                    defaultSplit={panelSplit}
                    minSize={30}
                    maxSize={80}
                    direction="horizontal"
                    onResize={onPanelResize}
                >
                    {renderChatContent()}

                    {/* Side Panel for PDF Viewer */}
                    <div className={styles.sidePanel}>
                        <SidePanelPDFViewer
                            sourceInfo={currentSourceInfo}
                            mode={mode}
                            userId={user_id}
                            onClose={onPDFViewerClose}
                        />
                    </div>
                </ResizablePanel>
            </div>
        );
    }

    return (
        <div className={styles.chatContainer}>
            {renderChatContent()}
        </div>
    );
});

ChatContainer.displayName = 'ChatContainer';

export { ChatContainer };
export type { ChatContainerProps, ChatContainerRef };