export const NODE_DATA = [
    {
        categoryId: 'langchain',
        categoryName: 'LangChain',
        icon: 'LuBrainCircuit',
        functions: [    
            {
                functionId: 'chat_models',
                functionName: 'Chat Models',
                nodes: [
                    {
                        id: 'chat-openai',
                        nodeName: 'ChatOpenAI',
                        inputs: [
                            { id: 'in-msg', name: 'Messages', multi: true, type: 'STR' },
                            { id: 'in-stop', name: 'Stop Sequence', multi: false, type: 'STR' },
                        ],
                        parameters: [
                            { id: 'p-model', name: 'Model', value: 'gpt-4o' },
                            { id: 'p-temp', name: 'Temperature', value: 0.7, step: 0.1 },
                        ],
                        outputs: [
                            { id: 'out-1', name: 'Output1', multi: false, type: 'STR' },
                            { id: 'out-2', name: 'Output2', multi: false, type: 'STR' },
                            { id: 'out-3', name: 'Output3', multi: false, type: 'STR' },
                            { id: 'out-4', name: 'Output4', multi: false, type: 'STR' },
                        ]
                    },
                ]
            },
        ],
    },
    {
        categoryId: 'utilities',
        categoryName: 'Utilities',
        icon: 'LuWrench',
        functions: [
            {
                functionId: 'util_types',
                functionName: 'Type Generators',
                nodes: [
                    {
                        id: 'util-gen-str',
                        nodeName: 'Generate String',
                        outputs: [{ id: 'out-str', name: 'String', type: 'STR' }]
                    },
                    // ... 다른 노드들
                ]
            },
        ],
    },
];