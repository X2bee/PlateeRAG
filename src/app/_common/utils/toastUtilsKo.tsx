import toast from 'react-hot-toast';

// 전역 키보드 핸들러 관리
let currentKeyHandler: ((e: KeyboardEvent) => void) | null = null;

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
    enableEnterKey = false,
}: DeleteConfirmOptions & { enableEnterKey?: boolean }) => {
    // 기존 핸들러가 있으면 제거
    if (currentKeyHandler) {
        document.removeEventListener('keydown', currentKeyHandler);
        currentKeyHandler = null;
    }

    if (enableEnterKey) {
        currentKeyHandler = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                // 핸들러 정리
                if (currentKeyHandler) {
                    document.removeEventListener('keydown', currentKeyHandler);
                    currentKeyHandler = null;
                }
                toast.dismiss();
                onConfirm();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                // 핸들러 정리
                if (currentKeyHandler) {
                    document.removeEventListener('keydown', currentKeyHandler);
                    currentKeyHandler = null;
                }
                toast.dismiss();
                onCancel?.();
            }
        };
        document.addEventListener('keydown', currentKeyHandler);
    }

    const confirmToast = toast(
        (t) => {

            return (
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
                    {enableEnterKey && (
                        <div
                            style={{
                                fontSize: '0.8rem',
                                color: '#6b7280',
                                fontStyle: 'italic',
                            }}
                        >
                            💡 Enter키를 누르면 삭제됩니다 | ESC로 취소
                        </div>
                    )}
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
                                if (currentKeyHandler) {
                                    document.removeEventListener('keydown', currentKeyHandler);
                                    currentKeyHandler = null;
                                }
                                onCancel?.();
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#ffffff',
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                borderColor: '#6b7280',
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
                                if (currentKeyHandler) {
                                    document.removeEventListener('keydown', currentKeyHandler);
                                    currentKeyHandler = null;
                                }
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
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                borderColor: '#b91c1c',
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
            );
        },
        {
            duration,
            style: {
                maxWidth: '420px',
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: '#374151',
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
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#10b981',
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
    enableEnterKey = false,
}: WarningConfirmOptions & { enableEnterKey?: boolean }) => {
    // 기존 핸들러가 있으면 제거
    if (currentKeyHandler) {
        document.removeEventListener('keydown', currentKeyHandler);
        currentKeyHandler = null;
    }

    if (enableEnterKey) {
        currentKeyHandler = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                // 핸들러 정리
                if (currentKeyHandler) {
                    document.removeEventListener('keydown', currentKeyHandler);
                    currentKeyHandler = null;
                }
                toast.dismiss();
                onConfirm();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                // 핸들러 정리
                if (currentKeyHandler) {
                    document.removeEventListener('keydown', currentKeyHandler);
                    currentKeyHandler = null;
                }
                toast.dismiss();
                onCancel?.();
            }
        };
        document.addEventListener('keydown', currentKeyHandler);
    }

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
                {enableEnterKey && (
                    <div
                        style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            fontStyle: 'italic',
                        }}
                    >
                        💡 Enter키를 누르면 계속됩니다 | ESC로 취소
                    </div>
                )}
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
                            if (currentKeyHandler) {
                                document.removeEventListener('keydown', currentKeyHandler);
                                currentKeyHandler = null;
                            }
                            onCancel?.();
                        }}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#ffffff',
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            borderColor: '#6b7280',
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
                            if (currentKeyHandler) {
                                document.removeEventListener('keydown', currentKeyHandler);
                                currentKeyHandler = null;
                            }
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
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            borderColor: '#d97706',
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
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: '#374151',
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
    onCancel?: () => void,
    enableEnterKey: boolean = false
) => {
    return showWarningConfirmToastKo({
        title: '워크플로우가 이미 존재합니다',
        message: `"${workflowName}" 이름의 워크플로우가 이미 존재합니다.\n덮어쓰시겠습니까?`,
        onConfirm,
        onCancel,
        confirmText: '덮어쓰기',
        cancelText: '취소',
        enableEnterKey,
    });
};

/**
 * 워크플로우 버전 변경 확인 토스트 (한국어)
 */
export const showWorkflowVersionChangeConfirmKo = (
    versionLabel: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void,
    enableEnterKey: boolean = false
) => {
    return showWarningConfirmToastKo({
        title: '워크플로우 버전 변경',
        message: `${versionLabel}으로 버전을 변경하시겠습니까?\n현재 사용 버전이 변경됩니다.`,
        onConfirm,
        onCancel,
        confirmText: '변경',
        cancelText: '취소',
        enableEnterKey,
    });
};

/**
 * 새 워크플로우 시작 확인 토스트 (한국어)
 */
