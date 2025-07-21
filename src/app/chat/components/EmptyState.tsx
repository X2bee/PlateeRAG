
import { FiClock } from 'react-icons/fi';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { SuggestionChips } from './SuggestionChips';


interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    children?: React.ReactNode;
    showSuggestions?: boolean;
    onChipClick?: (text: string) => void;
    disabled?: boolean;
}
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, children, showSuggestions, onChipClick, disabled }) => {
    return (
        <div className={styles.emptyState}>
            {icon || <FiClock className={styles.emptyIcon} />}
            <h3>{title}</h3>
            {children}
            {showSuggestions && (
                <div className={styles.welcomeActions}>
                    <SuggestionChips onChipClick={onChipClick} disabled={disabled} />
                </div>
            )}
        </div>
    );
};