import React, { useState, useEffect, useRef } from 'react';
import { FiTool, FiDatabase, FiFileText, FiX, FiInfo, FiSettings, FiArrowRight, FiArrowLeft, FiEdit3 } from 'react-icons/fi';
import styles from '@/app/chat/assets/ChatToolsDisplay.module.scss';
import { WorkflowData, CanvasNode, CanvasEdge, Parameter } from '@/app/canvas/types';
import { AiOutlineApi } from "react-icons/ai";
import useSidebarManager from '@/app/_common/hooks/useSidebarManager';

interface ChatToolsDisplayProps {
    workflowContentDetail: {
        nodes?: CanvasNode[];
        edges?: CanvasEdge[];
        [key: string]: any;
    } | null;
    additionalParams?: Record<string, Record<string, any>>;
    onAdditionalParamsChange?: (params: Record<string, Record<string, any>>) => void;
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

const ChatToolsDisplay: React.FC<ChatToolsDisplayProps> = ({
    workflowContentDetail,
    additionalParams = {},
    onAdditionalParamsChange
}) => {
    const [selectedTool, setSelectedTool] = useState<ToolNode | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showArgsDropdown, setShowArgsDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useSidebarManager(showModal)

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowArgsDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToolClick = (tool: ToolNode) => {
        setSelectedTool(tool);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedTool(null);
    };

    const handleArgsButtonClick = (e: React.MouseEvent, tool: ToolNode) => {
        e.stopPropagation();
        if (showArgsDropdown === tool.id) {
            setShowArgsDropdown(null);
        } else {
            const argsSchemaInfo = getArgsSchemaInfo(tool.id);
            if (argsSchemaInfo && !additionalParams[tool.id] && onAdditionalParamsChange) {
                const initialParams: Record<string, any> = {};
                argsSchemaInfo.parameters.forEach((param: any) => {
                    initialParams[param.id] = '';
                });
                onAdditionalParamsChange({
                    ...additionalParams,
                    [tool.id]: initialParams
                });
            }
            setShowArgsDropdown(tool.id);
        }
    };

    const handleArgsValueChange = (toolId: string, paramId: string, value: string) => {
        if (onAdditionalParamsChange) {
            const updated = {
                ...additionalParams,
                [toolId]: {
                    ...additionalParams[toolId],
                    [paramId]: value
                }
            };
            console.log('Updated additionalParams:', updated);
            onAdditionalParamsChange(updated);
        }
    };
    const getToolNodes = (): ToolNode[] => {
        if (!workflowContentDetail?.nodes) return [];

        return workflowContentDetail.nodes
            .filter((node: CanvasNode) => {
                const { data } = node;
                const isValidFunctionId = data.functionId === 'api_loader' || data.functionId === 'document_loaders' || data.functionId === 'startnode';
                const hasToolInId = data.id.toLowerCase().includes('tool') || data.id.toLowerCase().includes('input') ;

                // startnode인 경우 args_schema로 연결된 edge가 있는지 확인
                if (data.functionId === 'startnode') {
                    const hasArgsSchemaEdge = workflowContentDetail.edges?.some((edge: any) =>
                        edge.target?.nodeId === node.id && edge.target?.portId === 'args_schema'
                    );
                    return isValidFunctionId && hasToolInId && hasArgsSchemaEdge;
                }

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
                    id: node.id, // 전체 노드 ID 사용 (data.id 대신)
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

    // ArgsSchema 연결 정보를 가져오는 함수
    const getArgsSchemaInfo = (toolNodeId: string) => {
        if (!workflowContentDetail?.edges || !workflowContentDetail?.nodes) return null;

        // 해당 tool 노드로 연결되는 ArgsSchema edge 찾기
        const argsSchemaEdge = workflowContentDetail.edges.find((edge: any) => {
            return edge.target?.nodeId === toolNodeId && edge.target?.portId === 'args_schema';
        });

        if (!argsSchemaEdge) return null;

        // ArgsSchema를 제공하는 source 노드 찾기
        const sourceNode = workflowContentDetail.nodes.find((node: CanvasNode) =>
            node.id === argsSchemaEdge.source.nodeId
        );

        if (!sourceNode) return null;

        // handle_id가 true인 parameters만 필터링
        const schemaParameters = sourceNode.data.parameters?.filter((param: any) =>
            param.handle_id === true
        ) || [];

        return {
            sourceNodeName: sourceNode.data.nodeName,
            sourceNodeId: sourceNode.id,
            parameters: schemaParameters
        };
    };    // Tool Detail Modal Component
    const ToolDetailModal: React.FC<{ tool: ToolNode }> = ({ tool }) => {
        const { data } = tool.fullNodeData;
        const argsSchemaInfo = getArgsSchemaInfo(tool.id);

        const renderParameterValue = (param: any) => {
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

                {/* ArgsSchema Information */}
                {argsSchemaInfo && (
                    <div className={styles.detailSection}>
                        <h4><FiDatabase /> ArgsSchema 연결 정보</h4>
                        <div className={styles.argsSchemaInfo}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>연결된 노드:</span>
                                <span className={styles.infoValue}>{argsSchemaInfo.sourceNodeName}</span>
                            </div>
                            {argsSchemaInfo.parameters.length > 0 && (
                                <div className={styles.schemaParameters}>
                                    <span className={styles.paramLabel}>스키마 매개변수:</span>
                                    <div className={styles.schemaParamsList}>
                                        {argsSchemaInfo.parameters.map((param: any, index: number) => (
                                            <div key={index} className={styles.schemaParamItem}>
                                                <div className={styles.schemaParamHeader}>
                                                    <span className={styles.paramName}>{param.name}</span>
                                                    <span className={styles.paramId}>({param.id})</span>
                                                    <span className={styles.paramType}>{param.type}</span>
                                                </div>
                                                <div className={styles.schemaParamValue}>
                                                    <span className={styles.paramLabel}>값:</span>
                                                    {renderParameterValue(param)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                    {toolNodes.map((tool) => {
                        const argsSchemaInfo = getArgsSchemaInfo(tool.id);
                        return (
                            <div key={tool.id} className={styles.toolItemWrapper} ref={showArgsDropdown === tool.id ? dropdownRef : null}>
                                <div
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
                                    <div className={styles.toolActions}>
                                        {argsSchemaInfo && (
                                            <button
                                                className={styles.argsButton}
                                                onClick={(e) => handleArgsButtonClick(e, tool)}
                                                title="ArgsSchema 편집"
                                            >
                                                <FiEdit3 />
                                            </button>
                                        )}
                                        <div className={`${styles.toolBadge} ${getBadgeClass(tool.type)}`}>
                                            {getTypeLabel(tool.type)}
                                        </div>
                                    </div>
                                </div>

                                {/* Args Dropdown */}
                                {showArgsDropdown === tool.id && argsSchemaInfo && (
                                    <div className={styles.argsDropdown}>
                                        <div className={styles.argsDropdownHeader}>
                                            <span>스키마: {argsSchemaInfo.sourceNodeName}</span>
                                        </div>
                                        <div className={styles.argsForm}>
                                            {argsSchemaInfo.parameters.map((param: any) => (
                                                <div key={param.id} className={styles.argsFormItem}>
                                                    <label className={styles.argsLabel}>
                                                        <span className={styles.argsLabelText}>
                                                            {param.name}
                                                            <span className={styles.argsLabelId}></span>
                                                        </span>
                                                        <input
                                                            type="text"
                                                            className={styles.argsInput}
                                                            value={additionalParams[tool.id]?.[param.id] || ''}
                                                            onChange={(e) => handleArgsValueChange(tool.id, param.id, e.target.value)}
                                                            placeholder={`${param.name} 값을 입력하세요`}
                                                        />
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
