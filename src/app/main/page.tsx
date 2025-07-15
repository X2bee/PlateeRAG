import { Suspense } from 'react';
import MainPageClient from './components/MainPageClient';
import styles from './assets/MainPage.module.scss';

// 간단한 로딩 컴포넌트
// Suspense의 fallback으로 사용되어 클라이언트 컴포넌트 로딩 중에 표시됩니다.
function Loading() {
    return (
        <div className={styles.loadingContainer}>
            <p>페이지를 불러오는 중입니다...</p>
        </div>
    );
}

// 이 페이지는 서버에서 렌더링됩니다.
export default function MainPage() {
    return (
        // Suspense는 클라이언트 컴포넌트(MainPageClient)가 준비될 때까지
        // fallback UI(Loading)를 보여줍니다.
        // 이 구조가 빌드 에러를 해결하는 핵심입니다.
        <Suspense fallback={<Loading />}>
            <MainPageClient />
        </Suspense>
    );
}
