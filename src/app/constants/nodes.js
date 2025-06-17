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
                            // [수정] type: 'STR' 추가
                            { id: 'in-msg', name: 'Messages', multi: true, type: 'STR' },
                            { id: 'in-stop', name: 'Stop Sequence', multi: false, type: 'STR' },
                        ],
                        parameters: [
                            { id: 'p-model', name: 'Model', value: 'gpt-4o' },
                            { id: 'p-temp', name: 'Temperature', value: 0.7, step: 0.1 },
                        ],
                        outputs: [
                            // [수정] type: 'STR' 추가
                            { id: 'out-1', name: 'Output1', multi: false, type: 'STR' },
                            { id: 'out-2', name: 'Output2', multi: false, type: 'STR' },
                            { id: 'out-3', name: 'Output3', multi: false, type: 'STR' },
                            { id: 'out-4', name: 'Output4', multi: false, type: 'STR' },
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
                        inputs: [
                            // [수정] type: 'STR' 추가
                            { id: 'in-llm-prompt', name: 'Prompt', multi: false, type: 'STR' }
                        ],
                        outputs: [
                            // [수정] type: 'STR' 추가
                            { id: 'out-llm-completion', name: 'Completion', multi: false, type: 'STR' }
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
            { 
                id: 'util_types', 
                name: 'Type Generators',
                nodes: [
                    {
                        id: 'util-gen-str',
                        nodeName: 'Generate String',
                        outputs: [{ id: 'out-str', name: 'String', type: 'STR' }]
                    },
                    {
                        id: 'util-gen-int',
                        nodeName: 'Generate Integer',
                        outputs: [{ id: 'out-int', name: 'Integer', type: 'INT' }]
                    },
                    {
                        id: 'util-gen-float',
                        nodeName: 'Generate Float',
                        outputs: [{ id: 'out-float', name: 'Float', type: 'FLOAT' }]
                    },
                    {
                        id: 'util-accept-all',
                        nodeName: 'Accept Any',
                        inputs: [
                            { id: 'in-str', name: 'Accept STR', type: 'STR' },
                            { id: 'in-int', name: 'Accept INT', type: 'INT' },
                            { id: 'in-float', name: 'Accept FLOAT', type: 'FLOAT' },
                        ]
                    }
                ]
            },
        ],
    },
];