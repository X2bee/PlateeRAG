import React, { useState, useEffect, useRef } from 'react';
import { sendMessage } from '@/app/api/chatAPI';
import styles from '@/app/(canvas)/assets/Chat.module.scss'; // Corrected path
import sideMenuStyles from '@/app/(canvas)/assets/SideMenu.module.scss'; // SideMenu 스타일 추가
import { LuArrowLeft, LuSend } from "react-icons/lu"; // Icons for back and send

const Chat = ({ onBack }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messageListRef = useRef(null);

    // Scroll to bottom effect when new messages are added
    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleSendMessage = async () => {
        if (inputValue.trim() === '' || isLoading) return;

        const userMessage = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
        };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setIsLoading(true);
        setInputValue(''); // Clear input immediately

        try {
            const response = await sendMessage(userMessage.text);
            const botMessage = {
                id: Date.now() + 1, // Ensure unique ID
                text: response.text,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = {
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

    // Allow sending message with Enter key
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent newline in textarea
            handleSendMessage();
        }
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
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`${styles.message} ${msg.sender === 'user' ? styles.userMessage : styles.botMessage}`}
                    >
                        {msg.text}
                    </div>
                ))}
                {isLoading && messages.length > 0 && messages[messages.length -1].sender === 'user' && (
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
                    rows="1" // Start with a single line, expands with content
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

export default Chat;
