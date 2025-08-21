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

  // 모든 가능한 PDF DOM 구조 탐색
  const findPDFElements = () => {
    // 1. containerRef 시도
    if (containerRef.current) {
      
      // 상위 요소들 탐색
      let current: Element | null = containerRef.current;
      while (current && current !== document.body) {
        const textLayer = current.querySelector('.react-pdf__Page__textContent');
        if (textLayer) {
          return textLayer;
        }
        
        current = current.parentElement;
      }
    }
    
    // 2. 페이지 번호 기반 검색
    const pageDataSelectors = [
      `[data-page-number="${pageNumber}"]`,
      `[data-page="${pageNumber}"]`,
      `.react-pdf__Page[data-page-number="${pageNumber}"]`,
      `.react-pdf__Page:nth-child(${pageNumber})`
    ];
    
    for (const selector of pageDataSelectors) {
      const pageElement = document.querySelector(selector);
      if (pageElement) {
        const textLayer = pageElement.querySelector('.react-pdf__Page__textContent');
        if (textLayer) {
          return textLayer;
        }
      }
    }
    
    // 3. 전체 문서 텍스트 레이어 검색
    const allTextLayers = Array.from(document.querySelectorAll('.react-pdf__Page__textContent'));
    
    if (allTextLayers.length > 0) {
      // 페이지 번호가 있는 경우 해당 인덱스 선택
      if (pageNumber > 0 && pageNumber <= allTextLayers.length) {
        const targetLayer = allTextLayers[pageNumber - 1];
        return targetLayer;
      }
      
      // 첫 번째 텍스트 레이어 사용
      return allTextLayers[0];
    }
    
    // 4. react-pdf 구조 직접 탐색
    const reactPdfPages = Array.from(document.querySelectorAll('.react-pdf__Page'));
    
    for (let i = 0; i < reactPdfPages.length; i++) {
      const page = reactPdfPages[i];
      
      const textLayer = page.querySelector('.react-pdf__Page__textContent');
      if (textLayer && (i + 1 === pageNumber || allTextLayers.length === 1)) {
        return textLayer;
      }
    }
    
    return null;
  };

  // TextLayer에서 실제 텍스트 요소를 찾아 라인별로 정확하게 그룹화
  const findTextElements = () => {
    
    if (!shouldHighlight) {
      return [];
    }

    const textLayerDiv = findPDFElements();
    
    if (!textLayerDiv) {
      return [];
    }

    const textSpans = Array.from(textLayerDiv.querySelectorAll('span')) as HTMLSpanElement[];
    
    // 텍스트 스팬이 없을 때
    if (textSpans.length === 0) {
      return [];
    }
    
    // 텍스트 스팬들의 유효성 검사
    const validSpans = textSpans.filter(span => {
      const text = span.textContent?.trim() || '';
      return text.length > 0;
    });
    
    if (validSpans.length === 0) {
      // 빈 텍스트 스팬
      return [];
    }

    // 텍스트 요소들을 Y 좌표로 정렬 (유효한 스팬만 사용)
    const containerRect = textLayerDiv.getBoundingClientRect();
    const sortedSpans = validSpans
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
        return spanData;
      })
      .sort((a, b) => a.top - b.top);
      
    const lines: HTMLSpanElement[][] = [];
    
    if (sortedSpans.length === 0) {
      return lines;
    }

    // 1. Y 좌표 기반으로 라인 그룹 생성
    const lineGroups: Array<{ y: number, tolerance: number, spans: typeof sortedSpans }> = [];
    
    sortedSpans.forEach((spanData, index) => {
      const { top, bottom, span, text } = spanData;
      const lineHeight = Math.max(bottom - top, 12); // 최소 12px 라인 높이
      const tolerance = Math.max(8, lineHeight * 0.4); // 더 관대한 톨러런스
      
      // 기존 라인 그룹과 매칭 시도
      let foundGroup = false;
      for (const group of lineGroups) {
        const yDiff = Math.abs(top - group.y);
        const maxTolerance = Math.max(group.tolerance, tolerance);
        
        if (yDiff <= maxTolerance) {
          group.spans.push(spanData);
          group.y = (group.y * (group.spans.length - 1) + top) / group.spans.length; // 평균 Y 좌표 업데이트
          group.tolerance = Math.max(group.tolerance, tolerance);
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup) {
        // 새로운 라인 그룹 생성
        lineGroups.push({
          y: top,
          tolerance: tolerance,
          spans: [spanData]
        });
      }
    });
    
    // 2. Y 좌표로 라인 그룹 정렬
    lineGroups.sort((a, b) => a.y - b.y);
    
    // 3. 각 그룹을 라인으로 변환
    lineGroups.forEach((group, groupIndex) => {
      // X 좌표로 스팬 정렬
      group.spans.sort((a, b) => a.left - b.left);
      
      const lineSpans = group.spans.map(spanData => spanData.span);
      const lineText = lineSpans.map(span => span.textContent || '').join('');
      
      // 빈 라인이나 의미없는 라인 필터링
      if (lineText.trim().length > 0) {
        lines.push(lineSpans);
      }
    });
    
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
    
    if (!shouldHighlight) {
      return [];
    }

    // PDF 페이지 요소 찾기
    let pageElement: Element | null = null;
    
    // 1. containerRef 기반 탐색
    if (containerRef.current) {
      let current: Element | null = containerRef.current;
      while (current && current !== document.body) {
        if (current.classList.contains('react-pdf__Page') || 
            current.querySelector('.react-pdf__Page__canvas')) {
          pageElement = current;
          break;
        }
        current = current.parentElement;
      }
    }
    
    // 2. 페이지 번호 기반 탐색
    if (!pageElement) {
      const pageSelectors = [
        `[data-page-number="${pageNumber}"]`,
        `.react-pdf__Page:nth-child(${pageNumber})`,
        `.react-pdf__Page`
      ];
      
      for (const selector of pageSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          pageElement = element;
          break;
        }
      }
    }
    
    if (!pageElement) {
      return [];
    }

    const elements: Array<HighlightBox & { yPosition: number }> = [];

    // SVG 요소들 (실제 이미지나 그래픽 요소만 감지)
    const svgElements = pageElement.querySelectorAll('svg');
    
    svgElements.forEach((svg, index) => {
      // SVG가 실제 이미지 콘텐츠인지 확인 (텍스트 레이어 관련 SVG 제외)
      const hasImageContent = svg.querySelector('image, rect[fill], circle, polygon, path[fill]');
      const isTextLayerSVG = svg.closest('.react-pdf__Page__textContent');
      
      if (!hasImageContent || isTextLayerSVG) {
        return;
      }
      
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
      
      elements.push(element);
    });

    // 실제 IMG 태그들 (PDF에 삽입된 이미지)
    const imgElements = pageElement.querySelectorAll('img');
    
    imgElements.forEach((img, index) => {
      const rect = img.getBoundingClientRect();
      const containerRect = pageElement.getBoundingClientRect();
      
      const element = {
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left,
        width: rect.width,
        height: rect.height,
        type: 'image' as const,
        yPosition: rect.top - containerRect.top
      };
      
      elements.push(element);
    });

    return elements;
  };

  const detectTablePatterns = (lines: HTMLSpanElement[][], targetLineStart: number, targetLineEnd: number) => {
    const tableElements: Array<HighlightBox & { lineNumbers: number[] }> = [];
    
    // 테이블 감지 기능을 비활성화 - 일반 텍스트를 테이블로 잘못 인식하는 문제 방지
    return tableElements;
    
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
          
          if (containerRef.current !== null) {
            const containerRect = containerRef.current!.getBoundingClientRect();
            
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

  // DOM 준비 상태 확인 함수 - 실제 텍스트 스팬까지 기다리기
  const waitForPDFDOM = (maxAttempts: number = 15, interval: number = 300): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0;
      
      const checkDOM = () => {
        attempts++;
        // 1. 기본 PDF DOM 요소들 확인
        const hasTextLayers = document.querySelectorAll('.react-pdf__Page__textContent').length > 0;
        const hasPDFPages = document.querySelectorAll('.react-pdf__Page').length > 0;
        const hasCanvasElements = document.querySelectorAll('.react-pdf__Page canvas').length > 0;
        
        // 2. 실제 텍스트 스팬 요소들 확인 (핵심!)
        const textSpans = document.querySelectorAll('.react-pdf__Page__textContent span');
        const hasTextSpans = textSpans.length > 0;
        
        // 3. 현재 페이지의 텍스트 스팬들 확인
        const pageSelector = `[data-page-number="${pageNumber}"] .react-pdf__Page__textContent span`;
        const currentPageSpans = document.querySelectorAll(pageSelector);
        const hasCurrentPageSpans = currentPageSpans.length > 0;
        
        // 텍스트 스팬이 실제로 내용을 가지고 있는지 확인
        let hasValidTextContent = false;
        if (hasCurrentPageSpans) {
          for (let i = 0; i < Math.min(currentPageSpans.length, 5); i++) {
            const span = currentPageSpans[i] as HTMLElement;
            const text = span.textContent?.trim() || '';
            if (text.length > 0) {
              hasValidTextContent = true;
              break;
            }
          }
        }
        
        // 모든 조건이 만족되면 준비 완료
        if (hasTextLayers && hasPDFPages && hasCanvasElements && hasCurrentPageSpans && hasValidTextContent) {
          resolve(true);
          return;
        }
        
        // 부분적으로 준비된 상태도 허용 (캔버스와 텍스트 레이어만 있어도)
        if (attempts >= maxAttempts) {
          if (hasTextLayers && hasCanvasElements) {
            resolve(true);
          } else {
            resolve(false);
          }
          return;
        }
        
        setTimeout(checkDOM, interval);
      };
      
      checkDOM();
    });
  };

  useEffect(() => {
    if (!shouldHighlight) {
      setHighlightBoxes([]);
      return;
    }

    // DOM 준비 상태를 확인한 후 하이라이팅 실행
    const executeHighlighting = async () => {
      
      // PDF DOM이 준비될 때까지 대기
      const domReady = await waitForPDFDOM();
      
      // TextLayer div 찾기
      const textLayerDiv = findPDFElements();
      if (!textLayerDiv) {
        return;
      }
      
      const lines = findTextElements();
      
      // 각 라인의 내용을 로그
      lines.forEach((line, index) => {
        const lineText = line.map(span => span.textContent).join(' ');
      });
      
      const imageElements = findImageAndTableElements();
      
      const tableElements = detectTablePatterns(lines, highlightRange.lineStart, highlightRange.lineEnd);
      
      const boxes: HighlightBox[] = [];

      // 지정된 라인 범위의 텍스트 하이라이팅
      const startLine = highlightRange.lineStart - 1; // 0-based index
      const endLine = highlightRange.lineEnd - 1;

      // 라인별 Y 좌표 범위 계산
      let lineYMin = Infinity;
      let lineYMax = -Infinity;

      for (let lineIndex = startLine; lineIndex <= endLine && lineIndex < lines.length; lineIndex++) {
        const lineSpans = lines[lineIndex];
        
        if (!lineSpans || lineSpans.length === 0) {
          continue;
        }

        // TextLayer를 기준으로 상대 좌표 계산
        const textLayerRect = textLayerDiv.getBoundingClientRect();
        
        // 각 텍스트 스팬을 개별적으로 하이라이트 (라인 전체가 아닌 개별 텍스트 요소)
        lineSpans.forEach((span, spanIndex) => {
          const rect = span.getBoundingClientRect();
          
          // 유효한 크기를 가진 스팬만 하이라이트
          if (rect.width > 0 && rect.height > 0 && span.textContent && span.textContent.trim() !== '') {
            const spanTop = rect.top - textLayerRect.top;
            const spanLeft = rect.left - textLayerRect.left;
            
            lineYMin = Math.min(lineYMin, spanTop);
            lineYMax = Math.max(lineYMax, spanTop + rect.height);
            
            const highlightBox = {
              top: spanTop,
              left: spanLeft,
              width: rect.width,
              height: Math.max(rect.height, 12), // 최소 12px 높이
              type: 'text' as const
            };
            
            boxes.push(highlightBox);
          }
        });
      }
  
      // 라인 범위에 포함된 이미지 요소들 추가 (Y 좌표 기반 매칭)
      imageElements.forEach((element, index) => {
        // Y 좌표 기반으로 라인 범위와 겹치는지 확인
        const elementTop = element.yPosition;
        const elementBottom = element.yPosition + element.height;
        
        // 여유를 두고 겹침 확인 (라인 높이의 50% 정도)
        const tolerance = 20;
        
        
        if (lineYMin !== Infinity && lineYMax !== -Infinity) {
          const overlaps = (elementTop <= lineYMax + tolerance && elementBottom >= lineYMin - tolerance) ||
                          (elementTop >= lineYMin - tolerance && elementTop <= lineYMax + tolerance);
          if (overlaps) {
            const { yPosition, ...boxWithoutY } = element;
            boxes.push(boxWithoutY);
          }
        }
      });

      // 테이블 요소들 추가 (이미 라인 범위 내에서 감지됨)
      tableElements.forEach((element, index) => {
        
        const { lineNumbers, ...boxWithoutLineNumbers } = element;
        boxes.push(boxWithoutLineNumbers);
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

      setHighlightBoxes(boxes);
    };

    executeHighlighting();
  }, [shouldHighlight, highlightRange, scale, pageWidth, pageHeight, textContent, pageNumber]);

  if (!shouldHighlight) {
    return null;
  }

  if (highlightBoxes.length === 0) {
    return null;
  }
  return (
    <div 
      ref={containerRef} 
      className={styles.highlightContainer}
    >
      {highlightBoxes.map((box, index) => {
        return (
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
        );
      })}
      
    </div>
  );
};

export default PDFHighlighter;