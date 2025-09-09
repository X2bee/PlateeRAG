import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
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
import SoundInput from '../SoundInput/SoundInputModal';
import SoundInputHandler from '../SoundInput/SoundInputHandler';
import { getSTTSimpleStatus } from '@/app/api/sttAPI';
import { devLog } from '@/app/_common/utils/logger';

interface STTSimpleStatusResponse {
    available: boolean;
    provider: string | null;
    model: string | null;
    api_key_configured?: boolean;
    error?: string;
}

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
    onAudioUpload?: (audioBlob: Blob) => void;
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
        onAudioUpload,
    },
    ref
) => {
    const attachmentButtonRef = useRef<HTMLDivElement>(null);
    const [showSoundInput, setShowSoundInput] = useState(false);
    const [sttAvailable, setSttAvailable] = useState(true);
    const [useStt, setUseStt] = useState(false);

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

    // STT 상태 확인
    useEffect(() => {
        const checkSttStatus = async () => {
            try {
                const data = await getSTTSimpleStatus() as STTSimpleStatusResponse;
                setSttAvailable(data.available);
            } catch (error) {
                setSttAvailable(false);
            }
        };

        checkSttStatus();
    }, []);

    useEffect(() => {
        const loadWorkflowData = () => {
            try {
                const workflowContentDetail = localStorage.getItem('workflowContentDetail');
                if (workflowContentDetail) {
                    const parsedWorkflowData = JSON.parse(workflowContentDetail);
                    devLog.log('Parsed workflow data:', parsedWorkflowData);

                    if (parsedWorkflowData.interaction_id === 'default') {
                        devLog.log('Default mode detected, enabling STT');
                        setUseStt(true);
                        return;
                    }

                    const inputStringNode = parsedWorkflowData.nodes?.find((node: any) =>
                        node.data?.id === 'input_string'
                    );
                    if (inputStringNode) {
                        const useSttParam = inputStringNode.data?.parameters?.find((param: any) =>
                            param.id === 'use_stt'
                        );
                        if (useSttParam) {
                            setUseStt(useSttParam.value);
                        }
                    }
                }
            } catch (error) {
                setUseStt(false);
            }
        };

        loadWorkflowData();
    }, []);

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

    // 음성 입력 처리 함수
    const handleAudioReady = (audioBlob: Blob) => {
        if (onAudioUpload) {
            onAudioUpload(audioBlob);
        }
        // 오디오를 사용하기로 결정했을 때만 모달 닫기
        setShowSoundInput(false);
    };

    // 음성 변환 텍스트 처리 함수 (모달용)
    const handleTranscriptionReady = (transcription: string) => {
        // 변환된 텍스트를 입력창에 설정
        inputHandling.setInputMessage(transcription);
        // 모달 닫기
        setShowSoundInput(false);
    };

    // 음성 변환 텍스트 처리 함수 (핸들러용)
    const handleHandlerTranscriptionReady = (transcription: string) => {
        // 변환된 텍스트를 입력창에 설정
        inputHandling.setInputMessage(transcription);
    };

    // 음성 입력 모달 닫기
    const handleCloseSoundInput = () => {
        setShowSoundInput(false);
    };

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
                    {/* 음성 입력 핸들러 버튼 */}
                    <SoundInputHandler
                        onTranscriptionReady={handleHandlerTranscriptionReady}
                        disabled={mode === 'new-default' ? !sttAvailable : !(sttAvailable && useStt)}
                    />

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
                                    className={`${styles.attachmentOption} ${(mode === 'new-default' ? !sttAvailable : !(sttAvailable && useStt)) ? styles.disabled : ''}`}
                                    onClick={() => {
                                        setShowSoundInput(true);
                                        onAttachmentClick(); // 첨부 메뉴 닫기
                                    }}
                                    disabled={mode === 'new-default' ? !sttAvailable : !(sttAvailable && useStt)}
                                >
                                    <FiMic />
                                    <span>음성 (상세)</span>
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

            {/* 음성 입력 모달 */}
            <SoundInput
                isOpen={showSoundInput}
                onAudioReady={handleAudioReady}
                onTranscriptionReady={handleTranscriptionReady}
                onClose={handleCloseSoundInput}
            />
        </div>
    );
});

ChatInput.displayName = 'ChatInput';

export { ChatInput };
export type { ChatInputProps, ChatInputRef };
