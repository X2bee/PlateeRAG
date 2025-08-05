var l={init:i=>{let{userId:s,apiHost:c,workflowName:t}=i,o=`${c}/chatbot/embed/${s}`;t&&(o+=`?workflowName=${encodeURIComponent(t)}`);let r=`
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
        `,e=`
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
        `,d=document.createElement("style");d.innerHTML=r+e,document.head.appendChild(d);let a=document.createElement("button");a.className="chatbot-popup-button",a.innerHTML="\u{1F4AC}",document.body.appendChild(a);let n=document.createElement("iframe");n.className="chatbot-iframe",n.src=o,document.body.appendChild(n),a.addEventListener("click",()=>{n.style.display=n.style.display==="block"?"none":"block"})},initFull:i=>{let{userId:s,apiHost:c,workflowName:t}=i,o=document.querySelector("fullchatbot");if(o){let r=`${c}/chatbot/embed/${s}`;t&&(r+=`?workflowName=${encodeURIComponent(t)}`);let e=document.createElement("iframe");e.src=r,e.style.width="100%",e.style.height="100%",e.style.border="none",o.replaceWith(e)}}};window.Chatbot=l;export{l as Chatbot};