export const showNewWorkflowConfirmKo = (
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void,
    enableEnterKey: boolean = false
) => {
    return showWarningConfirmToastKo({
        title: '새 워크플로우를 시작하시겠습니까?',
        message: '현재 모든 노드와 연결이 삭제됩니다.\n필요하다면 현재 작업을 먼저 저장해주세요.',
        onConfirm,
        onCancel,
        confirmText: '새로 시작',
        cancelText: '취소',
        enableEnterKey,
    });
};

/**
 * 작업 히스토리 초기화 경고 토스트 (한국어)
 */
export const showHistoryClearWarningKo = (
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void,
    enableEnterKey: boolean = false
) => {
    return showWarningConfirmToastKo({
        title: '작업 히스토리가 초기화됩니다',
        message: '이 작업을 수행하면 모든 작업 히스토리가 삭제됩니다.',
        onConfirm,
        onCancel,
        confirmText: '계속',
        cancelText: '취소',
        enableEnterKey,
    });
};

/**
 * 워크플로우 삭제 전용 유틸리티 (한국어)
 */
export const showWorkflowDeleteConfirmKo = (
    workflowName: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void,
    enableEnterKey: boolean = false
) => {
    return showDeleteConfirmToastKo({
        title: '워크플로우 삭제',
        message: `"${workflowName}" 워크플로우를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
        itemName: workflowName,
        onConfirm,
        onCancel,
        confirmText: '삭제',
        cancelText: '취소',
        enableEnterKey,
    });
};

/**
 * 로그 삭제 전용 유틸리티 (한국어)
 */
export const showLogDeleteConfirmKo = (
    logType: string,
    workflowName: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void,
    enableEnterKey: boolean = false
) => {
    return showDeleteConfirmToastKo({
        title: `${logType} 삭제`,
        message: `"${workflowName}" 워크플로우의 모든 ${logType.toLowerCase()}을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
        itemName: workflowName,
        onConfirm,
        onCancel,
        confirmText: '삭제',
        cancelText: '취소',
        enableEnterKey,
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
        enableEnterKey: true,
    });
};

/**
 * 성능 데이터 삭제 전용 유틸리티 (한국어)
 */
