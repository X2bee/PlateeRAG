import React from 'react';
import styles from './ChatContent.module.scss';

const ChatContent: React.FC = () => {
    return (
        <div className={styles.chatContainer}>
            <div className={styles.welcomeSection}>
                <div className={styles.welcomeContent}>
                    <h1>채팅을 시작해보세요! 🚀</h1>
                    <p>AI와 대화하며 궁금한 것들을 물어보세요.</p>
                    <div className={styles.suggestionCards}>
                        <div className={styles.card}>
                            <h3>✨ 질문하기</h3>
                            <p>무엇이든 물어보세요</p>
                        </div>
                        <div className={styles.card}>
                            <h3>💡 아이디어 얻기</h3>
                            <p>창의적인 아이디어를 얻어보세요</p>
                        </div>
                        <div className={styles.card}>
                            <h3>📚 학습하기</h3>
                            <p>새로운 것을 배워보세요</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatContent;
