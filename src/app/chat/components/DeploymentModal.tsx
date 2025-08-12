import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { Prism } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiCode, FiExternalLink, FiX, FiTerminal, FiCopy, FiShare2 } from 'react-icons/fi';
import { SiPython, SiJavascript } from "react-icons/si";
import toast from 'react-hot-toast';
import { Workflow } from './types';
import { useEffect, useRef, useState, Children, isValidElement, ReactNode } from 'react';
import { getAuthCookie } from '@/app/_common/utils/cookieUtils';

interface DeploymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    workflow: Workflow;
    workflowDetail?: any;
}

// additional_params를 파싱하는 함수
const parseAdditionalParams = (workflowData: any) => {
    if (!workflowData || !workflowData.nodes || !workflowData.edges) {
        return null;
    }
    const result: any = {};
    const schemaProviderNodes = workflowData.nodes.filter((node: any) =>
        node.data.nodeName === "Schema Provider(Input)" || node.data.id === "input_schema_provider"
    );

    if (schemaProviderNodes.length === 0) {
        return null;
    }
    schemaProviderNodes.forEach((schemaNode: any) => {
        const connectedEdges = workflowData.edges.filter((edge: any) =>
            edge.source.nodeId === schemaNode.id &&
            edge.source.portId === "args_schema" &&
            edge.source.portType === "output"
        );

        connectedEdges.forEach((edge: any) => {
            const targetNodeId = edge.target.nodeId;

            if (schemaNode.data.parameters) {
                const handleIdParams: any = {};

                schemaNode.data.parameters.forEach((param: any) => {
                    if (param.handle_id === true) {
                        handleIdParams[param.id] = param.value;
                    }
                });

                if (Object.keys(handleIdParams).length > 0) {
                    result[targetNodeId] = handleIdParams;
                }
            }
        });
    });

    return Object.keys(result).length > 0 ? result : null;
};

const OutputSchemaProviderParse = (workflowData: any) => {
    if (!workflowData || !workflowData.nodes || !workflowData.edges) {
        return null;
    }
    const schemaProviderNodes = workflowData.nodes.filter((node: any) =>
        node.data.nodeName === "Schema Provider(output)" || node.data.id === "output_schema_provider"
    );

    if (schemaProviderNodes.length === 0) {
        return null;
    }

    const schemaProviderNode = schemaProviderNodes[0];
    const outputSchema: any = {};
    schemaProviderNode.data.parameters.forEach((param: any) => {
        if (param.handle_id === true) {
            outputSchema[param.id] = param.value;
        }
    });

    return outputSchema ? outputSchema : null;
};

