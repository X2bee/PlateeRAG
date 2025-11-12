'use client';
import React, { useState } from 'react';
import styles from '@/app/main/workflowSection/assets/Documents.module.scss';
import { DocumentInCollection, SearchResult } from '@/app/main/workflowSection/types/index';
import { formatFileSize, getRelativeTime, updateChunkContent } from '@/app/_common/api/rag/retrievalAPI';
import { showWarningConfirmToastKo, showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';

interface DocumentDetailSectionProps {
    searchQuery: string;
    searchResults: SearchResult[];
    isSearching: boolean;
    documentDetails: DocumentInCollection | null;
    loading: boolean;
    collectionName: string;
    needsRemake: boolean;
    onSearchQueryChange: (query: string) => void;
    onSearch: () => void;
    onRefreshDocument: () => void | Promise<void>;
}

const DocumentDetailSection: React.FC<DocumentDetailSectionProps> = ({
    searchQuery,
    searchResults,
    isSearching,
    documentDetails,
    loading,
    collectionName,
    needsRemake,
    onSearchQueryChange,
    onSearch,
    onRefreshDocument,
}) => {
    const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleEditClick = (chunkId: string, currentContent: string) => {
        setEditingChunkId(chunkId);
        setEditContent(currentContent);
    };

    const handleCancelEdit = () => {
        setEditingChunkId(null);
        setEditContent('');
    };

    const handleConfirmEdit = async (chunkId: string, chunkIndex: number) => {
        if (!documentDetails) return;

        // Toast로 업데이트 확인
        showWarningConfirmToastKo({
            title: '청크 업데이트',
            message: `청크 #${chunkIndex + 1}의 내용을 업데이트하시겠습니까?\n이 작업은 임베딩을 다시 생성합니다.`,
            confirmText: '업데이트',
            cancelText: '취소',
            enableEnterKey: true,
            onConfirm: async () => {
                try {
                    setIsUpdating(true);
                    await updateChunkContent(
                        collectionName,
                        documentDetails.document_id,
                        chunkId,
                        editContent,
                        {
                            chunk_index: chunkIndex,
                            updated_at: new Date().toISOString(),
                        }
                    );

                    // 성공 토스트
                    showSuccessToastKo(`청크 #${chunkIndex + 1}이(가) 성공적으로 업데이트되었습니다!`);

                    // 편집 모드 종료
                    setEditingChunkId(null);
                    setEditContent('');

                    // 문서 상세 정보 다시 로드
                    await onRefreshDocument();
                } catch (error) {
                    console.error('Failed to update chunk:', error);
                    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
                    showErrorToastKo(`청크 업데이트에 실패했습니다: ${errorMessage}`);
                } finally {
                    setIsUpdating(false);
                }
            },
            onCancel: () => {
                // 취소 시 아무것도 하지 않음
            }
        });
    };

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
                                        <div className={styles.chunkHeaderLeft}>
                                            <span className={styles.chunkIndex}>청크 #{chunk.chunk_index + 1}</span>
                                            <span className={styles.chunkSize}>
                                                {formatFileSize(chunk.chunk_size)}
                                            </span>
                                        </div>
                                        {editingChunkId === chunk.chunk_id ? (
                                            <div className={styles.chunkActions}>
                                                <button
                                                    onClick={() => handleConfirmEdit(chunk.chunk_id, chunk.chunk_index)}
                                                    disabled={isUpdating}
                                                    className={`${styles.button} ${styles.primary}`}
                                                >
                                                    {isUpdating ? '업데이트 중...' : '확인'}
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={isUpdating}
                                                    className={`${styles.button} ${styles.secondary}`}
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEditClick(chunk.chunk_id, chunk.chunk_text || '')}
                                                className={`${styles.button} ${styles.edit}`}
                                            >
                                                업데이트
                                            </button>
                                        )}
                                    </div>
                                    {editingChunkId === chunk.chunk_id ? (
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className={styles.chunkEditArea}
                                            rows={10}
                                            disabled={isUpdating}
                                        />
                                    ) : (
                                        <div className={styles.chunkText}>
                                            {chunk.chunk_text}
                                        </div>
                                    )}
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
