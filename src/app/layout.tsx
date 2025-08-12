import type { Metadata } from 'next';
import '@/app/globals.css';
import ToastProvider from '@/app/_common/components/ToastProvider';
import CookieProvider from '@/app/_common/components/CookieProvider';

export const metadata: Metadata = {
    title: 'XGEN',
    description: 'XGEN - Next-Gen AI Workflow Platform',
    icons: {
    // icon: '/favicon.png',  
    icon: '/favicon-a.png',
    // icon: '/favicon-black.png',
    // icon: '/favicon-white.png',
    // icon: '/favicon-p-lo.png',
    // icon: '/favicon-v-l.png',
},
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <CookieProvider>
                    <ToastProvider />
                    {children}
                </CookieProvider>
            </body>
        </html>
    );
}
