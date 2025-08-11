'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import MetricsPageContent from '@/app/model/components/MetricsPageContent';
import EvalPageContent from '@/app/model/components/EvalPageContent';
import TrainPageContent from '@/app/model/components/TrainPageContent';
import StoragePageContent from '@/app/model/components/StoragePageContent';
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
