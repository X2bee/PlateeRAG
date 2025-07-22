import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { FiCode, FiExternalLink, FiX, FiTerminal, FiCopy } from 'react-icons/fi';
import toast from 'react-hot-toast'; 
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
    const [curlPayload, setCurlPayload] = useState('');
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('website');
            const defaultPayload = JSON.stringify({
                workflow_name: workflow.name,
                workflow_id: workflow.id,
                input_data: "안녕하세요",
                interaction_id: "default",
                selected_collection: "string"
            }, null, 2);
            setCurlPayload(defaultPayload);

            setTimeout(() => closeButtonRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

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

    const curlCode = `curl -X 'POST' \\
    '${baseUrl}/api/workflow/execute/based_id' \\
    -H 'accept: application/json' \\
    -H 'Content-Type: application/json' \\
    -d '${curlPayload.replace(/'/g, "'\\''")}'`;

    const handleCopy = (text: string) => {
        if (!text || !navigator.clipboard) {
            toast.error('클립보드를 사용할 수 없습니다.');
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            toast.success('클립보드에 복사되었습니다!');
        }, (err) => {
            toast.error('복사에 실패했습니다.');
            console.error('클립보드 복사 실패:', err);
        });
    };

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
                    <button
                        className={`${styles.tabButton} ${activeTab === 'curl' ? styles.active : ''}`}
                        onClick={() => setActiveTab('curl')}
                        role="tab"
                        aria-selected={activeTab === 'curl'}
                    >
                        <FiTerminal /> cURL
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
                            <div className={styles.codeBlockHeader}>
                                <h5>Python</h5>
                                <button className={styles.copyButton} onClick={() => handleCopy(pythonApiCode)}>
                                    <FiCopy /> Copy
                                </button>
                             </div>
                             <pre className={styles.codeSnippet}>{baseUrl ? pythonApiCode : '코드 생성 중...'}</pre>

                            <div className={styles.codeBlockHeader}>
                                <h5>JavaScript</h5>
                                <button className={styles.copyButton} onClick={() => handleCopy(jsApiCode)}>
                                    <FiCopy /> Copy
                                </button>
                             </div>
                            <pre className={styles.codeSnippet}>{baseUrl ? jsApiCode : '코드 생성 중...'}</pre>
                        </div>
                    )}

                    {activeTab === 'curl' && (
                        <div className={styles.tabPanel}>
                             <p>아래 텍스트 영역에서 Payload를 직접 수정하여 cURL 명령어를 완성할 수 있습니다.</p>
                             <textarea
                                className={styles.payloadTextarea}
                                value={curlPayload}
                                onChange={(e) => setCurlPayload(e.target.value)}
                                rows={10}
                                spellCheck="false"
                             />
                             <div className={styles.codeBlockHeader}>
                                <h5>생성된 cURL 명령어:</h5>
                                <button className={styles.copyButton} onClick={() => handleCopy(curlCode)}>
                                    <FiCopy /> Copy
                                </button>
                             </div>
                             <pre className={styles.codeSnippet}>{baseUrl ? curlCode : '코드 생성 중...'}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};