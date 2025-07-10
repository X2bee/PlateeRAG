"use client";
import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/(canvas)/assets/TemplatePreview.module.scss';
import { LuX, LuCopy } from "react-icons/lu";
import MiniCanvas from './MiniCanvas';

const TemplatePreview = ({ template, onClose, onUseTemplate }) => {
    const previewRef = useRef(null);
    const canvasRef = useRef(null);

    // 팝업 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (previewRef.current && !previewRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

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
        <div className={styles.overlay}>
            <div className={styles.previewContainer} ref={previewRef}>
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <h3>{template.name}</h3>
                        <span className={styles.category}>{template.category}</span>
                    </div>
                    <div className={styles.actions}>
                        <button 
                            className={styles.useButton}
                            onClick={() => onUseTemplate(template)}
                            title="Use This Template"
                        >
                            <LuCopy />
                            Use Template
                        </button>
                        <button 
                            className={styles.closeButton}
                            onClick={onClose}
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
