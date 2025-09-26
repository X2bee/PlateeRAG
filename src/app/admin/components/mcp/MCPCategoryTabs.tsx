'use client';

import React from 'react';
import { MCPCategory } from './types';
import styles from '@/app/admin/assets/MCPMarket.module.scss';

interface MCPCategoryTabsProps {
    categories: MCPCategory[];
    activeCategory: string;
    onCategoryChange: (categoryId: string) => void;
}

const MCPCategoryTabs: React.FC<MCPCategoryTabsProps> = ({
    categories,
    activeCategory,
    onCategoryChange
}) => {
    return (
        <div className={styles.categoryTabs}>
            {categories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                    className={`${styles.categoryTab} ${activeCategory === category.id ? styles.active : ''}`}
                >
                    <span>{category.name}</span>
                    <span className={styles.categoryCount}>
                        {category.count.toLocaleString()}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default MCPCategoryTabs;
