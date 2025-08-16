'use client';

import React, { useEffect, useState, useRef } from 'react';
import { HighlightRange } from '../../types/source';
import styles from './PDFHighlighter.module.scss';

interface PDFHighlighterProps {
  pageNumber: number;
  highlightRange: HighlightRange;
  scale: number;
  pageWidth: number;
  pageHeight: number;
}

const PDFHighlighter: React.FC<PDFHighlighterProps> = ({
  pageNumber,
  highlightRange,
  scale,
  pageWidth,
  pageHeight
}) => {
  const [highlightBoxes, setHighlightBoxes] = useState<Array<{
    top: number;
    left: number;
    width: number;
    height: number;
  }>>([]);

  // 현재 페이지가 하이라이트 대상인지 확인
  const shouldHighlight = pageNumber === highlightRange.pageNumber;

  useEffect(() => {
    if (!shouldHighlight) {
      setHighlightBoxes([]);
      return;
    }

    // 간단한 하이라이팅 계산 (라인 기반)
    // 실제 구현에서는 PDF 텍스트 레이어를 분석해야 하지만,
    // 여기서는 근사치로 계산
    const lineHeight = 20 * scale; // 대략적인 라인 높이
    const marginTop = 50 * scale; // 대략적인 상단 여백
    const marginLeft = 50 * scale; // 대략적인 좌측 여백
    const textWidth = (pageWidth * scale) - (marginLeft * 2); // 텍스트 영역 너비

    const boxes = [];
    const startLine = highlightRange.lineStart;
    const endLine = highlightRange.lineEnd;

    for (let line = startLine; line <= endLine; line++) {
      const top = marginTop + (line - 1) * lineHeight;
      
      boxes.push({
        top,
        left: marginLeft,
        width: textWidth,
        height: lineHeight
      });
    }

    setHighlightBoxes(boxes);
  }, [shouldHighlight, highlightRange, scale, pageWidth, pageHeight]);

  if (!shouldHighlight || highlightBoxes.length === 0) {
    return null;
  }

  return (
    <div className={styles.highlightContainer}>
      {highlightBoxes.map((box, index) => (
        <div
          key={index}
          className={styles.highlightBox}
          style={{
            top: `${box.top}px`,
            left: `${box.left}px`,
            width: `${box.width}px`,
            height: `${box.height}px`,
          }}
        />
      ))}
      
      {/* 하이라이트 정보 라벨 */}
      <div className={styles.highlightLabel}>
        라인 {highlightRange.lineStart}
        {highlightRange.lineStart !== highlightRange.lineEnd && 
          `-${highlightRange.lineEnd}`
        } 하이라이트
      </div>
    </div>
  );
};

export default PDFHighlighter;