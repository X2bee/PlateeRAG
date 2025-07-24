'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    getCookie,
    setCookie,
    deleteCookie,
    getAuthCookie,
    setCookieAuth,
    removeAuthCookie,
    clearAllAuth
} from '@/app/_common/utils/cookieUtils';
import { clearAllUserData } from '@/app/_common/utils/storageUtils';
import { devLog } from '@/app/_common/utils/logger';

interface User {
    user_id: number;
    username: string;
    access_token: string;
}

interface CookieContextType {
    // 쿠키 기본 조작
    getCookie: (name: string) => string | null;
    setCookie: (name: string, value: string, days?: number, options?: object) => void;
    deleteCookie: (name: string, path?: string) => void;

    // 인증 관련
    user: User | null;
    isAuthenticated: boolean;
    isInitialized: boolean; // 초기화 완료 여부
    isLoggingOut: boolean; // 의도적인 로그아웃 중인지 여부
    setUser: (user: User | null) => void;
    clearAuth: (clearStorage?: boolean) => void;
    refreshAuth: () => void;

    // 인증 쿠키 전용
    getAuthCookie: (key: string) => string | null;
    setCookieAuth: (key: string, value: string) => void;
    removeAuthCookie: (key: string) => void;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

interface CookieProviderProps {
    children: React.ReactNode;
}

export const CookieProvider: React.FC<CookieProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // 인증 상태 새로고침
    const refreshAuth = useCallback(() => {
        try {
            const userId = getAuthCookie('user_id');
            const username = getAuthCookie('username');
            const accessToken = getAuthCookie('access_token');

            if (userId && username && accessToken) {
                const userData: User = {
                    user_id: parseInt(userId),
                    username: username,
                    access_token: accessToken,
                };
                setUser(userData);
                setIsAuthenticated(true);
                devLog.log('Auth refreshed from cookies:', userData);
            } else {
                setUser(null);
                setIsAuthenticated(false);
                devLog.log('No auth data found in cookies');
            }
        } catch (error) {
            devLog.error('Error refreshing auth:', error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsInitialized(true); // 초기화 완료 표시
        }
    }, []);    // 인증 정보 설정
    const setUserData = useCallback((userData: User | null) => {
        if (userData) {
            // 쿠키에만 저장
            setCookieAuth('user_id', userData.user_id.toString());
            setCookieAuth('username', userData.username);
            setCookieAuth('access_token', userData.access_token);

            setUser(userData);
            setIsAuthenticated(true);
            devLog.log('User data set:', userData);
        } else {
            setUser(null);
            setIsAuthenticated(false);
            devLog.log('User data cleared');
        }
    }, []);    // 인증 정보 완전 삭제 (로그아웃 시 localStorage도 함께 정리)
    const clearAuth = useCallback((clearStorage = true) => {
        try {
            // 의도적인 로그아웃임을 표시
            setIsLoggingOut(true);

            // 쿠키에서 모든 인증 정보 삭제
            clearAllAuth();
            setUser(null);
            setIsAuthenticated(false);
            devLog.log('Auth cleared completely');

            // localStorage의 사용자 데이터도 함께 정리 (설정 제외)
            if (clearStorage) {
                const result = clearAllUserData(false); // 설정은 보존
                if (result && result.success) {
                    devLog.log('User data cleared from localStorage:', result.message);
                } else {
                    devLog.warn('Failed to clear user data:', result?.message || 'Unknown error');
                }
            }

            // 짧은 시간 후 로그아웃 상태 해제 (리다이렉트 후)
            setTimeout(() => {
                setIsLoggingOut(false);
            }, 100);
        } catch (error) {
            devLog.error('Error clearing auth:', error);
            setIsLoggingOut(false);
        }
    }, []);

    // 컴포넌트 마운트 시 인증 상태 복원
    useEffect(() => {
        refreshAuth();
    }, [refreshAuth]);    const contextValue: CookieContextType = {
        // 쿠키 기본 조작
        getCookie,
        setCookie,
        deleteCookie,

        // 인증 관련
        user,
        isAuthenticated,
        isInitialized,
        isLoggingOut,
        setUser: setUserData,
        clearAuth,
        refreshAuth,

        // 인증 쿠키 전용
        getAuthCookie,
        setCookieAuth,
        removeAuthCookie,
    };

    return (
        <CookieContext.Provider value={contextValue}>
            {children}
        </CookieContext.Provider>
    );
};

// 커스텀 훅
export const useCookie = () => {
    const context = useContext(CookieContext);
    if (context === undefined) {
        throw new Error('useCookie must be used within a CookieProvider');
    }
    return context;
};

// 인증 관련 전용 훅
export const useAuth = () => {
    const context = useContext(CookieContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a CookieProvider');
    }

    return {
        user: context.user,
        isAuthenticated: context.isAuthenticated,
        isInitialized: context.isInitialized,
        isLoggingOut: context.isLoggingOut,
        setUser: context.setUser,
        clearAuth: context.clearAuth,
        refreshAuth: context.refreshAuth,
    };
};

export default CookieProvider;
