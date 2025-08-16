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
  textContent?: any; // PDF.js TextContent
}


interface HighlightBox {
  top: number;
  left: number;
  width: number;
  height: number;
  type: 'text' | 'image' | 'table';
}

const PDFHighlighter: React.FC<PDFHighlighterProps> = ({
  pageNumber,
  highlightRange,
  scale,
  pageWidth,
  pageHeight,
  textContent
}) => {
  const [highlightBoxes, setHighlightBoxes] = useState<HighlightBox[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // 현재 페이지가 하이라이트 대상인지 확인
  const shouldHighlight = pageNumber === highlightRange.pageNumber;

  // TextLayer에서 실제 텍스트 요소를 찾아 라인별로 정확하게 그룹화
  const findTextElements = () => {
    console.log('🔍 [PDF Highlighter] Starting findTextElements...');
    
    if (!containerRef.current || !shouldHighlight) {
      console.log('❌ [PDF Highlighter] Early return:', { 
        containerExists: !!containerRef.current, 
        shouldHighlight 
      });
      return [];
    }

    console.log('📍 [PDF Highlighter] Container ref found:', containerRef.current);
    
    const textLayerDiv = containerRef.current.parentElement?.querySelector('.react-pdf__Page__textContent');
    console.log('📄 [PDF Highlighter] TextLayer div:', textLayerDiv);
    
    if (!textLayerDiv) {
      console.log('❌ [PDF Highlighter] No textLayer div found');
      // 대안 탐색
      const allTextLayers = document.querySelectorAll('.react-pdf__Page__textContent');
      console.log('🔍 [PDF Highlighter] Available text layers in document:', allTextLayers.length);
      allTextLayers.forEach((layer, index) => {
        console.log(`📋 [PDF Highlighter] Text layer ${index}:`, layer);
      });
      return [];
    }

    const textSpans = Array.from(textLayerDiv.querySelectorAll('span')) as HTMLSpanElement[];
    console.log(`📝 [PDF Highlighter] Found ${textSpans.length} text spans`);
    
    if (textSpans.length === 0) {
      console.log('❌ [PDF Highlighter] No text spans found');
      return [];
    }

    // 텍스트 요소들을 Y 좌표로 정렬
    console.log('📐 [PDF Highlighter] Processing span positions...');
    const containerRect = textLayerDiv.getBoundingClientRect();
    console.log('📦 [PDF Highlighter] Container rect:', {
      top: containerRect.top,
      left: containerRect.left,
      width: containerRect.width,
      height: containerRect.height
    });

    const sortedSpans = textSpans
      .map((span, index) => {
        const rect = span.getBoundingClientRect();
        const spanData = {
          span,
          index,
          top: rect.top - containerRect.top,
          left: rect.left - containerRect.left,
          bottom: rect.bottom - containerRect.top,
          width: rect.width,
          height: rect.height,
          text: span.textContent || ''
        };
        
        if (index < 5) { // 처음 5개만 로그
          console.log(`📝 [PDF Highlighter] Span ${index}:`, {
            text: `"${spanData.text}"`,
            position: `(${spanData.left.toFixed(1)}, ${spanData.top.toFixed(1)})`,
            size: `${spanData.width.toFixed(1)}x${spanData.height.toFixed(1)}`
          });
        }
        
        return spanData;
      })
      .sort((a, b) => a.top - b.top);
      
    console.log(`📊 [PDF Highlighter] Sorted ${sortedSpans.length} spans by Y position`);

    // 라인 그룹화 - 더 정확한 알고리즘
    console.log('📋 [PDF Highlighter] Starting line grouping...');
    const lines: HTMLSpanElement[][] = [];
    let currentLineSpans: HTMLSpanElement[] = [];
    let currentLineTop = -1;
    let currentLineBottom = -1;
    let lineNumber = 0;

    sortedSpans.forEach(({ span, top, bottom, text, index }) => {
      // 라인 높이의 절반 이상 겹치면 같은 라인으로 간주
      const lineHeight = bottom - top;
      const tolerance = Math.max(3, lineHeight * 0.3); // 최소 3px 또는 라인 높이의 30%

      const isNewLine = currentLineTop === -1 || top > currentLineBottom - tolerance;

      if (isNewLine) {
        // 새로운 라인 시작
        if (currentLineSpans.length > 0) {
          lines.push([...currentLineSpans]);
          console.log(`📄 [PDF Highlighter] Line ${lineNumber} completed with ${currentLineSpans.length} spans:`, 
            currentLineSpans.map(s => `"${s.textContent}"`).join(' '));
          lineNumber++;
        }
        currentLineSpans = [span];
        currentLineTop = top;
        currentLineBottom = bottom;
        console.log(`🆕 [PDF Highlighter] Starting new line ${lineNumber} with span ${index}: "${text}" at Y=${top.toFixed(1)}`);
      } else {
        // 같은 라인에 추가
        currentLineSpans.push(span);
        currentLineTop = Math.min(currentLineTop, top);
        currentLineBottom = Math.max(currentLineBottom, bottom);
        console.log(`➕ [PDF Highlighter] Adding to line ${lineNumber}, span ${index}: "${text}" (tolerance: ${tolerance.toFixed(1)})`);
      }
    });

    // 마지막 라인 추가
    if (currentLineSpans.length > 0) {
      lines.push(currentLineSpans);
      console.log(`📄 [PDF Highlighter] Final line ${lineNumber} completed with ${currentLineSpans.length} spans:`, 
        currentLineSpans.map(s => `"${s.textContent}"`).join(' '));
    }
    
    console.log(`✅ [PDF Highlighter] Line grouping complete: ${lines.length} lines found`);

    // 각 라인 내에서 X 좌표로 정렬
    lines.forEach(line => {
      line.sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectA.left - rectB.left;
      });
    });

    return lines;
  };

  // 이미지와 테이블 요소들을 Y 좌표와 함께 찾아 하이라이팅
  const findImageAndTableElements = () => {
    console.log('🖼️ [PDF Highlighter] Starting findImageAndTableElements...');
    
    if (!containerRef.current || !shouldHighlight) {
      console.log('❌ [PDF Highlighter] Early return from findImageAndTableElements:', { 
        containerExists: !!containerRef.current, 
        shouldHighlight 
      });
      return [];
    }

    const pageElement = containerRef.current.parentElement;
    console.log('📄 [PDF Highlighter] Page element for image search:', pageElement);
    
    if (!pageElement) {
      console.log('❌ [PDF Highlighter] No page element found for image search');
      return [];
    }

    const elements: Array<HighlightBox & { yPosition: number }> = [];

    // SVG 요소들 (이미지나 그래픽 요소로 간주)
    const svgElements = pageElement.querySelectorAll('svg');
    console.log(`🎨 [PDF Highlighter] Found ${svgElements.length} SVG elements`);
    
    svgElements.forEach((svg, index) => {
      const rect = svg.getBoundingClientRect();
      const containerRect = pageElement.getBoundingClientRect();
      
      const element = {
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left,
        width: rect.width,
        height: rect.height,
        type: 'image' as const,
        yPosition: rect.top - containerRect.top
      };
      
      console.log(`🎨 [PDF Highlighter] SVG ${index}:`, {
        position: `(${element.left.toFixed(1)}, ${element.top.toFixed(1)})`,
        size: `${element.width.toFixed(1)}x${element.height.toFixed(1)}`,
        element: svg
      });
      
      elements.push(element);
    });

    // Canvas 요소들 (이미지로 간주)
    const canvasElements = pageElement.querySelectorAll('canvas');
    console.log(`🖼️ [PDF Highlighter] Found ${canvasElements.length} Canvas elements`);
    
    canvasElements.forEach((canvas, index) => {
      const rect = canvas.getBoundingClientRect();
      const containerRect = pageElement.getBoundingClientRect();
      
      const element = {
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left,
        width: rect.width,
        height: rect.height,
        type: 'image' as const,
        yPosition: rect.top - containerRect.top
      };
      
      console.log(`🖼️ [PDF Highlighter] Canvas ${index}:`, {
        position: `(${element.left.toFixed(1)}, ${element.top.toFixed(1)})`,
        size: `${element.width.toFixed(1)}x${element.height.toFixed(1)}`,
        element: canvas
      });
      
      elements.push(element);
    });

    // Path 요소들 (도형이나 그래픽 요소로 간주)
    const pathElements = pageElement.querySelectorAll('path');
    pathElements.forEach(path => {
      const parentSvg = path.closest('svg');
      if (parentSvg) {
        const rect = parentSvg.getBoundingClientRect();
        const containerRect = pageElement.getBoundingClientRect();
        
        // 중복 방지를 위해 이미 추가된 SVG인지 확인
        const alreadyExists = elements.some(el => 
          Math.abs(el.top - (rect.top - containerRect.top)) < 1 &&
          Math.abs(el.left - (rect.left - containerRect.left)) < 1
        );
        
        if (!alreadyExists) {
          elements.push({
            top: rect.top - containerRect.top,
            left: rect.left - containerRect.left,
            width: rect.width,
            height: rect.height,
            type: 'image',
            yPosition: rect.top - containerRect.top
          });
        }
      }
    });

    return elements;
  };

  // 테이블 패턴 감지 (텍스트 기반) - 개선된 버전
  const detectTablePatterns = (lines: HTMLSpanElement[][], targetLineStart: number, targetLineEnd: number) => {
    const tableElements: Array<HighlightBox & { lineNumbers: number[] }> = [];
    
    if (lines.length < 2) return tableElements;

    // 지정된 라인 범위에서 테이블 패턴 찾기
    const startIndex = Math.max(0, targetLineStart - 1);
    const endIndex = Math.min(lines.length - 1, targetLineEnd - 1);
    
    // 연속된 라인들이 정렬된 열 구조를 가지는지 확인
    for (let i = startIndex; i <= endIndex && i < lines.length - 1; i++) {
      const currentLine = lines[i];
      const nextLine = lines[i + 1];
      
      if (currentLine.length >= 2 && nextLine.length >= 2) {
        // 각 라인의 요소들이 비슷한 X 좌표에 정렬되어 있는지 확인
        const currentPositions = currentLine.map(span => {
          const rect = span.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            text: span.textContent?.trim() || ''
          };
        });
        
        const nextPositions = nextLine.map(span => {
          const rect = span.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            text: span.textContent?.trim() || ''
          };
        });
        
        let alignedColumns = 0;
        const tolerance = 15; // 15px 오차 허용
        
        // 탭이나 공백으로 구분된 열 구조 확인
        for (const currPos of currentPositions) {
          for (const nextPos of nextPositions) {
            if (Math.abs(currPos.left - nextPos.left) <= tolerance) {
              alignedColumns++;
              break;
            }
          }
        }
        
        // 정렬된 열이 2개 이상이고, 숫자나 특정 패턴이 있으면 테이블로 간주
        const hasTabularData = currentPositions.some(pos => 
          /^\d+(\.\d+)?$/.test(pos.text) || // 숫자
          /^\$\d+/.test(pos.text) || // 금액
          /^\d{4}-\d{2}-\d{2}/.test(pos.text) || // 날짜
          pos.text.length <= 3 // 짧은 코드나 약어
        );
        
        if (alignedColumns >= 2 && hasTabularData) {
          const firstSpan = currentLine[0];
          const lastSpan = currentLine[currentLine.length - 1];
          const firstRect = firstSpan.getBoundingClientRect();
          const lastRect = lastSpan.getBoundingClientRect();
          
          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            
            // 다음 라인까지 포함한 테이블 영역
            const nextFirstSpan = nextLine[0];
            const nextLastSpan = nextLine[nextLine.length - 1];
            const nextFirstRect = nextFirstSpan.getBoundingClientRect();
            const nextLastRect = nextLastSpan.getBoundingClientRect();
            
            tableElements.push({
              top: firstRect.top - containerRect.top,
              left: Math.min(firstRect.left, nextFirstRect.left) - containerRect.left,
              width: Math.max(lastRect.right, nextLastRect.right) - Math.min(firstRect.left, nextFirstRect.left),
              height: (nextLastRect.bottom - firstRect.top),
              type: 'table',
              lineNumbers: [i + 1, i + 2] // 1-based line numbers
            });
          }
        }
      }
    }
    
    return tableElements;
  };

  useEffect(() => {
    if (!shouldHighlight) {
      setHighlightBoxes([]);
      return;
    }

    // DOM이 업데이트된 후 실행하기 위해 setTimeout 사용
    const timer = setTimeout(() => {
      console.log('🚀 [PDF Highlighter] Starting highlighting process...');
      console.log('🎯 [PDF Highlighter] Target:', {
        page: pageNumber,
        highlightPage: highlightRange.pageNumber,
        lineStart: highlightRange.lineStart,
        lineEnd: highlightRange.lineEnd,
        shouldHighlight
      });
      
      const lines = findTextElements();
      console.log(`📚 [PDF Highlighter] Found ${lines.length} lines total`);
      
      // 각 라인의 내용을 로그
      lines.forEach((line, index) => {
        const lineText = line.map(span => span.textContent).join(' ');
        console.log(`📄 [PDF Highlighter] Line ${index + 1}: "${lineText}"`);
      });
      
      const imageElements = findImageAndTableElements();
      console.log(`🖼️ [PDF Highlighter] Found ${imageElements.length} image elements`);
      
      const tableElements = detectTablePatterns(lines, highlightRange.lineStart, highlightRange.lineEnd);
      console.log(`📊 [PDF Highlighter] Found ${tableElements.length} table elements`);
      
      const boxes: HighlightBox[] = [];

      // 지정된 라인 범위의 텍스트 하이라이팅
      const startLine = highlightRange.lineStart - 1; // 0-based index
      const endLine = highlightRange.lineEnd - 1;
      
      console.log('🔢 [PDF Highlighter] Target line indices:', {
        startLine: startLine,
        endLine: endLine,
        totalLines: lines.length
      });

      // 라인별 Y 좌표 범위 계산
      let lineYMin = Infinity;
      let lineYMax = -Infinity;

      for (let lineIndex = startLine; lineIndex <= endLine && lineIndex < lines.length; lineIndex++) {
        const lineSpans = lines[lineIndex];
        console.log(`🎯 [PDF Highlighter] Processing target line ${lineIndex + 1} (0-based: ${lineIndex})`);
        
        if (!lineSpans || lineSpans.length === 0) {
          console.log(`⚠️ [PDF Highlighter] Line ${lineIndex + 1} is empty or undefined`);
          continue;
        }

        console.log(`📝 [PDF Highlighter] Line ${lineIndex + 1} has ${lineSpans.length} spans:`, 
          lineSpans.map(span => `"${span.textContent}"`).join(' '));

        // 라인의 첫 번째와 마지막 요소의 위치를 기반으로 하이라이트 박스 생성
        const firstSpan = lineSpans[0];
        const lastSpan = lineSpans[lineSpans.length - 1];
        
        const firstRect = firstSpan.getBoundingClientRect();
        const lastRect = lastSpan.getBoundingClientRect();
        
        console.log(`📐 [PDF Highlighter] Line ${lineIndex + 1} bounds:`, {
          firstSpan: {
            text: firstSpan.textContent,
            rect: { top: firstRect.top, left: firstRect.left, width: firstRect.width, height: firstRect.height }
          },
          lastSpan: {
            text: lastSpan.textContent,
            rect: { top: lastRect.top, left: lastRect.left, width: lastRect.width, height: lastRect.height }
          }
        });
        
        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          
          const lineTop = firstRect.top - containerRect.top;
          const lineBottom = firstRect.bottom - containerRect.top;
          const lineLeft = firstRect.left - containerRect.left;
          const lineWidth = (lastRect.right - firstRect.left);
          
          lineYMin = Math.min(lineYMin, lineTop);
          lineYMax = Math.max(lineYMax, lineBottom);
          
          const highlightBox = {
            top: lineTop,
            left: lineLeft,
            width: lineWidth,
            height: firstRect.height,
            type: 'text' as const
          };
          
          console.log(`✅ [PDF Highlighter] Created highlight box for line ${lineIndex + 1}:`, {
            position: `(${lineLeft.toFixed(1)}, ${lineTop.toFixed(1)})`,
            size: `${lineWidth.toFixed(1)}x${firstRect.height.toFixed(1)}`,
            relativeToContainer: true
          });
          
          boxes.push(highlightBox);
        }
      }
      
      console.log(`📏 [PDF Highlighter] Text lines Y range: ${lineYMin === Infinity ? 'none' : lineYMin.toFixed(1)} - ${lineYMax === -Infinity ? 'none' : lineYMax.toFixed(1)}`);

      // 라인 범위에 포함된 이미지 요소들 추가 (Y 좌표 기반 매칭)
      console.log('🖼️ [PDF Highlighter] Processing image elements...');
      imageElements.forEach((element, index) => {
        // Y 좌표 기반으로 라인 범위와 겹치는지 확인
        const elementTop = element.yPosition;
        const elementBottom = element.yPosition + element.height;
        
        // 여유를 두고 겹침 확인 (라인 높이의 50% 정도)
        const tolerance = 20;
        
        console.log(`🖼️ [PDF Highlighter] Image ${index}:`, {
          position: `Y: ${elementTop.toFixed(1)} - ${elementBottom.toFixed(1)}`,
          size: `${element.width.toFixed(1)}x${element.height.toFixed(1)}`,
          textRangeY: lineYMin !== Infinity ? `${lineYMin.toFixed(1)} - ${lineYMax.toFixed(1)}` : 'none',
          tolerance
        });
        
        if (lineYMin !== Infinity && lineYMax !== -Infinity) {
          const overlaps = (elementTop <= lineYMax + tolerance && elementBottom >= lineYMin - tolerance) ||
                          (elementTop >= lineYMin - tolerance && elementTop <= lineYMax + tolerance);
                          
          console.log(`🖼️ [PDF Highlighter] Image ${index} overlaps with text: ${overlaps}`);
          
          if (overlaps) {
            const { yPosition, ...boxWithoutY } = element;
            boxes.push(boxWithoutY);
            console.log(`✅ [PDF Highlighter] Added image ${index} to highlight boxes`);
          }
        }
      });

      // 테이블 요소들 추가 (이미 라인 범위 내에서 감지됨)
      console.log('📊 [PDF Highlighter] Processing table elements...');
      tableElements.forEach((element, index) => {
        console.log(`📊 [PDF Highlighter] Table ${index}:`, {
          lineNumbers: element.lineNumbers,
          position: `(${element.left.toFixed(1)}, ${element.top.toFixed(1)})`,
          size: `${element.width.toFixed(1)}x${element.height.toFixed(1)}`
        });
        
        const { lineNumbers, ...boxWithoutLineNumbers } = element;
        boxes.push(boxWithoutLineNumbers);
        console.log(`✅ [PDF Highlighter] Added table ${index} to highlight boxes`);
      });

      // 텍스트가 없고 이미지나 테이블만 있는 경우 처리
      if (boxes.filter(box => box.type === 'text').length === 0 && (imageElements.length > 0 || tableElements.length > 0)) {
        // 지정된 라인 범위에 해당하는 추정 Y 좌표 계산
        if (lines.length > 0) {
          const estimatedLineHeight = 16; // 기본 라인 높이
          const pageTopOffset = 50; // 페이지 상단 여백 추정
          
          const estimatedTop = pageTopOffset + (startLine * estimatedLineHeight);
          const estimatedBottom = pageTopOffset + ((endLine + 1) * estimatedLineHeight);
          
          imageElements.forEach(element => {
            const elementTop = element.yPosition;
            const elementBottom = element.yPosition + element.height;
            
            if (elementTop <= estimatedBottom && elementBottom >= estimatedTop) {
              const { yPosition, ...boxWithoutY } = element;
              boxes.push(boxWithoutY);
            }
          });
        }
      }

      // 최종 결과 로그
      const textBoxes = boxes.filter(box => box.type === 'text');
      const imageBoxes = boxes.filter(box => box.type === 'image');
      const tableBoxes = boxes.filter(box => box.type === 'table');
      
      console.log('🎉 [PDF Highlighter] Final Results:', {
        targetLines: `${highlightRange.lineStart}-${highlightRange.lineEnd}`,
        totalLinesFound: lines.length,
        textBoxesCreated: textBoxes.length,
        imageBoxesCreated: imageBoxes.length,
        tableBoxesCreated: tableBoxes.length,
        lineYRange: lineYMin !== Infinity ? `${lineYMin.toFixed(1)}-${lineYMax.toFixed(1)}` : 'not found',
        totalBoxes: boxes.length
      });
      
      // 각 박스의 세부 정보 로그
      boxes.forEach((box, index) => {
        console.log(`📦 [PDF Highlighter] Box ${index} (${box.type}):`, {
          position: `(${box.left.toFixed(1)}, ${box.top.toFixed(1)})`,
          size: `${box.width.toFixed(1)}x${box.height.toFixed(1)}`
        });
      });
      
      if (boxes.length === 0) {
        console.warn('⚠️ [PDF Highlighter] No highlight boxes created! Check:');
        console.warn('   1. Are we on the correct page?', pageNumber, 'vs', highlightRange.pageNumber);
        console.warn('   2. Do the target lines exist?', `${highlightRange.lineStart}-${highlightRange.lineEnd}`, 'vs', lines.length, 'total lines');
        console.warn('   3. Is the TextLayer properly rendered?');
        console.warn('   4. Are the DOM elements accessible?');
      }

      setHighlightBoxes(boxes);
    }, 100);

    return () => clearTimeout(timer);
  }, [shouldHighlight, highlightRange, scale, pageWidth, pageHeight, textContent]);

  if (!shouldHighlight || highlightBoxes.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className={styles.highlightContainer}>
      {highlightBoxes.map((box, index) => (
        <div
          key={index}
          className={`${styles.highlightBox} ${styles[`highlight${box.type.charAt(0).toUpperCase() + box.type.slice(1)}`]}`}
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
        }
        <span className={styles.contentTypes}>
          {highlightBoxes.filter(box => box.type === 'text').length > 0 && ' 📝'}
          {highlightBoxes.filter(box => box.type === 'image').length > 0 && ' 📷'}
          {highlightBoxes.filter(box => box.type === 'table').length > 0 && ' 📊'}
        </span>
        {highlightBoxes.length > 0 && (
          <div className={styles.contentCount}>
            {highlightBoxes.length}개 요소 감지
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFHighlighter;