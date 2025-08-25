export interface SourceInfo {
  file_name: string;
  file_path: string;
  page_number: number;
  line_start: number;
  line_end: number;
  response_content?: string; // 답변 내용 추가
}

export interface CitationData {
  context: string;
  sourceInfo: SourceInfo;
}

export interface PDFViewerProps {
  sourceInfo: SourceInfo;
  isOpen: boolean;
  onClose: () => void;
  mode?: string;
  userId?: string | number;
}

export interface HighlightRange {
  pageNumber: number;
  lineStart?: number; // 레거시 지원을 위해 선택적으로 유지
  lineEnd?: number;   // 레거시 지원을 위해 선택적으로 유지
  searchText?: string; // 검색할 텍스트 (주요 하이라이팅 방식)
}