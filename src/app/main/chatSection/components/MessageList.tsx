import styles from '@/app/main/chatSection/assets/ChatInterface.module.scss';
import { IOLog } from '@/app/main/chatSection/components/types';

interface MessageListProps {
    ioLogs: IOLog[];
    pendingLogId: string | null;
    executing: boolean;
    renderMessageContent: (content: string, isUserMessage?: boolean, onHeightChange?: () => void) => React.ReactNode;
    formatDate: (dateString: string) => string;
    onHeightChange?: () => void;
}
export const MessageList: React.FC<MessageListProps> = ({ ioLogs, pendingLogId, executing, renderMessageContent, formatDate, onHeightChange }) => {
    return ioLogs.map((log) => {
        const isStreamingInProgress = String(log.log_id) === pendingLogId && executing;

        return (
            <div key={log.log_id} className={styles.messageExchange}>
                <div className={styles.userMessage}>
                    <div className={styles.messageContent}>
                        {renderMessageContent(log.input_data, true, onHeightChange)}
                    </div>
                    <div className={styles.messageTime}>
                        {formatDate(log.updated_at)}
                    </div>
                </div>

                <div className={styles.botMessage}>
                    <div className={styles.messageContent}>
                        {isStreamingInProgress && !log.output_data ? (
                            <div className={styles.typingIndicator}>
                                <span /><span /><span />
                            </div>
                        ) : (
                            renderMessageContent(log.output_data, false, onHeightChange)
                        )}
                    </div>
                </div>
            </div>
        );
    });
};
