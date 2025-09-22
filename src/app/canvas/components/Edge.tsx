import React, { memo } from 'react';
import styles from '@/app/canvas/assets/Edge.module.scss';
import type { EdgeProps, Position } from '@/app/canvas/types';

type Orientation = -1 | 0 | 1;

const HORIZONTAL_RATIO_COLLAPSED = 0.45;
const HORIZONTAL_RATIO_EXPANDED = 0.35;
const MIN_HORIZONTAL_COLLAPSED = 60;
const MIN_HORIZONTAL_EXPANDED = 90;
const MAX_HORIZONTAL = 240;

const VERTICAL_RATIO_COLLAPSED = 0.3;
const VERTICAL_RATIO_EXPANDED = 0.45;
const MIN_VERTICAL_COLLAPSED = 16;
const MIN_VERTICAL_EXPANDED = 38;
const MAX_VERTICAL = 220;

const NEAR_VERTICAL_THRESHOLD_COLLAPSED = 80;
const NEAR_VERTICAL_THRESHOLD_EXPANDED = 110;
const NEAR_VERTICAL_EXTRA_HORIZONTAL_COLLAPSED = 80;
const NEAR_VERTICAL_EXTRA_HORIZONTAL_EXPANDED = 120;

const STUB_LENGTH_COLLAPSED_OUTPUT = 0;
const STUB_LENGTH_COLLAPSED_INPUT = 0;
const STUB_LENGTH_EXPANDED_OUTPUT = 50;
const STUB_LENGTH_EXPANDED_INPUT = 50;

const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(value, max));
};

const getOrientation = (portType?: 'input' | 'output'): Orientation => {
    if (portType === 'input') return -1;
    if (portType === 'output') return 1;
    return 0;
};

const invertOrientation = (value: Orientation): Orientation => {
    if (value === 1) return -1;
    if (value === -1) return 1;
    return 0;
};

const getStubLength = (portType?: 'input' | 'output', isExpanded?: boolean): number => {
    if (!portType) return 0;
    if (isExpanded) {
        return portType === 'output' ? STUB_LENGTH_EXPANDED_OUTPUT : STUB_LENGTH_EXPANDED_INPUT;
    }
    return portType === 'output' ? STUB_LENGTH_COLLAPSED_OUTPUT : STUB_LENGTH_COLLAPSED_INPUT;
};

const getStubPoint = (pos: Position, orientation: Orientation, length: number): Position => {
    if (orientation === 0 || length === 0) {
        return pos;
    }
    return {
        x: pos.x + orientation * length,
        y: pos.y
    };
};

interface BezierOptions {
    sourcePortType?: 'input' | 'output';
    targetPortType?: 'input' | 'output';
    sourceExpanded?: boolean;
    targetExpanded?: boolean;
    sourcePos: Position;
    targetPos: Position;
}

const buildPath = ({
    sourcePos,
    targetPos,
    sourcePortType,
    targetPortType,
    sourceExpanded,
    targetExpanded
}: BezierOptions): string => {
    const sourceOrientation = getOrientation(sourcePortType);
    const targetOrientation = getOrientation(targetPortType);

    const sourceStubLength = getStubLength(sourcePortType, sourceExpanded);
    const targetStubLength = getStubLength(targetPortType, targetExpanded);

    const sourceStub = getStubPoint(sourcePos, sourceOrientation, sourceStubLength);
    const targetStub = getStubPoint(targetPos, targetOrientation, targetStubLength);

    const dx = targetStub.x - sourceStub.x;
    const dy = targetStub.y - sourceStub.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const anyExpanded = Boolean(sourceExpanded || targetExpanded);

    const horizontalRatio = anyExpanded ? HORIZONTAL_RATIO_EXPANDED : HORIZONTAL_RATIO_COLLAPSED;
    const minHorizontal = anyExpanded ? MIN_HORIZONTAL_EXPANDED : MIN_HORIZONTAL_COLLAPSED;
    const nearVerticalThreshold = anyExpanded ? NEAR_VERTICAL_THRESHOLD_EXPANDED : NEAR_VERTICAL_THRESHOLD_COLLAPSED;
    const nearVerticalExtraHorizontal = anyExpanded
        ? NEAR_VERTICAL_EXTRA_HORIZONTAL_EXPANDED
        : NEAR_VERTICAL_EXTRA_HORIZONTAL_COLLAPSED;

    let horizontalOffset = clamp(absDx * horizontalRatio, minHorizontal, MAX_HORIZONTAL);

    const verticalRatio = anyExpanded ? VERTICAL_RATIO_EXPANDED : VERTICAL_RATIO_COLLAPSED;
    const minVertical = anyExpanded ? MIN_VERTICAL_EXPANDED : MIN_VERTICAL_COLLAPSED;
    let verticalOffset = clamp(absDy * verticalRatio, minVertical, MAX_VERTICAL);

    let verticalDirection: Orientation = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

    if (absDx <= nearVerticalThreshold) {
        horizontalOffset = Math.max(horizontalOffset, nearVerticalExtraHorizontal);
        verticalOffset = clamp((absDy + nearVerticalThreshold) * verticalRatio, minVertical + 12, MAX_VERTICAL);
        if (verticalDirection === 0) {
            const diff = targetPos.y - sourcePos.y;
            verticalDirection = diff === 0 ? 1 : (diff > 0 ? 1 : -1);
        }
    }

    const fallbackHorizontal = dx === 0
        ? (sourceOrientation !== 0 ? sourceOrientation : 1)
        : (dx > 0 ? 1 : -1);

    const departureOrientation: Orientation = sourceOrientation !== 0
        ? sourceOrientation
        : fallbackHorizontal;

    const arrivalOrientation: Orientation = targetOrientation !== 0
        ? targetOrientation
        : invertOrientation(fallbackHorizontal);

    const controlPoint1 = {
        x: sourceStub.x + horizontalOffset * departureOrientation,
        y: sourceStub.y + verticalOffset * verticalDirection
    };

    const controlPoint2 = {
        x: targetStub.x + horizontalOffset * arrivalOrientation,
        y: targetStub.y - verticalOffset * verticalDirection
    };

    const pathSegments: string[] = [`M ${sourcePos.x},${sourcePos.y}`];

    if (sourceOrientation !== 0 && sourceStubLength > 0) {
        pathSegments.push(`L ${sourceStub.x},${sourceStub.y}`);
    }

    pathSegments.push(
        `C ${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${targetStub.x},${targetStub.y}`
    );

    if (targetOrientation !== 0 && targetStubLength > 0) {
        pathSegments.push(`L ${targetPos.x},${targetPos.y}`);
    }

    return pathSegments.join(' ');
};

const Edge: React.FC<EdgeProps> = ({
    id,
    sourcePos,
    targetPos,
    sourcePortType,
    targetPortType,
    sourceExpanded,
    targetExpanded,
    onEdgeClick,
    isSelected = false,
    isPreview = false
}) => {
    if (!sourcePos || !targetPos) return null;

    const d = buildPath({
        sourcePos,
        targetPos,
        sourcePortType,
        targetPortType,
        sourceExpanded,
        targetExpanded
    });

    const handleEdgeClick = (e: React.MouseEvent<SVGGElement>): void => {
        if (isPreview) return;
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
