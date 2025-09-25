'use client';

import React, { useState, useMemo } from 'react';
import { FiPackage } from 'react-icons/fi';
import MCPCard from './MCPCard';
import MCPSearchBar from './MCPSearchBar';
import MCPCategoryTabs from './MCPCategoryTabs';
import { MCPItem, MCPCategory, MCPSearchFilters } from './types';
import { mockMCPItems, mockMCPCategories } from './mockData';
import styles from '@/app/admin/assets/MCPMarket.module.scss';
import cardStyles from '@/app/admin/assets/MCPCard.module.scss';

interface MCPMarketContentProps {
    // 추후 API 연동을 위한 props
}

const MCPMarketContent: React.FC<MCPMarketContentProps> = () => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'downloads' | 'stars' | 'updated' | 'name'>('downloads');

    // 필터링 및 정렬된 MCP 아이템들
    const filteredAndSortedItems = useMemo(() => {
        let filtered = mockMCPItems;

        // 카테고리 필터링
        if (activeCategory !== 'all') {
            filtered = filtered.filter(item => item.category === activeCategory);
        }

        // 검색어 필터링
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.author.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query)
            );
        }

        // 정렬
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'downloads':
                    return b.downloads - a.downloads;
                case 'stars':
                    return b.stars - a.stars;
                case 'updated':
                    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [searchQuery, activeCategory, sortBy]);

    const handleCardClick = (item: MCPItem) => {
        // 추후 상세 페이지 이동 또는 모달 표시 구현
        console.log('MCP Card clicked:', item);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
    };

    const handleCategoryChange = (categoryId: string) => {
        setActiveCategory(categoryId);
    };

    const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(event.target.value as 'downloads' | 'stars' | 'updated' | 'name');
    };

    return (
        <div>
            {/* 검색바 */}
            <MCPSearchBar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                placeholder="이름, 소개 또는 키워드 검색..."
            />

            {/* 카테고리 탭 */}
            <MCPCategoryTabs
                categories={mockMCPCategories}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
            />

            {/* 필터 및 정렬 옵션 */}
            <div className={styles.filterContainer}>
                <div className={styles.filterLeft}>
                    <span className={styles.resultCount}>
                        {filteredAndSortedItems.length.toLocaleString()}개의 MCP 발견
                    </span>
                </div>
                <div className={styles.filterRight}>
                    <select
                        value={sortBy}
                        onChange={handleSortChange}
                        className={styles.sortSelect}
                    >
                        <option value="downloads">다운로드 순</option>
                        <option value="stars">별점 순</option>
                        <option value="updated">최신 업데이트 순</option>
                        <option value="name">이름 순</option>
                    </select>
                </div>
            </div>

            {/* MCP 카드 그리드 */}
            {filteredAndSortedItems.length > 0 ? (
                <div className={cardStyles.mcpGrid}>
                    {filteredAndSortedItems.map((item) => (
                        <MCPCard
                            key={item.id}
                            item={item}
                            onClick={handleCardClick}
                        />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <FiPackage />
                    </div>
                    <div className={styles.emptyTitle}>
                        검색 결과가 없습니다
                    </div>
                    <div className={styles.emptyDescription}>
                        다른 검색어나 카테고리를 시도해보세요.
                    </div>
                </div>
            )}
        </div>
    );
};

export default MCPMarketContent;
