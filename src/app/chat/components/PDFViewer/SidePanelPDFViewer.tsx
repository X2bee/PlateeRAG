'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FiX, FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight, FiRotateCcw } from 'react-icons/fi';
import { PDFViewerProps, HighlightRange } from '../../types/source';
import { fetchDocumentByPath, hasDocumentInCache } from '../../../api/rag/documentAPI';
import CacheStatusIndicator from './CacheStatusIndicator';
import styles from './SidePanelPDFViewer.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import { HighlightingProgress } from './highlightingWorkerManager';

// Dynamic imports to prevent SSR issues
const Document = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Document })), {
  ssr: false,
  loading: () => <div className={styles.loading}>PDF 구성 요소를 로드하는 중...</div>
});

const Page = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Page })), {
  ssr: false
});

const PDFHighlighter = dynamic(() => import('./PDFHighlighter'), {
  ssr: false
});

const AdvancedPDFHighlighter = dynamic(() => import('./AdvancedPDFHighlighter'), {
  ssr: false
});

const DocxHighlighter = dynamic(() => import('./DocxHighlighter'), {
  ssr: false
});

// PDF.js worker 설정 - 클라이언트 사이드에서만 실행
if (typeof window !== 'undefined') {
  import('react-pdf').then(({ pdfjs }) => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  });
}

/**
 * 파일 확장자를 기반으로 파일 타입 검사
 */
const getFileType = (filePath: string): 'pdf' | 'html' | 'docx' | 'unknown' => {
  if (!filePath) return 'unknown';

  const extension = filePath.toLowerCase().split('.').pop();
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'html':
    case 'htm':
      return 'html';
    case 'docx':
    case 'doc':
      return 'docx';
    default:
      // 변환된 파일 이름에 '_변환'이 포함되어 있고 확장자가 html인 경우
      if (filePath.includes('_변환') && extension === 'html') {
        return 'html';
      }
      return 'unknown';
  }
};

interface SidePanelPDFViewerProps {
  sourceInfo: PDFViewerProps['sourceInfo'] | null;
  mode?: string;
  userId?: string | number;
  onClose: () => void;
}

