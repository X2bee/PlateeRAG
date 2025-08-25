'use client';
import React from 'react';
import Link from 'next/link';
import { FiShield, FiUsers, FiSettings, FiArrowRight, FiDatabase, FiActivity, FiLock } from 'react-icons/fi';
import styles from '@/app/admin/assets/AdminIntro.module.scss';

const AdminIntroduction: React.FC = () => {
    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <div className={styles.heroSection}>
                <div className={styles.heroIcon}>
                    <FiShield />
                </div>
                <h2 className={styles.heroTitle}>관리자 대시보드</h2>
                <p className={styles.heroDescription}>
                    시스템 전반을 관리하고 모니터링할 수 있는 통합 관리 환경입니다.
                    사용자 관리, 시스템 설정, 성능 모니터링 등 모든 관리 기능을
                    한 곳에서 제어할 수 있습니다.
                </p>

                <Link href="/admin?view=users" className={styles.primaryButton}>
                    <FiUsers />
                    사용자 관리하기
                    <FiArrowRight />
                </Link>
            </div>

            {/* Features Grid */}
            <div className={styles.featuresGrid}>
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon}>
                        <FiUsers />
                    </div>
                    <h3>사용자 관리</h3>
                    <p>
                        등록된 사용자를 관리하고 권한을 설정할 수 있습니다.
                        사용자별 활동 내역과 접근 권한을 제어하세요.
                    </p>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIcon}>
                        <FiActivity />
                    </div>
                    <h3>시스템 모니터링</h3>
                    <p>
                        실시간 시스템 상태와 성능 지표를 모니터링할 수 있습니다.
                        서버 리소스 사용량과 응답 시간을 확인하세요.
                    </p>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIcon}>
                        <FiDatabase />
                    </div>
                    <h3>데이터베이스 관리</h3>
                    <p>
                        시스템 데이터베이스를 관리하고 백업을 수행할 수 있습니다.
                        데이터 무결성과 안정성을 보장하세요.
                    </p>
                </div>
            </div>

            {/* Quick Start Guide */}
            <div className={styles.quickStart}>
                <h3>관리자 기능 가이드</h3>
                <div className={styles.steps}>
                    <div className={styles.step}>
                        <div className={styles.stepNumber}>1</div>
                        <div className={styles.stepContent}>
                            <h4>사용자 관리</h4>
                            <p>
                                사용자 목록을 확인하고 권한을 설정하거나 계정을
                                관리하세요.
                            </p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>2</div>
                        <div className={styles.stepContent}>
                            <h4>시스템 설정</h4>
                            <p>
                                전역 설정을 변경하고 시스템 동작을 제어하세요.
                            </p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>3</div>
                        <div className={styles.stepContent}>
                            <h4>모니터링</h4>
                            <p>
                                시스템 상태와 사용자 활동을 실시간으로
                                모니터링하세요.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Information Sections */}
            <div className={styles.additionalInfo}>
                <h3>관리 기능</h3>
                <div className={styles.infoGrid}>
                    <div className={styles.infoCard}>
                        <h4>사용자 권한 관리</h4>
                        <p>
                            각 사용자별로 세밀한 권한을 설정할 수 있습니다.
                            워크플로우 생성, 모델 훈련, 시스템 설정 등의 권한을
                            개별적으로 제어하여 보안을 강화하세요.
                        </p>
                    </div>

                    <div className={styles.infoCard}>
                        <h4>시스템 로그 관리</h4>
                        <p>
                            모든 시스템 활동과 사용자 행동을 로그로 기록하고
                            관리합니다. 보안 감사와 문제 해결을 위한 상세한
                            로그 분석이 가능합니다.
                        </p>
                    </div>

                    <div className={styles.infoCard}>
                        <h4>백업 및 복구</h4>
                        <p>
                            정기적인 데이터 백업과 긴급 상황 시 빠른 복구를
                            지원합니다. 시스템 안정성과 데이터 보안을 위한
                            필수 기능입니다.
                        </p>
                    </div>
                </div>
            </div>

            <div className={styles.additionalInfo}>
                <h3>관리 영역</h3>
                <div className={styles.nodeTypes}>
                    <div className={styles.nodeCategory}>
                        <h4>사용자 관리</h4>
                        <ul>
                            <li>신규 사용자 등록</li>
                            <li>계정 활성화/비활성화</li>
                            <li>비밀번호 재설정</li>
                            <li>사용자 그룹 관리</li>
                        </ul>
                    </div>

                    <div className={styles.nodeCategory}>
                        <h4>시스템 설정</h4>
                        <ul>
                            <li>전역 환경변수</li>
                            <li>API 키 관리</li>
                            <li>모델 설정</li>
                            <li>보안 정책</li>
                        </ul>
                    </div>

                    <div className={styles.nodeCategory}>
                        <h4>모니터링</h4>
                        <ul>
                            <li>서버 리소스</li>
                            <li>API 응답시간</li>
                            <li>에러 로그</li>
                            <li>사용량 통계</li>
                        </ul>
                    </div>

                    <div className={styles.nodeCategory}>
                        <h4>데이터 관리</h4>
                        <ul>
                            <li>데이터베이스 백업</li>
                            <li>파일 시스템 관리</li>
                            <li>캐시 정리</li>
                            <li>저장소 최적화</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className={styles.additionalInfo}>
                <h3>보안 권장사항</h3>
                <div className={styles.tipsList}>
                    <div className={styles.tip}>
                        <h4>🔐 강력한 인증</h4>
                        <p>
                            관리자 계정에는 반드시 강력한 비밀번호와 2단계 인증을
                            설정하여 보안을 강화하세요.
                        </p>
                    </div>

                    <div className={styles.tip}>
                        <h4>📊 정기 모니터링</h4>
                        <p>
                            시스템 상태와 사용자 활동을 정기적으로 모니터링하여
                            이상 징후를 조기에 발견하세요.
                        </p>
                    </div>

                    <div className={styles.tip}>
                        <h4>💾 백업 전략</h4>
                        <p>
                            중요한 데이터는 정기적으로 백업하고 복구 절차를
                            미리 테스트하여 데이터 손실을 방지하세요.
                        </p>
                    </div>

                    <div className={styles.tip}>
                        <h4>🔄 권한 검토</h4>
                        <p>
                            사용자 권한을 정기적으로 검토하고 불필요한 권한은
                            제거하여 최소 권한 원칙을 유지하세요.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminIntroduction;
