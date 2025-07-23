import { FiClock } from 'react-icons/fi';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { MessageList } from './MessageList';
import { EmptyState } from './EmptyState';
import { IOLog, Workflow } from './types';

interface ChatAreaProps {
    mode: "existing" | "new-workflow" | "new-default" | "deploy";
    loading: boolean;
    ioLogs: IOLog[];
    workflow: Workflow;
    executing: boolean;
    setInputMessage: (message: string) => void;
    messagesRef: React.RefObject<HTMLDivElement | null>;
    pendingLogId: string | null;
    renderMessageContent: (content: string, isUserMessage?: boolean) => React.ReactNode;
    formatDate: (dateString: string) => string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
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
}) => {
    // 1. 로딩 상태 처리 (existing 모드 전용)
    if (mode === 'existing' && loading) {
        return (
            <div className={styles.chatContainer}>
                <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner}></div>
                    <p>채팅 기록을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // 2. 각 모드에 맞는 컨텐츠 렌더링
    const renderContent = () => {
        if (mode === 'existing' || mode === 'deploy') {
            return ioLogs.length === 0 ? (
                <EmptyState title="대화 기록이 없습니다">
                    <p>&quot;{workflow.name}&quot; 워크플로우의 이전 대화를 불러올 수 없습니다.</p>
                    <p>새로운 대화를 시작해보세요.</p>
                </EmptyState>
            ) : (
                <MessageList
                    ioLogs={ioLogs}
                    pendingLogId={pendingLogId}
                    executing={executing}
                    renderMessageContent={renderMessageContent}
                    formatDate={formatDate}
                />
            );
        }

        if (mode === 'new-workflow') {
            return (
                <EmptyState
                    title="첫 대화를 시작해보세요!"
                    showSuggestions
                    onChipClick={setInputMessage}
                    disabled={executing}
                >
                    <p>&quot;{workflow.name}&quot; 워크플로우가 준비되었습니다.</p>
                </EmptyState>
            );
        }

        if (mode === 'new-default') {
            return (
                <EmptyState
                    title="첫 대화를 시작해보세요!"
                    showSuggestions
                    onChipClick={setInputMessage}
                    disabled={executing}
                >
                    <p>일반 채팅 모드로 자유롭게 대화할 수 있습니다.</p>
                </EmptyState>
            );
        }
        
        return null; // 예외 케이스
    };

    return (
        <div className={styles.chatContainer}>
            <div ref={messagesRef} className={styles.messagesArea}>
                {renderContent()}
            </div>
        </div>
    );
};