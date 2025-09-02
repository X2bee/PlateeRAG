import toast from 'react-hot-toast';

interface DeleteConfirmOptions {
    title?: string;
    message: string;
    itemName: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    duration?: number;
}

interface DeleteSuccessOptions {
    itemName: string;
    itemType?: string;
    count?: number;
    customMessage?: string;
}

interface DeleteErrorOptions {
    itemName: string;
    itemType?: string;
    error?: Error | string;
    customMessage?: string;
}

interface WarningConfirmOptions {
    title?: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    duration?: number;
}

interface WarningToastOptions {
    message: string;
    duration?: number;
}

/**
 * 재사용 가능한 삭제 확인 토스트
 */
export const showDeleteConfirmToast = ({
    title = 'Delete Confirmation',
    message,
    itemName,
    onConfirm,
    onCancel,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    duration = Infinity,
}: DeleteConfirmOptions) => {
    const confirmToast = toast(
        (t) => (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                <div
                    style={{
                        fontWeight: '600',
                        color: '#dc2626',
                        fontSize: '1rem',
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        fontSize: '0.9rem',
                        color: '#374151',
                        lineHeight: '1.4',
                    }}
                >
                    {message}
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'flex-end',
                        marginTop: '4px',
                    }}
                >
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            onCancel?.();
                        }}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#ffffff',
                            border: '2px solid #6b7280',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            color: '#374151',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await onConfirm();
                            } catch (error) {
                                console.error('Delete confirmation error:', error);
                            }
                        }}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: '2px solid #b91c1c',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        ),
        {
            duration,
            style: {
                maxWidth: '420px',
                padding: '20px',
                backgroundColor: '#f9fafb',
                border: '2px solid #374151',
                borderRadius: '12px',
                boxShadow:
                    '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                color: '#374151',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            },
        },
    );

    return confirmToast;
};

/**
 * 삭제 성공 토스트
 */
export const showDeleteSuccessToast = ({
    itemName,
    itemType = 'item',
    count,
    customMessage,
}: DeleteSuccessOptions) => {
    let message = customMessage;

    if (!message) {
        if (count !== undefined) {
            message = `"${itemName}" ${itemType} deleted successfully! (${count} records removed)`;
        } else {
            message = `"${itemName}" ${itemType} deleted successfully!`;
        }
    }

    toast.success(message, {
        duration: 3000,
        style: {
            background: '#ffffff',
            color: '#374151',
            border: '2px solid #10b981',
            borderRadius: '10px',
            fontWeight: '500',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
        },
        iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
        },
    });
};

/**
 * 삭제 실패 토스트
 */
export const showDeleteErrorToast = ({
    itemName,
    itemType = 'item',
    error,
    customMessage,
}: DeleteErrorOptions) => {
    let message = customMessage;

    if (!message) {
        const errorMessage = error instanceof Error ? error.message : error || 'Unknown error';
        message = `Failed to delete "${itemName}" ${itemType}: ${errorMessage}`;
    }

    toast.error(message, {
        duration: 4000,
        style: {
            background: '#ffffff',
            color: '#374151',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            fontWeight: '500',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
        },
        iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
        },
    });
};

/**
 * 경고 확인 토스트 (주황색)
 */
