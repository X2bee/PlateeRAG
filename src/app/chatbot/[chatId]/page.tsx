'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ChatInterface from '@/app/chat/components/ChatInterface';
import { Workflow } from '@/app/chat/components/types';
import { decryptUrlParams } from '@/app/_common/utils/urlEncryption';
import { ALLOWED_ORIGINS } from '@/app/config';
import styles from './StandaloneChat.module.scss';

const StandaloneChatPage = () => {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const encryptedParams = params.chatId as string;
    const workflowNameFromUrl = searchParams.get('workflowName') as string;
    const hideInputUI = searchParams.get('hideInput') === 'true'; // 새로 추가

    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string>('');
    const [workflowName, setWorkflowName] = useState<string>('');

    // origin 검증 함수
    const isAllowedOrigin = (origin: string): boolean => {
        return ALLOWED_ORIGINS.includes(origin);
    };

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // 여러 origin 검증
            if (!isAllowedOrigin(event.origin)) {
                console.warn(`Message from unauthorized origin: ${event.origin}`);
                return;
            }

            if (event.data?.type === 'SEND_QUERY' && event.data?.query) {
                const query = event.data.query;
                console.log('Received query from parent:', query);

                setTimeout(() => {
                    const textarea = document.querySelector('textarea');
                    const sendButton = document.querySelector('button[class*="sendButton"]');

                    if (textarea && sendButton) {
                        // React의 내부 상태를 강제로 업데이트
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                        if (nativeInputValueSetter) {
                            nativeInputValueSetter.call(textarea, query);
                        }

                        // 다양한 이벤트 발생으로 React 상태 동기화
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        textarea.dispatchEvent(new Event('change', { bubbles: true }));
                        textarea.focus();

                        // 상태 업데이트 확인
                        setTimeout(() => {
                            (sendButton as HTMLButtonElement).click();
                        }, 200);
                    }
                }, 300);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const handleDecryption = async () => {
            if (!encryptedParams) {
                setError('잘못된 접근입니다. 암호화된 파라미터가 필요합니다.');
                setLoading(false);
                return;
            }

            try {
                // 암호화된 파라미터 복호화
                const decryptedParams = await decryptUrlParams(encryptedParams);
                
                if (!decryptedParams) {
                    // 기존 방식으로 fallback (하위 호환성)
                    if (workflowNameFromUrl) {
                        setUserId(encryptedParams);
                        setWorkflowName(workflowNameFromUrl);
                    } else {
                        setError('URL 파라미터를 복호화할 수 없습니다.');
                        setLoading(false);
                        return;
                    }
                } else {
                    // 배포 상태 확인 메시지 처리
                    if (decryptedParams.message) {
                        setError(decryptedParams.message === 'This workflow is not deployed.' 
                            ? '이 워크플로우는 배포되지 않았습니다.' 
                            : decryptedParams.message);
                        setLoading(false);
                        return;
                    }
                    
                    setUserId(decryptedParams.userId);
                    setWorkflowName(decryptedParams.workflowName);
                }

                const fetchWorkflow = async () => {
                    try {
                        setLoading(true);
                        const currentUserId = decryptedParams?.userId || userId;
                        const currentWorkflowName = decryptedParams?.workflowName || workflowName;

                        if (!currentUserId || !currentWorkflowName) {
                            setError('사용자 ID 또는 워크플로우 이름이 없습니다.');
                            return;
                        }

                        const fetchedWorkflow: Workflow | null = {
                            id: currentUserId,
                            name: currentWorkflowName,
                            filename: currentWorkflowName,
                            author: 'Unknown',
                            nodeCount: 0,
                            status: 'active' as const,
                        };
                        setWorkflow(fetchedWorkflow);
                        setError(null);
                    } catch (err) {
                        console.error(err);
                        setError('워크플로우를 불러오는 데 실패했습니다. 파라미터를 확인해 주세요.');
                        setWorkflow(null);
                    } finally {
                        setLoading(false);
                    }
                };

                fetchWorkflow();
            } catch (error) {
                console.error('Decryption error:', error);
                setError('URL 파라미터 복호화 중 오류가 발생했습니다.');
                setLoading(false);
            }
        };

        handleDecryption();
    }, [encryptedParams, workflowNameFromUrl, userId, workflowName]);

    if (loading) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.centeredMessage}>
                    <div className={styles.spinner}></div>
                    <p>채팅 인터페이스를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    if (error || !workflow) {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.centeredMessage}>
                    <h2>오류</h2>
                    <p>{error || '워크플로우를 찾을 수 없습니다.'}</p>
                    <button onClick={() => router.push('/')} className={styles.homeButton}>
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.mainContent}>
            <div className={styles.chatContainer}>
                <div className={styles.workflowSection}>
                    <ChatInterface
                        mode="deploy"
                        workflow={workflow}
                        onBack={() => { }}
                        onChatStarted={() => { }}
                        hideBackButton={true}
                        hideInputUI={hideInputUI} // 새로 추가된 prop
                        existingChatData={undefined}
                        user_id={userId || workflow.id}
                    />
                </div>
            </div>
        </div>
    );
};

export default StandaloneChatPage;