const SidePanelPDFViewer: React.FC<SidePanelPDFViewerProps> = ({ sourceInfo, mode, userId, onClose }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [textContent, setTextContent] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'html' | 'docx' | 'unknown'>('unknown');
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [pdfScrollContainer, setPdfScrollContainer] = useState<HTMLDivElement | null>(null);
  const [highlightingProgress, setHighlightingProgress] = useState<HighlightingProgress | null>(null);
  const [useAdvancedHighlighting, setUseAdvancedHighlighting] = useState<boolean>(true);

  if (!sourceInfo) return null;

  const highlightRange: HighlightRange = {
    pageNumber: sourceInfo.page_number,
    searchText: sourceInfo.response_content // 답변 내용을 검색 텍스트로 사용
  };

  // 문서 파일 로딩 (PDF 및 HTML 지원)
  const loadPdfDocument = useCallback(async () => {
    if (!sourceInfo?.file_path) return;

    const filePath = sourceInfo.file_path;
    const documentType = getFileType(filePath);
    setFileType(documentType);

    // 이미 캐시에 있다면 빠른 로딩 표시
    const isInCache = hasDocumentInCache(filePath);
    if (!isInCache) {
      setLoading(true);
    }

    setError(null);
    setPdfUrl(null);
    setDocxHtml(null);

    try {
      devLog.log('📄 [SidePanelPDFViewer] Loading document from path:', filePath, `(${documentType})`, isInCache ? '(cached)' : '(from server)');

      // 파일 경로 유효성 검사
      if (!filePath.trim()) {
        throw new Error('파일 경로가 비어있습니다.');
      }

      const documentData = await fetchDocumentByPath(filePath, true, mode, userId?.toString());

      // 데이터 유효성 검사
      if (!documentData || documentData.byteLength === 0) {
        throw new Error('문서 데이터가 비어있습니다.');
      }

      // ArrayBuffer를 Blob URL로 변환 (파일 타입에 따라 MIME 타입 결정)
      let mimeType = 'application/octet-stream';
      switch (documentType) {
        case 'pdf':
          mimeType = 'application/pdf';
          break;
        case 'html':
          mimeType = 'text/html';
          break;
        case 'docx':
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
      }

      const blob = new Blob([documentData], { type: mimeType });
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);

      // DOCX 파일의 경우 mammoth.js를 사용해서 HTML로 변환
      if (documentType === 'docx') {
        try {
          const mammoth = await import('mammoth');

          // 표와 스타일을 더 잘 처리하기 위한 옵션 설정
          const options = {
            arrayBuffer: documentData,
            styleMap: [
              // 표 스타일 매핑
              "p[style-name='Table Grid'] => table",
              "p[style-name='Table'] => table",
              "r[style-name='Table Grid'] => td",
              "r[style-name='Table'] => td",
              // 헤더 스타일
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Heading 4'] => h4:fresh",
              // 본문 스타일
              "p[style-name='Normal'] => p:fresh",
              // 강조 스타일
              "r[style-name='Strong'] => strong",
              "r[style-name='Emphasis'] => em"
            ],
            includeDefaultStyleMap: true,
            includeEmbeddedStyleMap: true
          };

          const result = await mammoth.convertToHtml(options);

          // HTML 후처리를 통해 표 스타일 개선
          let processedHtml = result.value;

          // 표 요소에 클래스 추가
          processedHtml = processedHtml.replace(/<table/g, '<table class="docx-table"');

          // 빈 표 셀 처리
          processedHtml = processedHtml.replace(/<td><\/td>/g, '<td>&nbsp;</td>');
          processedHtml = processedHtml.replace(/<th><\/th>/g, '<th>&nbsp;</th>');

          // 여러 줄의 빈 공간 제거
          processedHtml = processedHtml.replace(/\n\s*\n/g, '\n');

          setDocxHtml(processedHtml);

          // 변환 시 발생한 메시지가 있다면 로그 출력
          if (result.messages.length > 0) {
            devLog.warn('📝 [SidePanelPDFViewer] DOCX conversion messages:', result.messages);
          }
        } catch (docxError) {
          throw new Error(`DOCX 변환 실패: ${docxError instanceof Error ? docxError.message : '알 수 없는 오류'}`);
        }
      }

      // HTML 및 DOCX 파일의 경우 페이지 수를 1로 설정
      if (documentType === 'html' || documentType === 'docx') {
        setNumPages(1);
        setPageNumber(1);
      }

      // 로딩 완료 상태로 변경
      setLoading(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(`문서를 로드할 수 없습니다: ${errorMessage}`);
      setLoading(false);
      setPdfUrl(null);
      setDocxHtml(null);
    }
  }, [sourceInfo?.file_path, mode, userId]);

  const handleZoomIn = useCallback(() => {
    if (!pdfScrollContainer) return;

    // 현재 스크롤 위치와 컨테이너 크기 저장
    const scrollLeft = pdfScrollContainer.scrollLeft;
    const scrollTop = pdfScrollContainer.scrollTop;
    const containerWidth = pdfScrollContainer.clientWidth;
    const containerHeight = pdfScrollContainer.clientHeight;

    // 현재 보이는 중심점 계산
    const centerX = scrollLeft + containerWidth / 2;
    const centerY = scrollTop + containerHeight / 2;

    setScale(prev => {
      const newScale = Math.min(prev + 0.1, 3.0);
      const scaleRatio = newScale / prev;

      // 새로운 중심점 계산 후 스크롤 위치 조정
      setTimeout(() => {
        if (pdfScrollContainer) {
          const newCenterX = centerX * scaleRatio;
          const newCenterY = centerY * scaleRatio;

          pdfScrollContainer.scrollLeft = newCenterX - containerWidth / 2;
          pdfScrollContainer.scrollTop = newCenterY - containerHeight / 2;
        }
      }, 50);

      return newScale;
    });
  }, [pdfScrollContainer]);

  const handleZoomOut = useCallback(() => {
    if (!pdfScrollContainer) return;

    // 현재 스크롤 위치와 컨테이너 크기 저장
    const scrollLeft = pdfScrollContainer.scrollLeft;
    const scrollTop = pdfScrollContainer.scrollTop;
    const containerWidth = pdfScrollContainer.clientWidth;
    const containerHeight = pdfScrollContainer.clientHeight;

    // 현재 보이는 중심점 계산
    const centerX = scrollLeft + containerWidth / 2;
    const centerY = scrollTop + containerHeight / 2;

    setScale(prev => {
      const newScale = Math.max(prev - 0.1, 0.2);
      const scaleRatio = newScale / prev;

      // 새로운 중심점 계산 후 스크롤 위치 조정
      setTimeout(() => {
        if (pdfScrollContainer) {
          const newCenterX = centerX * scaleRatio;
          const newCenterY = centerY * scaleRatio;

          pdfScrollContainer.scrollLeft = newCenterX - containerWidth / 2;
          pdfScrollContainer.scrollTop = newCenterY - containerHeight / 2;
        }
      }, 50);

      return newScale;
    });
  }, [pdfScrollContainer]);

  // 키보드 단축키와 휠 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === '=' || event.key === '+') {
          event.preventDefault();
          handleZoomIn();
        } else if (event.key === '-') {
          event.preventDefault();
          handleZoomOut();
        } else if (event.key === '0') {
          event.preventDefault();
          // 기본 크기로 리셋하면서 중앙 정렬
          setScale(1.0);
          if (pdfScrollContainer) {
            setTimeout(() => {
              // 1.0 스케일에서는 중앙 정렬되므로 스크롤 초기화
              const containerWidth = pdfScrollContainer.clientWidth;
              const containerHeight = pdfScrollContainer.clientHeight;
              pdfScrollContainer.scrollLeft = 0;
              pdfScrollContainer.scrollTop = 0;
            }, 100);
          }
        }
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        if (event.deltaY < 0) {
          handleZoomIn();
        } else {
          handleZoomOut();
        }
      } else if (event.shiftKey && pdfScrollContainer) {
        // Shift + 휠로 좌우 스크롤
        event.preventDefault();
        pdfScrollContainer.scrollLeft += event.deltaY;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [handleZoomIn, handleZoomOut, pdfScrollContainer]);

  // sourceInfo가 변경될 때 문서 로딩 및 페이지 설정
  useEffect(() => {
    if (sourceInfo) {
      loadPdfDocument();
      if (sourceInfo.page_number) {
        setPageNumber(sourceInfo.page_number);
      }
    }
  }, [sourceInfo, loadPdfDocument]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    setError(`PDF 문서를 로드하는데 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    setLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback((page: any) => {
    const { width, height } = page;
    setPageSize({ width, height });


    // 텍스트 콘텐츠 추출
    page.getTextContent().then((content: any) => {

      setTextContent(content);

      // 텍스트 콘텐츠가 로드된 후 약간의 지연을 두고 DOM 업데이트 대기
      setTimeout(() => {

      }, 100);
    }).catch((err: Error) => {
      console.warn('텍스트 콘텐츠를 가져올 수 없습니다:', err);
    });
  }, [pageNumber]);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };


  // PDF URL 정리
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.fileInfo}>
          <h3 className={styles.fileName}>{sourceInfo.file_name}</h3>
          <span className={styles.location}>
            {fileType === 'pdf' ? (
              `페이지 ${sourceInfo.page_number}`
            ) : (
              '문서 내용'
            )}
          </span>
        </div>
        <div className={styles.headerActions}>
          <CacheStatusIndicator
            filePath={sourceInfo.file_path}
            className={styles.cacheIndicator}
          />
          <button className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* 페이지 컨트롤은 PDF에만 표시 */}
        {fileType === 'pdf' && (
          <div className={styles.pageControls}>
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className={styles.controlButton}
            >
              <FiChevronLeft />
            </button>
            <span className={styles.pageInfo}>
              {pageNumber} / {numPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className={styles.controlButton}
            >
              <FiChevronRight />
            </button>
          </div>
        )}

        {/* 줌 컨트롤은 모든 파일 타입에 표시 */}
        <div className={styles.zoomControls}>
          <button onClick={handleZoomOut} className={styles.controlButton}>
            <FiZoomOut />
          </button>
          <span className={styles.zoomInfo}>{Math.round(scale * 100)}%</span>
          <button onClick={handleZoomIn} className={styles.controlButton}>
            <FiZoomIn />
          </button>
          <button
            onClick={() => {
              setScale(1.0);
              if (pdfScrollContainer) {
                setTimeout(() => {
                  pdfScrollContainer.scrollLeft = 0;
                  pdfScrollContainer.scrollTop = 0;
                }, 100);
              }
            }}
            className={styles.controlButton}
            title="기본 크기로 리셋 (Ctrl+0)"
          >
            <FiRotateCcw />
          </button>
          <button
            onClick={() => setUseAdvancedHighlighting(!useAdvancedHighlighting)}
            className={`${styles.controlButton} ${useAdvancedHighlighting ? styles.active : ''}`}
            title={useAdvancedHighlighting ? "기본 하이라이팅으로 전환" : "고도화 하이라이팅으로 전환"}
            style={{ 
              backgroundColor: useAdvancedHighlighting ? '#6366f1' : 'transparent',
              color: useAdvancedHighlighting ? 'white' : 'inherit',
              fontSize: '10px',
              padding: '4px 6px'
            }}
          >
            {useAdvancedHighlighting ? 'AI' : 'AI'}
          </button>
        </div>
      </div>

      {/* Highlighting Progress Indicator */}
      {useAdvancedHighlighting && highlightingProgress && highlightingProgress.progress < 100 && (
        <div style={{ 
          padding: '12px 16px', 
          backgroundColor: '#f8fafc', 
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ 
            fontSize: '13px', 
            color: '#4b5563', 
            marginBottom: '6px',
            fontWeight: '500'
          }}>
            🔍 하이라이팅 분석 중... ({Math.round(highlightingProgress.progress)}%)
          </div>
          <div style={{ 
            backgroundColor: '#e5e7eb', 
            borderRadius: '6px', 
            height: '6px', 
            overflow: 'hidden',
            marginBottom: '4px'
          }}>
            <div 
              style={{ 
                backgroundColor: '#6366f1', 
                height: '100%', 
                width: `${highlightingProgress.progress}%`,
                transition: 'width 0.3s ease',
                boxShadow: '0 0 4px rgba(99, 102, 241, 0.3)'
              }} 
            />
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#6b7280', 
            fontStyle: 'italic'
          }}>
            {highlightingProgress.message}
          </div>
        </div>
      )}

      {/* Document Content */}
      <div className={styles.content}>
        {loading && !error && (
          <div className={styles.loading}>
            {fileType === 'html' ? 'HTML' : fileType === 'docx' ? 'DOCX' : 'PDF'}을 로드하는 중...
          </div>
        )}
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
            <button
              onClick={loadPdfDocument}
              className={styles.retryButton}
            >
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && pdfUrl && fileType === 'html' && (
          <div className={styles.htmlContainer} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <iframe
              src={pdfUrl}
              className={styles.htmlFrame}
              title={sourceInfo.file_name}
              sandbox="allow-same-origin"
              style={{
                width: `${100 / scale}%`,
                height: `${100 / scale}%`,
                border: 'none'
              }}
            />
          </div>
        )}

        {!loading && !error && docxHtml && fileType === 'docx' && (
          <div className={styles.docxContainer}>
            <div
              className={styles.docxContent}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease'
              }}
              dangerouslySetInnerHTML={{ __html: docxHtml }}
            />

            {/* DOCX 하이라이터 - CSS 클래스를 직접 DOM에 적용 */}
            <DocxHighlighter
              highlightRange={highlightRange}
              scale={scale}
            />
          </div>
        )}

{!loading && !error && pdfUrl && fileType === 'pdf' && (
          <div
            ref={setPdfScrollContainer}
            className={`${styles.pdfScrollContainer} ${scale <= 1.0 ? styles.centered : ''}`}
          >
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div>PDF 문서를 로드하는 중...</div>}
              error={<div>PDF 문서 로드 오류</div>}
            >
              <div className={styles.pageContainer}>
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  loading=""
                  error=""
                  className={styles.page}
                  onLoadSuccess={onPageLoadSuccess}
                />

                {/* PDF 하이라이터 */}
                {useAdvancedHighlighting ? (
                  <AdvancedPDFHighlighter
                    pageNumber={pageNumber}
                    highlightRange={highlightRange}
                    scale={scale}
                    pageWidth={pageSize.width}
                    pageHeight={pageSize.height}
                    textContent={textContent}
                    onProgressChange={setHighlightingProgress}
                    enableAsyncProcessing={true}
                  />
                ) : (
                  <PDFHighlighter
                    pageNumber={pageNumber}
                    highlightRange={highlightRange}
                    scale={scale}
                    pageWidth={pageSize.width}
                    pageHeight={pageSize.height}
                    textContent={textContent}
                  />
                )}
              </div>
            </Document>
          </div>
        )}

        {!loading && !error && fileType === 'unknown' && (
          <div className={styles.error}>지원하지 않는 파일 형식입니다.</div>
        )}
      </div>
    </div>
  );
};

export default SidePanelPDFViewer;
