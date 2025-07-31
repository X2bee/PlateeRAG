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
  onSelect,
  onConfirm,
  onClose,
  onSearchChange
}) => {
  const [internalSelected, setInternalSelected] = useState(selected);
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery);
  const modalRef = useRef<HTMLDivElement>(null);

  // 검색어가 외부에서 변경될 때 내부 상태 업데이트
  useEffect(() => {
    setInternalSearchQuery(searchQuery);
  }, [searchQuery]);

  // 선택된 항목이 외부에서 변경될 때 내부 상태 업데이트
  useEffect(() => {
    setInternalSelected(selected);
  }, [selected]);

  // 필터링된 옵션들
  const filteredOptions = useMemo(() => {
    const query = internalSearchQuery.trim();
    if (!query) return options;

    return options.filter(item => {
      const lowerQuery = query.toLowerCase();
      if (typeof item === 'string') {
        return item.toLowerCase().includes(lowerQuery);
      }
      return (
        item.name?.toLowerCase().includes(lowerQuery) || 
        (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
        (item.user_name && item.user_name.toLowerCase().includes(lowerQuery)) ||
        (item.base_model && item.base_model.toLowerCase().includes(lowerQuery)) ||
        (item.training_method && item.training_method.toLowerCase().includes(lowerQuery)) ||
        (item.main_task && item.main_task.toLowerCase().includes(lowerQuery))
      );
    });
  }, [options, internalSearchQuery]);

  const getItemName = useCallback((item: any): string => {
    return typeof item === 'string' ? item : (item.name || '');
  }, []);

  const isSelected = useCallback((item: any): boolean => {
    return internalSelected === getItemName(item);
  }, [internalSelected, getItemName]);

  const selectItem = useCallback((item: any) => {
    const itemName = getItemName(item);
    setInternalSelected(itemName);
    onSelect({ name: itemName, item });
  }, [getItemName, onSelect]);

  const confirmSelection = useCallback(() => {
    if (internalSelected) {
      const selectedItem = filteredOptions.find(item => getItemName(item) === internalSelected);
      if (selectedItem) {
        onConfirm({ name: internalSelected, item: selectedItem });
      }
    }
  }, [internalSelected, filteredOptions, getItemName, onConfirm]);

  const handleDoubleClick = useCallback((item: any) => {
    selectItem(item);
    const itemName = getItemName(item);
    onConfirm({ name: itemName, item });
  }, [selectItem, getItemName, onConfirm]);

  const closePopup = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      closePopup();
    }
  }, [closePopup]);

  const handleKeydown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      closePopup();
    }
  }, [closePopup]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInternalSearchQuery(value);
    onSearchChange?.(value);
  }, [onSearchChange]);

  // 모달이 열릴 때 포커스 설정
  useEffect(() => {
    if (show && modalRef.current) {
      modalRef.current.focus();
    }
  }, [show]);

  // Body 스크롤 제어
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show) return null;

  return (
    <div 
      className={styles.backdrop}
      onClick={handleBackdropClick}
      onKeyDown={handleKeydown}
      tabIndex={0}
    >
      <div 
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
      >
        {/* 헤더 */}
        <div className={styles.header}>
          <h2 id="popup-title" className={styles.title}>{title}</h2>
          <button 
            type="button"
            onClick={closePopup} 
            className={styles.closeButton}
            aria-label="닫기"
          >
            <svg className={styles.closeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 검색 */}
        <div className={styles.searchContainer}>
          <input 
            type="text" 
            value={internalSearchQuery}
            onChange={handleSearchChange}
            placeholder={`${type === 'model' ? '모델' : type === 'dataset' ? '데이터셋' : '컬럼'} 검색...`}
            className={styles.searchInput}
          />
        </div>
        
        {/* 콘텐츠 */}
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner} />
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className={styles.emptyState}>
              <p>검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className={styles.itemsGrid}>
              {filteredOptions.map((item, index) => {
                const itemKey = getItemName(item) + index;
                const itemName = getItemName(item);
                const selected = type === 'columns' ? internalSelected === item : isSelected(item);

                return (
                  <button
                    key={itemKey}
                    type="button"
                    className={`${styles.itemButton} ${selected ? styles.selected : ''}`}
                    onClick={() => selectItem(item)}
                    onDoubleClick={() => handleDoubleClick(item)}
                  >
                    <h3 className={styles.itemName}>
                      {type === 'columns' ? item : itemName}
                    </h3>
                    
                    {type !== 'columns' && (
                      <div className={styles.itemDetails}>
                        {item.user_name && item.user_name !== "Unknown" && (
                          <p>생성자: {item.user_name}</p>
                        )}
                        
                        {type === 'model' && (
                          <>
                            {item.base_model && item.base_model !== "Unknown" && (
                              <p>베이스 모델: {item.base_model}</p>
                            )}
                            {item.training_method && item.training_method !== "Unknown" && (
                              <p>학습 방법: {item.training_method}</p>
                            )}
                          </>
                        )}
                        
                        {type === 'dataset' && (
                          <>
                            {item.main_task && item.main_task !== "Unknown" && (
                              <p>주요 작업: {item.main_task}</p>
                            )}
                            {item.number_rows && item.number_rows !== "Unknown" && (
                              <p>데이터 수: {item.number_rows}</p>
                            )}
                            {item.description && item.description !== "Unknown" && (
                              <p className={styles.description}>설명: {item.description}</p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    
                    {type === 'model' && (
                      <div className={styles.badges}>
                        {item.use_deepspeed && (
                          <span className={`${styles.badge} ${styles.deepspeedBadge}`}>DeepSpeed</span>
                        )}
                        {item.use_peft && (
                          <span className={`${styles.badge} ${styles.peftBadge}`}>PEFT</span>
                        )}
                        {item.use_flash_attention && (
                          <span className={`${styles.badge} ${styles.flashAttentionBadge}`}>Flash Attention</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* 푸터 버튼들 */}
        <div className={styles.footer}>
          <button 
            type="button"
            onClick={closePopup} 
            className={`${styles.button} ${styles.cancelButton}`}
          >
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
    </div>
  );
};

export default SelectionPopup;