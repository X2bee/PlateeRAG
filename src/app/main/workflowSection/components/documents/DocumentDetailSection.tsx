'use client';
import React from 'react';
import styles from '@/app/main/workflowSection/assets/Documents.module.scss';
import { DocumentInCollection, SearchResult } from '@/app/main/workflowSection/types/index';
import { formatFileSize, getRelativeTime } from '@/app/api/rag/retrievalAPI';

interface DocumentDetailSectionProps {
    searchQuery: string;
    searchResults: SearchResult[];
    isSearching: boolean;
    documentDetails: DocumentInCollection | null;
    loading: boolean;
    onSearchQueryChange: (query: string) => void;
    onSearch: () => void;
}

const DocumentDetailSection: React.FC<DocumentDetailSectionProps> = ({
    searchQuery,
    searchResults,
    isSearching,
    documentDetails,
    loading,
    onSearchQueryChange,
    onSearch,
}) => {
    return (
        <div className={styles.documentDetailContainer}>
            {/* 검색 영역 */}
            <div className={styles.searchContainer}>
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="문서 내용을 검색하세요..."
                        value={searchQuery}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        className={styles.searchInput}
                    />
                    <button
                        onClick={onSearch}
                        disabled={isSearching || !searchQuery.trim()}
                        className={`${styles.button} ${styles.primary}`}
                    >
                        {isSearching ? '검색 중...' : '검색'}
                    </button>
                </div>
            </div>

            {/* 검색 결과 */}
            {searchQuery && (
                <div className={styles.searchResultsContainer}>
                    <h4 className={styles.searchResultsTitle}>검색 결과 ({searchResults.length}개)</h4>
                    {searchResults.length === 0 ? (
                        <div className={styles.emptyState}>검색 결과가 없습니다.</div>
                    ) : (
                        <div className={styles.searchResults}>
                            {searchResults.map((result) => (
                                <div key={result.id} className={styles.searchResultItem}>
                                    <div className={styles.resultHeader}>
                                        <span className={styles.resultScore}>
                                            유사도: {(result.score * 100).toFixed(1)}%
                                        </span>
                                        <span className={styles.resultChunk}>
                                            청크 #{result.chunk_index + 1}
                                        </span>
                                    </div>
                                    <p className={styles.resultText}>
                                        {result.chunk_text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 문서 상세 정보 */}
            {!searchQuery && documentDetails && (
                <div className={styles.documentDetailContent}>
                    <div className={styles.documentDetailMeta}>
                        <h3 className={styles.documentTitle}>{documentDetails.file_name}</h3>
                        <div className={styles.metaInfo}>
                            <span>파일 타입: {documentDetails.file_type.toUpperCase()}</span>
                            <span>전체 청크: {documentDetails.total_chunks}개</span>
                            <span>업로드 시간: {getRelativeTime(documentDetails.processed_at)}</span>
                        </div>
                    </div>

                    <div className={styles.chunksContainer}>
                        <h4 className={styles.chunksTitle}>문서 내용</h4>
                        <div className={styles.chunksList}>
                            {documentDetails.chunks.map((chunk) => (
                                <div key={chunk.chunk_id} className={styles.chunkItem}>
                                    <div className={styles.chunkHeader}>
                                        <span className={styles.chunkIndex}>청크 #{chunk.chunk_index + 1}</span>
                                        <span className={styles.chunkSize}>
                                            {formatFileSize(chunk.chunk_size)}
                                        </span>
                                    </div>
                                    <div className={styles.chunkText}>
                                        {chunk.chunk_text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {loading && <div className={styles.loading}>로딩 중...</div>}
        </div>
    );
};

export default DocumentDetailSection;
