import type { Metadata } from 'next';
import '@/app/globals.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import ToastProvider from '@/app/_common/components/ToastProvider';
import CookieProvider from '@/app/_common/components/CookieProvider';
import { BatchTesterProvider } from '@/app/_common/contexts/BatchTesterContext';

export const metadata: Metadata = {
    title: 'XGEN',
    description: 'XGEN - Next-Gen AI Workflow Platform',
    icons: {
        icon: [
            { url: '/favicon.png', sizes: '32x32', type: 'image/x-icon' },
            { url: '/favicon.png', sizes: '32x32', type: 'image/png' }
        ],
        shortcut: '/favicon.png',
        apple: '/favicon.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.png" sizes="32x32" />
                <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
                <link rel="shortcut icon" href="/favicon.png" />
                <link rel="apple-touch-icon" href="/favicon.png" />
            </head>
            <body>
                <CookieProvider>
                    <BatchTesterProvider>
                        <ToastProvider />
                        {children}
                    </BatchTesterProvider>
                </CookieProvider>
            </body>
        </html>
    );
}
