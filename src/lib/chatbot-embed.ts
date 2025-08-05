interface InitParams {
    userId: string;
    apiHost: string;
    workflowName?: string;
}

export const Chatbot = {
    init: (params: InitParams) => {
        const { userId, apiHost, workflowName } = params;

        let iframeSrc = `${apiHost}/chatbot/embed/${userId}`;
        if (workflowName) {
            iframeSrc += `?workflowName=${encodeURIComponent(workflowName)}`;
        }

        const buttonCss = `
            .chatbot-popup-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background-color: #10b981;
                color: white;
                border-radius: 50%;
                border: none;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                z-index: 9998;
                transition: all 0.2s ease-in-out;
            }
            .chatbot-popup-button:hover {
                transform: scale(1.1);
            }
        `;

        const iframeCss = `
            .chatbot-iframe {
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 400px;
                height: 600px;
                border: 1px solid #e5e7eb;
                border-radius: 0.75rem;
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                display: none;
                z-index: 9999;
            }
        `;
        const style = document.createElement('style');
        style.innerHTML = buttonCss + iframeCss;
        document.head.appendChild(style);

        const button = document.createElement('button');
        button.className = 'chatbot-popup-button';
        button.innerHTML = '💬';
        document.body.appendChild(button);

        const iframe = document.createElement('iframe');
        iframe.className = 'chatbot-iframe';
        iframe.src = iframeSrc;
        document.body.appendChild(iframe);

        button.addEventListener('click', () => {
            iframe.style.display = iframe.style.display === 'block' ? 'none' : 'block';
        });
    },

    initFull: (params: InitParams) => {
        const { userId, apiHost, workflowName } = params;
        const targetElement = document.querySelector('fullchatbot');


        if (targetElement) {
            let iframeSrc = `${apiHost}/chatbot/embed/${userId}`;
            if (workflowName) {
                iframeSrc += `?workflowName=${encodeURIComponent(workflowName)}`;
            }
            
            const iframe = document.createElement('iframe');
            iframe.src = iframeSrc;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            targetElement.replaceWith(iframe);
        }
    }
};

(window as any).Chatbot = Chatbot;