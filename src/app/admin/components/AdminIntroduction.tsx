'use client';
import React from 'react';
import {
    FiShield, FiUsers, FiSettings, FiActivity, FiDatabase, FiLock,
    FiUserPlus, FiMessageSquare, FiBarChart, FiServer, FiHardDrive,
    FiArchive, FiEye, FiAlertTriangle, FiFileText, FiTrendingUp,
    FiCpu, FiMonitor, FiZap
} from 'react-icons/fi';
import styles from '@/app/admin/assets/AdminIntro.module.scss';

const AdminIntroduction: React.FC = () => {
    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <div className={styles.heroSection}>
                <div className={styles.heroIcon}>
                    <FiShield />
                </div>
                <h2 className={styles.heroTitle}>XGen 관리자 대시보드</h2>
                <p className={styles.heroDescription}>
                    AI 기반 RAG 시스템의 모든 것을 통합 관리하는 중앙 컨트롤 센터입니다.
                    사용자부터 워크플로우, 시스템 모니터링까지 - 한 곳에서 완벽하게 제어하고
                    최적화된 AI 서비스를 제공하세요.
                </p>
            </div>

            {/* Core Management Areas */}
            <div className={styles.featuresGrid}>
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon}>
                        <FiUsers />
                    </div>
                    <h3>사용자 & 권한 관리</h3>
                    <p>
                        사용자 등록부터 조직별 권한 설정까지. 체계적인 접근 제어로
                        보안성과 효율성을 동시에 확보하세요.
                    </p>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIcon}>
                        <FiBarChart />
                    </div>
                    <h3>워크플로우 모니터링</h3>
                    <p>
                        실시간 워크플로우 실행 상태, 성능 분석, 배치 테스트까지.
                        AI 파이프라인을 완벽하게 관리하고 최적화하세요.
                    </p>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIcon}>
                        <FiServer />
                    </div>
                    <h3>시스템 인프라</h3>
                    <p>
                        LLM 설정, 데이터베이스, 벡터DB부터 서버 상태까지.
                        안정적인 AI 서비스를 위한 인프라를 통합 관리하세요.
                    </p>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIcon}>
                        <FiEye />
                    </div>
                    <h3>보안 & 로그 관리</h3>
                    <p>
                        감사 로그, 에러 추적, 접근 기록까지. 투명하고 안전한
                        시스템 운영을 위한 완벽한 가시성을 제공합니다.
                    </p>
                </div>
            </div>

            {/* Management Workflow Guide */}
            <div className={styles.quickStart}>
                <h3>AI RAG 시스템 관리 워크플로우</h3>
                <div className={styles.steps}>
                    <div className={styles.step}>
                        <div className={styles.stepNumber}>1</div>
                        <div className={styles.stepContent}>
                            <h4>사용자 & 권한 설정</h4>
                            <p>
                                신규 사용자 등록, 조직별 권한 배정으로 체계적인
                                접근 관리 체계를 구축하세요.
                            </p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>2</div>
                        <div className={styles.stepContent}>
                            <h4>AI 시스템 구성</h4>
                            <p>
                                LLM 모델, 벡터 데이터베이스, 임베딩 설정으로
                                최적화된 RAG 파이프라인을 구성하세요.
                            </p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>3</div>
                        <div className={styles.stepContent}>
                            <h4>모니터링 & 최적화</h4>
                            <p>
                                실시간 성능 분석과 워크플로우 모니터링으로
                                지속적인 서비스 개선을 실현하세요.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Management Areas */}
            <div className={styles.additionalInfo}>
                <h3>통합 관리 영역</h3>
                <div className={styles.nodeTypes}>
                    <div className={styles.nodeCategory}>
                        <h4>👥 사용자 관리</h4>
                        <ul>
                            <li>사용자 목록 및 상태 관리</li>
                            <li>신규 사용자 계정 생성</li>
                            <li>조직별 권한 설정</li>
                            <li>접근 제어 및 보안 정책</li>
                        </ul>
                    </div>

                    <div className={styles.nodeCategory}>
                        <h4>⚙️ 시스템 설정</h4>
                        <ul>
                            <li>LLM 모델 설정 및 관리</li>
                            <li>벡터 데이터베이스 구성</li>
                            <li>전역 환경변수 관리</li>
                            <li>API 키 및 인증 설정</li>
                        </ul>
                    </div>

                    <div className={styles.nodeCategory}>
                        <h4>📊 모니터링 시스템</h4>
                        <ul>
                            <li>실시간 채팅 활동 추적</li>
                            <li>워크플로우 성능 분석</li>
                            <li>시스템 리소스 모니터링</li>
                            <li>서비스 건강성 체크</li>
                        </ul>
                    </div>

                    <div className={styles.nodeCategory}>
                        <h4>💾 데이터 관리</h4>
                        <ul>
                            <li>데이터베이스 상태 관리</li>
                            <li>파일 시스템 및 저장소</li>
                            <li>자동 백업 및 복구</li>
                            <li>데이터 최적화 및 정리</li>
                        </ul>
                    </div>

                    <div className={styles.nodeCategory}>
                        <h4>🔒 보안 & 로그</h4>
                        <ul>
                            <li>보안 정책 및 설정</li>
                            <li>사용자 활동 감사 로그</li>
                            <li>시스템 에러 추적</li>
                            <li>API 접근 기록 관리</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Advanced Features */}
            <div className={styles.additionalInfo}>
                <h3>고급 관리 기능</h3>
                <div className={styles.infoGrid}>
                    <div className={styles.infoCard}>
                        <h4>워크플로우 최적화</h4>
                        <p>
                            실시간 성능 모니터링과 배치 테스트를 통해 AI 워크플로우의
                            처리 속도와 정확도를 지속적으로 개선할 수 있습니다.
                            병목 지점을 식별하고 자동 최적화를 수행하세요.
                        </p>
                    </div>

                    <div className={styles.infoCard}>
                        <h4>지능형 로그 분석</h4>
                        <p>
                            AI 기반 로그 분석으로 시스템 이상 징후를 조기에 감지하고
                            예측적 유지보수를 수행합니다. 패턴 분석을 통한
                            프로액티브한 시스템 관리가 가능합니다.
                        </p>
                    </div>

                    <div className={styles.infoCard}>
                        <h4>자동화된 인프라</h4>
                        <p>
                            스마트 백업, 자동 스케일링, 리소스 최적화 등
                            인프라 관리를 자동화하여 운영 효율성을 극대화합니다.
                            관리자의 개입 없이도 안정적인 서비스를 유지하세요.
                        </p>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className={styles.additionalInfo}>
                <h3>실시간 성능 지표</h3>
                <div className={styles.tipsList}>
                    <div className={styles.tip}>
                        <h4>시스템 성능 대시보드</h4>
                        <p>
                            CPU, 메모리, 네트워크 사용률부터 AI 모델 추론 속도까지
                            모든 핵심 지표를 실시간으로 모니터링하고 시각화합니다.
                        </p>
                    </div>

                    <div className={styles.tip}>
                        <h4>사용자 활동 인사이트</h4>
                        <p>
                            사용자별 서비스 이용 패턴, 워크플로우 실행 통계,
                            인기 기능 분석을 통해 서비스 개선 방향을 제시합니다.
                        </p>
                    </div>

                    <div className={styles.tip}>
                        <h4>AI 모델 성능 추적</h4>
                        <p>
                            RAG 파이프라인의 검색 정확도, 응답 생성 품질,
                            처리 지연시간 등을 추적하여 AI 서비스 품질을 보장합니다.
                        </p>
                    </div>

                    <div className={styles.tip}>
                        <h4>보안 상태 모니터링</h4>
                        <p>
                            실시간 보안 위협 탐지, 비정상 접근 패턴 알림,
                            데이터 유출 방지 시스템으로 안전한 AI 서비스를 제공합니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminIntroduction;
