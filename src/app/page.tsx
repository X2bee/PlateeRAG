'use client';
import Link from 'next/link';
import {
    FiArrowRight,
    FiGithub,
    FiPlay,
    FiZap,
    FiGrid,
    FiUsers,
} from 'react-icons/fi';
import styles from '@/app/HomePage.module.scss';

export default function HomePage() {
    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <nav className={styles.nav}>
                    <div className={styles.navContent}>
                        <div className={styles.logo}>
                            <h1>PlateerRAG</h1>
                        </div>
                        <div className={styles.navActions}>
                            <Link href="/main" className={styles.secondaryBtn}>
                                관리센터
                            </Link>
                            <Link
                                href="/canvas"
                                className={styles.getStartedBtn}
                            >
                                Get Started
                                <FiArrowRight />
                            </Link>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <main className={styles.main}>
                <div className={styles.heroSection}>
                    <h1 className={styles.heroTitle}>
                        Build AI Workflows
                        <span className={styles.highlight}>
                            Visually & Intuitively
                        </span>
                    </h1>
                    <p className={styles.heroDescription}>
                        PlateerRAG는 드래그 앤 드롭으로 AI 워크플로우를 구축할
                        수 있는 비주얼 에디터입니다.<br></br>
                        복잡한 AI 파이프라인을 직관적인 노드 기반 인터페이스로
                        간단하게 만들어보세요.
                    </p>
                    <div className={styles.heroActions}>
                        <Link href="/canvas" className={styles.primaryBtn}>
                            <FiPlay />
                            지금 시작하기
                        </Link>
                        <Link href="/main" className={styles.secondaryBtn}>
                            관리센터 둘러보기
                        </Link>
                    </div>
                </div>

                {/* Feature Cards */}
                <div id="features" className={styles.featuresSection}>
                    <div className={styles.featuresHeader}>
                        <h2>핵심 기능</h2>
                        <p>
                            PlateerRAG가 제공하는 강력한 기능들을 확인해보세요
                        </p>
                    </div>

                    <div className={styles.featuresGrid}>
                        <div className={styles.featureCard}>
                            <div
                                className={`${styles.cardBackground} ${styles.blue}`}
                            ></div>
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <FiGrid className={styles.blue} />
                                    <h3>비주얼 워크플로우 에디터</h3>
                                </div>
                                <p className={styles.cardDescription}>
                                    드래그 앤 드롭으로 노드를 연결하여 복잡한 AI
                                    워크플로우를 시각적으로 구성할 수 있습니다.
                                </p>
                            </div>
                        </div>

                        <div className={styles.featureCard}>
                            <div
                                className={`${styles.cardBackground} ${styles.purple}`}
                            ></div>
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <FiZap className={styles.purple} />
                                    <h3>실시간 실행</h3>
                                </div>
                                <p className={styles.cardDescription}>
                                    구성한 워크플로우를 실시간으로 실행하고
                                    결과를 즉시 확인할 수 있습니다.
                                </p>
                            </div>
                        </div>

                        <div className={styles.featureCard}>
                            <div
                                className={`${styles.cardBackground} ${styles.green}`}
                            ></div>
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <FiUsers className={styles.green} />
                                    <h3>협업 환경</h3>
                                </div>
                                <p className={styles.cardDescription}>
                                    팀원들과 함께 워크플로우를 공유하고 협업할
                                    수 있는 환경을 제공합니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className={styles.ctaSection}>
                    <div className={styles.ctaContent}>
                        <h2>지금 바로 시작해보세요</h2>
                        <p>몇 분 안에 첫 번째 AI 워크플로우를 만들어보세요</p>
                        <Link href="/canvas" className={styles.ctaBtn}>
                            <FiPlay />
                            워크플로우 만들기
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerTop}>
                        <div className={styles.footerBrand}>
                            <h3>PlateerRAG</h3>
                            <p>AI 워크플로우의 새로운 패러다임</p>
                        </div>
                        <div className={styles.footerSocial}>
                            <a href="#">
                                <FiGithub />
                            </a>
                        </div>
                    </div>
                    <div className={styles.footerBottom}>
                        <p>© 2025 Plateer AI-LAB. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
