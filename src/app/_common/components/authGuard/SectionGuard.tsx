'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { devLog } from '@/app/_common/utils/logger';

interface SectionGuardProps {
    children: React.ReactNode;
    requiredSection: string;
    fallback?: React.ReactNode;
    redirectTo?: string; // 접근 거부 시 리다이렉트할 URL (기본값: '/chat')
}

/**
 * 섹션별 접근 제어 가드 컴포넌트
 * 사용자가 특정 섹션에 접근 권한이 있는지 확인하고, 없으면 리다이렉트
 */
const SectionGuard: React.FC<SectionGuardProps> = ({
    children,
    requiredSection,
    fallback,
    redirectTo = '/main'
}) => {
    const router = useRouter();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { hasAccessToSection, isInitialized, availableSections } = useAuth();

    useEffect(() => {
        const checkSectionAccess = () => {
            // 초기화가 완료될 때까지 대기
            if (!isInitialized) {
                devLog.log('SectionGuard: Waiting for auth initialization...');
                return;
            }

            // 섹션 정보가 로드될 때까지 대기
            if (!availableSections) {
                devLog.log('SectionGuard: Waiting for sections data...');
                setHasAccess(false);
                setIsLoading(false);
                return;
            }

            devLog.log('SectionGuard: Available sections:', availableSections);
            devLog.log('SectionGuard: Required section:', requiredSection);

            const access = hasAccessToSection(requiredSection);
            setHasAccess(access);
            setIsLoading(false);

            devLog.log(`SectionGuard: Access check for section '${requiredSection}':`, access);
        };

        checkSectionAccess();
    }, [requiredSection, hasAccessToSection, isInitialized, availableSections]);

    useEffect(() => {
        // 접근 권한이 없고 로딩이 완료되면 리다이렉트
        if (hasAccess === false && !isLoading) {
            devLog.log(`SectionGuard: Access denied for section '${requiredSection}', redirecting to ${redirectTo}...`);
            router.push(redirectTo);
        }
    }, [hasAccess, isLoading, router, redirectTo, requiredSection]);

    // 로딩 중
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
                    권한을 확인하는 중...
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

    // 접근 권한이 없는 경우
    if (hasAccess === false) {
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
                    접근 권한이 없습니다. 채팅 페이지로 이동 중...
                </p>
            </div>
        );
    }

    // 접근 권한이 있는 경우 자식 컴포넌트 렌더링
    return <>{children}</>;
};

/**
 * HOC 패턴을 위한 헬퍼 함수
 * 페이지 컴포넌트를 SectionGuard로 감싸는 함수
 */
export const withSectionGuard = <P extends object>(
    WrappedComponent: React.ComponentType<P>,
    requiredSection: string,
    fallback?: React.ReactNode,
    redirectTo?: string
) => {
    const SectionGuardedComponent = (props: P) => {
        return (
            <SectionGuard
                requiredSection={requiredSection}
                fallback={fallback}
                redirectTo={redirectTo}
            >
                <WrappedComponent {...props} />
            </SectionGuard>
        );
    };

    // displayName 설정 (디버깅에 유용)
    SectionGuardedComponent.displayName = `withSectionGuard(${WrappedComponent.displayName || WrappedComponent.name})`;

    return SectionGuardedComponent;
};

export default SectionGuard;
