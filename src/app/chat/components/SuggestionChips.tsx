import styles from '@/app/chat/assets/ChatInterface.module.scss';

interface SuggestionChipsProps {
    onChipClick?: (text: string) => void;
    disabled?: boolean;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ onChipClick, disabled }) => {
    const suggestions = ['안녕하세요!', '도움이 필요해요', '어떤 기능이 있나요?'];

    return (
        <div className={styles.suggestionChips}>
            {suggestions.map((text) => (
                <button
                    key={text}
                    className={styles.suggestionChip}
                    onClick={() => onChipClick?.(text)}
                    disabled={disabled}
                >
                    {text}
                </button>
            ))}
        </div>
    );
};