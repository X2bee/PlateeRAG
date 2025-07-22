import type { Metadata } from 'next';
import '@/app/globals.css';
import ToastProvider from '@/app/_common/components/ToastProvider';

export const metadata: Metadata = {
    title: 'Prague',
    description: 'Prague - Next-Gen AI Workflow Platform',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <ToastProvider />
                {children}
            </body>
        </html>
    );
}
