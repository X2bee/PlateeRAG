var l={init:r=>{let{chatflowid:s,apiHost:c,workflowName:e}=r,o=`${c}/chatbot/embed/${s}`;e&&(o+=`?workflowName=${encodeURIComponent(e)}`);let a=`
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
        `,t=`
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
        `,d=document.createElement("style");d.innerHTML=a+t,document.head.appendChild(d);let i=document.createElement("button");i.className="chatbot-popup-button",i.innerHTML="\u{1F4AC}",document.body.appendChild(i);let n=document.createElement("iframe");n.className="chatbot-iframe",n.src=o,document.body.appendChild(n),i.addEventListener("click",()=>{n.style.display=n.style.display==="block"?"none":"block"})},initFull:r=>{let{chatflowid:s,apiHost:c,workflowName:e}=r,o=document.querySelector("fullchatbot");if(o){let a=`${c}/chatbot/embed/${s}`;e&&(a+=`?workflowName=${encodeURIComponent(e)}`);let t=document.createElement("iframe");t.src=a,t.style.width="100%",t.style.height="100%",t.style.border="none",o.replaceWith(t)}}};window.Chatbot=l;export{l as Chatbot};
