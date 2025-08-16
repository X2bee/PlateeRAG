'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FiX, FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { PDFViewerProps, HighlightRange } from '../../types/source';
import PDFHighlighter from './PDFHighlighter';
import styles from './PDFViewer.module.scss';

// PDF.js worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFViewer: React.FC<PDFViewerProps> = ({ sourceInfo, isOpen, onClose }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

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
  }, []);

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
              />
              
              {/* 하이라이트 오버레이 (해당 페이지인 경우) */}
              {pageNumber === highlightRange.pageNumber && (
                <div className={styles.highlightOverlay}>
                  {/* 실제 하이라이팅은 나중에 구현 */}
                  <div className={styles.highlightBox}>
                    하이라이트 영역: 라인 {highlightRange.lineStart}-{highlightRange.lineEnd}
                  </div>
                </div>
              )}
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;