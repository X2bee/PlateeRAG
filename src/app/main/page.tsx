import { Suspense } from 'react';
import MainPageClient from './components/MainPageClient';
import styles from './assets/MainPage.module.scss';

function Loading() {
    return (
        <div className={styles.loadingContainer}>
            <p>페이지를 불러오는 중입니다...</p>
        </div>
    );
}

export default function MainPage() {
    return (
        <Suspense fallback={<Loading />}>
            <MainPageClient />
        </Suspense>
    );
}
