import React, { useState } from 'react';
import { FiTool, FiDatabase, FiFileText, FiX, FiInfo, FiSettings, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import styles from './ChatToolsDisplay.module.scss';
import { WorkflowData, CanvasNode, Parameter } from '@/app/canvas/types';
import { AiOutlineApi } from "react-icons/ai";

interface ChatToolsDisplayProps {
    workflowContentDetail: WorkflowData | null;
}

interface ToolNode {
    id: string;
    nodeName: string;
    functionId: string;
    type: 'api_loader' | 'document_loaders';
    description?: string;
    toolName?: string;
    apiEndpoint?: string;
    method?: string;
    fullNodeData: CanvasNode; // 전체 노드 데이터 포함
}

const ChatToolsDisplay: React.FC<ChatToolsDisplayProps> = ({ workflowContentDetail }) => {
    const [selectedTool, setSelectedTool] = useState<ToolNode | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleToolClick = (tool: ToolNode) => {
        setSelectedTool(tool);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedTool(null);
    };
    const getToolNodes = (): ToolNode[] => {
        if (!workflowContentDetail?.nodes) return [];

        return workflowContentDetail.nodes
            .filter((node: CanvasNode) => {
                const { data } = node;
                // functionId가 api_loader 또는 document_loaders인지 확인
                const isValidFunctionId = data.functionId === 'api_loader' || data.functionId === 'document_loaders';
                // id에 tool 또는 Tool이 포함되어 있는지 확인
                const hasToolInId = data.id.toLowerCase().includes('tool');

                return isValidFunctionId && hasToolInId;
            })
            .map((node: CanvasNode) => {
                const { data } = node;

                // parameters에서 주요 정보 추출
                const getParameterValue = (paramId: string): string => {
                    const param = data.parameters?.find(p => p.id === paramId);
                    return param?.value?.toString() || '';
                };

                return {
                    id: data.id,
                    nodeName: data.nodeName,
                    functionId: data.functionId!,
                    type: data.functionId as 'api_loader' | 'document_loaders',
                    description: getParameterValue('description'),
                    toolName: getParameterValue('tool_name'),
                    apiEndpoint: getParameterValue('api_endpoint'),
                    method: getParameterValue('method'),
                    fullNodeData: node // 전체 노드 데이터 추가
                };
            });
    };

    const toolNodes = getToolNodes();

    // 도구가 없으면 컴포넌트를 렌더링하지 않음
    if (toolNodes.length === 0) {
        return null;
    }

    const getToolIcon = (type: string) => {
        switch (type) {
            case 'api_loader':
                return <AiOutlineApi className={styles.toolIcon} />;
            case 'document_loaders':
                return <FiFileText className={styles.toolIcon} />;
            default:
                return <FiTool className={styles.toolIcon} />;
        }
    };

    const getBadgeClass = (type: string) => {
        switch (type) {
            case 'api_loader':
                return styles.apiLoader;
            case 'document_loaders':
                return styles.documentLoader;
            default:
                return styles.apiLoader;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'api_loader':
                return 'API';
            case 'document_loaders':
                return 'DOC';
            default:
                return 'TOOL';
        }
    };

    const getDisplayDescription = (tool: ToolNode): string => {
        if (tool.description) {
            return tool.description;
        }
        if (tool.type === 'api_loader' && tool.method && tool.apiEndpoint) {
            const endpoint = tool.apiEndpoint.split('/').pop() || tool.apiEndpoint;
            return `${tool.method} ${endpoint}`;
        }
        return tool.toolName || tool.id.split('/').pop() || '';
    };

    // Tool Detail Modal Component
    const ToolDetailModal: React.FC<{ tool: ToolNode }> = ({ tool }) => {
        const { data } = tool.fullNodeData;

        const renderParameterValue = (param: Parameter) => {
            if (param.type === 'STR' && param.value && param.value.toString().length > 50) {
                return (
                    <div className={styles.longValue}>
                        {param.value.toString()}
                    </div>
                );
            }
            return <span className={styles.paramValue}>{param.value?.toString() || 'N/A'}</span>;
        };

        const renderOptions = (param: Parameter) => {
            if (!param.options || param.options.length === 0) return null;

            return (
                <div className={styles.optionsContainer}>
                    <span className={styles.optionsLabel}>사용 가능한 옵션:</span>
                    <div className={styles.optionsList}>
                        {param.options.map((option, index) => (
                            <span
                                key={index}
                                className={`${styles.optionItem} ${
                                    option.value === param.value ? styles.selectedOption : ''
                                }`}
                            >
                                {option.label || option.value}
                            </span>
                        ))}
                    </div>
                </div>
            );
        };

        return (
            <div className={styles.toolDetailContent}>
                {/* Basic Info */}
                <div className={styles.detailSection}>
                    <h4><FiInfo /> 기본 정보</h4>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>ID:</span>
                            <span className={styles.infoValue}>{data.id}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Function ID:</span>
                            <span className={styles.infoValue}>{data.functionId}</span>
                        </div>
                        {(data as any).tags && (data as any).tags.length > 0 && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Tags:</span>
                                <div className={styles.tagsList}>
                                    {(data as any).tags.map((tag: string, index: number) => (
                                        <span key={index} className={styles.tag}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Inputs & Outputs */}
                {(data.inputs && data.inputs.length > 0) && (
                    <div className={styles.detailSection}>
                        <h4><FiArrowRight /> 입력</h4>
                        <div className={styles.portsList}>
                            {data.inputs.map((input, index) => (
                                <div key={index} className={styles.portItem}>
                                    <span className={styles.portName}>{input.name}</span>
                                    <span className={styles.portType}>{input.type}</span>
                                    {input.required && <span className={styles.required}>필수</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(data.outputs && data.outputs.length > 0) && (
                    <div className={styles.detailSection}>
                        <h4><FiArrowLeft /> 출력</h4>
                        <div className={styles.portsList}>
                            {data.outputs.map((output, index) => (
                                <div key={index} className={styles.portItem}>
                                    <span className={styles.portName}>{output.name}</span>
                                    <span className={styles.portType}>{output.type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Parameters */}
                {data.parameters && data.parameters.length > 0 && (
                    <div className={styles.detailSection}>
                        <h4><FiSettings /> 매개변수</h4>
                        <div className={styles.parametersList}>
                            {data.parameters.map((param, index) => (
                                <div key={index} className={styles.parameterItem}>
                                    <div className={styles.paramHeader}>
                                        <span className={styles.paramName}>{param.name}</span>
                                        <span className={styles.paramType}>{param.type}</span>
                                        {param.required && <span className={styles.required}>필수</span>}
                                    </div>

                                    <div className={styles.paramBody}>
                                        <div className={styles.paramValueContainer}>
                                            <span className={styles.paramLabel}>값:</span>
                                            {renderParameterValue(param)}
                                        </div>

                                        {param.description && (
                                            <div className={styles.paramDescription}>
                                                <span className={styles.paramLabel}>설명:</span>
                                                <span className={styles.description}>{param.description}</span>
                                            </div>
                                        )}

                                        {renderOptions(param)}

                                        {(param.min !== undefined || param.max !== undefined) && (
                                            <div className={styles.paramRange}>
                                                <span className={styles.paramLabel}>범위:</span>
                                                <span className={styles.range}>
                                                    {param.min !== undefined ? `최소: ${param.min}` : ''}
                                                    {param.min !== undefined && param.max !== undefined ? ', ' : ''}
                                                    {param.max !== undefined ? `최대: ${param.max}` : ''}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className={styles.toolsDisplayArea}>
                {/* <div className={styles.toolsLabel}>
                    <FiTool className={styles.labelIcon} />
                    <span>활성화된 도구</span>
                </div> */}
                <div className={styles.toolsList}>
                    {toolNodes.map((tool) => (
                        <div
                            key={tool.id}
                            className={styles.toolItem}
                            onClick={() => handleToolClick(tool)}
                            style={{ cursor: 'pointer' }}
                        >
                            {getToolIcon(tool.type)}
                            <div className={styles.toolInfo}>
                                <div className={styles.toolName}>{tool.nodeName}</div>
                                <div className={styles.toolDescription}>
                                    {getDisplayDescription(tool)}
                                </div>
                            </div>
                            <div className={`${styles.toolBadge} ${getBadgeClass(tool.type)}`}>
                                {getTypeLabel(tool.type)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tool Detail Modal */}
            {showModal && selectedTool && (
                <div className={styles.modalBackdrop} onClick={handleCloseModal}>
                    <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}>
                                {getToolIcon(selectedTool.type)}
                                <h3>{selectedTool.nodeName}</h3>
                                <div className={`${styles.toolBadge} ${getBadgeClass(selectedTool.type)}`}>
                                    {getTypeLabel(selectedTool.type)}
                                </div>
                            </div>
                            <button className={styles.closeButton} onClick={handleCloseModal}>
                                <FiX />
                            </button>
                        </div>

                        <div className={styles.modalContent}>
                            <ToolDetailModal tool={selectedTool} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatToolsDisplay;
