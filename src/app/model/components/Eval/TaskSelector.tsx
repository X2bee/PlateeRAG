'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { TaskGroups } from '@/app/model/components/types';
import styles from '@/app/model/assets/TaskSelector.module.scss';

export const TOP_TASKS = [
    'global_mmlu_ko',
    'global_mmlu_full_ko',
    'gsm8k_cot',
    'humaneval',
    'hellaswag',
    'arc_easy',
    'arc_challenge',
    'truthfulqa',
    'piqa',
    'commonsense_qa',
    'drop'
] as const;

interface TaskSelectorProps {
  show: boolean;
  taskGroups: TaskGroups;
  selectedTasks: string[];
  onTaskChange: (tasks: string[]) => void;
  onConfirm: (tasks: string[]) => void;
  onClose: () => void;
}

interface TooltipState {
  show: boolean;
  content: string;
  position: { x: number; y: number };
}

const TaskSelector: React.FC<TaskSelectorProps> = ({
  show,
  taskGroups = {},
  selectedTasks = [],
  onTaskChange,
  onConfirm,
  onClose
}) => {
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [tooltip, setTooltip] = useState<TooltipState>({
    show: false,
    content: '',
    position: { x: 0, y: 0 }
  });

  // Task 검색 필터링
  const filteredTasks = useMemo(() => {
    return Object.entries(taskGroups).reduce((acc, [groupName, groupData]) => {
      const filteredGroupTasks = groupData.tasks.filter(task => {
        if (!taskSearchQuery.trim()) return true;
        const query = taskSearchQuery.toLowerCase();
        return (
          task.toLowerCase().includes(query) || 
          groupName.toLowerCase().includes(query) ||
          groupData.description.toLowerCase().includes(query)
        );
      });

      if (filteredGroupTasks.length > 0) {
        acc[groupName] = {
          description: groupData.description,
          tasks: filteredGroupTasks
        };
      }
      return acc;
    }, {} as TaskGroups);
  }, [taskGroups, taskSearchQuery]);

  const selectTask = useCallback((task: string) => {
    const index = selectedTasks.indexOf(task);
    let newSelectedTasks: string[];
    
    if (index > -1) {
      newSelectedTasks = selectedTasks.filter(t => t !== task);
    } else {
      newSelectedTasks = [...selectedTasks, task];
    }
    
    onTaskChange(newSelectedTasks);
  }, [selectedTasks, onTaskChange]);

  const clearAllTasks = useCallback(() => {
    onTaskChange([]);
  }, [onTaskChange]);

  const confirmSelection = useCallback(() => {
    onConfirm(selectedTasks);
  }, [selectedTasks, onConfirm]);

  const closeSelector = useCallback(() => {
    onClose();
  }, [onClose]);

  const showGroupTooltip = useCallback((event: React.MouseEvent<HTMLButtonElement>, description: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      content: description,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      }
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(prev => ({ ...prev, show: false }));
  }, []);

  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      closeSelector();
    }
  }, [closeSelector]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeSelector();
    }
  }, [closeSelector]);

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
    <>
      <div 
        className={styles.backdrop}
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div 
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>벤치마크 태스크 선택</h2>
              <p className={styles.subtitle}>
                {selectedTasks.length > 0 ? `${selectedTasks.length}개 선택됨` : '태스크를 선택하세요'}
              </p>
            </div>
            <button onClick={closeSelector} className={styles.closeButton}>
              <svg className={styles.closeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* 선택된 태스크 표시 영역 */}
          {selectedTasks.length > 0 && (
            <div className={styles.selectedTasksContainer}>
              <div className={styles.selectedTasksHeader}>
                <span className={styles.selectedTasksLabel}>선택된 태스크 ({selectedTasks.length}개)</span>
                <button 
                  type="button" 
                  className={styles.clearAllButton}
                  onClick={clearAllTasks}
                >
                  모두 제거
                </button>
              </div>
              <div className={styles.selectedTasksList}>
                {selectedTasks.map((task, index) => (
                  <span key={`${task}-${index}`} className={styles.selectedTaskTag}>
                    <span className={styles.taskIndex}>{index + 1}.</span>
                    {task}
                    <button 
                      type="button" 
                      className={styles.removeTaskButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectTask(task);
                      }}
                    >
                      <svg className={styles.removeIcon} fill="currentColor" viewBox="0 0 8 8">
                        <path d="m0 0 1 1 1.5-1.5 1.5 1.5 1-1-1.5-1.5 1.5-1.5-1-1-1.5 1.5-1.5-1.5z"/>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
              placeholder="태스크 검색..." 
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.content}>
            {Object.keys(filteredTasks).length === 0 ? (
              <div className={styles.emptyState}>
                <p>검색 결과가 없습니다.</p>
              </div>
            ) : (
              <>
                {/* Top Tasks 섹션 */}
                {TOP_TASKS.length > 0 && !taskSearchQuery.trim() && (
                  <div className={styles.topTasksSection}>
                    <div className={styles.topTasksHeader}>
                      <h3 className={styles.topTasksTitle}>
                        ⭐ Top Tasks
                      </h3>
                    </div>
                    <div className={styles.topTasksContainer}>
                      <div className={styles.topTasksList}>
                        {TOP_TASKS.map((task) => (
                          <button
                            key={task}
                            className={`${styles.topTaskItem} ${selectedTasks.includes(task) ? styles.selected : ''}`}
                            onClick={() => selectTask(task)}
                          >
                            {task}
                            {selectedTasks.includes(task) && (
                              <span className={styles.taskNumber}>
                                {selectedTasks.indexOf(task) + 1}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 일반 Task 그룹들 */}
                <div className={styles.taskGroups}>
                  {Object.entries(filteredTasks).map(([groupName, groupData]) => (
                    <div key={groupName} className={styles.taskGroup}>
                      <div className={styles.taskGroupHeader}>
                        <h3 className={styles.taskGroupTitle}>
                          {groupName.replace(/_/g, ' ')}
                        </h3>
                        <button
                          className={styles.tooltipButton}
                          onMouseEnter={(e) => showGroupTooltip(e, groupData.description)}
                          onMouseLeave={hideTooltip}
                        >
                          <svg className={styles.infoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      <div className={styles.taskList}>
                        {groupData.tasks.map((task) => (
                          <button
                            key={task}
                            className={`${styles.taskItem} ${selectedTasks.includes(task) ? styles.selected : ''}`}
                            onClick={() => selectTask(task)}
                          >
                            {task}
                            {selectedTasks.includes(task) && (
                              <span className={styles.taskNumber}>
                                {selectedTasks.indexOf(task) + 1}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          
          <div className={styles.footer}>
            <div className={styles.footerLeft}>
              {selectedTasks.length > 0 && (
                <span className={styles.selectedCount}>
                  {selectedTasks.length}개 선택됨
                </span>
              )}
            </div>
            <div className={styles.footerButtons}>
              <button 
                onClick={closeSelector} 
                className={`${styles.button} ${styles.cancelButton}`}
              >
                취소
              </button>
              <button 
                onClick={confirmSelection} 
                className={`${styles.button} ${styles.confirmButton}`}
              >
                완료
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 툴팁 */}
      {tooltip.show && (
        <div 
          className={styles.tooltip}
          style={{
            left: `${tooltip.position.x}px`,
            top: `${tooltip.position.y}px`
          }}
        >
          {tooltip.content}
          <div className={styles.tooltipArrow} />
        </div>
      )}
    </>
  );
};

export default TaskSelector;