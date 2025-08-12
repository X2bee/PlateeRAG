'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from '@/app/model/assets/SelectionPopup.module.scss';

interface SelectionPopupProps {
  show: boolean;
  type: 'model' | 'dataset' | 'columns';
  title: string;
  options: any[];
  selected?: string;
  loading?: boolean;
  searchQuery?: string;
  error?: string | null; // ← 로드 실패 등 표시용
  onSelect: (data: { name: string; item: any }) => void;
  onConfirm: (data: { name: string; item: any }) => void;
  onClose: () => void;
  onSearchChange?: (query: string) => void;
}

const SelectionPopup: React.FC<SelectionPopupProps> = ({
  show,
  type,
  title,
  options,
  selected = '',
  loading = false,
  searchQuery = '',
  error = null,
  onSelect,
  onConfirm,
  onClose,
  onSearchChange,
}) => {
  // ── state & refs
  const [internalSelected, setInternalSelected] = useState(selected);
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery);
  const modalRef = useRef<HTMLDivElement>(null);

  // ── sync external props
  useEffect(() => setInternalSearchQuery(searchQuery), [searchQuery]);
  useEffect(() => setInternalSelected(selected), [selected]);

  // ── esc to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // ── lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  // ── helpers (hooks must be defined before any early return)
  const getItemName = useCallback((item: any): string => {
    return typeof item === 'string' ? item : item?.name || '';
  }, []);

  const selectItem = useCallback(
    (item: any) => {
      const name = getItemName(item);
      setInternalSelected(name);
      onSelect({ name, item });
    },
    [getItemName, onSelect],
  );

  const confirmSelection = useCallback(() => {
    if (!internalSelected) return;
    const selItem = options.find((i) => getItemName(i) === internalSelected);
    if (selItem) onConfirm({ name: internalSelected, item: selItem });
  }, [internalSelected, options, getItemName, onConfirm]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.currentTarget === e.target) onClose();
    },
    [onClose],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setInternalSearchQuery(v);
      onSearchChange?.(v);
    },
    [onSearchChange],
  );

  const filteredOptions = useMemo(() => {
    const q = internalSearchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) => {
      const name = getItemName(item).toLowerCase();
      return (
        name.includes(q) ||
        (typeof item?.description === 'string' && item.description.toLowerCase().includes(q)) ||
        (typeof item?.user_name === 'string' && item.user_name.toLowerCase().includes(q))
      );
    });
  }, [options, internalSearchQuery, getItemName]);

  // ── after all hooks
  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        className={styles.backdrop}
        type="button"
        aria-label="팝업 닫기"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 id="popup-title" className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
            <svg className={styles.closeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            value={internalSearchQuery}
            onChange={handleSearchChange}
            placeholder={
              type === 'model'
                ? '모델 검색...'
                : type === 'dataset'
                ? '데이터셋 검색...'
                : '컬럼 검색...'
            }
            className={styles.searchInput}
          />
        </div>

        {/* Content */}
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner} />
            </div>
          ) : (filteredOptions?.length ?? 0) === 0 ? (
            <div className={styles.emptyState}>
              <p>{error ? '목록을 불러오지 못했습니다.' : '검색 결과가 없습니다.'}</p>
            </div>
          ) : (
            <div className={styles.itemsGrid}>
              {filteredOptions.map((item, idx) => {
                const name = getItemName(item);
                const active = internalSelected === name;

                return (
                  <button
                    key={name + idx}
                    type="button"
                    className={`${styles.itemButton} ${active ? styles.selected : ''}`}
                    onClick={() => selectItem(item)}
                    onDoubleClick={() => {
                      selectItem(item);
                      onConfirm({ name, item });
                    }}
                  >
                    <h3 className={styles.itemName}>{name}</h3>

                    {/* details for model/dataset only */}
                    {type !== 'columns' && (
                      <div className={styles.itemDetails}>
                        {item?.user_name && item.user_name !== 'Unknown' && (
                          <p>생성자: {item.user_name}</p>
                        )}

                        {type === 'model' && (
                          <>
                            {item?.base_model && <p>베이스 모델: {item.base_model}</p>}
                            {item?.training_method && <p>학습 방법: {item.training_method}</p>}
                          </>
                        )}

                        {type === 'dataset' && (
                          <>
                            {item?.main_task && <p>주요 작업: {item.main_task}</p>}
                            {item?.number_rows && <p>데이터 수: {item.number_rows}</p>}
                            {item?.description && (
                              <p className={styles.description}>설명: {item.description}</p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {type === 'model' && (
                      <div className={styles.badges}>
                        {item?.use_deepspeed && (
                          <span className={`${styles.badge} ${styles.deepspeedBadge}`}>DeepSpeed</span>
                        )}
                        {item?.use_peft && (
                          <span className={`${styles.badge} ${styles.peftBadge}`}>PEFT</span>
                        )}
                        {item?.use_flash_attention && (
                          <span className={`${styles.badge} ${styles.flashAttentionBadge}`}>
                            Flash Attention
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" onClick={onClose} className={`${styles.button} ${styles.cancelButton}`}>
            취소
          </button>
          <button
            type="button"
            onClick={confirmSelection}
            className={`${styles.button} ${styles.confirmButton}`}
            disabled={!internalSelected}
          >
            선택
          </button>
        </div>
      </div>
    </>
  );
};

export default SelectionPopup;
