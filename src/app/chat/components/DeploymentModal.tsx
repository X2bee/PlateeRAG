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
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
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
    const apiEndpoint = `${baseUrl}/api/v1/prediction/${chatId}`;
    const webPageUrl = `${baseUrl}/chatbot/${chatId}?workflowName=${workflowName}`;

    const pythonApiCode = `import requests

API_URL = "${apiEndpoint}"

def query(payload):
    response = requests.post(API_URL, json=payload)
    return response.json()

output = query({
    "question": "Hey, how are you?",
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

query({"question": "Hey, how are you?"}).then((response) => {
    console.log(response);
});
`;


    return (
        <div
            className={styles.deploymentModalBackdrop}
            onClick={onClose}
            onKeyDown={handleBackdropKeyDown}
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
                <div className={styles.deploymentModalContent}>
                    <div className={styles.deploymentSection}>
                        <h4><FiExternalLink /> 독립 웹페이지</h4>
                        <p>아래 링크를 통해 독립된 웹페이지에서 채팅을 사용할 수 있습니다.</p>
                        <div className={styles.webPageUrl}>
                            <a href={webPageUrl} target="_blank" rel="noopener noreferrer">{webPageUrl}</a>
                            <button onClick={() => navigator.clipboard.writeText(webPageUrl)}>Copy</button>
                        </div>
                    </div>
                    <div className={styles.deploymentSection}>
                        <h4><FiCode /> API 연동</h4>
                        <p>아래 코드를 사용하여 API를 통해 워크플로우를 호출할 수 있습니다.</p>
                        <h5>Python</h5>
                        <pre className={styles.codeSnippet}>{pythonApiCode}</pre>
                        <h5>JavaScript</h5>
                        <pre className={styles.codeSnippet}>{jsApiCode}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
};