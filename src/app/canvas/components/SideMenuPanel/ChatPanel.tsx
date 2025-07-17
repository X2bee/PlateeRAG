import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { sendMessage } from '@/app/api/chatAPI';
import styles from '@/app/canvas/assets/Chat.module.scss';
import sideMenuStyles from '@/app/canvas/assets/SideMenu.module.scss';
import { LuArrowLeft, LuSend } from "react-icons/lu";
import { devLog } from '@/app/utils/logger';
import type {
    Message,
    ChatPanelProps,
    SendMessageResponse
} from '@/app/canvas/types';

const ChatPanel: React.FC<ChatPanelProps> = ({ onBack }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const messageListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages]);

    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
        setInputValue(e.target.value);
    };

    const handleSendMessage = async (): Promise<void> => {
        if (inputValue.trim() === '' || isLoading) return;

        const userMessage: Message = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
        };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setIsLoading(true);
        setInputValue('');

        try {
            const response = await sendMessage({ 
                message: userMessage.text,
                isNewChat: messages.length === 1 // 첫 번째 메시지면 새 채팅
            }) as SendMessageResponse;
            const botMessage: Message = {
                id: Date.now() + 1,
                text: response.text,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
        } catch (error) {
            devLog.error("Error sending message:", error);
            const errorMessage: Message = {
                id: Date.now() + 1,
                text: "Sorry, I couldn't get a response. Please try again.",
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const isLastMessageFromUser = (): boolean => {
        return messages.length > 0 && messages[messages.length - 1].sender === 'user';
    };

    return (
        <div className={styles.chatContainer}>
            <div className={sideMenuStyles.header}>
                <button onClick={onBack} className={sideMenuStyles.backButton} aria-label="Back to main menu">
                    <LuArrowLeft />
                </button>
                <h3>Chat</h3>
            </div>

            <div className={styles.messageList} ref={messageListRef}>
                {messages.map((msg: Message) => (
                    <div
                        key={msg.id}
                        className={`${styles.message} ${msg.sender === 'user' ? styles.userMessage : styles.botMessage}`}
                    >
                        {msg.text}
                    </div>
                ))}
                {isLoading && isLastMessageFromUser() && (
                    <div className={`${styles.message} ${styles.botMessage} ${styles.loadingDots}`}>
                        <span></span><span></span><span></span>
                    </div>
                )}
            </div>

            <div className={styles.inputArea}>
                <textarea
                    className={styles.textInput}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    rows={1} // Start with a single line, expands with content
                    disabled={isLoading}
                />
                <button
                    className={styles.sendButton}
                    onClick={handleSendMessage}
                    disabled={isLoading || inputValue.trim() === ''}
                    aria-label="Send message"
                >
                    <LuSend />
                </button>
            </div>
        </div>
    );
};

export default ChatPanel;