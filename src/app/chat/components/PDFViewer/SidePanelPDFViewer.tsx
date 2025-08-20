'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FiX, FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { PDFViewerProps, HighlightRange } from '../../types/source';
import { fetchDocumentByPath, hasDocumentInCache } from '../../../api/documentAPI';
import CacheStatusIndicator from './CacheStatusIndicator';
import styles from './SidePanelPDFViewer.module.scss';

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

interface SidePanelPDFViewerProps {
  sourceInfo: PDFViewerProps['sourceInfo'] | null;
  mode?: string;
  userId?: string | number;
  onClose: () => void;
}

const SidePanelPDFViewer: React.FC<SidePanelPDFViewerProps> = ({ sourceInfo, mode, userId, onClose }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(0.8);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [textContent, setTextContent] = useState<any>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'html' | 'docx' | 'unknown'>('unknown');
  const [docxHtml, setDocxHtml] = useState<string | null>(null);

  if (!sourceInfo) return null;

  // 디버깅을 위한 상태 로깅
  console.log('🔍 [SidePanelPDFViewer] Render state:', {
    loading,
    error,
    pdfUrl: !!pdfUrl,
    pdfUrlValue: pdfUrl,
    numPages,
    pageNumber
  });

  // 하이라이트 범위 계산
  const highlightRange: HighlightRange = {
    pageNumber: sourceInfo.page_number,
    lineStart: sourceInfo.line_start,
    lineEnd: sourceInfo.line_end
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
    setPdfData(null);
    setPdfUrl(null);
    setDocxHtml(null);
    
    try {
      console.log('📄 [SidePanelPDFViewer] Loading document from path:', filePath, `(${documentType})`, isInCache ? '(cached)' : '(from server)');
      
      // 파일 경로 유효성 검사
      if (!filePath.trim()) {
        throw new Error('파일 경로가 비어있습니다.');
      }
      
      const documentData = await fetchDocumentByPath(filePath, true, mode, userId?.toString());
      
      // 데이터 유효성 검사
      if (!documentData || documentData.byteLength === 0) {
        throw new Error('문서 데이터가 비어있습니다.');
      }
      
      setPdfData(documentData);
      
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
      
      console.log('📄 [SidePanelPDFViewer] Creating Blob URL:', {
        type: documentType,
        size: documentData.byteLength,
        blobSize: blob.size,
        blobType: blob.type,
        url: url
      });
      
      setPdfUrl(url);
      
      // DOCX 파일의 경우 mammoth.js를 사용해서 HTML로 변환
      if (documentType === 'docx') {
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer: documentData });
          setDocxHtml(result.value);
          console.log('✅ [SidePanelPDFViewer] DOCX converted to HTML successfully');
          
          // 변환 시 발생한 메시지가 있다면 로그 출력
          if (result.messages.length > 0) {
            console.warn('📝 [SidePanelPDFViewer] DOCX conversion messages:', result.messages);
          }
        } catch (docxError) {
          console.error('❌ [SidePanelPDFViewer] Failed to convert DOCX:', docxError);
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
      
      console.log('✅ [SidePanelPDFViewer] Document loaded successfully:', {
        type: documentType,
        size: documentData.byteLength
      });
    } catch (err) {
      console.error('❌ [SidePanelPDFViewer] Failed to load document:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(`문서를 로드할 수 없습니다: ${errorMessage}`);
      setLoading(false);
      setPdfData(null);
      setPdfUrl(null);
      setDocxHtml(null);
    }
  }, [sourceInfo?.file_path, mode, userId]);

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
    console.log('✅ [SidePanelPDFViewer] PDF Document loaded successfully:', { numPages, pdfUrl });
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, [pdfUrl]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('❌ [SidePanelPDFViewer] PDF document load error:', error);
    setError(`PDF 문서를 로드하는데 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    setLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback((page: any) => {
    const { width, height } = page;
    setPageSize({ width, height });
    
    console.log('📄 [SidePanelPDFViewer] Page loaded successfully:', { pageNumber, width, height });
    
    // 텍스트 콘텐츠 추출
    page.getTextContent().then((content: any) => {
      console.log('📝 [SidePanelPDFViewer] Text content loaded:', {
        pageNumber,
        itemsCount: content?.items?.length || 0
      });
      setTextContent(content);
      
      // 텍스트 콘텐츠가 로드된 후 약간의 지연을 두고 DOM 업데이트 대기
      setTimeout(() => {
        console.log('🔄 [SidePanelPDFViewer] Text content DOM should be ready now');
      }, 100);
    }).catch((err: Error) => {
      console.warn('텍스트 콘텐츠를 가져올 수 없습니다:', err);
    });
  }, [pageNumber]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.3));
  };

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
        )}
        
        {!loading && !error && pdfUrl && fileType === 'pdf' && (
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
        )}
        
        {!loading && !error && fileType === 'unknown' && (
          <div className={styles.error}>지원하지 않는 파일 형식입니다.</div>
        )}
      </div>
    </div>
  );
};

export default SidePanelPDFViewer;