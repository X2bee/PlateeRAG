'use client';

import React from 'react';
import { FiDownload, FiStar, FiGitBranch } from 'react-icons/fi';
import { MCPItem } from './types';
import styles from '@/app/admin/assets/MCPCard.module.scss';

interface MCPCardProps {
    item: MCPItem;
    onClick?: (item: MCPItem) => void;
}

const MCPCard: React.FC<MCPCardProps> = ({ item, onClick }) => {
    const handleClick = () => {
        if (onClick) {
            onClick(item);
        }
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.mcpCard} onClick={handleClick}>
            <div className={styles.cardHeader}>
                <div className={styles.iconContainer}>
                    {item.iconUrl ? (
                        <img src={item.iconUrl} alt={`${item.name} icon`} />
                    ) : (
                        <FiGitBranch />
                    )}
                </div>
                <div className={styles.cardInfo}>
                    <h3 className={styles.cardTitle}>{item.name}</h3>
                    <p className={styles.cardAuthor}>{item.author}</p>
                </div>
                <div className={`${styles.statusBadge} ${item.status === '우수' ? styles.excellent : styles.normal}`}>
                    {item.status}
                </div>
            </div>

            <p className={styles.cardDescription}>
                {item.description}
            </p>

            <div className={styles.cardFooter}>
                <div className={styles.cardStats}>
                    <div className={styles.statItem}>
                        <FiDownload />
                        <span>{formatNumber(item.downloads)}</span>
                    </div>
                    <div className={styles.statItem}>
                        <FiStar />
                        <span>{formatNumber(item.stars)}</span>
                    </div>
                </div>

                {item.version && (
                    <div className={styles.cardVersion}>
                        <FiGitBranch />
                        <span>{item.version}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MCPCard;
