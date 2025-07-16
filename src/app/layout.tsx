import type { Metadata } from 'next';
import '@/app/globals.css';
import ToastProvider from '@/app/_common/components/ToastProvider';

export const metadata: Metadata = {
    title: 'PlateeRAG',
    description: 'PlateeRAG',
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
