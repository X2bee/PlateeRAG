'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateToken, refreshToken } from '@/app/_common/api/authAPI';
import { validateManager } from '@/app/manager/api/manager';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { useSessionExpiredLogout } from '@/app/_common/utils/logoutUtils';
import { devLog } from '@/app/_common/utils/logger';

interface ManagerAuthGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
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

interface ManagerValidationResult {
    manager: boolean;
    user_id?: number;
}

/**
 * Manager 전용 인증 가드 컴포넌트
 * 사용자 인증 및 매니저 권한 검증
 */
const ManagerAuthGuard: React.FC<ManagerAuthGuardProps> = ({ children, fallback }) => {
    const router = useRouter();
    const [authStatus, setAuthStatus] = useState<'loading' | 'need-login' | 'authenticated' | 'unauthorized'>('loading');
    const [isLoading, setIsLoading] = useState(true);

    // CookieProvider의 useAuth 훅 사용
    const { user, clearAuth, refreshAuth, isInitialized, isLoggingOut } = useAuth();
    const { sessionExpiredLogout } = useSessionExpiredLogout();

    useEffect(() => {
        const checkManagerAccess = async () => {
            try {
                devLog.log('ManagerAuthGuard: Starting manager access verification...');

                // 1단계: CookieProvider 초기화 대기
                if (!isInitialized) {
                    devLog.log('ManagerAuthGuard: Waiting for CookieProvider initialization...');
                    return;
                }

                // 2단계: 사용자 인증 정보 확인
                devLog.log('ManagerAuthGuard: Step 1 - Checking user authentication...');

                if (!user) {
                    devLog.log('ManagerAuthGuard: No user data found, need login');
                    setAuthStatus('need-login');
                    setIsLoading(false);
                    return;
                }

                devLog.log('ManagerAuthGuard: User data found, validating token...');

                // 3단계: 토큰 유효성 검증
                let tokenValid = false;
                try {
                    const tokenValidation = await validateToken(user.access_token) as TokenValidationResult;
                    tokenValid = tokenValidation.valid;
                } catch (error) {
                    devLog.error('ManagerAuthGuard: Token validation failed:', error);
                }

                if (!tokenValid) {
                    devLog.log('ManagerAuthGuard: Access token invalid, trying refresh token...');

                    try {
                        // Refresh token으로 새 토큰 획득 시도
                        const refreshResult = await refreshToken() as any;

                        if (refreshResult.access_token) {
                            devLog.log('ManagerAuthGuard: Token refreshed successfully');
                            // CookieProvider에서 새로운 토큰 정보를 다시 로드
                            refreshAuth();
                            // 새로운 토큰으로 다시 검증 (재귀적으로 다시 실행될 것임)
                            return;
                        }
                    } catch (refreshError) {
                        devLog.error('ManagerAuthGuard: Refresh token failed:', refreshError);
                    }

                    // 토큰 갱신 실패 시 로그인 필요
                    devLog.log('ManagerAuthGuard: All tokens invalid, need login');
                    setAuthStatus('need-login');
                    clearAuth(true);
                    setIsLoading(false);
                    return;
                }

                // 4단계: 매니저 권한 검증 (인증된 토큰으로)
                devLog.log('ManagerAuthGuard: Step 2 - Validating manager privileges...');

                try {
                    const managerValidation = await validateManager() as ManagerValidationResult;
                    devLog.log('ManagerAuthGuard: Manager validation result:', managerValidation);

                    if (managerValidation.manager) {
                        devLog.log('ManagerAuthGuard: Manager access granted');
                        setAuthStatus('authenticated');
                    } else {
                        devLog.log('ManagerAuthGuard: User is not a manager, access denied');
                        setAuthStatus('unauthorized');
                    }
                } catch (error) {
                    devLog.error('ManagerAuthGuard: Manager validation failed:', error);
                    setAuthStatus('need-login');
                }

            } catch (error) {
                devLog.error('ManagerAuthGuard: Error during manager access check:', error);
                setAuthStatus('need-login');
                clearAuth(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkManagerAccess();
    }, [user, clearAuth, refreshAuth, isInitialized, isLoggingOut]);

    // 상태에 따른 리다이렉트 처리
    useEffect(() => {
        if (isLoggingOut || isLoading) {
            return;
        }

        switch (authStatus) {
            case 'need-login':
                devLog.log('ManagerAuthGuard: Redirecting to login page');
                router.push('/login');
                break;
            case 'unauthorized':
                devLog.log('ManagerAuthGuard: Access denied, redirecting to main page');
                router.push('/main');
                break;
            case 'authenticated':
                // 인증 완료, 컴포넌트 렌더링
                break;
        }
    }, [authStatus, isLoading, router, isLoggingOut]);

    // 로딩 중일 때
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
                    매니저 권한을 확인하는 중...
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

    // 인증되지 않은 상태일 때
    if (authStatus !== 'authenticated') {
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
                    {authStatus === 'need-login' && '로그인 페이지로 이동 중...'}
                    {authStatus === 'unauthorized' && '접근 권한이 없습니다. 메인 페이지로 이동 중...'}
                </p>
            </div>
        );
    }

    // 인증 완료 시 자식 컴포넌트 렌더링
    return <>{children}</>;
};

/**
 * HOC 패턴을 위한 헬퍼 함수
 * Manager 페이지 컴포넌트를 ManagerAuthGuard로 감싸는 함수
 */
export const withManagerAuthGuard = <P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: React.ReactNode
) => {
    const ManagerAuthGuardedComponent = (props: P) => {
        return (
            <ManagerAuthGuard fallback={fallback}>
                <WrappedComponent {...props} />
            </ManagerAuthGuard>
        );
    };

    // displayName 설정 (디버깅에 유용)
    ManagerAuthGuardedComponent.displayName = `withManagerAuthGuard(${WrappedComponent.displayName || WrappedComponent.name})`;

    return ManagerAuthGuardedComponent;
};

/**
 * 클라이언트 사이드에서만 Manager 권한 체크를 하는 훅
 * 서버 사이드 렌더링 시에는 항상 false 반환
 */
export const useManagerAuth = () => {
    const [isManagerAuthenticated, setIsManagerAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // CookieProvider의 useAuth 훅 사용
    const { user } = useAuth();

    useEffect(() => {
        const checkManagerAuth = async () => {
            try {
                // 1단계: 사용자 인증 확인
                if (!user) {
                    setIsManagerAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                // 2단계: 토큰 검증
                const tokenValidation = await validateToken(user.access_token) as TokenValidationResult;
                if (!tokenValidation.valid) {
                    setIsManagerAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                // 3단계: 매니저 권한 검증
                const managerValidation = await validateManager() as ManagerValidationResult;
                setIsManagerAuthenticated(managerValidation.manager);
            } catch (error) {
                setIsManagerAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkManagerAuth();
    }, [user]);

    return { isManagerAuthenticated, isLoading };
};

export default ManagerAuthGuard;
