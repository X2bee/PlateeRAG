import { useState, useCallback, useEffect, useRef } from 'react';

interface UseInputHandlingProps {
    executing: boolean;
    mode: string;
    onSendMessage: () => void;
    onShiftEnter?: () => void;
}

interface UseInputHandlingReturn {
    inputMessage: string;
    isComposing: boolean;
    setInputMessage: React.Dispatch<React.SetStateAction<string>>;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    adjustTextareaHeight: () => void;
    handleCompositionStart: () => void;
    handleCompositionEnd: () => void;
    handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const useInputHandling = ({ 
    executing, 
    mode, 
    onSendMessage,
    onShiftEnter
}: UseInputHandlingProps): UseInputHandlingReturn => {
    const [inputMessage, setInputMessage] = useState<string>('');
    const [isComposing, setIsComposing] = useState<boolean>(false);
    const textareaRef = useRef<HTMLTextAreaElement|null>(null);

    // Textarea 높이 자동 조절 함수
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            // 먼저 높이를 auto로 설정하여 scrollHeight를 정확히 계산
            textarea.style.height = 'auto';
            
            const scrollHeight = textarea.scrollHeight;
            const minHeight = 45; // 최소 높이
            const maxHeight = 200; // 최대 높이
            
            if (scrollHeight <= maxHeight) {
                // 최대 높이보다 작으면 스크롤 숨김하고 내용에 맞게 높이 설정
                textarea.style.height = `${Math.max(scrollHeight, minHeight)}px`;
                textarea.classList.remove('scrollable');
            } else {
                // 최대 높이에 도달하면 스크롤 표시
                textarea.style.height = `${maxHeight}px`;
                textarea.classList.add('scrollable');
            }
        }
    }, []);

    // IME composition 이벤트 핸들러들
    const handleCompositionStart = useCallback(() => {
        setIsComposing(true);
    }, []);

    const handleCompositionEnd = useCallback(() => {
        setIsComposing(false);
    }, []);

    // 키보드 이벤트 처리
    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // 한글 입력 중(composition 중)이면 Enter 키 무시
        if (isComposing) {
            return;
        }
        
        if (e.key === 'Enter' && !e.shiftKey && !executing) {
            e.preventDefault();
            onSendMessage();
            setInputMessage('');
        } else if (e.key === 'Enter' && e.shiftKey && onShiftEnter) {
            // Shift+Enter 시 scrollToBottom 실행
            onShiftEnter();
        }
        // Shift+Enter는 줄바꿈을 허용 (기본 동작)
    }, [executing, onSendMessage, onShiftEnter, isComposing]);

    // 입력 변경 처리
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputMessage(e.target.value);
    }, []);

    // 입력 메시지 변경 시 높이 조절
    useEffect(() => {
        adjustTextareaHeight();
    }, [inputMessage, adjustTextareaHeight]);

    return {
        inputMessage,
        isComposing,
        setInputMessage,
        textareaRef,
        adjustTextareaHeight,
        handleCompositionStart,
        handleCompositionEnd,
        handleKeyPress,
        handleInputChange
    };
};