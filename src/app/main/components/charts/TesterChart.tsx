'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import styles from '@/app/main/assets/TesterChart.module.scss';

// 필요한 Chart.js 모듈 등록
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface TesterChartProps {
    data: any;
    title: string;
}

const TesterChart: React.FC<TesterChartProps> = ({ data, title }) => {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: title,
                font: { size: 16 }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'category' as const,
                title: {
                    display: true,
                    text: '테스트 실행 일시'
                }
            },
            y: {
                type: 'linear' as const,
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: '정답률 (%)'
                },
                ticks: {
                    callback: function(value: any) {
                        return value + '%';
                    }
                }
            }
        }
    };

    return (
        <div className={styles.testerChartContainer}>
            <div className={styles.testerChartWrapper}>
                <Line options={options} data={data} />
            </div>
        </div>
    );
};

export default TesterChart;
