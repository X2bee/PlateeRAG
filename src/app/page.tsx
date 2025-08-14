'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    FiArrowRight,
    FiGithub,
    FiPlay,
    FiZap,
    FiGrid,
    FiMessageCircle,
    FiCpu,
    FiLayers,
    FiTrendingUp,
    FiShield,
    FiGlobe,
    FiLogOut,
} from 'react-icons/fi';
import styles from '@/app/HomePage.module.scss';
import { logout } from '@/app/api/authAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';

export default function HomePage() {
    // CookieProvider의 useAuth 훅 사용
    const { user, clearAuth, refreshAuth } = useAuth();

    useEffect(() => {
        // 컴포넌트가 마운트될 때 인증 상태 새로고침
        refreshAuth();
    }, [refreshAuth]);

    const handleLogout = async () => {
        try {
            await logout();
            clearAuth(); // CookieProvider를 통한 인증 정보 정리
            toast.success('로그아웃되었습니다.');
        } catch (error) {
            console.error('Logout failed:', error);
            // 로그아웃 실패해도 UI는 업데이트 (스토리지는 이미 정리됨)
            clearAuth();
            toast.error('로그아웃 처리 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <nav className={styles.nav}>
                    <div className={styles.navContent}>
                        <div className={styles.logo}>
                            <Image src="/simbol.png" alt="XGEN" height={0} width={26}/>
                            <h1>GEN&nbsp;AI&nbsp;Platform</h1>
                        </div>
                        <div className={styles.navActions}>
                            {user ? (
                                <div className={styles.userSection}>
                                    <span className={styles.welcomeMessage}>
                                        환영합니다, {user.username}님!
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className={styles.logoutBtn}
                                        title="로그아웃"
                                    >
                                        <FiLogOut />
                                    </button>
                                </div>
                            ) : (
                                <Link href="/login?redirect=%2F" className={styles.loginBtn}>
                                    Login
                                    <FiArrowRight />
                                </Link>
                            )}
                            <Link
                                href="/chat"
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
                    <div className={styles.heroContent}>
                        <div className={styles.heroLabel}>
                            <span>🚀 Next-Gen AI Platform</span>
                        </div>
                        <h1 className={styles.heroTitle}>
                            Intelligent <br /><i>AI Platform</i>
                            <span className={styles.highlight}>
                                with Visual Simplicity
                            </span>
                        </h1>
                        <p className={styles.heroDescription}>
                            <Image src="/simbol.png" alt="XGEN" height={0} width={15}/> <b>GEN AI Platform</b> is the all-in-one AI platform<br />
                            where you can train models, design intelligent workflows <br />
                            with drag & drop, and serve them as APIs — effortlessly.
                        </p>
                        <div className={styles.heroStats}>
                            <div className={styles.statItem}>
                                <strong>5+</strong>
                                <span>AI 노드 타입</span>
                            </div>
                            <div className={styles.statItem}>
                                <strong>실시간</strong>
                                <span>채팅 인터페이스</span>
                            </div>
                            <div className={styles.statItem}>
                                <strong>무제한</strong>
                                <span>워크플로우 생성</span>
                            </div>
                        </div>
                        <div className={styles.heroActions}>
                            <Link href="/chat" className={styles.primaryBtn}>
                                <FiPlay />
                                Be More Productive with XGEN
                            </Link>
                        </div>
                    </div>
                    <div className={styles.heroVisual}>
                        <div className={styles.heroImage}>
                            <div className={styles.mockupScreen}>
                                <div className={styles.mockupHeader}>
                                    <div className={styles.mockupDots}>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                    <span>XGEN Canvas</span>
                                </div>
                                <div className={styles.mockupContent}>
                                    <div className={styles.mockupNodes}>
                                        <div className={`${styles.mockupNode} ${styles.input}`}>
                                            <FiLayers />
                                            <span>Input</span>
                                        </div>
                                        <div className={styles.mockupFlow}></div>
                                        <div className={`${styles.mockupNode} ${styles.ai}`}>
                                            <FiCpu />
                                            <span>AI Process</span>
                                        </div>
                                        <div className={styles.mockupFlow}></div>
                                        <div className={`${styles.mockupNode} ${styles.output}`}>
                                            <FiZap />
                                            <span>Output</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Cards */}
                <div id="features" className={styles.featuresSection}>
                    <div className={styles.featuresHeader}>
                        <h2>왜 XGEN인가요?</h2>
                        <p>
                            AI 워크플로우 구축의 새로운 표준을 제시하는 혁신적인 기능들
                        </p>
                    </div>

                    <div className={styles.featuresGrid}>
                        <div className={styles.featureCard}>
                            <div className={`${styles.cardBackground} ${styles.blue}`}></div>
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <FiGrid className={styles.blue} />
                                    <h3>비주얼 캔버스 에디터</h3>
                                </div>
                                <p className={styles.cardDescription}>
                                    직관적인 드래그 앤 드롭으로 복잡한 AI 워크플로우를
                                    시각적으로 구성하고 실시간으로 미리보기할 수 있습니다.
                                </p>
                                <div className={styles.cardFeatures}>
                                    <span>• 5+ AI 노드 타입</span>
                                    <span>• 실시간 미리보기</span>
                                    <span>• 자동 유효성 검사</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.featureCard}>
                            <div className={`${styles.cardBackground} ${styles.purple}`}></div>
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <FiMessageCircle className={styles.purple} />
                                    <h3>실시간 AI 채팅</h3>
                                </div>
                                <p className={styles.cardDescription}>
                                    완성된 워크플로우와 자연스럽게 대화하며
                                    AI의 응답을 실시간으로 확인할 수 있습니다.
                                </p>
                                <div className={styles.cardFeatures}>
                                    <span>• 실시간 응답</span>
                                    <span>• 대화 기록 저장</span>
                                    <span>• 다중 워크플로우 선택</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.featureCard}>
                            <div className={`${styles.cardBackground} ${styles.green}`}></div>
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <FiTrendingUp className={styles.green} />
                                    <h3>스마트 관리센터</h3>
                                </div>
                                <p className={styles.cardDescription}>
                                    워크플로우 성능 모니터링, 실행 로그 분석,
                                    그리고 팀 협업을 위한 통합 관리 환경을 제공합니다.
                                </p>
                                <div className={styles.cardFeatures}>
                                    <span>• 성능 대시보드</span>
                                    <span>• 실행 로그 분석</span>
                                    <span>• 팀 협업 도구</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.featureCard}>
                            <div className={`${styles.cardBackground} ${styles.orange}`}></div>
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <FiCpu className={styles.orange} />
                                    <h3>고성능 실행 엔진</h3>
                                </div>
                                <p className={styles.cardDescription}>
                                    최적화된 실행 엔진으로 대규모 워크플로우도
                                    빠르고 안정적으로 처리합니다.
                                </p>
                                <div className={styles.cardFeatures}>
                                    <span>• 병렬 처리 지원</span>
                                    <span>• 자동 스케일링</span>
                                    <span>• 에러 복구 시스템</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.featureCard}>
                            <div className={`${styles.cardBackground} ${styles.pink}`}></div>
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <FiShield className={styles.pink} />
                                    <h3>엔터프라이즈 보안</h3>
                                </div>
                                <p className={styles.cardDescription}>
                                    기업급 보안과 데이터 보호 기능으로
                                    안전한 AI 워크플로우 환경을 보장합니다.
                                </p>
                                <div className={styles.cardFeatures}>
                                    <span>• 데이터 암호화</span>
                                    <span>• 접근 권한 제어</span>
                                    <span>• 감사 로그</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.featureCard}>
                            <div className={`${styles.cardBackground} ${styles.indigo}`}></div>
                            <div className={styles.cardContent}>
                                <div className={styles.cardHeader}>
                                    <FiGlobe className={styles.indigo} />
                                    <h3>개방형 생태계</h3>
                                </div>
                                <p className={styles.cardDescription}>
                                    다양한 AI 모델과 서비스를 쉽게 연동하고
                                    확장 가능한 플러그인 시스템을 제공합니다.
                                </p>
                                <div className={styles.cardFeatures}>
                                    <span>• API 통합</span>
                                    <span>• 플러그인 지원</span>
                                    <span>• 커뮤니티 마켓플레이스</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className={styles.ctaSection}>
                    <div className={styles.ctaContent}>
                        <div className={styles.ctaLabel}>
                            <span>🎯 Ready to Transform Your AI Workflow?</span>
                        </div>
                        <h2>지금 바로 시작해보세요</h2>
                        <p>몇 분 안에 첫 번째 AI 워크플로우를 만들고 실행해보세요</p>
                        <div className={styles.ctaActions}>
                            <Link href="/canvas" className={styles.ctaBtn}>
                                <FiPlay />
                                무료로 시작하기
                            </Link>
                            <Link href="/main" className={styles.ctaSecondaryBtn}>
                                <FiTrendingUp />
                                관리센터 둘러보기
                            </Link>
                        </div>
                        <div className={styles.ctaNote}>
                            <span> Let&apos;s Start </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerTop}>
                        <div className={styles.footerBrand}>
                            <h3>XGEN</h3>
                            <p>Next Generation AI Workflow</p>
                        </div>
                        {/* <div className={styles.footerSocial}>
                            <a href="https://github.com/X2bee/PlateeRAG" target="_blank" rel="noopener noreferrer">
                                <FiGithub />
                            </a>
                        </div> */}
                    </div>
                    <div className={styles.footerBottom}>
                        <p>© 2025 Plateer AI-LAB. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
