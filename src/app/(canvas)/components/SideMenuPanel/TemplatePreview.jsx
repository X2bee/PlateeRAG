"use client";
import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/(canvas)/assets/TemplatePreview.module.scss';
import MiniCanvas from '@/app/(canvas)/components/SideMenuPanel/MiniCanvas';
import { LuX, LuCopy } from "react-icons/lu";
import { devLog } from '@/app/utils/logger';

const TemplatePreview = ({ template, onClose, onUseTemplate }) => {
    const previewRef = useRef(null);
    const canvasRef = useRef(null);

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
                        <div className={styles.tagsContainer}>
                            {template.tags && template.tags.map(tag => (
                                <span key={tag} className={styles.category}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className={styles.actions}>
                        <button 
                            className={styles.useButton}
                            onClick={(e) => {
                                devLog.log('=== TemplatePreview Use Template clicked ===');
                                devLog.log('Event:', e);
                                devLog.log('Template:', template);
                                devLog.log('onUseTemplate function:', onUseTemplate);
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                    onUseTemplate(template);
                                    devLog.log('onUseTemplate called successfully');
                                    onClose();
                                    devLog.log('onClose called successfully');
                                } catch (error) {
                                    devLog.error('Error in Use Template:', error);
                                }
                            }}
                            onMouseDown={(e) => {
                                devLog.log('Use Template mousedown');
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
                                devLog.log('Close button clicked in TemplatePreview');
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

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default TemplatePreview;
