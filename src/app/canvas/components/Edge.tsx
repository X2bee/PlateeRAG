import React, { memo } from 'react';
import styles from '@/app/canvas/assets/Edge.module.scss';
import type { EdgeProps } from '@/app/canvas/types';

const getBezierPath = (x1: number, y1: number, x2: number, y2: number): string => {
    const dx = x2 - x1;
    const offsetX = Math.abs(dx) * 0.5;
    const controlPoint1X = x1 + (dx > 0 ? offsetX : -offsetX);
    const controlPoint2X = x2 - (dx > 0 ? offsetX : -offsetX);
    
    return `M ${x1},${y1} C ${controlPoint1X},${y1} ${controlPoint2X},${y2} ${x2},${y2}`;
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