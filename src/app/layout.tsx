import type { Metadata } from 'next';
import '@/app/globals.css';
import ToastProvider from '@/app/_common/components/ToastProvider';
import CookieProvider from '@/app/_common/components/CookieProvider';

export const metadata: Metadata = {
    title: 'XGen',
    description: 'XGen - Next-Gen AI Workflow Platform',
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
