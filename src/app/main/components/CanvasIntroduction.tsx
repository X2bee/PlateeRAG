"use client";
import React from "react";
import Link from "next/link";
import { FiPlay, FiGrid, FiArrowRight, FiZap } from "react-icons/fi";
import styles from "@/app/main/assets/CanvasIntro.module.scss";

const CanvasIntroduction: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroIcon}>
          <FiGrid />
        </div>
        <h2 className={styles.heroTitle}>비주얼 워크플로우 캔버스</h2>
        <p className={styles.heroDescription}>
          드래그 앤 드롭으로 AI 워크플로우를 직관적으로 구성하세요. 
          복잡한 데이터 파이프라인을 시각적으로 설계하고 실시간으로 테스트할 수 있습니다.
        </p>
        
        <Link href="/canvas" className={styles.primaryButton}>
          <FiPlay />
          워크플로우 만들기
          <FiArrowRight />
        </Link>
      </div>

      {/* Features Grid */}
      <div className={styles.featuresGrid}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <FiGrid />
          </div>
          <h3>드래그 앤 드롭 인터페이스</h3>
          <p>노드를 쉽게 연결하여 복잡한 워크플로우를 직관적으로 구성할 수 있습니다.</p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <FiZap />
          </div>
          <h3>실시간 실행 및 디버깅</h3>
          <p>구성한 워크플로우를 즉시 실행하고 각 단계별 결과를 확인할 수 있습니다.</p>
        </div>

        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <FiPlay />
          </div>
          <h3>템플릿 기반 시작</h3>
          <p>미리 구성된 템플릿으로 빠르게 시작하거나 처음부터 새로 만들 수 있습니다.</p>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className={styles.quickStart}>
        <h3>빠른 시작 가이드</h3>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h4>노드 추가</h4>
              <p>사이드 패널에서 필요한 노드를 캔버스로 드래그하세요.</p>
            </div>
          </div>
          
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h4>연결 설정</h4>
              <p>노드들을 연결하여 데이터 흐름을 구성하세요.</p>
            </div>
          </div>
          
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h4>실행 및 테스트</h4>
              <p>워크플로우를 실행하여 결과를 확인하세요.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasIntroduction;
