import React, { memo } from 'react';
import styles from '@/app/canvas/assets/Edge.module.scss';
import type { EdgeProps } from '@/app/canvas/types';

const HORIZONTAL_OFFSET_RATIO = 0.5;
const MIN_HORIZONTAL_OFFSET = 60;
const MAX_HORIZONTAL_OFFSET = 160;
const VERTICAL_OFFSET_RATIO = 0.25;
const MAX_VERTICAL_OFFSET = 120;

const getBezierPath = (x1: number, y1: number, x2: number, y2: number): string => {
    const dx = x2 - x1;
    const dy = y2 - y1;

    const absDx = Math.abs(dx);
    const horizontalOffset = Math.min(
        Math.max(absDx * HORIZONTAL_OFFSET_RATIO, MIN_HORIZONTAL_OFFSET),
        MAX_HORIZONTAL_OFFSET
    );

    const absDy = Math.abs(dy);
    const directionY = dy === 0 ? 0 : dy / absDy;
    const verticalOffset = directionY === 0
        ? 0
        : Math.min(absDy * VERTICAL_OFFSET_RATIO, MAX_VERTICAL_OFFSET);

    const controlPoint1X = x1 + horizontalOffset;
    const controlPoint2X = x2 - horizontalOffset;
    const controlPoint1Y = y1 + verticalOffset * directionY;
    const controlPoint2Y = y2 - verticalOffset * directionY;

    return `M ${x1},${y1} C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${x2},${y2}`;
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
