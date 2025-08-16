'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FiX, FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { PDFViewerProps, HighlightRange } from '../../types/source';
import styles from './PDFViewer.module.scss';

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

// PDF.js worker 설정 - 클라이언트 사이드에서만 실행
if (typeof window !== 'undefined') {
  import('react-pdf').then(({ pdfjs }) => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  });
}

const PDFViewer: React.FC<PDFViewerProps> = ({ sourceInfo, isOpen, onClose }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [textContent, setTextContent] = useState<any>(null);

  // 하이라이트 범위 계산
  const highlightRange: HighlightRange = {
    pageNumber: sourceInfo.page_number,
    lineStart: sourceInfo.line_start,
    lineEnd: sourceInfo.line_end
  };

  // PDF 파일 경로
  const pdfUrl = sourceInfo.file_path;

  // 모달이 열릴 때 해당 페이지로 이동
  useEffect(() => {
    if (isOpen && sourceInfo.page_number) {
      setPageNumber(sourceInfo.page_number);
    }
  }, [isOpen, sourceInfo.page_number]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    setError('PDF 파일을 로드하는데 실패했습니다.');
    setLoading(false);
    console.error('PDF load error:', error);
  }, []);

  const onPageLoadSuccess = useCallback((page: any) => {
    const { width, height } = page;
    setPageSize({ width, height });
    
    console.log('📄 [PDFViewer] Page loaded successfully:', { pageNumber, width, height });
    
    // 텍스트 콘텐츠 추출
    page.getTextContent().then((content: any) => {
      console.log('📝 [PDFViewer] Text content loaded:', {
        pageNumber,
        itemsCount: content?.items?.length || 0
      });
      setTextContent(content);
      
      // 텍스트 콘텐츠가 로드된 후 약간의 지연을 두고 DOM 업데이트 대기
      setTimeout(() => {
        console.log('🔄 [PDFViewer] Text content DOM should be ready now');
      }, 100);
    }).catch((err: Error) => {
      console.warn('텍스트 콘텐츠를 가져올 수 없습니다:', err);
    });
  }, [pageNumber]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        goToPrevPage();
        break;
      case 'ArrowRight':
        goToNextPage();
        break;
      case '+':
      case '=':
        e.preventDefault();
        handleZoomIn();
        break;
      case '-':
        e.preventDefault();
        handleZoomOut();
        break;
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.fileInfo}>
            <h3 className={styles.fileName}>{sourceInfo.file_name}</h3>
            <span className={styles.location}>
              페이지 {sourceInfo.page_number}, 라인 {sourceInfo.line_start}-{sourceInfo.line_end}
            </span>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
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
          
          <div className={styles.zoomControls}>
            <button onClick={handleZoomOut} className={styles.controlButton}>
              <FiZoomOut />
            </button>
            <span className={styles.zoomInfo}>{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className={styles.controlButton}>
              <FiZoomIn />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className={styles.content}>
          {loading && <div className={styles.loading}>PDF를 로드하는 중...</div>}
          {error && <div className={styles.error}>{error}</div>}
          
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
            error=""
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
              <PDFHighlighter
                pageNumber={pageNumber}
                highlightRange={highlightRange}
                scale={scale}
                pageWidth={pageSize.width}
                pageHeight={pageSize.height}
                textContent={textContent}
              />
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;