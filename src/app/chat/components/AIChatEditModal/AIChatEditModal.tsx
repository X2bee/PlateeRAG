import React, { useRef, useEffect } from 'react';
import { FiVolume2, FiCopy, FiLoader, FiInfo } from 'react-icons/fi';
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
}

const AIChatEditDropdown: React.FC<AIChatEditDropdownProps> = ({
    isOpen,
    onClose,
    messageContent,
    onReadAloud,
    onCopy,
    position = { top: 0, right: 0 },
    isReading = false,
    onDebug
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

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
                    <button className={styles.optionButton} onClick={onDebug}>
                        <FiInfo className={styles.icon} />
                        <span>디버그 정보</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default AIChatEditDropdown;
