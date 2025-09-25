'use client';

import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import styles from '@/app/admin/assets/MCPMarket.module.scss';

interface MCPSearchBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    placeholder?: string;
}

const MCPSearchBar: React.FC<MCPSearchBarProps> = ({
    searchQuery,
    onSearchChange,
    placeholder = '이름, 소개 또는 키워드 검색...'
}) => {
    const handleClear = () => {
        onSearchChange('');
    };

    return (
        <div className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
                <FiSearch className={styles.searchIcon} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    className={styles.searchInput}
                />
                {searchQuery && (
                    <button
                        onClick={handleClear}
                        className={styles.clearButton}
                        type="button"
                    >
                        <FiX size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default MCPSearchBar;
