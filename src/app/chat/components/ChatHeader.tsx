import { FiArrowLeft, FiMessageSquare, FiUpload } from 'react-icons/fi';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { ChatHeaderProps } from './types';

const ChatHeader: React.FC<ChatHeaderProps> = ({ mode, workflow, ioLogs, onBack, hideBackButton, onDeploy }) => {
    let title = '';
    let subtitle = '';
    let chatCountText = '';

    const isExistingMode = mode === 'existing';
    const isDeployMode = mode === 'deploy';

    if (isExistingMode) {
        title = workflow.name === 'default_mode' ? '일반 채팅' : workflow.name;
        subtitle = hideBackButton ? '현재 채팅을 계속하세요' : '기존 대화를 계속하세요';
        chatCountText = `${ioLogs.length}개의 대화`;
    } else if (mode === 'new-default') {
        title = '일반 채팅';
        subtitle = '자유롭게 대화를 시작하세요';
        chatCountText = '새 채팅';
    } else if (mode === 'new-workflow') {
        title = workflow.name;
        subtitle = '새로운 대화를 시작하세요';
        chatCountText = '새 채팅';
    } else {
        title = workflow.name;
        subtitle = '새로운 대화를 시작하세요';
        chatCountText = '새 채팅';
    }

    const showBackButton = ((!isExistingMode && !isDeployMode) || !hideBackButton);

    return (
        <div className={styles.header}>
            <div className={styles.headerInfo}>
                {showBackButton && (
                    <button className={styles.backButton} onClick={onBack}>
                        <FiArrowLeft />
                    </button>
                )}
                <div>
                    <h2>{title}</h2>
                    <p>{subtitle}</p>
                </div>
            </div>
            <div className={styles.chatCount}>
                { mode === 'deploy' || mode === 'new-default' || workflow.name === 'default_mode' ? (
                    <span></span>
                ) : (
                    <button className={styles.deployButton} onClick={onDeploy}>
                        <FiUpload />
                        <span>배포</span>
                    </button>
                )}
                <FiMessageSquare />
                <span>{chatCountText}</span>
                
            </div>
            
        </div>
    );
};

export default ChatHeader;