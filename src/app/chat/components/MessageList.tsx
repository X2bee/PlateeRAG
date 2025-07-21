import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { IOLog } from './types';

interface MessageListProps {
    ioLogs: IOLog[];
    pendingLogId: string | null;
    executing: boolean;
    renderMessageContent: (content: string, isUserMessage?: boolean) => React.ReactNode;
    formatDate: (dateString: string) => string;
}
export const MessageList: React.FC<MessageListProps> = ({ ioLogs, pendingLogId, executing, renderMessageContent, formatDate }) => {
    return ioLogs.map((log) => (
        <div key={log.log_id} className={styles.messageExchange}>
            <div className={styles.userMessage}>
                <div className={styles.messageContent}>
                    {renderMessageContent(log.input_data, true)}
                </div>
                <div className={styles.messageTime}>
                    {formatDate(log.updated_at)}
                </div>
            </div>

            <div className={styles.botMessage}>
                <div className={styles.messageContent}>
                    {String(log.log_id) === pendingLogId && executing && !log.output_data ? (
                        <div className={styles.typingIndicator}>
                            <span /><span /><span />
                        </div>
                    ) : (
                        renderMessageContent(log.output_data)
                    )}
                </div>
            </div>
        </div>
    ));
};