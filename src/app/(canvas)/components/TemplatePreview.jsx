"use client";
import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/(canvas)/assets/TemplatePreview.module.scss';
import { LuX, LuCopy } from "react-icons/lu";
import MiniCanvas from './MiniCanvas';

const TemplatePreview = ({ template, onClose, onUseTemplate }) => {
    const previewRef = useRef(null);
    const canvasRef = useRef(null);

    // 외부 클릭 감지 로직 제거 - 오버레이 배경 클릭만으로 닫기

    // ESC 키로 닫기
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [onClose]);

    if (!template) {
        return null;
    }

    const modalContent = (
        <div className={styles.overlay} onClick={(e) => {
            // 오버레이 배경을 클릭했을 때만 닫기 (자식 요소 클릭은 제외)
            if (e.target === e.currentTarget) {
                onClose();
            }
        }}>
            <div 
                className={styles.previewContainer} 
                ref={previewRef}
                data-template-preview="true"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <h3>{template.name}</h3>
                        <span className={styles.category}>{template.category}</span>
                    </div>
                    <div className={styles.actions}>
                        <button 
                            className={styles.useButton}
                            onClick={(e) => {
                                console.log('=== TemplatePreview Use Template clicked ===');
                                console.log('Event:', e);
                                console.log('Template:', template);
                                console.log('onUseTemplate function:', onUseTemplate);
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                    onUseTemplate(template);
                                    console.log('onUseTemplate called successfully');
                                    onClose();
                                    console.log('onClose called successfully');
                                } catch (error) {
                                    console.error('Error in Use Template:', error);
                                }
                            }}
                            onMouseDown={(e) => {
                                console.log('Use Template mousedown');
                                e.stopPropagation();
                            }}
                            title="Use This Template"
                        >
                            <LuCopy />
                            Use Template
                        </button>
                        <button 
                            className={styles.closeButton}
                            onClick={(e) => {
                                console.log('Close button clicked in TemplatePreview');
                                e.preventDefault();
                                e.stopPropagation();
                                onClose();
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                            }}
                            title="Close Preview"
                        >
                            <LuX />
                        </button>
                    </div>
                </div>

                <div className={styles.previewContent}>
                    <div className={styles.canvasContainer} ref={canvasRef}>
                        <MiniCanvas template={template} />
                    </div>

                    <div className={styles.templateInfo}>
                        <p className={styles.description}>{template.description}</p>
                        <div className={styles.stats}>
                            <div className={styles.stat}>
                                <span className={styles.statLabel}>Nodes:</span>
                                <span className={styles.statValue}>{template.nodes}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Portal을 사용하여 document.body에 직접 렌더링
    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default TemplatePreview;
