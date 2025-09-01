import { useState, useCallback } from 'react';
import type { CanvasNode, Parameter, DeletedItem } from '@/app/canvas/types';
import { devLog } from '@/app/_common/utils/logger';

interface UseNodeManagementReturn {
    nodes: CanvasNode[];
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    copiedNode: CanvasNode | null;
    lastDeleted: DeletedItem | null;
    addNode: (node: CanvasNode) => void;
    deleteNode: (nodeId: string, connectedEdges: any[]) => void;
    copyNode: (nodeId: string) => void;
    pasteNode: () => string | null;
    undoDelete: () => CanvasNode | null;
    updateNodeParameter: (nodeId: string, paramId: string, value: string | number | boolean) => void;
    updateNodeName: (nodeId: string, newName: string) => void;
    updateParameterName: (nodeId: string, paramId: string, newName: string) => void;
    addParameter: (nodeId: string, newParameter: Parameter) => void;
    deleteParameter: (nodeId: string, paramId: string) => void;
}

export const useNodeManagement = (): UseNodeManagementReturn => {
    const [nodes, setNodes] = useState<CanvasNode[]>([]);
    const [copiedNode, setCopiedNode] = useState<CanvasNode | null>(null);
    const [lastDeleted, setLastDeleted] = useState<DeletedItem | null>(null);

    const addNode = useCallback((node: CanvasNode) => {
        setNodes(prev => [...prev, node]);
    }, []);

    const deleteNode = useCallback((nodeId: string, connectedEdges: any[]) => {
        const nodeToDelete = nodes.find(node => node.id === nodeId);
        if (nodeToDelete) {
            setLastDeleted({ node: nodeToDelete, edges: connectedEdges });
            setNodes(prev => prev.filter(node => node.id !== nodeId));
            devLog.log('Node deleted and saved for undo:', nodeToDelete.data.nodeName);
        }
    }, [nodes]);

    const copyNode = useCallback((nodeId: string) => {
        const nodeToCopy = nodes.find(node => node.id === nodeId);
        if (nodeToCopy) {
            setCopiedNode(nodeToCopy);
            devLog.log('Node copied:', nodeToCopy.data.nodeName);
        }
    }, [nodes]);

    const pasteNode = useCallback((): string | null => {
        if (copiedNode) {
            const newNode: CanvasNode = {
                ...copiedNode,
                id: `${copiedNode.data.id}-${Date.now()}`,
                position: {
                    x: copiedNode.position.x + 50,
                    y: copiedNode.position.y + 50
                }
            };

            setNodes(prev => [...prev, newNode]);
            devLog.log('Node pasted:', newNode.data.nodeName);
            return newNode.id;
        }
        return null;
    }, [copiedNode]);

    const undoDelete = useCallback((): CanvasNode | null => {
        if (lastDeleted) {
            setNodes(prev => [...prev, lastDeleted.node]);
            devLog.log('Node restored:', lastDeleted.node.data.nodeName);
            const restoredNode = lastDeleted.node;
            setLastDeleted(null);
            return restoredNode;
        }
        return null;
    }, [lastDeleted]);

    const updateNodeParameter = useCallback((nodeId: string, paramId: string, value: string | number | boolean): void => {
        devLog.log('=== Canvas Parameter Change ===');
        devLog.log('Received:', { nodeId, paramId, value });

        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) {
                devLog.warn('Target node not found:', nodeId);
                return prevNodes;
            }

            const targetNode = prevNodes[targetNodeIndex];
            if (!targetNode.data.parameters || !Array.isArray(targetNode.data.parameters)) {
                devLog.warn('No parameters found in target node');
                return prevNodes;
            }

            const targetParamIndex = targetNode.data.parameters.findIndex(param => param.id === paramId);
            if (targetParamIndex === -1) {
                devLog.warn('Target parameter not found:', paramId);
                return prevNodes;
            }

            const targetParam = targetNode.data.parameters[targetParamIndex];
            const newValue = typeof targetParam.value === 'number' ? Number(value) : value;

            if (targetParam.value === newValue) {
                devLog.log('Parameter value unchanged, skipping update');
                return prevNodes;
            }

            const newNodes = [...prevNodes];
            newNodes[targetNodeIndex] = {
                ...targetNode,
                data: {
                    ...targetNode.data,
                    parameters: [
                        ...targetNode.data.parameters.slice(0, targetParamIndex),
                        { ...targetParam, value: newValue },
                        ...targetNode.data.parameters.slice(targetParamIndex + 1)
                    ]
                }
            };

            devLog.log('Parameter update completed successfully');
            return newNodes;
        });
    }, []);

    const updateNodeName = useCallback((nodeId: string, newName: string): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) {
                return prevNodes;
            }

            const targetNode = prevNodes[targetNodeIndex];
            if (targetNode.data.nodeName === newName) {
                return prevNodes;
            }

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        nodeName: newName
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    const updateParameterName = useCallback((nodeId: string, paramId: string, newName: string): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) {
                return prevNodes;
            }

            const targetNode = prevNodes[targetNodeIndex];
            if (!targetNode.data.parameters || !Array.isArray(targetNode.data.parameters)) {
                return prevNodes;
            }

            const targetParamIndex = targetNode.data.parameters.findIndex(param => param.id === paramId);
            if (targetParamIndex === -1) {
                return prevNodes;
            }

            const targetParam = targetNode.data.parameters[targetParamIndex];
            if (targetParam.name === newName) {
                return prevNodes;
            }

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        parameters: [
                            ...targetNode.data.parameters.slice(0, targetParamIndex),
                            { ...targetParam, name: newName, id: newName },
                            ...targetNode.data.parameters.slice(targetParamIndex + 1)
                        ]
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    const addParameter = useCallback((nodeId: string, newParameter: Parameter): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) {
                return prevNodes;
            }

            const targetNode = prevNodes[targetNodeIndex];
            const existingParameters = targetNode.data.parameters || [];

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        parameters: [...existingParameters, newParameter]
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    const deleteParameter = useCallback((nodeId: string, paramId: string): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) {
                return prevNodes;
            }

            const targetNode = prevNodes[targetNodeIndex];
            if (!targetNode.data.parameters || !Array.isArray(targetNode.data.parameters)) {
                return prevNodes;
            }

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        parameters: targetNode.data.parameters.filter(param => param.id !== paramId)
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    return {
        nodes,
        setNodes,
        copiedNode,
        lastDeleted,
        addNode,
        deleteNode,
        copyNode,
        pasteNode,
        undoDelete,
        updateNodeParameter,
        updateNodeName,
        updateParameterName,
        addParameter,
        deleteParameter
    };
};