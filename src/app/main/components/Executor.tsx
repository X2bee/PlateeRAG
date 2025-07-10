"use client";
import React from "react";
import { FiSettings, FiPlay, FiCpu, FiActivity } from "react-icons/fi";
import styles from "@/app/main/assets/Executor.module.scss";

const Executor: React.FC = () => {
    return (
        <div className={styles.container}>
            {/* Coming Soon Header */}
            <div className={styles.comingSoonSection}>
                <div className={styles.iconWrapper}>
                    <FiCpu />
                </div>
                <h2 className={styles.title}>워크플로우 실행기</h2>
                <p className={styles.description}>
                    완성된 워크플로우를 실제 환경에서 실행하고 모니터링할 수 있는 기능입니다.
                    현재 개발 중이며, 곧 사용하실 수 있습니다.
                </p>
            </div>

            {/* Planned Features */}
            <div className={styles.featuresPreview}>
                <h3 className={styles.featuresTitle}>예정된 기능들</h3>
                <div className={styles.featuresGrid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <FiPlay />
                        </div>
                        <h4>일괄 실행</h4>
                        <p>여러 워크플로우를 한 번에 실행하고 결과를 확인할 수 있습니다.</p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <FiActivity />
                        </div>
                        <h4>실시간 모니터링</h4>
                        <p>실행 중인 워크플로우의 상태와 성능을 실시간으로 모니터링합니다.</p>
                    </div>

                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>
                            <FiSettings />
                        </div>
                        <h4>환경 설정</h4>
                        <p>실행 환경을 커스터마이징하고 리소스를 효율적으로 관리합니다.</p>
                    </div>
                </div>
            </div>

            {/* Progress Indicator */}
            <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                    <h4>개발 진행률</h4>
                    <span className={styles.progressText}>65%</span>
                </div>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: "65%" }}></div>
                </div>
                <p className={styles.progressNote}>
                    베타 버전은 2025년 2월 출시 예정입니다.
                </p>
            </div>
        </div>
    );
};

export default Executor;
