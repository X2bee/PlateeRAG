'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateToken } from '@/app/api/authAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { devLog } from '@/app/_common/utils/logger';

interface ReverseAuthGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    redirectTo?: string; // 인증된 사용자를 리다이렉트할 URL (기본값: 이전 페이지 또는 '/')
}

interface TokenValidationResult {
    valid: boolean;
    message?: string;
}

/**
 * 역방향 인증 가드 컴포넌트
 * 이미 인증된 사용자가 로그인/회원가입 페이지에 접근할 때 이전 페이지로 리다이렉트
 */
const ReverseAuthGuard: React.FC<ReverseAuthGuardProps> = ({
    children,
    fallback,
    redirectTo
}) => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // CookieProvider의 useAuth 훅 사용
    const { user, isInitialized } = useAuth();

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                devLog.log('ReverseAuthGuard: Checking authentication status...');

                // 1. CookieProvider 초기화 대기
                if (!isInitialized) {
                    devLog.log('ReverseAuthGuard: Waiting for CookieProvider initialization...');
                    return;
                }

                // 2. CookieProvider에서 사용자 정보 확인
                if (!user) {
                    devLog.log('ReverseAuthGuard: No user data found, allowing access');
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }

                devLog.log('ReverseAuthGuard: User data found, validating token...');

                // 3. 토큰 유효성 검증
                const tokenValidation = await validateToken(user.access_token) as TokenValidationResult;

                if (tokenValidation.valid) {
                    devLog.log('ReverseAuthGuard: User is authenticated, will redirect');
                    setIsAuthenticated(true);
                } else {
                    devLog.log('ReverseAuthGuard: Token invalid, allowing access');
                    setIsAuthenticated(false);
                }

            } catch (error) {
                devLog.error('ReverseAuthGuard: Error during authentication check:', error);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthentication();
    }, [user, isInitialized]);

    useEffect(() => {
        // 인증된 상태이고 로딩이 완료되면 리다이렉트
        if (isAuthenticated === true && !isLoading) {
            const targetUrl = redirectTo || getPreviousPage();
            devLog.log(`ReverseAuthGuard: User already authenticated, redirecting to ${targetUrl}...`);
            router.push(targetUrl);
        }
    }, [isAuthenticated, isLoading, router, redirectTo]);

    // 이전 페이지 URL을 가져오는 함수
    const getPreviousPage = (): string => {
        // 1. URL의 redirect 파라미터 확인
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect');
            if (redirect) {
                devLog.log(`ReverseAuthGuard: Found redirect parameter: ${redirect}`);
                return decodeURIComponent(redirect);
            }

            // 2. sessionStorage에서 로그아웃한 페이지 확인 (사이드바에서 로그아웃한 경우) - 우선순위 높음
            const logoutFromPage = sessionStorage.getItem('logoutFromPage');
            if (logoutFromPage && !logoutFromPage.includes('/login') && !logoutFromPage.includes('/signup')) {
                devLog.log(`ReverseAuthGuard: Using sessionStorage logoutFromPage: ${logoutFromPage}`);
                sessionStorage.removeItem('logoutFromPage'); // 사용 후 제거
                return logoutFromPage;
            }

            // 3. document.referrer 확인
            if (document.referrer && !document.referrer.includes('/login') && !document.referrer.includes('/signup')) {
                devLog.log(`ReverseAuthGuard: Using document.referrer: ${document.referrer}`);
                return document.referrer;
            }

            // 4. sessionStorage에서 이전 페이지 확인 (선택사항)
            const previousPage = sessionStorage.getItem('previousPage');
            if (previousPage && !previousPage.includes('/login') && !previousPage.includes('/signup')) {
                devLog.log(`ReverseAuthGuard: Using sessionStorage previousPage: ${previousPage}`);
                return previousPage;
            }
        }

        // 5. 기본값으로 홈페이지
        devLog.log('ReverseAuthGuard: Using default redirect to /');
        return '/';
    };

    // 로딩 중
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '1rem',
                backgroundColor: '#f8fafc'
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
                    margin: 0
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

    // 인증된 상태이면 fallback 표시 (리다이렉트 진행 중)
    if (isAuthenticated === true) {
        return fallback || (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                flexDirection: 'column',
                gap: '1rem',
                backgroundColor: '#f8fafc'
            }}>
                <p style={{
                    color: '#64748b',
                    fontSize: '0.875rem',
                    margin: 0
                }}>
                    이미 로그인되어 있습니다. 이전 페이지로 이동 중...
                </p>
            </div>
        );
    }

    // 인증되지 않은 상태이면 자식 컴포넌트 렌더링 (로그인/회원가입 페이지 표시)
    return <>{children}</>;
};

/**
 * HOC 패턴을 위한 헬퍼 함수
 * 로그인/회원가입 페이지 컴포넌트를 ReverseAuthGuard로 감싸는 함수
 */
export const withReverseAuthGuard = <P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: React.ReactNode,
    redirectTo?: string
) => {
    const ReverseAuthGuardedComponent = (props: P) => {
        return (
            <ReverseAuthGuard fallback={fallback} redirectTo={redirectTo}>
                <WrappedComponent {...props} />
            </ReverseAuthGuard>
        );
    };

    // displayName 설정 (디버깅에 유용)
    ReverseAuthGuardedComponent.displayName = `withReverseAuthGuard(${WrappedComponent.displayName || WrappedComponent.name})`;

    return ReverseAuthGuardedComponent;
};

export default ReverseAuthGuard;
