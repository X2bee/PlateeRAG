import React, { memo } from 'react';
import styles from '@/app/assets/Edge.module.scss';

const getBezierPath = (x1, y1, x2, y2) => {
    const controlPointX1 = x1 + Math.abs(x2 - x1) * 0.5;
    const controlPointX2 = x2 - Math.abs(x2 - x1) * 0.5;
    return `M ${x1},${y1} C ${controlPointX1},${y1} ${controlPointX2},${y2} ${x2},${y2}`;
};

const Edge = ({ sourcePos, targetPos }) => {
    if (!sourcePos || !targetPos) return null;

    const d = getBezierPath(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y);

    return (
        <path className={styles.edgePath} d={d} />
    );
};

export default memo(Edge);