export const showWarningConfirmToast = ({
    title = 'Warning',
    message,
    onConfirm,
    onCancel,
    confirmText = 'Continue',
    cancelText = 'Cancel',
    duration = Infinity,
}: WarningConfirmOptions) => {
    const confirmToast = toast(
        (t) => (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                <div
                    style={{
                        fontWeight: '600',
                        color: '#f59e0b',
                        fontSize: '1rem',
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        fontSize: '0.9rem',
                        color: '#374151',
                        lineHeight: '1.4',
                    }}
                >
                    {message}
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'flex-end',
                        marginTop: '4px',
                    }}
                >
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            onCancel?.();
                        }}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#ffffff',
                            border: '2px solid #6b7280',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            color: '#374151',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                        onMouseOver={(e) => {
                            (e.target as HTMLButtonElement).style.backgroundColor = '#f9fafb';
                            (e.target as HTMLButtonElement).style.borderColor = '#4b5563';
                        }}
                        onMouseOut={(e) => {
                            (e.target as HTMLButtonElement).style.backgroundColor = '#ffffff';
                            (e.target as HTMLButtonElement).style.borderColor = '#6b7280';
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await onConfirm();
                            } catch (error) {
                                console.error('Warning confirmation error:', error);
                            }
                        }}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: '2px solid #d97706',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        }}
                        onMouseOver={(e) => {
                            (e.target as HTMLButtonElement).style.backgroundColor = '#d97706';
                            (e.target as HTMLButtonElement).style.borderColor = '#b45309';
                        }}
                        onMouseOut={(e) => {
                            (e.target as HTMLButtonElement).style.backgroundColor = '#f59e0b';
                            (e.target as HTMLButtonElement).style.borderColor = '#d97706';
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        ),
        {
            duration,
            style: {
                maxWidth: '420px',
                padding: '20px',
                backgroundColor: '#f9fafb',
                border: '2px solid #374151',
                borderRadius: '12px',
                boxShadow:
                    '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                color: '#374151',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            },
        },
    );

    return confirmToast;
};

/**
 * 간단한 경고 토스트 (주황색)
 */
export const showWarningToast = ({
    message,
    duration = 4000,
}: WarningToastOptions) => {
    toast(message, {
        duration,
        icon: '⚠️',
        style: {
            background: '#f59e0b',
            color: '#fff',
            borderRadius: '10px',
            fontWeight: '500',
        },
        iconTheme: {
            primary: '#d97706',
            secondary: '#fff',
        },
    });
};

/**
 * 워크플로우 덮어쓰기 확인 토스트
 */
export const showWorkflowOverwriteConfirm = (
    workflowName: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
) => {
    return showWarningConfirmToast({
        title: 'Workflow Already Exists',
        message: `A workflow named "${workflowName}" already exists.\nDo you want to overwrite it?`,
        onConfirm,
        onCancel,
        confirmText: 'Overwrite',
        cancelText: 'Cancel',
    });
};

/**
 * 새 워크플로우 시작 확인 토스트
 */
export const showNewWorkflowConfirm = (
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
) => {
    return showWarningConfirmToast({
        title: 'Start New Workflow?',
        message: 'This will clear all current nodes and edges.\nMake sure to save your current work if needed.',
        onConfirm,
        onCancel,
        confirmText: 'Start New',
        cancelText: 'Cancel',
    });
};

/**
 * 워크플로우 삭제 전용 유틸리티
 */
export const showWorkflowDeleteConfirm = (
    workflowName: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
) => {
    return showDeleteConfirmToast({
        title: 'Delete Workflow',
        message: `Are you sure you want to delete "${workflowName}"?\nThis action cannot be undone.`,
        itemName: workflowName,
        onConfirm,
        onCancel,
        confirmText: 'Delete',
        cancelText: 'Cancel',
    });
};

/**
 * 로그 삭제 전용 유틸리티
 */
export const showLogDeleteConfirm = (
    logType: string,
    workflowName: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
) => {
    return showDeleteConfirmToast({
        title: `Delete ${logType}`,
        message: `Are you sure you want to delete all ${logType.toLowerCase()} for "${workflowName}"?\nThis action cannot be undone.`,
        itemName: workflowName,
        onConfirm,
        onCancel,
        confirmText: 'Delete',
        cancelText: 'Cancel',
    });
};

/**
 * 채팅 삭제 전용 유틸리티
 */
export const showChatDeleteConfirm = (
    chatName: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
) => {
    return showDeleteConfirmToast({
        title: 'Delete Chat',
        message: `Are you sure you want to delete the chat "${chatName}"?\nThis action cannot be undone.`,
        itemName: chatName,
        onConfirm,
        onCancel,
        confirmText: 'Delete',
        cancelText: 'Cancel',
    });
};

/**
 * 성능 데이터 삭제 전용 유틸리티
 */
export const showPerformanceDataDeleteConfirm = (
    workflowName: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
) => {
    return showDeleteConfirmToast({
        title: 'Delete Performance Data',
        message: `Are you sure you want to delete all performance data for "${workflowName}"?\nThis action cannot be undone.`,
        itemName: workflowName,
        onConfirm,
        onCancel,
        confirmText: 'Delete',
        cancelText: 'Cancel',
    });
};