// JSON을 적절한 들여쓰기로 포맷팅하는 함수
const formatAdditionalParamsForCode = (params: any, baseIndent: number = 4): string => {
    if (!params) return 'null';

    const indent = ' '.repeat(baseIndent);
    const innerIndent = ' '.repeat(baseIndent + 4);
    const deepIndent = ' '.repeat(baseIndent + 8);

    let result = '{\n';

    Object.keys(params).forEach((key, index) => {
        const isLast = index === Object.keys(params).length - 1;
        result += `${innerIndent}"${key}": {\n`;

        const paramObj = params[key];
        Object.keys(paramObj).forEach((paramKey, paramIndex) => {
            const isLastParam = paramIndex === Object.keys(paramObj).length - 1;
            result += `${deepIndent}"${paramKey}": "${paramObj[paramKey]}"${isLastParam ? '' : ','}\n`;
        });

        result += `${innerIndent}}${isLast ? '' : ','}\n`;
    });

    result += `${indent}}`;
    return result;

};
const formatOutputSchemaForCode = (params: any, baseIndent: number = 4): string => {
    if (!params) return 'null';

    const indent = ' '.repeat(baseIndent);
    const innerIndent = ' '.repeat(baseIndent + 4);
    const deepIndent = ' '.repeat(baseIndent + 8);

    let result = '{\n';

    Object.keys(params).forEach((key, index) => {
        const isLast = index === Object.keys(params).length - 1;
        const paramObj = params[key];
        result += `${innerIndent}"${key}": ${paramObj}`;
        result += `${isLast ? '' : ','}\n`;
    });

    result += `${indent}}`;
    return result;
};
export const DeploymentModal: React.FC<DeploymentModalProps> = ({ isOpen, onClose, workflow, workflowDetail }) => {
    const [baseUrl, setBaseUrl] = useState('');
    const [activeTab, setActiveTab] = useState('website');
    const [activeApiLang, setActiveApiLang] = useState('python');
    const [curlPayload, setCurlPayload] = useState('');
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const user_id = getAuthCookie('user_id') as string;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('website');
            setActiveApiLang('python');

            const defaultPayload = JSON.stringify({
                workflow_name: workflow.name,
                workflow_id: workflow.id,
                input_data: "안녕하세요",
                interaction_id: "default",
                selected_collection: "string",
                user_id: user_id
            }, null, 2);
            setCurlPayload(defaultPayload);

            setTimeout(() => closeButtonRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;
    const userId = user_id
    const workflowId = workflow.id;
    const workflowName = workflow.name;
    const apiEndpoint = `${baseUrl}/api/workflow/deploy/execute/based_id`;
    const webPageUrl = `${baseUrl}/chatbot/${userId}?workflowName=${workflowName}`;
    const additional_params = parseAdditionalParams(workflowDetail);
    const outputSchema = OutputSchemaProviderParse(workflowDetail);


    const pythonApiCode = `import requests

API_URL = "${apiEndpoint}"

def query(payload):
    response = requests.post(API_URL, json=payload)
    return response.json()

output = query({
    "workflow_name": "${workflowName}",
    "workflow_id": "${workflowId}",
    "input_data": "안녕하세요",
    "interaction_id": "default",
    "selected_collection": "string",
    "additional_params": ${formatAdditionalParamsForCode(additional_params, 4)},
    "user_id": "${userId}"
})

print(output)

# Result Format:
${formatOutputSchemaForCode(outputSchema, 1)}
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
    "workflow_name": "${workflowName}",
    "workflow_id": "${workflowId}",
    "input_data": "안녕하세요",
    "interaction_id": "default",
    "selected_collection": "string",
    "additional_params": ${formatAdditionalParamsForCode(additional_params, 4)},
    "user_id": "${userId}"
}).then((response) => {
    console.log(response);
});

// Result Format:
${formatOutputSchemaForCode(outputSchema, 1)}
`;

    const curlCode = `curl -X 'POST' \\
    '${baseUrl}/api/workflow/deploy/execute/based_id' \\
    -H 'accept: application/json' \\
    -H 'Content-Type: application/json' \\
    -d '${curlPayload.replace(/'/g, "'\\''")}'`;

    const popupHtmlCode = `<script type="module">
    import {Chatbot} from "${baseUrl}/chatbot-embed.js"
    Chatbot.init({
        userId: "${userId}",
        apiHost: "${baseUrl}",
        workflowName: "${workflowName}"
    })
</script>`;

    const fullPageHtmlCode = `<fullchatbot style="width: 100%; height: 100%;"></fullchatbot>
<script type="module">
    import {Chatbot} from "${baseUrl}/chatbot-embed.js"
    Chatbot.initFull({
        userId: "${userId}",
        apiHost: "${baseUrl}",
        workflowName: "${workflowName}"
    })
</script>`;

    const CodeBlockWithCopyButton = ({ children, ...props }: { children: ReactNode; [key: string]: any }) => {

        /**
         * 중첩된 React 노드에서 모든 텍스트를 재귀적으로 추출하는 함수
         * @param nodes 추출할 React 노드
         * @returns 합쳐진 전체 텍스트 문자열
         */
        const getTextFromChildren = (nodes: ReactNode): string => {
            if (typeof nodes === 'string') {
                return nodes;
            }
            if (Array.isArray(nodes)) {
                return nodes.map(getTextFromChildren).join('');
            }
            if (isValidElement(nodes)) {
                const elementProps = nodes.props as { children?: ReactNode };

                if (elementProps.children) {
                    return getTextFromChildren(elementProps.children);
                }
            }
            return '';
        };

        const codeString = getTextFromChildren(children);

        const handleCopy = () => {
            if (!codeString) {
                console.error("복사할 코드를 찾을 수 없습니다.");
                return;
            };

            navigator.clipboard.writeText(codeString).then(() => {
                toast.success('클립보드에 복사되었습니다!');
            }, (err) => {
                toast.error('복사에 실패했습니다.');
            });
        };

        return (
            <div className={styles.codeBlockWrapper}>
                <pre {...props}>
                    {children}
                </pre>
                <button className={styles.copyButton} onClick={handleCopy}>
                    <FiCopy />
                    <span>Copy</span>
                </button>
            </div>
        );
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
                    <button
                        className={`${styles.tabButton} ${activeTab === 'embed' ? styles.active : ''}`}
                        onClick={() => setActiveTab('embed')}
                        role="tab"
                        aria-selected={activeTab === 'embed'}
                    >
                        <FiShare2 /> 임베드
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
                             <p>사용하시는 언어를 선택하여 아래 코드를 통해 API를 호출할 수 있습니다.</p>

                             {/* API 언어 탭 컨테이너 */}
                             <div className={styles.nestedTabContainer}>
                                <button
                                    className={`${styles.langTabButton} ${activeApiLang === 'python' ? styles.active : ''}`}
                                    onClick={() => setActiveApiLang('python')}
                                >
                                    <SiPython />Python
                                </button>
                                <button
                                    className={`${styles.langTabButton} ${activeApiLang === 'javascript' ? styles.active : ''}`}
                                    onClick={() => setActiveApiLang('javascript')}
                                >
                                    <SiJavascript />JavaScript
                                </button>
                             </div>

                             {/* 선택된 언어의 코드 블록만 렌더링 */}
                             {activeApiLang === 'python' && (
                                <div className={styles.codeBlockWrapper}>
                                    <Prism
                                        PreTag={CodeBlockWithCopyButton}
                                        language="python"
                                        style={vscDarkPlus}
                                        showLineNumbers={true}
                                        customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                                    >
                                        {baseUrl ? pythonApiCode : '코드 생성 중...'}
                                    </Prism>
                                </div>
                             )}

                             {activeApiLang === 'javascript' && (
                                <div className={styles.codeBlockWrapper}>
                                    <Prism
                                        PreTag={CodeBlockWithCopyButton}
                                        language="javascript"
                                        style={vscDarkPlus}
                                        showLineNumbers={true}
                                        customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                                    >
                                        {baseUrl ? jsApiCode : '코드 생성 중...'}
                                    </Prism>
                                </div>
                             )}
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
                             <div className={styles.codeBlockWrapper}>
                                <h5>생성된 cURL 명령어:</h5>
                                <Prism
                                    PreTag={CodeBlockWithCopyButton}
                                    language="bash"
                                    style={vscDarkPlus}
                                    customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                                    wrapLines={true}
                                >
                                    {baseUrl ? curlCode : '코드 생성 중...'}
                                </Prism>
                            </div>
                        </div>
                    )}

                    {activeTab === 'embed' && (
                        <div className={styles.tabPanel}>
                            <p>웹사이트에 챗봇을 임베드하려면 아래 HTML 코드를 사용하세요.</p>

                            <h5>팝업(Popup) 형태</h5>
                            <Prism
                                PreTag={CodeBlockWithCopyButton}
                                language="html"
                                style={vscDarkPlus}
                                customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                            >
                                {baseUrl ? popupHtmlCode : '코드 생성 중...'}
                            </Prism>

                            <h5 style={{ marginTop: '1.5rem' }}>전체 페이지(Full Page) 형태</h5>
                            <Prism
                                PreTag={CodeBlockWithCopyButton}
                                language="html"
                                style={vscDarkPlus}
                                customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                            >
                                {baseUrl ? fullPageHtmlCode : '코드 생성 중...'}
                            </Prism>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
