'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiPlay, FiGrid, FiArrowRight, FiZap } from 'react-icons/fi';
import styles from '@/app/main/workflowSection/assets/CanvasIntro.module.scss';
import { startNewWorkflow, saveWorkflowName } from '@/app/_common/utils/workflowStorage';
import { listWorkflows } from '@/app/_common/api/workflow/workflowAPI';

const CanvasIntroduction: React.FC = () => {
    const router = useRouter();

    // 기존 워크플로우 목록에서 고유한 이름 생성
    const generateUniqueWorkflowName = (existingWorkflows: string[]): string => {
        const baseName = 'Workflow';

        // .json 확장자 제거한 이름 목록 생성
        const workflowNames = existingWorkflows.map(filename =>
            filename.replace('.json', '')
        );

        // 'Workflow'가 없으면 그대로 반환
        if (!workflowNames.includes(baseName)) {
            return baseName;
        }

        // 'Workflow (n)' 형식의 숫자 찾기
        const pattern = /^Workflow \((\d+)\)$/;
        const existingNumbers: number[] = [];

        workflowNames.forEach(name => {
            const match = name.match(pattern);
            if (match) {
                existingNumbers.push(parseInt(match[1], 10));
            }
        });

        // 다음 사용 가능한 번호 찾기
        let nextNumber = 1;
        while (
            workflowNames.includes(`${baseName} (${nextNumber})`) ||
            existingNumbers.includes(nextNumber)
        ) {
            nextNumber++;
        }

        return `${baseName} (${nextNumber})`;
    };

    const handleCreateWorkflow = async () => {
        // 새로운 워크플로우 시작 (localStorage 초기화)
        startNewWorkflow();

        // 기존 워크플로우 목록 조회하여 고유한 이름 생성
        try {
            const existingWorkflows = await listWorkflows();
            const newWorkflowName = generateUniqueWorkflowName(existingWorkflows);
            saveWorkflowName(newWorkflowName);
        } catch (error) {
            console.warn('Failed to fetch workflows for name generation, using default');
        }

        // 캔버스 페이지로 이동
        router.push('/canvas');
    };

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
                    복잡한 데이터 파이프라인을 시각적으로 설계하고 실시간으로
                    테스트할 수 있습니다.
                </p>

                <button onClick={handleCreateWorkflow} className={styles.primaryButton}>
                    <FiPlay />
                    워크플로우 만들기
                    <FiArrowRight />
                </button>
            </div>

            {/* Features Grid */}
            <div className={styles.featuresGrid}>
                <div className={styles.featureCard}>
                    <div className={styles.featureIcon}>
                        <FiGrid />
                    </div>
                    <h3>드래그 앤 드롭 인터페이스</h3>
                    <p>
                        노드를 쉽게 연결하여 복잡한 워크플로우를 직관적으로
                        구성할 수 있습니다.
                    </p>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIcon}>
                        <FiZap />
                    </div>
                    <h3>실시간 실행 및 디버깅</h3>
                    <p>
                        구성한 워크플로우를 즉시 실행하고 각 단계별 결과를
                        확인할 수 있습니다.
                    </p>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIcon}>
                        <FiPlay />
                    </div>
                    <h3>템플릿 기반 시작</h3>
                    <p>
                        미리 구성된 템플릿으로 빠르게 시작하거나 처음부터 새로
                        만들 수 있습니다.
                    </p>
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
                            <p>
                                사이드 패널에서 필요한 노드를 캔버스로
                                드래그하세요.
                            </p>
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

            {/* Additional Information Sections for Scroll Testing */}
            <div className={styles.additionalInfo}>
                <h3>고급 기능</h3>
                <div className={styles.infoGrid}>
                    <div className={styles.infoCard}>
                        <h4>조건부 실행</h4>
                        <p>
                            특정 조건에 따라 워크플로우의 실행 경로를 분기할 수
                            있습니다. if-else 로직을 시각적으로 구성하여 복잡한
                            비즈니스 로직을 처리하세요.
                        </p>
                    </div>

                    <div className={styles.infoCard}>
                        <h4>병렬 처리</h4>
                        <p>
                            여러 노드를 동시에 실행하여 처리 성능을 향상시킬 수
                            있습니다. 대용량 데이터 처리나 복잡한 AI 모델 추론에
                            유용합니다.
                        </p>
                    </div>

                    <div className={styles.infoCard}>
                        <h4>오류 처리</h4>
                        <p>
                            워크플로우 실행 중 발생할 수 있는 오류를 미리
                            정의하고 처리할 수 있습니다. 안정적인 서비스 운영을
                            위한 필수 기능입니다.
                        </p>
                    </div>
                </div>
            </div>

            <div className={styles.additionalInfo}>
                <h3>지원되는 노드 유형</h3>
                <div className={styles.nodeTypes}>
                    <div className={styles.nodeCategory}>
                        <h4>데이터 입력</h4>
                        <ul>
                            <li>파일 업로드</li>
                            <li>API 호출</li>
                            <li>데이터베이스 연결</li>
                            <li>웹 스크래핑</li>
                        </ul>
                    </div>

                    <div className={styles.nodeCategory}>
                        <h4>데이터 처리</h4>
                        <ul>
                            <li>텍스트 전처리</li>
                            <li>이미지 변환</li>
                            <li>데이터 필터링</li>
                            <li>형식 변환</li>
                        </ul>
                    </div>

                    <div className={styles.nodeCategory}>
                        <h4>AI 모델</h4>
                        <ul>
                            <li>자연어 처리</li>
                            <li>이미지 분석</li>
                            <li>음성 인식</li>
                            <li>추천 시스템</li>
                        </ul>
                    </div>

                    <div className={styles.nodeCategory}>
                        <h4>데이터 출력</h4>
                        <ul>
                            <li>파일 저장</li>
                            <li>이메일 발송</li>
                            <li>알림 전송</li>
                            <li>대시보드 연동</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className={styles.additionalInfo}>
                <h3>성능 최적화 팁</h3>
                <div className={styles.tipsList}>
                    <div className={styles.tip}>
                        <h4>💡 메모리 효율성</h4>
                        <p>
                            대용량 데이터를 처리할 때는 스트리밍 방식을 사용하여
                            메모리 사용량을 최적화하세요.
                        </p>
                    </div>

                    <div className={styles.tip}>
                        <h4>⚡ 캐싱 활용</h4>
                        <p>
                            반복적으로 사용되는 데이터는 캐싱을 통해 처리 속도를
                            향상시킬 수 있습니다.
                        </p>
                    </div>

                    <div className={styles.tip}>
                        <h4>🔄 배치 처리</h4>
                        <p>
                            개별 요청보다는 배치 단위로 처리하여 전체적인
                            처리량을 증가시키세요.
                        </p>
                    </div>

                    <div className={styles.tip}>
                        <h4>📊 모니터링</h4>
                        <p>
                            실시간 모니터링을 통해 병목 지점을 파악하고 성능을
                            개선하세요.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CanvasIntroduction;
