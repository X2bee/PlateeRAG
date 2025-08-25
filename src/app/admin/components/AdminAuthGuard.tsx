'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateToken, refreshToken } from '@/app/api/authAPI';
import { checkSuperuser, validateSuperuser } from '@/app/admin/api/admin';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { useSessionExpiredLogout } from '@/app/_common/utils/logoutUtils';
import { devLog } from '@/app/_common/utils/logger';

interface AdminAuthGuardProps {
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

/**
 * Admin 전용 인증 가드 컴포넌트
 * 1. 슈퍼유저 존재 여부 확인
 * 2. 사용자 인증 및 슈퍼유저 권한 검증
 */
const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children, fallback }) => {
    const router = useRouter();
    const [authStatus, setAuthStatus] = useState<'loading' | 'no-superuser' | 'need-login' | 'authenticated' | 'unauthorized'>('loading');
    const [isLoading, setIsLoading] = useState(true);

    // CookieProvider의 useAuth 훅 사용
    const { user, clearAuth, refreshAuth, isInitialized, isLoggingOut } = useAuth();
    const { sessionExpiredLogout } = useSessionExpiredLogout();

    useEffect(() => {
        const checkAdminAccess = async () => {
            try {
                devLog.log('AdminAuthGuard: Starting admin access verification...');

                // 1단계: 슈퍼유저 존재 여부 확인 (인증 없이)
                devLog.log('AdminAuthGuard: Step 1 - Checking if superuser exists...');

                let superuserExists;
                try {
                    superuserExists = await checkSuperuser();
                    devLog.log('AdminAuthGuard: Superuser exists:', superuserExists);
                } catch (error) {
                    devLog.error('AdminAuthGuard: Failed to check superuser existence:', error);
                    setAuthStatus('no-superuser');
                    setIsLoading(false);
                    return;
                }

                // 슈퍼유저가 존재하지 않는 경우
                if (!superuserExists) {
                    devLog.log('AdminAuthGuard: No superuser found, redirecting to create superuser page');
                    setAuthStatus('no-superuser');
                    setIsLoading(false);
                    return;
                }

                // 2단계: CookieProvider 초기화 대기
                if (!isInitialized) {
                    devLog.log('AdminAuthGuard: Waiting for CookieProvider initialization...');
                    return;
                }

                // 3단계: 사용자 인증 정보 확인
                devLog.log('AdminAuthGuard: Step 2 - Checking user authentication...');

                if (!user) {
                    devLog.log('AdminAuthGuard: No user data found, need admin login');
                    setAuthStatus('need-login');
                    setIsLoading(false);
                    return;
                }

                devLog.log('AdminAuthGuard: User data found, validating token...');

                // 4단계: 토큰 유효성 검증
                let tokenValid = false;
                try {
                    const tokenValidation = await validateToken(user.access_token) as TokenValidationResult;
                    tokenValid = tokenValidation.valid;
                } catch (error) {
                    devLog.error('AdminAuthGuard: Token validation failed:', error);
                }

                if (!tokenValid) {
                    devLog.log('AdminAuthGuard: Access token invalid, trying refresh token...');

                    try {
                        // Refresh token으로 새 토큰 획득 시도
                        const refreshResult = await refreshToken() as any;

                        if (refreshResult.access_token) {
                            devLog.log('AdminAuthGuard: Token refreshed successfully');
                            // CookieProvider에서 새로운 토큰 정보를 다시 로드
                            refreshAuth();
                            // 새로운 토큰으로 다시 검증 (재귀적으로 다시 실행될 것임)
                            return;
                        }
                    } catch (refreshError) {
                        devLog.error('AdminAuthGuard: Refresh token failed:', refreshError);
                    }

                    // 토큰 갱신 실패 시 로그인 필요
                    devLog.log('AdminAuthGuard: All tokens invalid, need admin login');
                    setAuthStatus('need-login');
                    clearAuth(true);
                    setIsLoading(false);
                    return;
                }

                // 5단계: 슈퍼유저 권한 검증 (인증된 토큰으로)
                devLog.log('AdminAuthGuard: Step 3 - Validating superuser privileges...');

                try {
                    const isSuperuser = await validateSuperuser();
                    devLog.log('AdminAuthGuard: Superuser validation result:', isSuperuser);

                    if (isSuperuser) {
                        devLog.log('AdminAuthGuard: Admin access granted');
                        setAuthStatus('authenticated');
                    } else {
                        devLog.log('AdminAuthGuard: User is not a superuser, access denied');
                        setAuthStatus('unauthorized');
                    }
                } catch (error) {
                    devLog.error('AdminAuthGuard: Superuser validation failed:', error);
                    setAuthStatus('need-login');
                }

            } catch (error) {
                devLog.error('AdminAuthGuard: Error during admin access check:', error);
                setAuthStatus('need-login');
                clearAuth(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminAccess();
    }, [user, clearAuth, refreshAuth, isInitialized, isLoggingOut]);

    // 상태에 따른 리다이렉트 처리
    useEffect(() => {
        if (isLoggingOut || isLoading) {
            return;
        }

        switch (authStatus) {
            case 'no-superuser':
                devLog.log('AdminAuthGuard: Redirecting to create superuser page');
                router.push('/admin/create-superuser');
                break;
            case 'need-login':
                devLog.log('AdminAuthGuard: Redirecting to admin login page');
                router.push('/admin/login-superuser');
                break;
            case 'unauthorized':
                devLog.log('AdminAuthGuard: Access denied, redirecting to main page');
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
                    borderTop: '4px solid #e74c3c',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{
                    color: '#64748b',
                    fontSize: '0.875rem',
                    margin: 0,
                    textAlign: 'center'
                }}>
                    관리자 권한을 확인하는 중...
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
                    {authStatus === 'no-superuser' && '슈퍼유저 생성 페이지로 이동 중...'}
                    {authStatus === 'need-login' && '관리자 로그인 페이지로 이동 중...'}
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
 * Admin 페이지 컴포넌트를 AdminAuthGuard로 감싸는 함수
 */
export const withAdminAuthGuard = <P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: React.ReactNode
) => {
    const AdminAuthGuardedComponent = (props: P) => {
        return (
            <AdminAuthGuard fallback={fallback}>
                <WrappedComponent {...props} />
            </AdminAuthGuard>
        );
    };

    // displayName 설정 (디버깅에 유용)
    AdminAuthGuardedComponent.displayName = `withAdminAuthGuard(${WrappedComponent.displayName || WrappedComponent.name})`;

    return AdminAuthGuardedComponent;
};

/**
 * 클라이언트 사이드에서만 Admin 권한 체크를 하는 훅
 * 서버 사이드 렌더링 시에는 항상 false 반환
 */
export const useAdminAuth = () => {
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // CookieProvider의 useAuth 훅 사용
    const { user } = useAuth();

    useEffect(() => {
        const checkAdminAuth = async () => {
            try {
                // 1단계: 슈퍼유저 존재 확인
                const superuserExists = await checkSuperuser();
                if (!superuserExists) {
                    setIsAdminAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                // 2단계: 사용자 인증 확인
                if (!user) {
                    setIsAdminAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                // 3단계: 토큰 검증
                const tokenValidation = await validateToken(user.access_token) as TokenValidationResult;
                if (!tokenValidation.valid) {
                    setIsAdminAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                // 4단계: 슈퍼유저 권한 검증
                const isSuperuser = await validateSuperuser();
                setIsAdminAuthenticated(isSuperuser);
            } catch (error) {
                setIsAdminAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminAuth();
    }, [user]);

    return { isAdminAuthenticated, isLoading };
};

export default AdminAuthGuard;
