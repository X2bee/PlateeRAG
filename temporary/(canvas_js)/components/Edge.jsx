import React, { memo } from 'react';
import styles from '@/app/canvas/assets/Edge.module.scss';

const getBezierPath = (x1, y1, x2, y2) => {
    const controlPointX1 = x1 + Math.abs(x2 - x1) * 0.5;
    const controlPointX2 = x2 - Math.abs(x2 - x1) * 0.5;
    return `M ${x1},${y1} C ${controlPointX1},${y1} ${controlPointX2},${y2} ${x2},${y2}`;
};

const Edge = ({ id, sourcePos, targetPos, onEdgeClick, isSelected, isPreview = false }) => {
    if (!sourcePos || !targetPos) return null;

    const d = getBezierPath(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y);

    const handleEdgeClick = (e) => {
        if (isPreview) return; // 프리뷰 모드에서는 클릭 비활성화
        e.stopPropagation();
        onEdgeClick(id);
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