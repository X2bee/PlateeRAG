"use client";
import { Toaster } from 'react-hot-toast';

const ToastProvider = () => {
    return (
        <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
                style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '10px',
                },
                success: {
                    duration: 3000,
                    iconTheme: {
                        primary: '#4caf50',
                        secondary: '#fff',
                    },
                },
                error: {
                    duration: 4000,
                    iconTheme: {
                        primary: '#f44336',
                        secondary: '#fff',
                    }
                }
            }}
        />
    );
};

export default ToastProvider;