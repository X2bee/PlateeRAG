import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { devLog } from '@/app/_common/utils/logger';

// 메모리 사용량 모니터링
export class MemoryMonitor {
    private static measurements: number[] = [];
    private static maxMeasurements = 50;

    static measureMemory(): number | null {
        if ('memory' in performance && (performance as any).memory) {
            const memory = (performance as any).memory;
            return memory.usedJSHeapSize;
        }
        return null;
    }

    static trackMemoryUsage(): void {
        const memoryUsage = this.measureMemory();
        if (memoryUsage !== null) {
            this.measurements.push(memoryUsage);
            if (this.measurements.length > this.maxMeasurements) {
                this.measurements.shift();
            }
            
            devLog.log('Memory usage:', this.formatBytes(memoryUsage));
        }
    }

    static getMemoryStats() {
        if (this.measurements.length === 0) return null;

        const current = this.measurements[this.measurements.length - 1];
        const average = this.measurements.reduce((sum, val) => sum + val, 0) / this.measurements.length;
        const max = Math.max(...this.measurements);

        return {
            current: this.formatBytes(current),
            average: this.formatBytes(average),
            max: this.formatBytes(max),
            trend: this.measurements.length > 1 
                ? current > this.measurements[this.measurements.length - 2] ? 'increasing' : 'decreasing'
                : 'stable'
        };
    }

    private static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 세션 데이터 최적화를 위한 유틸리티
export class SessionDataOptimizer {
    private static readonly MAX_MESSAGES_IN_MEMORY = 100;
    private static readonly MAX_MESSAGE_LENGTH = 10000;

    // 메시지 압축 (오래된 메시지들을 요약)
    static optimizeSessionMessages(messages: any[]): any[] {
        if (messages.length <= this.MAX_MESSAGES_IN_MEMORY) {
            return messages;
        }

        // 최근 메시지는 그대로 유지
        const recentMessages = messages.slice(-this.MAX_MESSAGES_IN_MEMORY / 2);
        
        // 오래된 메시지들을 요약
        const oldMessages = messages.slice(0, messages.length - this.MAX_MESSAGES_IN_MEMORY / 2);
        const summarizedMessage = {
            log_id: 'summarized-messages',
            workflow_name: 'system',
            workflow_id: 'system',
            input_data: `[요약] 이전 ${oldMessages.length}개 메시지`,
            output_data: `이 세션에서 총 ${oldMessages.length}개의 이전 대화가 있었습니다. 메모리 최적화를 위해 요약되었습니다.`,
            updated_at: oldMessages[0]?.updated_at || new Date().toISOString(),
        };

        return [summarizedMessage, ...recentMessages];
    }

    // 긴 메시지 내용 잘라내기
    static truncateMessage(message: string): string {
        if (message.length <= this.MAX_MESSAGE_LENGTH) {
            return message;
        }

        return message.substring(0, this.MAX_MESSAGE_LENGTH - 3) + '...';
    }

    // 불필요한 데이터 제거
    static cleanupSessionData(sessionData: any): any {
        return {
            ...sessionData,
            messages: this.optimizeSessionMessages(
                sessionData.messages?.map((msg: any) => ({
                    ...msg,
                    input_data: this.truncateMessage(msg.input_data || ''),
                    output_data: this.truncateMessage(msg.output_data || ''),
                })) || []
            ),
        };
    }
}

// 디바운싱을 위한 커스텀 훅
export const useDebounce = <T extends (...args: any[]) => void>(
    callback: T,
    delay: number
): T => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback(
        ((...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        }) as T,
        [callback, delay]
    );
};

// 무한 스크롤을 위한 가상화 훅
export const useVirtualization = (
    items: any[],
    itemHeight: number,
    containerHeight: number,
    buffer: number = 5
) => {
    const [scrollTop, setScrollTop] = useState(0);

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const endIndex = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
    );

    const visibleItems = useMemo(() => {
        return items.slice(startIndex, endIndex + 1).map((item, index) => ({
            ...item,
            originalIndex: startIndex + index,
            offsetY: (startIndex + index) * itemHeight,
        }));
    }, [items, startIndex, endIndex, itemHeight]);

    const totalHeight = items.length * itemHeight;

    return {
        visibleItems,
        totalHeight,
        setScrollTop,
        startIndex,
        endIndex,
    };
};

// 백그라운드 작업 스케줄러
export class BackgroundScheduler {
    private static tasks: Array<() => void> = [];
    private static isRunning = false;

    static addTask(task: () => void): void {
        this.tasks.push(task);
        this.processTasks();
    }

    private static async processTasks(): Promise<void> {
        if (this.isRunning || this.tasks.length === 0) return;

        this.isRunning = true;

        while (this.tasks.length > 0) {
            const task = this.tasks.shift();
            if (task) {
                try {
                    // requestIdleCallback 사용 가능한 경우 사용
                    if ('requestIdleCallback' in window) {
                        await new Promise<void>((resolve) => {
                            (window as any).requestIdleCallback(() => {
                                task();
                                resolve();
                            });
                        });
                    } else {
                        // 폴백: setTimeout 사용
                        await new Promise<void>((resolve) => {
                            setTimeout(() => {
                                task();
                                resolve();
                            }, 0);
                        });
                    }
                } catch (error) {
                    devLog.error('Background task failed:', error);
                }
            }
        }

        this.isRunning = false;
    }
}

// 성능 메트릭 수집
export class PerformanceMetrics {
    private static metrics: Map<string, number[]> = new Map();

    static startTimer(name: string): () => void {
        const startTime = performance.now();
        
        return () => {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.recordMetric(name, duration);
            devLog.log(`${name}: ${duration.toFixed(2)}ms`);
        };
    }

    private static recordMetric(name: string, value: number): void {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        const values = this.metrics.get(name)!;
        values.push(value);

        // 최대 100개 측정값만 유지
        if (values.length > 100) {
            values.shift();
        }
    }

    static getMetrics(name: string): {
        average: number;
        min: number;
        max: number;
        latest: number;
        count: number;
    } | null {
        const values = this.metrics.get(name);
        if (!values || values.length === 0) return null;

        return {
            average: values.reduce((sum, val) => sum + val, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            latest: values[values.length - 1],
            count: values.length,
        };
    }

    static getAllMetrics(): Record<string, any> {
        const result: Record<string, any> = {};
        for (const [name, values] of this.metrics.entries()) {
            if (values.length > 0) {
                result[name] = this.getMetrics(name);
            }
        }
        return result;
    }
}

// React 상태 최적화를 위한 유틸리티
export const useOptimizedState = <T>(initialState: T, optimizer?: (state: T) => T) => {
    const [state, setState] = useState(initialState);
    const lastOptimizedRef = useRef<T>(initialState);
    const optimizedUpdateCount = useRef(0);

    const optimizedSetState = useCallback((newState: T | ((prevState: T) => T)) => {
        setState(prevState => {
            const nextState = typeof newState === 'function' 
                ? (newState as (prevState: T) => T)(prevState)
                : newState;

            // 옵티마이저가 있고, 100번마다 실행
            if (optimizer && optimizedUpdateCount.current % 100 === 0) {
                const optimized = optimizer(nextState);
                lastOptimizedRef.current = optimized;
                optimizedUpdateCount.current++;
                return optimized;
            }

            optimizedUpdateCount.current++;
            return nextState;
        });
    }, [optimizer]);

    return [state, optimizedSetState] as const;
};