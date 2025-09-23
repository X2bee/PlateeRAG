// types.ts - 모든 모달의 타입 정의들

export interface DownloadDialogState {
    isOpen: boolean;
    repoId: string;
    filename: string;
    split: string;
}

export interface ColumnInfoModalProps {
    isOpen: boolean;
    columnInfo: string | object | null;
    onClose: () => void;
}

export interface DownloadDialogProps {
    dialogState: DownloadDialogState;
    downloading: boolean;
    onClose: () => void;
    onDownload: () => void;
    onUpdateDialog: (updates: Partial<DownloadDialogState>) => void;
}

export interface StatisticsModalProps {
    isOpen: boolean;
    statistics: any;
    loading: boolean;
    onClose: () => void;
}

export interface ColumnDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeleteMultipleColumns: (columnNames: string[]) => void;
    availableColumns: string[];
}

export interface ColumnValueReplaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReplaceValues: (columnName: string, oldValue: string, newValue: string) => void;
    availableColumns: string[];
}

export interface ColumnOperationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyOperation: (columnName: string, operation: string) => void;
    availableColumns: string[];
}

export interface SpecificColumnNullRemoveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRemoveNullRows: (columnName: string) => void;
    availableColumns: string[];
}

export interface HuggingFaceUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (repoId: string, filename: string, isPrivate: boolean, hfUserId: string, hubToken: string) => void;
}

export interface ColumnCopyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCopyColumn: (sourceColumn: string, newColumn: string) => void;
    availableColumns: string[];
}

export interface ColumnRenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRenameColumn: (oldName: string, newName: string) => void;
    availableColumns: string[];
}
