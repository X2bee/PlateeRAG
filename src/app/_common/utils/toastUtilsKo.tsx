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
 * 재사용 가능한 삭제 확인 토스트 (한국어)
 */
export const showDeleteConfirmToastKo = ({
    title = '삭제 확인',
    message,
    itemName,
    onConfirm,
    onCancel,
    confirmText = '삭제',
    cancelText = '취소',
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
 * 삭제 성공 토스트 (한국어)
 */
export const showDeleteSuccessToastKo = ({
    itemName,
    itemType = '항목',
    count,
    customMessage,
}: DeleteSuccessOptions) => {
    let message = customMessage;

    if (!message) {
        if (count !== undefined) {
            message = `"${itemName}" ${itemType}이(가) 성공적으로 삭제되었습니다! (${count}개 기록 제거됨)`;
        } else {
            message = `"${itemName}" ${itemType}이(가) 성공적으로 삭제되었습니다!`;
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
 * 삭제 실패 토스트 (한국어)
 */
export const showDeleteErrorToastKo = ({
    itemName,
    itemType = '항목',
    error,
    customMessage,
}: DeleteErrorOptions) => {
    let message = customMessage;

    if (!message) {
        const errorMessage = error instanceof Error ? error.message : error || '알 수 없는 오류';
        message = `"${itemName}" ${itemType} 삭제에 실패했습니다: ${errorMessage}`;
    }

    toast.error(message, {
        duration: 4000,
        style: {
            background: '#ef4444',
            color: '#fff',
            borderRadius: '10px',
            fontWeight: '500',
        },
        iconTheme: {
            primary: '#dc2626',
            secondary: '#fff',
        },
    });
};

/**
 * 경고 확인 토스트 (주황색, 한국어)
 */
export const showWarningConfirmToastKo = ({
    title = '경고',
    message,
    onConfirm,
    onCancel,
    confirmText = '계속',
    cancelText = '취소',
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
 * 간단한 경고 토스트 (주황색, 한국어)
 */
export const showWarningToastKo = ({
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
 * 워크플로우 덮어쓰기 확인 토스트 (한국어)
 */
export const showWorkflowOverwriteConfirmKo = (
    workflowName: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
) => {
    return showWarningConfirmToastKo({
        title: '워크플로우가 이미 존재합니다',
        message: `"${workflowName}" 이름의 워크플로우가 이미 존재합니다.\n덮어쓰시겠습니까?`,
        onConfirm,
        onCancel,
        confirmText: '덮어쓰기',
        cancelText: '취소',
    });
};

/**
 * 새 워크플로우 시작 확인 토스트 (한국어)
 */
export const showNewWorkflowConfirmKo = (
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
) => {
    return showWarningConfirmToastKo({
        title: '새 워크플로우를 시작하시겠습니까?',
        message: '현재 모든 노드와 연결이 삭제됩니다.\n필요하다면 현재 작업을 먼저 저장해주세요.',
        onConfirm,
        onCancel,
        confirmText: '새로 시작',
        cancelText: '취소',
    });
};

/**
 * 워크플로우 삭제 전용 유틸리티 (한국어)
 */
export const showWorkflowDeleteConfirmKo = (
    workflowName: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
) => {
    return showDeleteConfirmToastKo({
        title: '워크플로우 삭제',
        message: `"${workflowName}" 워크플로우를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
        itemName: workflowName,
        onConfirm,
        onCancel,
        confirmText: '삭제',
        cancelText: '취소',
    });
};

/**
 * 로그 삭제 전용 유틸리티 (한국어)
 */
export const showLogDeleteConfirmKo = (
    logType: string,
    workflowName: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
) => {
    return showDeleteConfirmToastKo({
        title: `${logType} 삭제`,
        message: `"${workflowName}" 워크플로우의 모든 ${logType.toLowerCase()}을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
        itemName: workflowName,
        onConfirm,
        onCancel,
        confirmText: '삭제',
        cancelText: '취소',
    });
};

/**
 * 채팅 삭제 전용 유틸리티 (한국어)
 */
export const showChatDeleteConfirmKo = (
    chatName: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
) => {
    return showDeleteConfirmToastKo({
        title: '채팅 삭제',
        message: `"${chatName}" 채팅을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
        itemName: chatName,
        onConfirm,
        onCancel,
        confirmText: '삭제',
        cancelText: '취소',
    });
};

/**
 * 성능 데이터 삭제 전용 유틸리티 (한국어)
 */
export const showPerformanceDataDeleteConfirmKo = (
    workflowName: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
) => {
    return showDeleteConfirmToastKo({
        title: '성능 데이터 삭제',
        message: `"${workflowName}" 워크플로우의 모든 성능 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
        itemName: workflowName,
        onConfirm,
        onCancel,
        confirmText: '삭제',
        cancelText: '취소',
    });
};
