// Node API related types
export interface NodeInput {
    id: string;
    name: string;
    type: string;
    multi: boolean;
    required: boolean;
    value?: any;
}

export interface NodeOutput {
    id: string;
    name: string;
    type: string;
    required: boolean;
    multi: boolean;
    stream: boolean;
}

export interface NodeParameter {
    id: string;
    name: string;
    type: string;
    value?: any;
    required: boolean;
    optional?: boolean;
    description?: string;
    min?: number;
    max?: number;
    step?: number;
    expandable?: boolean;
}

export interface Node {
    functionId: string;
    id: string;
    nodeName: string;
    description: string;
    tags: string[];
    inputs: NodeInput[];
    outputs: NodeOutput[];
    parameters: NodeParameter[];
    disable?: boolean;
}

export interface NodeFunction {
    functionId: string;
    functionName: string;
    nodes: Node[];
}

export interface NodeCategory {
    categoryId: string;
    categoryName: string;
    icon: string;
    functions: NodeFunction[];
}

// Tree structure for display
export interface TreeNode {
    id: string;
    name: string;
    type: 'category' | 'function' | 'node';
    children?: TreeNode[];
    data?: NodeCategory | NodeFunction | Node;
    expanded?: boolean;
}

export interface NodeTreeProps {
    nodes: NodeCategory[];
    onNodeSelect?: (node: Node) => void;
}

export interface NodeDetailProps {
    node: Node | null;
    onClose: () => void;
}
