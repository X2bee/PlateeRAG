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
                            {
                                id: 'in-msg',
                                name: 'Messages',
                                multi: true,
                                type: 'STR',
                            },
                            {
                                id: 'in-stop',
                                name: 'Stop Sequence',
                                multi: false,
                                type: 'STR',
                            },
                        ],
                        parameters: [
                            {
                                id: 'p-model',
                                name: 'Model',
                                value: 'gpt-4o',
                                optional: false,
                                options: [
                                    { value: 'gpt-4o', label: 'GPT-4o' },
                                    { value: 'gpt-4', label: 'GPT-4' },
                                    {
                                        value: 'gpt-3.5-turbo',
                                        label: 'GPT-3.5 Turbo',
                                    },
                                ],
                            },
                            {
                                id: 'p-temp',
                                name: 'Temperature',
                                value: 0.7,
                                step: 0.1,
                                optional: false,
                            },
                            {
                                id: 'p-max-tokens',
                                name: 'Max Tokens',
                                value: 1000,
                                optional: true,
                            },
                            {
                                id: 'p-top-p',
                                name: 'Top P',
                                value: 1.0,
                                step: 0.1,
                                min: 0,
                                max: 1,
                                optional: true,
                            },
                            {
                                id: 'p-frequency-penalty',
                                name: 'Frequency Penalty',
                                value: 0,
                                step: 0.1,
                                min: -2,
                                max: 2,
                                optional: true,
                            },
                            {
                                id: 'p-presence-penalty',
                                name: 'Presence Penalty',
                                value: 0,
                                step: 0.1,
                                min: -2,
                                max: 2,
                                optional: true,
                            },
                        ],
                        outputs: [
                            {
                                id: 'out-1',
                                name: 'Output1',
                                multi: false,
                                type: 'STR',
                            },
                            {
                                id: 'out-2',
                                name: 'Output2',
                                multi: false,
                                type: 'STR',
                            },
                            {
                                id: 'out-3',
                                name: 'Output3',
                                multi: false,
                                type: 'STR',
                            },
                            {
                                id: 'out-4',
                                name: 'Output4',
                                multi: false,
                                type: 'STR',
                            },
                        ],
                    },
                ],
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
                        parameters: [
                            {
                                id: 'p-text',
                                name: 'Text',
                                value: 'Hello World',
                                optional: false,
                            },
                            {
                                id: 'p-length',
                                name: 'Max Length',
                                value: 100,
                                optional: true,
                            },
                            {
                                id: 'p-uppercase',
                                name: 'Uppercase',
                                value: false,
                                optional: true,
                                options: [
                                    { value: false, label: 'False' },
                                    { value: true, label: 'True' },
                                ],
                            },
                        ],
                        outputs: [
                            { id: 'out-str', name: 'String', type: 'STR' },
                        ],
                    },
                    // ... 다른 노드들
                ],
            },
        ],
    },
];
