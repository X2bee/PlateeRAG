'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import MetricsPageContent from './MetricsPageContent';
import { getTrainItems } from '@/app/_common/components/sidebarConfig';

const ModelPage: React.FC = () => {
    const searchParams = useSearchParams();
    const [activeSection, setActiveSection] = useState<string>('train-monitor');

    useEffect(() => {
        const view = searchParams.get('view');
        if (view && getTrainItems.includes(view)) {
            setActiveSection(view);
        } else {
            setActiveSection('train'); // 기본값 설정
        }
    }, [searchParams]);

    const renderContent = () => {
        switch (activeSection) {
            case 'train-monitor':
                return <MetricsPageContent/>;
        }
    };

    return <>{renderContent()}</>;
};

export default ModelPage;