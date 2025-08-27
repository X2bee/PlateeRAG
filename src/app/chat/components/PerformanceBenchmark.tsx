import React, { useState, useEffect } from 'react';
import { PerformanceTracker, useRenderTracker, ProfilerWrapper } from '../utils/performanceUtils';

interface PerformanceBenchmarkProps {
    children: React.ReactNode;
    label: string;
    trackRenders?: boolean;
    trackMemory?: boolean;
}

const PerformanceBenchmark: React.FC<PerformanceBenchmarkProps> = ({
    children,
    label,
    trackRenders = true,
    trackMemory = false,
}) => {
    const [stats, setStats] = useState<{
        renderCount: number;
        averageRenderTime: number;
        memoryUsage?: { used: number; total: number };
    }>({
        renderCount: 0,
        averageRenderTime: 0,
    });

    const renderCount = useRenderTracker(label);

    useEffect(() => {
        PerformanceTracker.start(`${label}_render`);
        
        return () => {
            PerformanceTracker.end(`${label}_render`);
        };
    });

    useEffect(() => {
        const updateStats = () => {
            const perfStats = PerformanceTracker.getStats(`${label}_render`);
            let memoryUsage;

            if (trackMemory && 'memory' in performance) {
                const memory = (performance as any).memory;
                if (memory) {
                    memoryUsage = {
                        used: memory.usedJSHeapSize / 1024 / 1024,
                        total: memory.totalJSHeapSize / 1024 / 1024,
                    };
                }
            }

            setStats({
                renderCount,
                averageRenderTime: perfStats.average,
                memoryUsage,
            });
        };

        const interval = setInterval(updateStats, 1000);
        return () => clearInterval(interval);
    }, [label, renderCount, trackMemory]);

    const handleProfilerRender = (id: string, phase: 'mount' | 'update' | 'nested-update', actualDuration: number) => {
        console.log(`${label} [${phase}]: ${actualDuration.toFixed(2)}ms`);
    };

    if (process.env.NODE_ENV === 'development' && trackRenders) {
        return (
            <ProfilerWrapper id={label} onRender={handleProfilerRender}>
                <div style={{ position: 'relative' }}>
                    {children}
                    <div 
                        style={{
                            position: 'fixed',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(0, 0, 0, 0.8)',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            zIndex: 9999,
                            pointerEvents: 'none',
                        }}
                    >
                        <div><strong>{label}</strong></div>
                        <div>Renders: {stats.renderCount}</div>
                        <div>Avg Time: {stats.averageRenderTime.toFixed(2)}ms</div>
                        {stats.memoryUsage && (
                            <div>
                                Memory: {stats.memoryUsage.used.toFixed(1)}MB / {stats.memoryUsage.total.toFixed(1)}MB
                            </div>
                        )}
                    </div>
                </div>
            </ProfilerWrapper>
        );
    }

    return <>{children}</>;
};

// 성능 비교 컴포넌트
export const PerformanceComparison: React.FC<{
    originalComponent: React.ReactNode;
    optimizedComponent: React.ReactNode;
}> = ({ originalComponent, optimizedComponent }) => {
    const [showComparison, setShowComparison] = useState(false);

    if (process.env.NODE_ENV !== 'development') {
        return <>{optimizedComponent}</>;
    }

    return (
        <div>
            <div style={{ 
                position: 'fixed', 
                top: '10px', 
                left: '10px', 
                zIndex: 10000,
                background: 'white',
                padding: '10px',
                borderRadius: '5px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}>
                <button
                    onClick={() => setShowComparison(!showComparison)}
                    style={{
                        padding: '8px 16px',
                        background: showComparison ? '#ff6b6b' : '#51cf66',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    {showComparison ? 'Original' : 'Optimized'}
                </button>
            </div>
            
            {showComparison ? (
                <PerformanceBenchmark label="Original" trackRenders trackMemory>
                    {originalComponent}
                </PerformanceBenchmark>
            ) : (
                <PerformanceBenchmark label="Optimized" trackRenders trackMemory>
                    {optimizedComponent}
                </PerformanceBenchmark>
            )}
        </div>
    );
};

export default PerformanceBenchmark;