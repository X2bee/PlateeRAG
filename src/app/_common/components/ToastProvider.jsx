"use client";
import { Toaster } from 'react-hot-toast';

const ToastProvider = () => {
    return (
        <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
                style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '10px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    maxWidth: '500px',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                },
                success: {
                    duration: 3000,
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                    },
                    style: {
                        background: '#ffffff',
                        color: '#374151',
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        borderColor: '#10b981',
                        borderRadius: '10px',
                        fontWeight: '500',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
                        maxWidth: '500px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                    },
                },
                error: {
                    style: {
                        background: '#ffffff',
                        color: '#374151',
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        borderColor: '#ef4444',
                        borderRadius: '10px',
                        fontWeight: '500',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
                        maxWidth: '500px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                    },
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                    },
                },
                loading: {
                    style: {
                        background: '#6b7280',
                        color: '#fff',
                        fontWeight: '500',
                        maxWidth: '500px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                    },
                },
                // 경고 토스트용 스타일
                blank: {
                    style: {
                        background: '#f59e0b',
                        color: '#fff',
                        fontWeight: '500',
                        maxWidth: '500px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                    },
                },
                // 커스텀 삭제 확인 토스트용 스타일
                custom: {
                    style: {
                        background: '#f9fafb',
                        color: '#374151',
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        borderColor: '#374151',
                        borderRadius: '12px',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                        maxWidth: '500px',
                        padding: '20px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                    },
                },
            }}
        />
    );
};

export default ToastProvider;
