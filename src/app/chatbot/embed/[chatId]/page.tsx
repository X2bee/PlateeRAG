'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ChatInterface from '@/app/chat/components/ChatInterface';
import { Workflow } from '@/app/chat/components/types';
import styles from './Embed.module.scss'; // 임베드 전용 스타일

const EmbedChatContent = () => {
    const params = useParams();
    const searchParams = useSearchParams();
    const chatId = params.chatId as string;
    const workflowNameFromUrl = searchParams.get('workflowName');

    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!chatId) {
            setLoading(false);
            return;
        }
        if (!workflowNameFromUrl) {
            setLoading(false)
            return;
        }
        const fetchWorkflow = async () => {
            try {
                const fetchedWorkflow: Workflow | null = {
                                    id: chatId,
                                    name: workflowNameFromUrl,
                                    filename: workflowNameFromUrl,
                                    author: 'Unknown',
                                    nodeCount: 0,
                                    status: 'active' as const,
                                };
                if (workflowNameFromUrl) {
                    fetchedWorkflow.name = workflowNameFromUrl;
                }
                setWorkflow(fetchedWorkflow);
            } catch (err) {
                 if (workflowNameFromUrl) {
                    setWorkflow({
                        id: chatId,
                        name: workflowNameFromUrl,
                        status: 'active',
                        author: 'Unknown',
                        nodeCount: 0,
                    });
                }
            } finally {
                setLoading(false);
            }
        };
        fetchWorkflow();
    }, [chatId, workflowNameFromUrl]);

    if (loading || !workflow) {
        return <div className={styles.loader}></div>;
    }

    return (
        <div className={styles.embedContainer}>
            <ChatInterface
                mode="deploy"
                onBack={() => { } }
                onChatStarted={() => { } }
                hideBackButton={true}
                existingChatData={undefined} 
                workflow={workflow}            
                user_id = {chatId}
                />
        </div>
    );
};

const EmbedPage = () => {
    return (
        <Suspense fallback={<div className={styles.loader}></div>}>
            <EmbedChatContent />
        </Suspense>
    );
};

export default EmbedPage;