import { useState, useCallback } from 'react';
import type { CanvasEdge } from '@/app/canvas/types';

interface UseEdgeManagementProps {
    historyHelpers?: {
        recordEdgeCreate: (edgeId: string, sourceId: string, targetId: string) => void;
        recordEdgeDelete: (edgeId: string, sourceId: string, targetId: string) => void;
    };
}

interface UseEdgeManagementReturn {
    edges: CanvasEdge[];
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    addEdge: (edge: CanvasEdge) => void;
    removeEdge: (edgeId: string) => void;
    removeNodeEdges: (nodeId: string) => CanvasEdge[];
    isDuplicateEdge: (sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string) => boolean;
    replaceInputEdge: (nodeId: string, portId: string, newEdge: CanvasEdge) => void;
}

export const useEdgeManagement = ({ historyHelpers }: UseEdgeManagementProps = {}): UseEdgeManagementReturn => {
    const [edges, setEdges] = useState<CanvasEdge[]>([]);

    const addEdge = useCallback((edge: CanvasEdge) => {
        setEdges(prev => [...prev, edge]);
        // 히스토리 기록
        if (historyHelpers?.recordEdgeCreate) {
            historyHelpers.recordEdgeCreate(edge.id, edge.source.nodeId, edge.target.nodeId);
        }
    }, [historyHelpers]);

    const removeEdge = useCallback((edgeId: string) => {
        const edgeToRemove = edges.find(edge => edge.id === edgeId);
        if (edgeToRemove && historyHelpers?.recordEdgeDelete) {
            historyHelpers.recordEdgeDelete(edgeId, edgeToRemove.source.nodeId, edgeToRemove.target.nodeId);
        }
        setEdges(prev => prev.filter(edge => edge.id !== edgeId));
    }, [edges, historyHelpers]);

    const removeNodeEdges = useCallback((nodeId: string): CanvasEdge[] => {
        const connectedEdges = edges.filter(edge =>
            edge.source.nodeId === nodeId || edge.target.nodeId === nodeId
        );

        setEdges(prev => prev.filter(edge =>
            edge.source.nodeId !== nodeId && edge.target.nodeId !== nodeId
        ));

        return connectedEdges;
    }, [edges]);

    const isDuplicateEdge = useCallback((
        sourceNodeId: string,
        sourcePortId: string,
        targetNodeId: string,
        targetPortId: string
    ): boolean => {
        const edgeSignature = `${sourceNodeId}:${sourcePortId}-${targetNodeId}:${targetPortId}`;
        return edges.some(edge =>
            `${edge.source.nodeId}:${edge.source.portId}-${edge.target.nodeId}:${edge.target.portId}` === edgeSignature
        );
    }, [edges]);

    const replaceInputEdge = useCallback((nodeId: string, portId: string, newEdge: CanvasEdge) => {
        setEdges(prev => {
            // Remove existing edges to the same input port (for non-multi ports)
            const filteredEdges = prev.filter(edge =>
                !(edge.target.nodeId === nodeId && edge.target.portId === portId)
            );
            return [...filteredEdges, newEdge];
        });
    }, []);

    return {
        edges,
        setEdges,
        addEdge,
        removeEdge,
        removeNodeEdges,
        isDuplicateEdge,
        replaceInputEdge
    };
};