export const showPerformanceDataDeleteConfirmKo = (
    workflowName: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void,
    enableEnterKey: boolean = false
) => {
    return showDeleteConfirmToastKo({
        title: '성능 데이터 삭제',
        message: `"${workflowName}" 워크플로우의 모든 성능 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
        itemName: workflowName,
        onConfirm,
        onCancel,
        confirmText: '삭제',
        cancelText: '취소',
        enableEnterKey,
    });
};

/**
 * LLM 제공자 변경 확인 토스트 (한국어)
 */
export const showLLMProviderChangeConfirmKo = (
    currentProvider: string,
    newProvider: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void,
    enableEnterKey: boolean = false
) => {
    return showWarningConfirmToastKo({
        title: 'LLM 제공자 변경',
        message: `현재: ${currentProvider} → 변경: ${newProvider}\n변경 시 백엔드에서 재설정 작업이 수행됩니다.`,
        onConfirm,
        onCancel,
        confirmText: '변경',
        cancelText: '취소',
        enableEnterKey,
    });
};

/**
 * 일반적인 성공 토스트 (한국어)
 */
export const showSuccessToastKo = (message: string, duration: number = 3000) => {
    toast.success(message, {
        duration,
        style: {
            background: '#ffffff',
            color: '#374151',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#10b981',
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
 * 일반적인 에러 토스트 (한국어)
 */
export const showErrorToastKo = (message: string, duration: number = 4000) => {
    toast.error(message, {
        duration,
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
 * 로딩 토스트 (한국어)
 */
export const showLoadingToastKo = (message: string, id?: string) => {
    return toast.loading(message, {
        id,
        style: {
            background: '#ffffff',
            color: '#374151',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#d1d5db',
            borderRadius: '10px',
            fontWeight: '500',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        },
    });
};

/**
 * 토스트 해제
 */
export const dismissToastKo = (id?: string) => {
    toast.dismiss(id);
};

/**
 * 임베딩 제공자 변경 확인 토스트 (한국어)
 */
export const showEmbeddingProviderChangeConfirmKo = (
    currentProvider: string,
    newProvider: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void,
    enableEnterKey: boolean = false
) => {
    return showWarningConfirmToastKo({
        title: '임베딩 제공자 변경',
        message: `현재: ${currentProvider} → 변경: ${newProvider}\n변경 시 백엔드에서 재설정 작업이 수행됩니다.`,
        onConfirm,
        onCancel,
        confirmText: '변경',
        cancelText: '취소',
        enableEnterKey,
    });
};

/**
 * 복사 성공 토스트 (한국어)
 */
export const showCopySuccessToastKo = (message: string = '클립보드에 복사되었습니다!') => {
    showSuccessToastKo(message);
};

/**
 * 복사 실패 토스트 (한국어)
 */
export const showCopyErrorToastKo = (message: string = '복사에 실패했습니다.') => {
    showErrorToastKo(message);
};

/**
 * 연결 테스트 성공 토스트 (한국어)
 */
export const showConnectionSuccessToastKo = (service: string, message?: string) => {
    const defaultMessage = `${service} 연결 테스트 성공!`;
    showSuccessToastKo(message || defaultMessage);
};

/**
 * 연결 테스트 실패 토스트 (한국어)
 */
export const showConnectionErrorToastKo = (service: string, error: string) => {
    showErrorToastKo(`${service} 연결 실패: ${error}`);
};

/**
 * 인스턴스 관리 관련 토스트들
 */
export const showInstanceSuccessToastKo = (message: string) => {
    showSuccessToastKo(message);
};

export const showInstanceErrorToastKo = (message: string) => {
    showErrorToastKo(message);
};

/**
 * VLLM 관련 토스트들
 */
export const showVLLMSuccessToastKo = (message: string) => {
    showSuccessToastKo(message);
};

export const showVLLMErrorToastKo = (message: string) => {
    showErrorToastKo(message);
};

/**
 * GPU 검색 관련 토스트들
 */
export const showGpuSearchSuccessToastKo = (count: number) => {
    showSuccessToastKo(`${count}개의 오퍼를 찾았습니다.`);
};

export const showGpuSearchErrorToastKo = (error: string) => {
    showErrorToastKo(`검색 실패: ${error}`);
};

/**
 * VLLM 인스턴스 생성 관련 토스트들
 */
export const showInstanceCreationStartToastKo = (instanceId: string) => {
    showSuccessToastKo(`VLLM 인스턴스 생성 시작! ID: ${instanceId}`);
};

export const showInstanceCreationProgressToastKo = (instanceId: string, status: string) => {
    return showLoadingToastKo(`인스턴스 ${instanceId}: ${status}`);
};

export const showInstanceCreationSuccessToastKo = (instanceId: string, message: string) => {
    showSuccessToastKo(`인스턴스 ${instanceId}: ${message}`);
};

export const showInstanceCreationErrorToastKo = (instanceId: string, error: string) => {
    showErrorToastKo(`인스턴스 ${instanceId}: ${error}`);
};

/**
 * 로그 삭제 확인 토스트 (한국어)
 */
export const showLogDeleteConfirmToastKo = (
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void,
    enableEnterKey: boolean = false
) => {
    return showWarningConfirmToastKo({
        title: '로그 삭제',
        message: '정말 모든 로그를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
        onConfirm,
        onCancel,
        confirmText: '삭제',
        cancelText: '취소',
        enableEnterKey,
    });
};

/**
 * VLLM 인스턴스 생성 관련 토스트들
 */
export const showVllmInstanceCreateSuccessToastKo = (instanceId: string) => {
    showSuccessToastKo(`VLLM 인스턴스 생성 시작! ID: ${instanceId}`);
};

export const showVllmInstanceCreateErrorToastKo = (error: string) => {
    showErrorToastKo(`인스턴스 생성 실패: ${error}`);
};

/**
 * 입력 유효성 검사 토스트들
 */
export const showValidationErrorToastKo = (message: string) => {
    showErrorToastKo(message);
};

/**
 * 오퍼 선택 토스트
 */
export const showOfferSelectedToastKo = () => {
    showSuccessToastKo('오퍼가 선택되었습니다. VLLM 설정을 진행해주세요.');
};

/**
 * 인스턴스 상태 관련 토스트들
 */
export const showInstanceStatusToastKo = {
    creating: (instanceId: string) => showLoadingToastKo(`⏳ 인스턴스 ${instanceId} 생성 중...`),
    starting: (instanceId: string) => showLoadingToastKo(`🚀 인스턴스 ${instanceId} 시작 중...`),
    running: (instanceId: string) => showSuccessToastKo(`✅ 인스턴스 ${instanceId} 실행 중, VLLM 설정 대기...`),
    vllmRunning: (instanceId: string) => showSuccessToastKo(`🎉 인스턴스 ${instanceId} VLLM 실행 완료!`),
    exited: (instanceId: string) => showErrorToastKo(`❌ 인스턴스 ${instanceId} 종료됨`),
    error: (instanceId: string, error?: string) => showErrorToastKo(`💥 인스턴스 ${instanceId} 오류${error ? `: ${error}` : ''}`)
};
