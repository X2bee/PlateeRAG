import React, { useRef, useEffect } from 'react';

// 렌더링 횟수를 추적하는 Hook
export const useRenderTracker = (componentName: string) => {
    const renderCount = useRef(0);
    
    useEffect(() => {
        renderCount.current += 1;
        if (process.env.NODE_ENV === 'development') {
            console.log(`${componentName} rendered ${renderCount.current} times`);
        }
    });

    return renderCount.current;
};

// 성능 측정 유틸리티
export class PerformanceTracker {
    private static measurements: { [key: string]: number[] } = {};
    
    static start(name: string): void {
        if (typeof window !== 'undefined' && window.performance) {
            this.measurements[name] = this.measurements[name] || [];
            this.measurements[`${name}_start`] = [window.performance.now()];
        }
    }
    
    static end(name: string): number | null {
        if (typeof window !== 'undefined' && window.performance) {
            const startTime = this.measurements[`${name}_start`]?.[0];
            if (startTime) {
                const duration = window.performance.now() - startTime;
                this.measurements[name] = this.measurements[name] || [];
                this.measurements[name].push(duration);
                delete this.measurements[`${name}_start`];
                
                if (process.env.NODE_ENV === 'development') {
                    console.log(`${name}: ${duration.toFixed(2)}ms`);
                }
                
                return duration;
            }
        }
        return null;
    }
    
    static getAverage(name: string): number {
        const measurements = this.measurements[name];
        if (!measurements || measurements.length === 0) return 0;
        
        const sum = measurements.reduce((a, b) => a + b, 0);
        return sum / measurements.length;
    }
    
    static getStats(name: string): {
        count: number;
        average: number;
        min: number;
        max: number;
        total: number;
    } {
        const measurements = this.measurements[name] || [];
        
        return {
            count: measurements.length,
            average: measurements.length > 0 ? measurements.reduce((a, b) => a + b, 0) / measurements.length : 0,
            min: measurements.length > 0 ? Math.min(...measurements) : 0,
            max: measurements.length > 0 ? Math.max(...measurements) : 0,
            total: measurements.reduce((a, b) => a + b, 0),
        };
    }
    
    static reset(name?: string): void {
        if (name) {
            delete this.measurements[name];
        } else {
            this.measurements = {};
        }
    }
    
    static getAllStats(): { [key: string]: ReturnType<typeof PerformanceTracker.getStats> } {
        const stats: { [key: string]: ReturnType<typeof PerformanceTracker.getStats> } = {};
        
        for (const name in this.measurements) {
            if (!name.endsWith('_start')) {
                stats[name] = this.getStats(name);
            }
        }
        
        return stats;
    }
}

// 메모리 사용량 추적
export const useMemoryTracker = (componentName: string) => {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
            const memory = (performance as any).memory;
            if (memory) {
                console.log(`${componentName} Memory:`, {
                    used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
                    total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
                    limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
                });
            }
        }
    });
};

// React DevTools Profiler 통합
export const ProfilerWrapper: React.FC<{
    children: React.ReactNode;
    id: string;
    onRender?: (id: string, phase: 'mount' | 'update' | 'nested-update', actualDuration: number) => void;
}> = ({ children, id, onRender }) => {
    if (process.env.NODE_ENV === 'development') {
        const { Profiler } = React;
        
        const handleRender = (
            id: string,
            phase: 'mount' | 'update' | 'nested-update',
            actualDuration: number,
            baseDuration: number,
            startTime: number,
            commitTime: number,
        ) => {
            console.log(`Profiler [${id}]:`, {
                phase,
                actualDuration: `${actualDuration.toFixed(2)}ms`,
                baseDuration: `${baseDuration.toFixed(2)}ms`,
                startTime: `${startTime.toFixed(2)}ms`,
                commitTime: `${commitTime.toFixed(2)}ms`,
            });
            
            onRender?.(id, phase, actualDuration);
        };
        
        return React.createElement(Profiler, { id, onRender: handleRender }, children);
    }
    
    return React.createElement(React.Fragment, null, children);
};

// 컴포넌트 렌더링 시간 측정 Hook
export const useRenderTime = (componentName: string) => {
    const startTime = useRef<number>(0);
    
    // 렌더링 시작
    startTime.current = performance.now();
    
    useEffect(() => {
        // 렌더링 완료
        const endTime = performance.now();
        const duration = endTime - startTime.current;
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`${componentName} render time: ${duration.toFixed(2)}ms`);
        }
    });
};