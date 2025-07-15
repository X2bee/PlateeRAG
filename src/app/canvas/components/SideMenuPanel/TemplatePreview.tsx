"use client";
import React, { useRef, useEffect, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import styles from '@/app/canvas/assets/TemplatePreview.module.scss';
import MiniCanvas from '@/app/canvas/components/SideMenuPanel/MiniCanvas';
import { LuX, LuCopy } from "react-icons/lu";
import { devLog } from '@/app/utils/logger';

// Type definitions
interface Position {
    x: number;
    y: number;
}

interface Port {
    id: string;
    name: string;
    type: string;
    required?: boolean;
    multi?: boolean;
}

interface Parameter {
    id: string;
    name: string;
    value: string | number;
    type?: string;
    required?: boolean;
    optional?: boolean;
    options?: Array<{ value: string | number; label?: string }>;
    step?: number;
    min?: number;
    max?: number;
}

interface NodeData {
    id: string;
    nodeName: string;
    functionId?: string;
    inputs?: Port[];
    outputs?: Port[];
    parameters?: Parameter[];
}

interface CanvasNode {
    id: string;
    data: NodeData;
    position: Position;
}

interface EdgeConnection {
    nodeId: string;
    portId: string;
    portType: 'input' | 'output';
}

interface CanvasEdge {
    id: string;
    source: EdgeConnection;
    target: EdgeConnection;
}

interface WorkflowData {
    nodes?: CanvasNode[];
    edges?: CanvasEdge[];
}

interface Template {
    id: string;
    name: string;
    description: string;
    tags: string[];
    nodes: number;
    data?: WorkflowData;
}

interface TemplatePreviewProps {
    template: Template;
    onClose: () => void;
    onUseTemplate: (template: Template) => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, onClose, onUseTemplate }) => {
    const previewRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [onClose]);

    const handleUseTemplate = (template: Template): void => {
        devLog.log('=== TemplatePreview Use Template clicked ===');
        devLog.log('Template:', template);
        devLog.log('onUseTemplate function:', onUseTemplate);
        
        try {
            // Use TemplatePanel's confirmation logic by calling directly
            onUseTemplate(template);
            devLog.log('onUseTemplate called successfully');
            onClose();
            devLog.log('onClose called successfully');
        } catch (error) {
            devLog.error('Error in Use Template:', error);
            toast.error('Failed to load template');
        }
    };

    const handleOverlayClick = (e: MouseEvent<HTMLDivElement>): void => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handlePreviewContainerClick = (e: MouseEvent<HTMLDivElement>): void => {
        e.stopPropagation();
    };

    const handlePreviewContainerMouseDown = (e: MouseEvent<HTMLDivElement>): void => {
        e.stopPropagation();
    };

    const handleUseButtonClick = (e: MouseEvent<HTMLButtonElement>): void => {
        devLog.log('=== TemplatePreview Use Template clicked ===');
        e.preventDefault();
        e.stopPropagation();
        handleUseTemplate(template);
    };

    const handleUseButtonMouseDown = (e: MouseEvent<HTMLButtonElement>): void => {
        devLog.log('Use Template mousedown');
        e.stopPropagation();
    };

    const handleCloseButtonClick = (e: MouseEvent<HTMLButtonElement>): void => {
        devLog.log('Close button clicked in TemplatePreview');
        e.preventDefault();
        e.stopPropagation();
        onClose();
    };

    const handleCloseButtonMouseDown = (e: MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation();
    };

    if (!template) {
        return null;
    }

    const modalContent = (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div 
                className={styles.previewContainer} 
                ref={previewRef}
                data-template-preview="true"
                onClick={handlePreviewContainerClick}
                onMouseDown={handlePreviewContainerMouseDown}
            >
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <h3>{template.name}</h3>
                        <div className={styles.tagsContainer}>
                            {template.tags && template.tags.map((tag: string) => (
                                <span key={tag} className={styles.category}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className={styles.actions}>
                        <button 
                            className={styles.useButton}
                            onClick={handleUseButtonClick}
                            onMouseDown={handleUseButtonMouseDown}
                            title="Use This Template"
                        >
                            <LuCopy />
                            Use Template
                        </button>
                        <button 
                            className={styles.closeButton}
                            onClick={handleCloseButtonClick}
                            onMouseDown={handleCloseButtonMouseDown}
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