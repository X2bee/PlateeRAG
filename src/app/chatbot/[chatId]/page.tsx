'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { loadWorkflow } from '@/app/api/workflowAPI';
import ChatInterface from '@/app/chat/components/ChatInterface';
import { Workflow } from '@/app/chat/components/types';
import styles from './StandaloneChat.module.scss';

const StandaloneChatPage = () => {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const chatId = params.chatId as string;
    const workflowNameFromUrl = searchParams.get('workflowName') as string;


    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!chatId) {
            setError('잘못된 접근입니다. 워크플로우 ID가 필요합니다.');
            setLoading(false);
            return;
        }

        const fetchWorkflow = async () => {
            try {
                setLoading(true);
                const fetchedWorkflow: Workflow | null = {
                    id: chatId,
                    name: workflowNameFromUrl,
                    filename: workflowNameFromUrl,
                    author: 'Unknown',
                    nodeCount: 0,
                    status: 'active' as const,
                };
                setWorkflow(fetchedWorkflow);
                setError(null);
            } catch (err) {
                console.error(err);
                setError('워크플로우를 불러오는 데 실패했습니다. ID를 확인해 주세요.');
                setWorkflow(null);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkflow();
    }, [chatId]);

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
                        existingChatData={undefined}
                        user_id = {chatId}
                    />
                </div>
            </div>
        </div>
    );
};

export default StandaloneChatPage;
