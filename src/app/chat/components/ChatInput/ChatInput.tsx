import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
    FiSend,
    FiPlus,
    FiFolder,
    FiImage,
    FiMic,
    FiBookmark,
} from 'react-icons/fi';
import styles from '../../assets/ChatInterface.module.scss';
import { useInputHandling } from '../../hooks/useInputHandling';

interface ChatInputProps {
    executing: boolean;
    mode: string;
    loading: boolean;
    showAttachmentMenu: boolean;
    onAttachmentClick: () => void;
    onAttachmentOption: (option: string) => void;
    onSendMessage: (message: string) => void;
    onShiftEnter?: () => void;
    initialMessage?: string;
}

interface ChatInputRef {
    setMessage: (message: string) => void;
    getMessage: () => string;
    clearMessage: () => void;
}

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>((
    {
        executing,
        mode,
        loading,
        showAttachmentMenu,
        onAttachmentClick,
        onAttachmentOption,
        onSendMessage,
        onShiftEnter,
        initialMessage,
    },
    ref
) => {
    const attachmentButtonRef = useRef<HTMLDivElement>(null);

    const inputHandling = useInputHandling({
        executing,
        mode,
        onSendMessage: () => {
            onSendMessage(inputHandling.inputMessage);
        },
        onShiftEnter,
    });

    // 외부에서 접근할 수 있는 메서드들을 노출
    useImperativeHandle(ref, () => ({
        setMessage: (message: string) => {
            inputHandling.setInputMessage(message);
        },
        getMessage: () => {
            return inputHandling.inputMessage;
        },
        clearMessage: () => {
            inputHandling.setInputMessage('');
        },
    }), [inputHandling]);

    // 초기 메시지 설정
    useEffect(() => {
        if (initialMessage) {
            inputHandling.setInputMessage(initialMessage);
        }
    }, [initialMessage, inputHandling]);

    // 첨부 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (attachmentButtonRef.current && !attachmentButtonRef.current.contains(event.target as Node)) {
                // showAttachmentMenu가 true일 때만 onAttachmentClick 호출
                if (showAttachmentMenu) {
                    onAttachmentClick();
                }
            }
        };

        if (showAttachmentMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAttachmentMenu, onAttachmentClick]);

    return (
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
                    disabled={executing}
                    className={styles.messageInput}
                    rows={1}
                />
                <div className={styles.buttonGroup}>
                    <div className={styles.attachmentWrapper} ref={attachmentButtonRef}>
                        <button
                            onClick={onAttachmentClick}
                            className={`${styles.attachmentButton} ${showAttachmentMenu ? styles.active : ''}`}
                            disabled={executing}
                        >
                            <FiPlus />
                        </button>
                        {showAttachmentMenu && (
                            <div className={styles.attachmentMenu}>
                                <button
                                    className={styles.attachmentOption}
                                    onClick={() => onAttachmentOption('collection')}
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
                            onSendMessage(inputHandling.inputMessage);
                            inputHandling.setInputMessage('');
                        }}
                        disabled={executing || !inputHandling.inputMessage.trim()}
                        className={`${styles.sendButton} ${executing || !inputHandling.inputMessage.trim() ? styles.disabled : ''}`}
                    >
                        {executing ? <div className={styles.miniSpinner}></div> : <FiSend />}
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
        </div>
    );
});

ChatInput.displayName = 'ChatInput';

export { ChatInput };
export type { ChatInputProps, ChatInputRef };