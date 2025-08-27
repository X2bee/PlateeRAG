import { useState, useCallback, useRef, useEffect } from 'react';
import { SourceInfo } from '../types/source';

interface UseScrollManagementProps {
    messagesRef: React.RefObject<HTMLDivElement | null>;
    executing: boolean;
}

interface UseScrollManagementReturn {
    scrollPosition: number;
    isUserScrolling: boolean;
    isResizing: boolean;
    setIsResizing: React.Dispatch<React.SetStateAction<boolean>>;
    handleUserScroll: () => void;
    saveScrollPosition: () => void;
    restoreScrollPosition: () => void;
    scrollToBottom: () => void;
    handleViewSource: (sourceInfo: SourceInfo, messageContent?: string) => SourceInfo;
}

export const useScrollManagement = ({ 
    messagesRef, 
    executing 
}: UseScrollManagementProps): UseScrollManagementReturn => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 사용자 스크롤 감지 함수
    const handleUserScroll = useCallback(() => {
        if (!isResizing) {
            setIsUserScrolling(true);
            
            // 스크롤 정지 감지
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            
            scrollTimeoutRef.current = setTimeout(() => {
                setIsUserScrolling(false);
                // 스크롤이 정지된 후 현재 위치를 저장
                if (messagesRef.current) {
                    setScrollPosition(messagesRef.current.scrollTop);
                }
            }, 150);
        }
    }, [isResizing, messagesRef]);

    // 스크롤 위치 저장 함수 (조건부)
    const saveScrollPosition = useCallback(() => {
        if (messagesRef.current && !isUserScrolling) {
            setScrollPosition(messagesRef.current.scrollTop);
        }
    }, [isUserScrolling, messagesRef]);

    // 스크롤 위치 복원 함수 (조건부)
    const restoreScrollPosition = useCallback(() => {
        if (messagesRef.current && scrollPosition > 0 && !isUserScrolling && !isResizing) {
            requestAnimationFrame(() => {
                if (messagesRef.current && !isUserScrolling) {
                    messagesRef.current.scrollTop = scrollPosition;
                }
            });
        }
    }, [scrollPosition, isUserScrolling, isResizing, messagesRef]);

    // 강화된 스크롤 함수
    const scrollToBottom = useCallback(() => {
        if (messagesRef.current) {
            // 강제로 스크롤을 최하단으로 이동
            const scrollElement = messagesRef.current;

            // 즉시 스크롤
            scrollElement.scrollTop = scrollElement.scrollHeight;

            // 약간의 지연 후 다시 스크롤 (DOM 업데이트 대기)
            requestAnimationFrame(() => {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            });

            // 추가 보장을 위한 setTimeout
            setTimeout(() => {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            }, 50);
        }
    }, [messagesRef]);

    // 출처 보기 처리 (스크롤 위치 저장/복원 포함)
    const handleViewSource = useCallback((sourceInfo: SourceInfo, messageContent?: string) => {
        // 스크롤 위치 저장 (사용자가 스크롤 중이 아닐 때만)
        if (!isUserScrolling) {
            saveScrollPosition();
        }
        
        // 답변 내용을 sourceInfo에 추가
        const enrichedSourceInfo = {
            ...sourceInfo,
            response_content: messageContent || sourceInfo.response_content
        };
        
        return enrichedSourceInfo;
    }, [isUserScrolling, saveScrollPosition]);

    // 스크롤 이벤트 리스너 등록
    useEffect(() => {
        const messagesElement = messagesRef.current;
        if (messagesElement) {
            messagesElement.addEventListener('scroll', handleUserScroll, { passive: true });
            
            return () => {
                messagesElement.removeEventListener('scroll', handleUserScroll);
            };
        }
    }, [handleUserScroll]);

    // 실행 중일 때 주기적으로 스크롤 (스트리밍 대응)
    useEffect(() => {
        let scrollInterval: NodeJS.Timeout;

        if (executing) {
            // 실행 중일 때 0.5초마다 스크롤 체크
            scrollInterval = setInterval(() => {
                scrollToBottom();
            }, 500);
        }

        return () => {
            if (scrollInterval) {
                clearInterval(scrollInterval);
            }
        };
    }, [executing, scrollToBottom]);

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    return {
        scrollPosition,
        isUserScrolling,
        isResizing,
        setIsResizing,
        handleUserScroll,
        saveScrollPosition,
        restoreScrollPosition,
        scrollToBottom,
        handleViewSource
    };
};