import React, { useRef, useEffect, useState } from 'react';
import { FiVolume2, FiCopy, FiLoader, FiInfo, FiStar } from 'react-icons/fi';
import styles from './AIChatEditModal.module.scss';

interface AIChatEditDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    messageContent: string;
    onReadAloud: () => void;
    onCopy: () => void;
    position?: { top: number; right: number };
    isReading?: boolean; // 읽어주기 진행 상태
    onDebug?: () => void; // 디버그 버튼 핸들러
    onRating?: (rating: number) => void; // 별점 평가 핸들러
}

const AIChatEditDropdown: React.FC<AIChatEditDropdownProps> = ({
    isOpen,
    onClose,
    messageContent,
    onReadAloud,
    onCopy,
    position = { top: 0, right: 0 },
    isReading = false,
    onDebug,
    onRating
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [showRating, setShowRating] = useState(false);

    const handleDebugClick = () => {
        if (onDebug) {
            onDebug(); // 콘솔에 디버그 정보 출력
        }
        setShowRating(true); // 별점 평가 UI 표시
    };

    const handleRatingClick = (rating: number) => {
        if (onRating) {
            onRating(rating);
        }
        setShowRating(false);
        onClose();
    };

    // 컴포넌트가 닫힐 때 별점 UI도 숨기기
    useEffect(() => {
        if (!isOpen) {
            setShowRating(false);
        }
    }, [isOpen]);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className={styles.dropdown}
            style={{
                top: `${position.top}px`,
                right: `${position.right}px`
            }}
        >
            <div className={styles.options}>
                <button
                    className={`${styles.optionButton} ${isReading ? styles.reading : ''}`}
                    onClick={onReadAloud}
                    disabled={isReading}
                >
                    <FiVolume2 className={styles.icon} />
                    <span>{isReading ? '읽는 중...' : '읽어주기'}</span>
                </button>

                <button className={styles.optionButton} onClick={onCopy}>
                    <FiCopy className={styles.icon} />
                    <span>텍스트 복사</span>
                </button>

                {onDebug && (
                    <button className={styles.optionButton} onClick={handleDebugClick}>
                        <FiInfo className={styles.icon} />
                        <span>디버그 정보</span>
                    </button>
                )}
            </div>

            {/* 별점 평가 UI */}
            {showRating && (
                <div className={styles.ratingContainer}>
                    <div className={styles.ratingTitle}>이 답변을 평가해주세요</div>
                    <div className={styles.stars}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                                key={rating}
                                className={styles.starButton}
                                onClick={() => handleRatingClick(rating)}
                                title={`${rating}점`}
                            >
                                <FiStar className={styles.starIcon} />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChatEditDropdown;
