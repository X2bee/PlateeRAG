/**
 * SpecialNode 중앙 관리 파일
 *
 * 새로운 Special Node를 추가하는 방법:
 * 1. SpecialNode 폴더에 새로운 TSX 파일 생성 (예: MyCustomNode.tsx)
 * 2. 아래 SPECIAL_NODES 배열에 새로운 노드 정보 추가
 * 3. 끝! CanvasNodes.tsx는 자동으로 처리됩니다.
 */

import React from 'react';
import SchemaProviderNode from './SchemaProviderNode';
import RouterNode from './RouterNode';
import AgentXgenNode from './AgentXgenNode';
import type { NodeProps } from '@/app/canvas/types';

/**
 * Special Node 설정 타입
 */
export interface SpecialNodeConfig {
    /** 노드의 고유 식별자 */
    name: string;
    /** 렌더링할 React 컴포넌트 */
    component: React.ComponentType<NodeProps & any>;
    /** 노드 데이터를 검증하는 함수 */
    matcher: (nodeData: any) => boolean;
    /** 노드에 전달할 추가 props 키 목록 */
    additionalProps?: string[];
    /** 특별한 처리가 필요한 props (CanvasNodes에서 직접 처리) */
    requiresSpecialHandling?: boolean;
}

/**
 * Special Node 설정 목록
 * 각 노드는 다음 속성을 가집니다:
 * - name: 노드의 고유 식별자 (문자열)
 * - component: 렌더링할 React 컴포넌트
 * - matcher: 노드 데이터를 검증하는 함수 (data => boolean)
 * - additionalProps: 노드에 전달할 추가 props (선택사항)
 */
export const SPECIAL_NODES: SpecialNodeConfig[] = [
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
    },
    {
        name: 'AgentXgenNode',
        component: AgentXgenNode,
        matcher: (nodeData) => {
            return nodeData.id === 'agents/xgen' ||
                   nodeData.nodeName === 'Agent Xgen';
        },
        additionalProps: [],
        requiresSpecialHandling: true  // onOutputsUpdate 같은 특별한 처리가 필요함
    }
];/**
 * 노드 데이터로부터 적절한 Special Node 설정을 찾습니다.
 * @param nodeData - 노드 데이터 객체
 * @returns Special Node 설정 또는 null
 */
export const findSpecialNode = (nodeData: any): SpecialNodeConfig | null => {
    return SPECIAL_NODES.find(specialNode => specialNode.matcher(nodeData)) || null;
};

/**
 * 노드가 Special Node인지 확인합니다.
 * @param nodeData - 노드 데이터 객체
 * @returns Special Node 여부
 */
export const isSpecialNode = (nodeData: any): boolean => {
    return SPECIAL_NODES.some(specialNode => specialNode.matcher(nodeData));
};

/**
 * 모든 Special Node의 추가 props 키 목록을 반환합니다.
 * @returns 모든 추가 props 키 배열
 */
export const getAllAdditionalProps = (): string[] => {
    const propsSet = new Set<string>();
    SPECIAL_NODES.forEach(node => {
        if (node.additionalProps) {
            node.additionalProps.forEach(prop => propsSet.add(prop));
        }
    });
    return Array.from(propsSet);
};
