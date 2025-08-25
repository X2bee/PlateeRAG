'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateToken, refreshToken } from '@/app/api/authAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { useSessionExpiredLogout } from '@/app/_common/utils/logoutUtils';
import { devLog } from '@/app/_common/utils/logger';

interface AuthGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    redirectTo?: string; // 인증 실패 시 리다이렉트할 URL (기본값: '/login')
}

interface User {
    user_id: number;
    username: string;
    access_token: string;
}

interface TokenValidationResult {
    valid: boolean;
    message?: string;
}

/**
 * 인증 가드 컴포넌트
 * localStorage에서 인증 정보를 확인하고, 유효하지 않으면 로그인 페이지로 리다이렉트
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback, redirectTo = '/login' }) => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // CookieProvider의 useAuth 훅 사용
    const { user, clearAuth, refreshAuth, isInitialized, isLoggingOut } = useAuth();
    const { sessionExpiredLogout } = useSessionExpiredLogout();

    // 현재 페이지를 sessionStorage에 저장 (로그인 후 돌아올 수 있도록)
    useEffect(() => {
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
            sessionStorage.setItem('previousPage', window.location.href);
        }
    }, []);

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                devLog.log('AuthGuard: Checking authentication status...');

                // 1. CookieProvider 초기화 대기
                if (!isInitialized) {
                    devLog.log('AuthGuard: Waiting for CookieProvider initialization...');
                    return; // 초기화가 완료될 때까지 대기
                }

                // 2. CookieProvider에서 사용자 정보 확인
                if (!user) {
                    devLog.log('AuthGuard: No user data found');
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                devLog.log('AuthGuard: User data found, validating token...');

                // 2. 토큰 유효성 검증
                const tokenValidation = await validateToken(user.access_token) as TokenValidationResult;

                if (!tokenValidation.valid) {
                    devLog.log('AuthGuard: Access token invalid, trying refresh token...');

                    try {
                        // Refresh token으로 새 토큰 획득 시도
                        const refreshResult = await refreshToken() as any;

                        if (refreshResult.access_token) {
                            devLog.log('AuthGuard: Token refreshed successfully');
                            // CookieProvider에서 새로운 토큰 정보를 다시 로드
                            refreshAuth();
                            setIsAuthenticated(true);
                            return;
                        }
                    } catch (refreshError) {
                        devLog.error('AuthGuard: Refresh token failed:', refreshError);
                    }

                    // Refresh token도 실패하면 로그아웃 처리
                    devLog.log('AuthGuard: All tokens invalid, clearing auth');
                    setIsAuthenticated(false);
                    clearAuth(true); // localStorage도 함께 정리
                } else {
                    devLog.log('AuthGuard: Token validation successful');
                    setIsAuthenticated(true);
                }

            } catch (error) {
                devLog.error('AuthGuard: Error during authentication check:', error);
                setIsAuthenticated(false);

                // 에러 발생시 인증 정보 정리
                clearAuth(true); // localStorage도 함께 정리
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthentication();
    }, [user, clearAuth, refreshAuth, isInitialized, isLoggingOut]);

    useEffect(() => {
        // 의도적인 로그아웃 중이면 리다이렉트하지 않음
        if (isLoggingOut) {
            devLog.log('AuthGuard: Logout in progress, skipping redirect...');
            return;
        }

        // 인증되지 않은 상태이고 로딩이 완료되면 지정된 페이지로 리다이렉트
        if (isAuthenticated === false && !isLoading) {
            devLog.log(`AuthGuard: Redirecting to ${redirectTo}...`);
            // 현재 페이지를 redirect 파라미터로 추가
            const currentUrl = encodeURIComponent(window.location.href);
            const loginUrl = `${redirectTo}?redirect=${currentUrl}`;
            router.push(loginUrl);
        }
    }, [isAuthenticated, isLoading, router, redirectTo, isLoggingOut]);

    // 로딩 중이거나 인증되지 않은 상태
    if (isLoading) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                gap: '1rem',
                backgroundColor: '#f8fafc',
                zIndex: 9999
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #e2e8f0',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{
                    color: '#64748b',
                    fontSize: '0.875rem',
                    margin: 0,
                    textAlign: 'center'
                }}>
                    인증 상태를 확인하는 중...
                </p>
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (isAuthenticated === false) {
        // 커스텀 fallback이 있으면 표시, 없으면 기본 메시지
        return fallback || (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                gap: '1rem',
                backgroundColor: '#f8fafc',
                zIndex: 9999
            }}>
                <p style={{
                    color: '#64748b',
                    fontSize: '0.875rem',
                    margin: 0,
                    textAlign: 'center'
                }}>
                    로그인 페이지로 이동 중...
                </p>
            </div>
        );
    }

    // 인증된 상태이면 자식 컴포넌트 렌더링
    return <>{children}</>;
};

/**
 * HOC 패턴을 위한 헬퍼 함수
 * 페이지 컴포넌트를 AuthGuard로 감싸는 함수
 */
export const withAuthGuard = <P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: React.ReactNode
) => {
    const AuthGuardedComponent = (props: P) => {
        return (
            <AuthGuard fallback={fallback}>
                <WrappedComponent {...props} />
            </AuthGuard>
        );
    };

    // displayName 설정 (디버깅에 유용)
    AuthGuardedComponent.displayName = `withAuthGuard(${WrappedComponent.displayName || WrappedComponent.name})`;

    return AuthGuardedComponent;
};

/**
 * 클라이언트 사이드에서만 인증 체크를 하는 훅
 * 서버 사이드 렌더링 시에는 항상 false 반환
 */
export const useClientAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // CookieProvider의 useAuth 훅 사용
    const { user } = useAuth();

    useEffect(() => {
        const checkAuth = async () => {
            if (!user) {
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            try {
                const validation = await validateToken(user.access_token) as TokenValidationResult;
                setIsAuthenticated(validation.valid);
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [user]);

    return { isAuthenticated, isLoading };
};

export default AuthGuard;
