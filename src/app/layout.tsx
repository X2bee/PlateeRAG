import type { Metadata } from 'next';
import '@/app/globals.css';
import ToastProvider from '@/app/_common/components/ToastProvider';
import CookieProvider from '@/app/_common/components/CookieProvider';

export const metadata: Metadata = {
    title: 'XGEN',
    description: 'XGEN - Next-Gen AI Workflow Platform',
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
            { url: '/favicon.png', sizes: '32x32', type: 'image/png' }
        ],
        shortcut: '/favicon.ico',
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
                <link rel="icon" href="/favicon.ico" sizes="32x32" />
                <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
                <link rel="shortcut icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/favicon.png" />
            </head>
            <body>
                <CookieProvider>
                    <ToastProvider />
                    {children}
                </CookieProvider>
            </body>
        </html>
    );
}
