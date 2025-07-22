import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { FiCode, FiExternalLink, FiX } from 'react-icons/fi';
import { Workflow } from './types';
import { useEffect, useRef, useState } from 'react';

interface DeploymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    workflow: Workflow;
}
export const DeploymentModal: React.FC<DeploymentModalProps> = ({ isOpen, onClose, workflow }) => {
    const [baseUrl, setBaseUrl] = useState('');
    const [activeTab, setActiveTab] = useState('website');
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('website');
            setTimeout(() => closeButtonRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            onClose();
        }
    };

    const chatId = workflow.id;
    const workflowName = encodeURIComponent(workflow.name);
    const apiEndpoint = `${baseUrl}/api/workflow/execute/based_id`;
    const webPageUrl = `${baseUrl}/chatbot/${chatId}?workflowName=${workflowName}`;

    const pythonApiCode = `import requests

API_URL = "${apiEndpoint}"

def query(payload):
    response = requests.post(API_URL, json=payload)
    return response.json()

output = query({
    "workflow_name": ${workflowName},
    "workflow_id": ${chatId},
    "input_data": "안녕하세요",
    "interaction_id": "default",
    "selected_collection": "string"
})
`;

    const jsApiCode = `async function query(data) {
    const response = await fetch(
        "${apiEndpoint}",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        }
    );
    const result = await response.json();
    return result;
}

query({
    "workflow_name": ${workflowName},
    "workflow_id": ${chatId},
    "input_data": "안녕하세요",
    "interaction_id": "default",
    "selected_collection": "string"
}).then((response) => {
    console.log(response);
});
`;


    return (
        <div
            className={styles.deploymentModalBackdrop}
            role="button"
            tabIndex={-1}
            aria-label="Close deployment modal"
        >
            <div
                className={styles.deploymentModalContainer}
                role="dialog"
                aria-modal="true"
                aria-labelledby="deployment-modal-title"
            >
                <div className={styles.deploymentModalHeader}>
                    <h3 id="deployment-modal-title">배포 정보: {workflow.name}</h3>
                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        className={styles.closeButton}
                        aria-label="Close"
                    >
                        <FiX />
                    </button>
                </div>

                {/* 탭 버튼 UI */}
                <div className={styles.tabContainer}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'website' ? styles.active : ''}`}
                        onClick={() => setActiveTab('website')}
                        role="tab"
                        aria-selected={activeTab === 'website'}
                    >
                        <FiExternalLink /> 웹페이지
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'api' ? styles.active : ''}`}
                        onClick={() => setActiveTab('api')}
                        role="tab"
                        aria-selected={activeTab === 'api'}
                    >
                        <FiCode /> API 연동
                    </button>
                </div>

                {/* 탭 컨텐츠 */}
                <div className={styles.deploymentModalContent}>
                    {activeTab === 'website' && (
                        <div className={styles.tabPanel}>
                            <p>아래 링크를 통해 독립된 웹페이지에서 채팅을 사용할 수 있습니다.</p>
                            <div className={styles.webPageUrl}>
                                <a href={baseUrl ? webPageUrl : '#'} target="_blank" rel="noopener noreferrer">
                                    {baseUrl ? webPageUrl : 'URL 생성 중...'}
                                </a>
                                <button onClick={() => navigator.clipboard.writeText(webPageUrl)} disabled={!baseUrl}>Copy</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'api' && (
                        <div className={styles.tabPanel}>
                             <p>아래 코드를 사용하여 API를 통해 워크플로우를 호출할 수 있습니다.</p>
                            <h5>Python</h5>
                            <pre className={styles.codeSnippet}>{baseUrl ? pythonApiCode : '코드 생성 중...'}</pre>
                            <h5>JavaScript</h5>
                            <pre className={styles.codeSnippet}>{baseUrl ? jsApiCode : '코드 생성 중...'}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};