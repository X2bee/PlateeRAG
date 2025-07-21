// /src/app/main/components/charts/Chart.tsx
'use client';

import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// 필요한 모든 Chart.js 모듈 등록
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    TimeScale
);

interface ChartProps {
    type: 'line' | 'bar' | 'pie';
    data: any;
    title: string;
}

const ChartComponent: React.FC<ChartProps> = ({ type, data, title }) => {
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
        },
        scales: type === 'line' ? {
            x: { type: 'time' as const, time: { unit: 'second' as const } }
        } : {}
    };

    const renderChart = () => {
        switch (type) {
            case 'line':
                return <Line options={options} data={data} />;
            case 'bar':
                return <Bar options={options} data={data} />;
            case 'pie':
                return <Pie options={options} data={data} />;
            default:
                return null;
        }
    };

    return <div style={{ position: 'relative', height: '350px' }}>{renderChart()}</div>;
};

export default ChartComponent;