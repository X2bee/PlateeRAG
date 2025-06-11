export const NODE_DATA = [
    {
        id: 'langchain',
        name: 'LangChain',
        // 아이콘은 react-icons 라이브러리의 아이콘 이름을 문자열로 저장합니다.
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
                        parameters: { model: 'gpt-4o', temperature: 0.7 }, 
                        additionalParameters: { max_tokens: 1024 } 
                    },
                    { 
                        id: 'chat-anthropic', 
                        nodeName: 'ChatAnthropic', 
                        parameters: { model: 'claude-3-opus' }, 
                        additionalParameters: { top_k: 50 } 
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
                        parameters: { api_key: '...' }, 
                        additionalParameters: {} 
                    },
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