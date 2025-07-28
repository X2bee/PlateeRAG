/**
 * 워크플로우 데이터에 스트리밍을 지원하는 'endnode'가 있는지 확인합니다.
 * @param {object} workflowData - 노드 목록을 포함하는 워크플로우 데이터.
 * @returns {boolean} 스트리밍 endnode가 있으면 true, 그렇지 않으면 false.
 */
export const isStreamingWorkflow = (workflowData) => {
    if (!workflowData || !Array.isArray(workflowData.nodes)) {
        return false;
    }

    const endNodes = workflowData.nodes.filter(
        (node) => node.data?.functionId === 'endnode',
    );

    for (const node of endNodes) {
        if (Array.isArray(node.data?.inputs)) {
            const hasStreamingInput = node.data.inputs.some(
                (port) => port.stream === true,
            );
            if (hasStreamingInput) {
                return true;
            }
        }
    }

    return false;
};