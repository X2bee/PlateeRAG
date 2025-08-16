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
    console.log('🔍 [PDF Highlighter] Starting comprehensive PDF DOM search...');
    
    // 1. containerRef 시도
    if (containerRef.current) {
      console.log('✅ [PDF Highlighter] Container ref found:', containerRef.current);
      
      // 상위 요소들 탐색
      let current = containerRef.current;
      while (current && current !== document.body) {
        console.log('🔗 [PDF Highlighter] Exploring element:', {
          tagName: current.tagName,
          className: current.className,
          hasTextLayer: !!current.querySelector('.react-pdf__Page__textContent'),
          hasPage: !!current.querySelector('.react-pdf__Page'),
          children: current.children.length
        });
        
        const textLayer = current.querySelector('.react-pdf__Page__textContent');
        if (textLayer) {
          console.log('✅ [PDF Highlighter] Found text layer via containerRef navigation');
          return textLayer;
        }
        
        current = current.parentElement;
      }
    }
    
    // 2. 페이지 번호 기반 검색
    console.log('🔍 [PDF Highlighter] Searching by page number:', pageNumber);
    const pageDataSelectors = [
      `[data-page-number="${pageNumber}"]`,
      `[data-page="${pageNumber}"]`,
      `.react-pdf__Page[data-page-number="${pageNumber}"]`,
      `.react-pdf__Page:nth-child(${pageNumber})`
    ];
    
    for (const selector of pageDataSelectors) {
      const pageElement = document.querySelector(selector);
      if (pageElement) {
        console.log(`✅ [PDF Highlighter] Found page element with selector: ${selector}`);
        const textLayer = pageElement.querySelector('.react-pdf__Page__textContent');
        if (textLayer) {
          console.log('✅ [PDF Highlighter] Found text layer via page data selector');
          return textLayer;
        }
      }
    }
    
    // 3. 전체 문서 텍스트 레이어 검색
    const allTextLayers = Array.from(document.querySelectorAll('.react-pdf__Page__textContent'));
    console.log(`🔍 [PDF Highlighter] Found ${allTextLayers.length} text layers in document`);
    
    if (allTextLayers.length > 0) {
      // 페이지 번호가 있는 경우 해당 인덱스 선택
      if (pageNumber > 0 && pageNumber <= allTextLayers.length) {
        const targetLayer = allTextLayers[pageNumber - 1];
        console.log(`✅ [PDF Highlighter] Selected text layer by index: ${pageNumber - 1}`);
        return targetLayer;
      }
      
      // 첫 번째 텍스트 레이어 사용
      console.log('⚠️ [PDF Highlighter] Using first available text layer as fallback');
      return allTextLayers[0];
    }
    
    // 4. react-pdf 구조 직접 탐색
    const reactPdfPages = Array.from(document.querySelectorAll('.react-pdf__Page'));
    console.log(`🔍 [PDF Highlighter] Found ${reactPdfPages.length} react-pdf pages`);
    
    for (let i = 0; i < reactPdfPages.length; i++) {
      const page = reactPdfPages[i];
      console.log(`📄 [PDF Highlighter] Checking page ${i + 1}:`, {
        hasTextContent: !!page.querySelector('.react-pdf__Page__textContent'),
        hasCanvas: !!page.querySelector('canvas'),
        hasSvg: !!page.querySelector('svg'),
        className: page.className
      });
      
      const textLayer = page.querySelector('.react-pdf__Page__textContent');
      if (textLayer && (i + 1 === pageNumber || allTextLayers.length === 1)) {
        console.log(`✅ [PDF Highlighter] Found matching text layer on page ${i + 1}`);
        return textLayer;
      }
    }
    
    console.log('❌ [PDF Highlighter] No text layer found after comprehensive search');
    return null;
  };

  // TextLayer에서 실제 텍스트 요소를 찾아 라인별로 정확하게 그룹화
  const findTextElements = () => {
    console.log('🔍 [PDF Highlighter] Starting findTextElements...');
    
    if (!shouldHighlight) {
      console.log('❌ [PDF Highlighter] Highlighting not required for this page');
      return [];
    }

    const textLayerDiv = findPDFElements();
    console.log('📄 [PDF Highlighter] TextLayer div result:', !!textLayerDiv);
    
    if (!textLayerDiv) {
      console.log('❌ [PDF Highlighter] No textLayer div found after comprehensive search');
      return [];
    }

    const textSpans = Array.from(textLayerDiv.querySelectorAll('span')) as HTMLSpanElement[];
    console.log(`📝 [PDF Highlighter] Found ${textSpans.length} text spans`);
    
    // 텍스트 스팬이 없을 때 추가 디버깅
    if (textSpans.length === 0) {
      console.log('❌ [PDF Highlighter] No text spans found - Additional debugging:');
      
      // TextLayer의 내부 구조 확인
      console.log('🔍 [PDF Highlighter] TextLayer innerHTML:', textLayerDiv.innerHTML.substring(0, 500));
      console.log('🔍 [PDF Highlighter] TextLayer children count:', textLayerDiv.children.length);
      console.log('🔍 [PDF Highlighter] TextLayer className:', textLayerDiv.className);
      
      // 전체 문서에서 모든 span 요소들 확인
      const allSpans = document.querySelectorAll('span');
      console.log(`🔍 [PDF Highlighter] Total spans in document: ${allSpans.length}`);
      
      // react-pdf 관련 span들만 확인
      const pdfSpans = document.querySelectorAll('.react-pdf__Page span, [data-page-number] span');
      console.log(`🔍 [PDF Highlighter] PDF-related spans: ${pdfSpans.length}`);
      
      // 첫 번째 몇 개 span의 내용 출력
      for (let i = 0; i < Math.min(pdfSpans.length, 5); i++) {
        const span = pdfSpans[i] as HTMLElement;
        console.log(`📝 [PDF Highlighter] PDF Span ${i}:`, {
          text: span.textContent,
          className: span.className,
          parent: span.parentElement?.className
        });
      }
      
      return [];
    }
    
    // 텍스트 스팬들의 유효성 검사
    const validSpans = textSpans.filter(span => {
      const text = span.textContent?.trim() || '';
      return text.length > 0;
    });
    
    console.log(`✅ [PDF Highlighter] Valid spans: ${validSpans.length}/${textSpans.length}`);
    
    if (validSpans.length === 0) {
      console.log('⚠️ [PDF Highlighter] No spans with valid text content found');
      // 빈 텍스트 스팬들의 정보 출력
      textSpans.slice(0, 5).forEach((span, index) => {
        console.log(`📝 [PDF Highlighter] Empty span ${index}:`, {
          innerHTML: span.innerHTML,
          textContent: `"${span.textContent}"`,
          className: span.className,
          style: span.style.cssText
        });
      });
      return [];
    }

    // 텍스트 요소들을 Y 좌표로 정렬 (유효한 스팬만 사용)
    console.log('📐 [PDF Highlighter] Processing span positions...');
    const containerRect = textLayerDiv.getBoundingClientRect();
    console.log('📦 [PDF Highlighter] Container rect:', {
      top: containerRect.top,
      left: containerRect.left,
      width: containerRect.width,
      height: containerRect.height
    });

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
        
        if (index < 5) { // 처음 5개만 로그
          console.log(`📝 [PDF Highlighter] Valid Span ${index}:`, {
            text: `"${spanData.text}"`,
            position: `(${spanData.left.toFixed(1)}, ${spanData.top.toFixed(1)})`,
            size: `${spanData.width.toFixed(1)}x${spanData.height.toFixed(1)}`
          });
        }
        
        return spanData;
      })
      .sort((a, b) => a.top - b.top);
      
    console.log(`📊 [PDF Highlighter] Sorted ${sortedSpans.length} valid spans by Y position`);

    // 라인 그룹화 - 개선된 알고리즘 (한글 문자 결합 고려)
    console.log('📋 [PDF Highlighter] Starting improved line grouping...');
    const lines: HTMLSpanElement[][] = [];
    
    if (sortedSpans.length === 0) {
      console.log('❌ [PDF Highlighter] No spans to group');
      return lines;
    }

    // 1. Y 좌표 기반으로 라인 그룹 생성
    const lineGroups: Array<{ y: number, tolerance: number, spans: typeof sortedSpans }> = [];
    
    sortedSpans.forEach((spanData, index) => {
      const { top, bottom, span, text } = spanData;
      const lineHeight = Math.max(bottom - top, 12); // 최소 12px 라인 높이
      const tolerance = Math.max(8, lineHeight * 0.4); // 더 관대한 톨러런스
      
      console.log(`📝 [PDF Highlighter] Processing span ${index}: "${text}" at Y=${top.toFixed(1)}, height=${lineHeight.toFixed(1)}`);
      
      // 기존 라인 그룹과 매칭 시도
      let foundGroup = false;
      for (const group of lineGroups) {
        const yDiff = Math.abs(top - group.y);
        const maxTolerance = Math.max(group.tolerance, tolerance);
        
        if (yDiff <= maxTolerance) {
          // 같은 라인 그룹에 추가
          group.spans.push(spanData);
          group.y = (group.y * (group.spans.length - 1) + top) / group.spans.length; // 평균 Y 좌표 업데이트
          group.tolerance = Math.max(group.tolerance, tolerance);
          foundGroup = true;
          console.log(`➕ [PDF Highlighter] Added span to existing group (Y diff: ${yDiff.toFixed(1)}, tolerance: ${maxTolerance.toFixed(1)})`);
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
        console.log(`🆕 [PDF Highlighter] Created new line group at Y=${top.toFixed(1)}`);
      }
    });
    
    console.log(`📊 [PDF Highlighter] Created ${lineGroups.length} line groups`);
    
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
        console.log(`📄 [PDF Highlighter] Line ${lines.length}: "${lineText}" (${lineSpans.length} spans, Y=${group.y.toFixed(1)})`);
      } else {
        console.log(`🗑️ [PDF Highlighter] Skipped empty line group ${groupIndex}: "${lineText}"`);
      }
    });
    
    console.log(`✅ [PDF Highlighter] Improved line grouping complete: ${lines.length} lines found`);

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
    
    if (!shouldHighlight) {
      console.log('❌ [PDF Highlighter] Highlighting not required for this page');
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
          console.log(`📄 [PDF Highlighter] Found page element with selector: ${selector}`);
          break;
        }
      }
    }
    
    console.log('📄 [PDF Highlighter] Page element for image search:', !!pageElement);
    
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

  // DOM 준비 상태 확인 함수 - 실제 텍스트 스팬까지 기다리기
  const waitForPDFDOM = (maxAttempts: number = 15, interval: number = 300): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0;
      
      const checkDOM = () => {
        attempts++;
        console.log(`🔍 [PDF Highlighter] DOM readiness check attempt ${attempts}/${maxAttempts}`);
        
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
        
        console.log('📊 [PDF Highlighter] DOM status:', {
          hasTextLayers,
          hasPDFPages,
          hasCanvasElements,
          hasTextSpans,
          totalSpans: textSpans.length,
          hasCurrentPageSpans,
          currentPageSpans: currentPageSpans.length,
          pageNumber,
          attempt: attempts
        });
        
        // 텍스트 스팬이 실제로 내용을 가지고 있는지 확인
        let hasValidTextContent = false;
        if (hasCurrentPageSpans) {
          for (let i = 0; i < Math.min(currentPageSpans.length, 5); i++) {
            const span = currentPageSpans[i] as HTMLElement;
            const text = span.textContent?.trim() || '';
            if (text.length > 0) {
              hasValidTextContent = true;
              console.log(`📝 [PDF Highlighter] Found valid text: "${text}"`);
              break;
            }
          }
        }
        
        console.log('🎯 [PDF Highlighter] Text content validation:', {
          hasValidTextContent,
          checkedSpans: Math.min(currentPageSpans.length, 5)
        });
        
        // 모든 조건이 만족되면 준비 완료
        if (hasTextLayers && hasPDFPages && hasCanvasElements && hasCurrentPageSpans && hasValidTextContent) {
          console.log('✅ [PDF Highlighter] PDF DOM with text content is ready!');
          resolve(true);
          return;
        }
        
        // 부분적으로 준비된 상태도 허용 (캔버스와 텍스트 레이어만 있어도)
        if (attempts >= maxAttempts) {
          if (hasTextLayers && hasCanvasElements) {
            console.log('⚠️ [PDF Highlighter] Max attempts reached, but basic DOM is available');
            resolve(true);
          } else {
            console.log('❌ [PDF Highlighter] Max attempts reached, DOM not ready');
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
      console.log('🚀 [PDF Highlighter] Starting highlighting process...');
      console.log('🎯 [PDF Highlighter] Target:', {
        page: pageNumber,
        highlightPage: highlightRange.pageNumber,
        lineStart: highlightRange.lineStart,
        lineEnd: highlightRange.lineEnd,
        shouldHighlight
      });
      
      // PDF DOM이 준비될 때까지 대기
      const domReady = await waitForPDFDOM();
      console.log('📋 [PDF Highlighter] DOM readiness result:', domReady);
      
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
        
        // getBoundingClientRect가 0인 경우 처리
        if (firstRect.width === 0 || firstRect.height === 0) {
          console.log(`⚠️ [PDF Highlighter] Line ${lineIndex + 1} has zero dimensions, trying alternative approach`);
          
          // 전체 라인의 스팬들을 체크해서 유효한 크기 찾기
          let validRects: DOMRect[] = [];
          lineSpans.forEach((span, spanIndex) => {
            const rect = span.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              validRects.push(rect);
              console.log(`📏 [PDF Highlighter] Valid span ${spanIndex} in line ${lineIndex + 1}:`, {
                text: span.textContent,
                rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
              });
            }
          });
          
          if (validRects.length === 0) {
            console.log(`❌ [PDF Highlighter] No valid rects found for line ${lineIndex + 1}, skipping`);
            continue;
          }
          
          // 유효한 사각형들로 라인 경계 계산
          const minLeft = Math.min(...validRects.map(r => r.left));
          const maxRight = Math.max(...validRects.map(r => r.right));
          const minTop = Math.min(...validRects.map(r => r.top));
          const maxBottom = Math.max(...validRects.map(r => r.bottom));
          
          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            
            const lineTop = minTop - containerRect.top;
            const lineBottom = maxBottom - containerRect.top;
            const lineLeft = minLeft - containerRect.left;
            const lineWidth = maxRight - minLeft;
            const lineHeight = maxBottom - minTop;
            
            lineYMin = Math.min(lineYMin, lineTop);
            lineYMax = Math.max(lineYMax, lineBottom);
            
            const highlightBox = {
              top: lineTop,
              left: lineLeft,
              width: lineWidth,
              height: Math.max(lineHeight, 12), // 최소 12px 높이
              type: 'text' as const
            };
            
            console.log(`✅ [PDF Highlighter] Created highlight box for line ${lineIndex + 1} (alternative method):`, {
              position: `(${lineLeft.toFixed(1)}, ${lineTop.toFixed(1)})`,
              size: `${lineWidth.toFixed(1)}x${lineHeight.toFixed(1)}`,
              validRects: validRects.length
            });
            
            boxes.push(highlightBox);
          }
        } else if (containerRef.current) {
          // 기존 방식 (정상적인 경우)
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
            width: Math.max(lineWidth, 10), // 최소 10px 너비
            height: Math.max(firstRect.height, 12), // 최소 12px 높이
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
    };

    executeHighlighting();
  }, [shouldHighlight, highlightRange, scale, pageWidth, pageHeight, textContent, pageNumber]);

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