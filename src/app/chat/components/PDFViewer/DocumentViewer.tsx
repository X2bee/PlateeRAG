'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FiX, FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { PDFViewerProps, HighlightRange } from '../../types/source';
import { fetchDocumentByPath, hasDocumentInCache } from '../../../api/documentAPI';
import CacheStatusIndicator from './CacheStatusIndicator';
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

interface DocumentViewerProps extends Omit<PDFViewerProps, 'sourceInfo'> {
  sourceInfo: PDFViewerProps['sourceInfo'] | null;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ sourceInfo, isOpen, onClose, mode, userId }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [textContent, setTextContent] = useState<any>(null);
  const [documentData, setDocumentData] = useState<ArrayBuffer | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'html' | 'docx' | 'unknown'>('unknown');
  const [docxHtml, setDocxHtml] = useState<string | null>(null);

  if (!sourceInfo) return null;

  // 하이라이트 범위 계산
  const highlightRange: HighlightRange = {
    pageNumber: sourceInfo.page_number,
    lineStart: sourceInfo.line_start,
    lineEnd: sourceInfo.line_end
  };

  // 문서 파일 로딩
  const loadDocument = useCallback(async () => {
    if (!sourceInfo.file_path || !isOpen) return;

    const filePath = sourceInfo.file_path;
    const documentType = getFileType(filePath);
    setFileType(documentType);
    
    // 이미 캐시에 있다면 빠른 로딩 표시
    const isInCache = hasDocumentInCache(filePath);
    if (!isInCache) {
      setLoading(true);
    }
    
    setError(null);
    setDocumentData(null);
    setDocumentUrl(null);
    setDocxHtml(null);
    
    try {
      console.log('📄 [DocumentViewer] Loading document from path:', filePath, `(${documentType})`, isInCache ? '(cached)' : '(from server)');
      
      // 파일 경로 유효성 검사
      if (!filePath.trim()) {
        throw new Error('파일 경로가 비어있습니다.');
      }
      
      const data = await fetchDocumentByPath(filePath, true, mode, userId?.toString());
      
      // 데이터 유효성 검사
      if (!data || data.byteLength === 0) {
        throw new Error('문서 데이터가 비어있습니다.');
      }
      
      setDocumentData(data);
      
      // ArrayBuffer를 Blob URL로 변환
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
      
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
      
      // DOCX 파일의 경우 mammoth.js를 사용해서 HTML로 변환
      if (documentType === 'docx') {
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer: data });
          setDocxHtml(result.value);
          console.log('✅ [DocumentViewer] DOCX converted to HTML successfully');
          
          // 변환 시 발생한 메시지가 있다면 로그 출력
          if (result.messages.length > 0) {
            console.warn('📝 [DocumentViewer] DOCX conversion messages:', result.messages);
          }
        } catch (docxError) {
          console.error('❌ [DocumentViewer] Failed to convert DOCX:', docxError);
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
      
      console.log('✅ [DocumentViewer] Document loaded successfully:', {
        type: documentType,
        size: data.byteLength,
        url
      });
    } catch (err) {
      console.error('❌ [DocumentViewer] Failed to load document:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(`문서를 로드할 수 없습니다: ${errorMessage}`);
      setLoading(false);
      setDocumentData(null);
      setDocumentUrl(null);
    }
  }, [sourceInfo.file_path, isOpen, mode, userId]);

  // 모달이 열릴 때 문서 로딩 및 페이지 설정
  useEffect(() => {
    if (isOpen && sourceInfo) {
      loadDocument();
      if (sourceInfo.page_number) {
        setPageNumber(sourceInfo.page_number);
      }
    }
  }, [isOpen, loadDocument, sourceInfo?.page_number]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('✅ [DocumentViewer] PDF Document loaded successfully:', { numPages, documentUrl });
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, [documentUrl]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('❌ [DocumentViewer] PDF document load error:', error);
    setError(`PDF 문서를 로드하는데 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    setLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback((page: any) => {
    const { width, height } = page;
    setPageSize({ width, height });
    
    console.log('📄 [DocumentViewer] Page loaded successfully:', { pageNumber, width, height });
    
    // 텍스트 콘텐츠 추출
    page.getTextContent().then((content: any) => {
      console.log('📝 [DocumentViewer] Text content loaded:', {
        pageNumber,
        itemsCount: content?.items?.length || 0
      });
      setTextContent(content);
      
      // 텍스트 콘텐츠가 로드된 후 약간의 지연을 두고 DOM 업데이트 대기
      setTimeout(() => {
        console.log('🔄 [DocumentViewer] Text content DOM should be ready now');
      }, 100);
    }).catch((err: Error) => {
      console.warn('텍스트 콘텐츠를 가져올 수 없습니다:', err);
    });
  }, [pageNumber]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  }, [numPages]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        if (fileType === 'pdf') goToPrevPage();
        break;
      case 'ArrowRight':
        if (fileType === 'pdf') goToNextPage();
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
  }, [isOpen, onClose, goToPrevPage, goToNextPage, handleZoomIn, handleZoomOut, fileType]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Document URL 정리
  useEffect(() => {
    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [documentUrl]);

  if (!isOpen) return null;

  const renderDocumentContent = () => {
    if (loading && !error) {
      return <div className={styles.loading}>{fileType === 'html' ? 'HTML' : fileType === 'docx' ? 'DOCX' : 'PDF'}을 로드하는 중...</div>;
    }

    if (error) {
      return (
        <div className={styles.error}>
          <p>{error}</p>
          <button 
            onClick={loadDocument}
            className={styles.retryButton}
          >
            다시 시도
          </button>
        </div>
      );
    }

    if (!documentUrl) {
      return null;
    }

    // HTML 파일 렌더링
    if (fileType === 'html') {
      return (
        <div className={styles.htmlContainer} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <iframe
            src={documentUrl}
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
      );
    }

    // DOCX 파일 렌더링
    if (fileType === 'docx' && docxHtml) {
      return (
        <div 
          className={styles.docxContainer} 
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top left',
            width: `${100 / scale}%`,
            height: `${100 / scale}%`
          }}
        >
          <div 
            className={styles.docxContent}
            dangerouslySetInnerHTML={{ __html: docxHtml }}
          />
        </div>
      );
    }

    // PDF 파일 렌더링
    if (fileType === 'pdf') {
      return (
        <Document
          file={documentUrl}
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
      );
    }

    return <div className={styles.error}>지원하지 않는 파일 형식입니다.</div>;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.fileInfo}>
            <h3 className={styles.fileName}>{sourceInfo.file_name}</h3>
            <span className={styles.location}>
              {fileType === 'pdf' ? (
                `페이지 ${sourceInfo.page_number}, 라인 ${sourceInfo.line_start}-${sourceInfo.line_end}`
              ) : (
                `라인 ${sourceInfo.line_start}-${sourceInfo.line_end}`
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
          </div>
        </div>

        {/* Document Content */}
        <div className={styles.content}>
          {renderDocumentContent()}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;