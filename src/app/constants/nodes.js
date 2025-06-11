export const NODE_DATA = [
    {
        id: 'langchain',
        name: 'LangChain',
        icon: 'LuBrainCircuit',
        categories: [
            { id: 'agents', name: 'Agents' },
            { id: 'cache', name: 'Cache' },
            { id: 'chains', name: 'Chains' },
            {
                id: 'chat_models',
                name: 'Chat Models',
                nodes: [
                    {
                        id: 'chat-openai',
                        nodeName: 'ChatOpenAI',
                        inputs: [
                            { id: 'in-msg', name: 'Messages', multi: true },
                            { id: 'in-stop', name: 'Stop Sequence', multi: false },
                        ],
                        parameters: [
                            { id: 'p-model', name: 'Model', value: 'gpt-4o' },
                            { id: 'p-temp', name: 'Temperature', value: 0.7 },
                        ],
                        outputs: [
                            { id: 'out-1', name: 'Output', multi: false },
                            { id: 'out-2', name: 'Output2', multi: false },
                            { id: 'out-3', name: 'Output3', multi: false },
                            { id: 'out-4', name: 'Output4', multi: false },
                        ]
                    },
                    {
                        id: 'chat-anthropic',
                        nodeName: 'ChatAnthropic',
                        inputs: [
                            { id: 'in-anthropic-msg', name: 'Messages', multi: true },
                        ],
                        parameters: [
                            { id: 'p-anthropic-model', name: 'Model', value: 'claude-3-opus' },
                        ],
                        outputs: [
                            { id: 'out-anthropic-1', name: 'Output', multi: false },
                        ]
                    }
                ]
            },
            { id: 'document_loaders', name: 'Document Loaders' },
            { id: 'embeddings', name: 'Embeddings' },
            { id: 'graph', name: 'Graph' },
            {
                id: 'llms',
                name: 'LLMs',
                nodes: [
                    {
                        id: 'llm-openai',
                        nodeName: 'OpenAI',
                        // 이 노드는 파라미터가 없습니다.
                        inputs: [
                            { id: 'in-llm-prompt', name: 'Prompt', multi: false }
                        ],
                        outputs: [
                            { id: 'out-llm-completion', name: 'Completion', multi: false }
                        ]
                    }
                ]
            },
            { id: 'memory', name: 'Memory' },
            { id: 'moderation', name: 'Moderation' },
            { id: 'output_parsers', name: 'Output Parsers' },
        ],
    },
    {
        id: 'polar',
        name: 'Polar',
        icon: 'LuShare2',
        categories: [
            { id: 'polar_cat_1', name: 'Polar Category 1' },
            { id: 'polar_cat_2', name: 'Polar Category 2' },
        ],
    },
    {
        id: 'utilities',
        name: 'Utilities',
        icon: 'LuWrench',
        categories: [
            { id: 'util_cat_1', name: 'Utilities Category 1' },
            { id: 'util_cat_2', name: 'Utilities Category 2' },
        ],
    },
];