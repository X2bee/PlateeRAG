'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MetricsPageContent from '@/app/main/modelSection/components/MetricsPageContent';
import EvalPageContent from '@/app/main/modelSection/components/EvalPageContent';
import TrainPageContent from '@/app/main/modelSection/components/TrainPageContent';
import StoragePageContent from '@/app/main/modelSection/components/StoragePageContent';
import { getTrainItems } from '@/app/_common/components/sidebarConfig';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { devLog } from '@/app/_common/utils/logger';

const ModelPage: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const { hasAccessToSection, isInitialized } = useAuth();

    useEffect(() => {
        if (!isInitialized) return;

        const view = searchParams.get('view');
        devLog.log('ModelPage: URL view parameter:', view);
        devLog.log('ModelPage: getTrainItems:', getTrainItems);

        // 접근 가능한 첫 번째 섹션을 찾기
        const getAccessibleSection = () => {
            const sectionsToCheck = view && getTrainItems.includes(view) ? [view] : getTrainItems;
            devLog.log('ModelPage: Sections to check:', sectionsToCheck);

            for (const section of sectionsToCheck) {
                const hasAccess = hasAccessToSection(section);
                devLog.log(`ModelPage: Checking section '${section}': ${hasAccess}`);
                if (hasAccess) {
                    return section;
                }
            }

            // 접근 가능한 섹션이 없으면 채팅으로 리다이렉트
            devLog.log('ModelPage: No accessible train sections found, redirecting to chat');
            router.push('/chat');
            return null;
        };

        const accessibleSection = getAccessibleSection();
        devLog.log('ModelPage: Accessible section:', accessibleSection);
        if (accessibleSection) {
            setActiveSection(accessibleSection);
        }
    }, [searchParams, hasAccessToSection, isInitialized, router]);

    // 현재 섹션에 대한 접근 권한 재확인
    useEffect(() => {
        if (isInitialized && activeSection && !hasAccessToSection(activeSection)) {
            devLog.log(`ModelPage: Access denied for section '${activeSection}', redirecting to chat`);
            router.push('/chat');
        }
    }, [activeSection, hasAccessToSection, isInitialized, router]);

    const renderContent = () => {
        devLog.log('ModelPage: renderContent called', {
            isInitialized,
            activeSection,
            hasAccessToSection: activeSection ? hasAccessToSection(activeSection) : 'N/A'
        });

        // 초기화가 완료되지 않았거나 activeSection이 아직 설정되지 않았으면 로딩 표시
        if (!isInitialized || !activeSection) {
            return (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '50vh',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e2e8f0',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
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

        // 현재 섹션에 대한 접근 권한이 없으면 빈 화면
        if (activeSection && !hasAccessToSection(activeSection)) {
            return null;
        }

        switch (activeSection) {
            case 'train':
                return <TrainPageContent />;
            case 'train-monitor':
                return <MetricsPageContent />;
            case 'eval':
                return <EvalPageContent />;
            case 'storage':
                return <StoragePageContent />;
            default:
                return <TrainPageContent />;
        }
    };

    return <>{renderContent()}</>;
};

export default ModelPage;
