export interface SourceInfo {
  file_name: string;
  file_path: string;
  page_number: number;
  line_start: number;
  line_end: number;
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
  lineStart: number;
  lineEnd: number;
}