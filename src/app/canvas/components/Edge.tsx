import React, { memo } from 'react';
import styles from '@/app/canvas/assets/Edge.module.scss';
import type { EdgeProps } from '@/app/canvas/types';

const getBezierPath = (x1: number, y1: number, x2: number, y2: number): string => {
    const controlPointX = (x1 + x2) / 2;
    return `M ${x1},${y1} C ${controlPointX},${y1} ${controlPointX},${y2} ${x2},${y2}`;
};

const Edge: React.FC<EdgeProps> = ({
    id,
    sourcePos,
    targetPos,
    onEdgeClick,
    isSelected = false,
    isPreview = false
}) => {
    if (!sourcePos || !targetPos) return null;

    const d = getBezierPath(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y);

    const handleEdgeClick = (e: React.MouseEvent<SVGGElement>): void => {
        if (isPreview) return; // Disable click in preview mode
        e.stopPropagation();
        if (onEdgeClick && id) {
            onEdgeClick(id);
        }
    };

    return (
        <g
            className={`${styles.edgeGroup} ${isSelected ? styles.selected : ''} ${isPreview ? 'preview' : ''}`}
            onClick={handleEdgeClick}
        >
            <path className={styles.edgeHitbox} d={d} />
            <path className={styles.edgePath} d={d} />
        </g>
    );
};

export default memo(Edge);