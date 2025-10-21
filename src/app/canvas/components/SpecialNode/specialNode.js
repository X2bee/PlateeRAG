/**
 * SpecialNode 중앙 관리 파일
 *
 * 새로운 Special Node를 추가하는 방법:
 * 1. SpecialNode 폴더에 새로운 TSX 파일 생성 (예: MyCustomNode.tsx)
 * 2. 아래 SPECIAL_NODES 배열에 새로운 노드 정보 추가
 * 3. 끝! CanvasNodes.tsx는 자동으로 처리됩니다.
 */

import SchemaProviderNode from './SchemaProviderNode';
import RouterNode from './RouterNode';

/**
 * Special Node 설정
 * 각 노드는 다음 속성을 가집니다:
 * - name: 노드의 고유 식별자 (문자열)
 * - component: 렌더링할 React 컴포넌트
 * - matcher: 노드 데이터를 검증하는 함수 (data => boolean)
 * - additionalProps: 노드에 전달할 추가 props (선택사항)
 */
export const SPECIAL_NODES = [
    {
        name: 'SchemaProviderNode',
        component: SchemaProviderNode,
        matcher: (nodeData) => {
            return nodeData.id === 'input_schema_provider' ||
                   nodeData.id === 'output_schema_provider' ||
                   nodeData.nodeName === 'Schema Provider(Input)';
        },
        additionalProps: []
    },
    {
        name: 'RouterNode',
        component: RouterNode,
        matcher: (nodeData) => {
            return nodeData.id === 'router/Router' ||
                   nodeData.nodeName === 'Router';
        },
        additionalProps: ['onOutputAdd', 'onOutputDelete', 'onOutputNameChange']
    }
];

/**
 * 노드 데이터로부터 적절한 Special Node 설정을 찾습니다.
 * @param {Object} nodeData - 노드 데이터 객체
 * @returns {Object|null} Special Node 설정 또는 null
 */
export const findSpecialNode = (nodeData) => {
    return SPECIAL_NODES.find(specialNode => specialNode.matcher(nodeData)) || null;
};

/**
 * 노드가 Special Node인지 확인합니다.
 * @param {Object} nodeData - 노드 데이터 객체
 * @returns {boolean} Special Node 여부
 */
export const isSpecialNode = (nodeData) => {
    return SPECIAL_NODES.some(specialNode => specialNode.matcher(nodeData));
};

/**
 * 모든 Special Node의 추가 props 키 목록을 반환합니다.
 * @returns {string[]} 모든 추가 props 키 배열
 */
export const getAllAdditionalProps = () => {
    const propsSet = new Set();
    SPECIAL_NODES.forEach(node => {
        if (node.additionalProps) {
            node.additionalProps.forEach(prop => propsSet.add(prop));
        }
    });
    return Array.from(propsSet);
};
