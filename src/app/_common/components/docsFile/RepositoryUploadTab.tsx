'use client';
import React, { useState, useRef, useEffect } from 'react';
import styles from '@/app/_common/assets/DocumentFileModal.module.scss';
import { getRepositoryBranches, uploadRepository, getUploadProgress, cancelUploadTask } from '@/app/_common/api/rag/retrievalAPI';

interface Branch {
    name: string;
    default: boolean;
    protected: boolean;
}

interface UploadProgress {
    fileName: string;
    status: 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
    currentStep?: string;
    currentFile?: string;
    processedFiles?: number;
    totalFiles?: number;
    completedAt?: number;  // 완료 시간 타임스탬프
}

interface RepositoryUploadTabProps {
    selectedCollection: any;
    currentFolder: any;
    chunkSize: number;
    overlapSize: number;
    onUploadStart: (repositoryName?: string) => void;
    onUploadProgress: (progress: UploadProgress) => void;
    onUploadComplete: () => void;
    onError: (error: string) => void;
}

const RepositoryUploadTab: React.FC<RepositoryUploadTabProps> = ({
    selectedCollection,
    currentFolder,
    chunkSize,
    overlapSize,
    onUploadStart,
    onUploadProgress,
    onUploadComplete,
    onError
}) => {
    const [gitlabUrl, setGitlabUrl] = useState('https://gitlab.com');
    const [gitlabToken, setGitlabToken] = useState('');
    const [repositoryPath, setRepositoryPath] = useState('');
    const [branch, setBranch] = useState('main');
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [enableAnnotation, setEnableAnnotation] = useState(false);
    const [enableApiExtraction, setEnableApiExtraction] = useState(false);
    const [enableSubmodules, setEnableSubmodules] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Progress polling
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentTaskIdRef = useRef<string | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    // Progress polling function
    const startProgressPolling = (taskId: string, repoName: string, branch: string) => {
        currentTaskIdRef.current = taskId;

        // Poll every second
        pollIntervalRef.current = setInterval(async () => {
            try {
                const progressData = await getUploadProgress(taskId) as any;

                // 디버깅: 진행 상태 출력
                console.log('📊 Progress data received:', {
                    status: progressData.status,
                    progress: progressData.progress,
                    current_step: progressData.current_step,
                    processed_files: progressData.processed_files,
                    total_files: progressData.total_files
                });

                // Update progress
                const status = progressData.status === 'completed' ? 'success'
                             : progressData.status === 'error' ? 'error'
                             : 'uploading';

                onUploadProgress({
                    fileName: `${repoName} (${branch})`,
                    status,
                    progress: progressData.progress || 0,
                    error: progressData.error,
                    currentStep: progressData.current_step,
                    currentFile: progressData.current_file,
                    processedFiles: progressData.processed_files,
                    totalFiles: progressData.total_files,
                    completedAt: (status === 'success' || status === 'error') ? Date.now() : undefined
                });

                // Stop polling if completed or error
                if (progressData.status === 'completed' || progressData.status === 'error') {
                    console.log('✅ Upload finished, stopping polling. Status:', progressData.status);
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    currentTaskIdRef.current = null;

                    if (progressData.status === 'completed') {
                        setTimeout(() => {
                            onUploadComplete();
                        }, 500);
                    } else if (progressData.status === 'error') {
                        onError(`업로드 실패: ${progressData.error || '알 수 없는 오류'}`);
                    }

                    setUploading(false);
                }
            } catch (error) {
                console.error('Progress polling error:', error);
                // Continue polling even on error (might be temporary network issue)
            }
        }, 1000); // Poll every 1 second
    };

    // Stop progress polling
    const stopProgressPolling = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        currentTaskIdRef.current = null;
    };

    // Cancel upload
    const handleCancelUpload = async () => {
        if (!currentTaskIdRef.current) {
            console.log('No task to cancel');
            return;
        }

        try {
            console.log('Cancelling upload task:', currentTaskIdRef.current);
            await cancelUploadTask(currentTaskIdRef.current);

            // Stop polling
            stopProgressPolling();

            // Update UI
            setUploading(false);
            onError('업로드가 취소되었습니다');
        } catch (error) {
            console.error('Failed to cancel upload:', error);
            onError('업로드 취소에 실패했습니다');
        }
    };

    // 브랜치 목록 조회
    const handleFetchBranches = async () => {
        if (!gitlabUrl || !gitlabToken || !repositoryPath) {
            onError('GitLab URL, Token, Repository Path를 모두 입력해주세요.');
            return;
        }

        setLoadingBranches(true);
        setBranches([]);

        try {
            const fetchedBranches = await getRepositoryBranches(gitlabUrl, gitlabToken, repositoryPath);
            setBranches(fetchedBranches);

            // 기본 브랜치가 있으면 자동 선택
            const defaultBranch = fetchedBranches.find(b => b.default);
            if (defaultBranch) {
                setBranch(defaultBranch.name);
            } else if (fetchedBranches.length > 0) {
                setBranch(fetchedBranches[0].name);
            }

            onError(''); // 에러 초기화
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '브랜치 목록 조회 실패';
            onError(`브랜치 조회 실패: ${errorMessage}\n\nGitLab URL, Token, Repository Path를 확인해주세요.`);
            console.error('Failed to fetch branches:', error);
        } finally {
            setLoadingBranches(false);
        }
    };

    // 레포지토리 업로드
    const handleRepositoryUpload = async () => {
        if (!selectedCollection) {
            onError('컬렉션을 먼저 선택해주세요.');
            return;
        }

        if (!gitlabUrl || !gitlabToken || !repositoryPath || !branch) {
            onError('모든 필드를 입력해주세요.');
            return;
        }

        setUploading(true);

        // 진행 상태 초기화
        const repoName = repositoryPath.split('/').pop() || repositoryPath;
        onUploadStart(`${repoName} (${branch})`);
        onUploadProgress({
            fileName: `${repoName} (${branch})`,
            status: 'uploading',
            progress: 0,
            currentStep: 'Starting upload...'
        });

        try {
            // 업로드 메타데이터
            const metadata = {
                upload_type: 'repository',
                directory_full_path: currentFolder?.full_path || `/${selectedCollection.collection_make_name}`,
                repository_name: repoName,
                enable_submodules: enableSubmodules
            };

            // 레포지토리 업로드 실행 (비동기로 시작)
            const result = await uploadRepository(
                gitlabUrl,
                gitlabToken,
                repositoryPath,
                branch,
                selectedCollection.collection_name,
                chunkSize,
                overlapSize,
                metadata,
                enableAnnotation,
                enableApiExtraction
            ) as any;

            // Get task_id from response and start polling
            if (result.task_id) {
                console.log('Starting progress polling for task:', result.task_id);
                startProgressPolling(result.task_id, repoName, branch);
            } else {
                // Fallback: if no task_id, assume success
                console.warn('No task_id in response, assuming immediate success');
                onUploadProgress({
                    fileName: `${repoName} (${branch})`,
                    status: 'success',
                    progress: 100
                });
                setTimeout(() => {
                    onUploadComplete();
                }, 500);
                setUploading(false);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '업로드 실패';
            onUploadProgress({
                fileName: `${repoName} (${branch})`,
                status: 'error',
                progress: 0,
                error: errorMessage
            });
            onError(`레포지토리 업로드 실패: ${errorMessage}`);
            console.error('Repository upload failed:', error);
            setUploading(false);
            stopProgressPolling();
        }
    };

    return (
        <div className={styles.repositoryTab}>
            <div className={styles.repositoryForm}>
                <div className={styles.formGroup}>
                    <label>GitLab URL</label>
                    <input
                        type="text"
                        value={gitlabUrl}
                        onChange={(e) => setGitlabUrl(e.target.value)}
                        placeholder="https://gitlab.com"
                        disabled={uploading}
                    />
                    <small className={styles.helpText}>
                        Self-hosted GitLab도 지원합니다 (예: https://gitlab.company.com)
                    </small>
                </div>

                <div className={styles.formGroup}>
                    <label>Personal Access Token</label>
                    <input
                        type="password"
                        value={gitlabToken}
                        onChange={(e) => setGitlabToken(e.target.value)}
                        placeholder="GitLab Personal Access Token"
                        disabled={uploading}
                    />
                    <small className={styles.helpText}>
                        GitLab Settings → Access Tokens에서 발급 (read_repository 권한 필요)
                    </small>
                </div>

                <div className={styles.formGroup}>
                    <label>Repository Path</label>
                    <div className={styles.inputWithButton}>
                        <input
                            type="text"
                            value={repositoryPath}
                            onChange={(e) => setRepositoryPath(e.target.value)}
                            placeholder="group/project 또는 username/project"
                            disabled={uploading}
                        />
                        <button
                            onClick={handleFetchBranches}
                            disabled={!gitlabUrl || !gitlabToken || !repositoryPath || loadingBranches || uploading}
                            className={`${styles.button} ${styles.secondary}`}
                        >
                            {loadingBranches ? '조회 중...' : '브랜치 조회'}
                        </button>
                    </div>
                    <small className={styles.helpText}>
                        레포지토리 경로 (예: mygroup/myproject)
                    </small>
                </div>

                <div className={styles.formGroup}>
                    <label>Branch</label>
                    {branches.length > 0 ? (
                        <select
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            disabled={uploading}
                            className={styles.selectInput}
                        >
                            {branches.map((b) => (
                                <option key={b.name} value={b.name}>
                                    {b.name}
                                    {b.default ? ' (기본)' : ''}
                                    {b.protected ? ' 🔒' : ''}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            placeholder="main"
                            disabled={uploading}
                        />
                    )}
                    <small className={styles.helpText}>
                        {branches.length > 0
                            ? `${branches.length}개 브랜치 조회됨`
                            : '브랜치 조회 버튼을 눌러 목록을 불러오세요'
                        }
                    </small>
                </div>

                <div className={styles.formGroup}>
                    <label>처리 옵션</label>
                    <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={enableAnnotation}
                                onChange={(e) => setEnableAnnotation(e.target.checked)}
                                disabled={uploading}
                            />
                            <span>LLM 코드 주석 자동 생성</span>
                        </label>
                        <small className={styles.helpText}>
                            GPT-4o-mini를 사용하여 코드에 주석을 자동으로 추가합니다 (처리 시간 증가)
                        </small>
                    </div>

                    <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={enableApiExtraction}
                                onChange={(e) => setEnableApiExtraction(e.target.checked)}
                                disabled={uploading}
                            />
                            <span>API 엔드포인트 자동 추출</span>
                        </label>
                        <small className={styles.helpText}>
                            Spring Boot, Express, FastAPI 등의 API 엔드포인트를 자동으로 감지합니다
                        </small>
                    </div>

                    <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={enableSubmodules}
                                onChange={(e) => setEnableSubmodules(e.target.checked)}
                                disabled={uploading}
                            />
                            <span>Git 서브모듈 포함</span>
                        </label>
                        <small className={styles.helpText}>
                            재귀적으로 서브모듈의 코드도 함께 가져옵니다 (실험적 기능)
                        </small>
                    </div>
                </div>

                <div className={styles.uploadButtonContainer}>
                    {!uploading ? (
                        <button
                            onClick={handleRepositoryUpload}
                            disabled={!gitlabUrl || !gitlabToken || !repositoryPath || !branch}
                            className={`${styles.button} ${styles.primary} ${styles.uploadButton}`}
                        >
                            📦 레포지토리 업로드
                        </button>
                    ) : (
                        <div className={styles.uploadingButtonGroup}>
                            <button
                                disabled
                                className={`${styles.button} ${styles.primary} ${styles.uploadingButton}`}
                            >
                                <span className={styles.uploadingIcon}>📤</span>
                                <span>업로드 중...</span>
                            </button>
                            <button
                                onClick={handleCancelUpload}
                                className={`${styles.button} ${styles.danger} ${styles.cancelButton}`}
                                title="업로드 취소"
                            >
                                <span>✕</span>
                                <span>취소</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.infoSection}>
                    <h4>ℹ️ 레포지토리 업로드 안내</h4>
                    <ul>
                        <li>지원 파일: Python, Java, JavaScript, TypeScript, Go, Rust 등 30+ 언어</li>
                        <li>자동 제외: node_modules, target, .git 등 빌드 아티팩트</li>
                        <li>코드 청크 사이즈: {chunkSize}자 (설정 탭에서 변경 가능)</li>
                        <li>인코딩: UTF-8, CP949, EUC-KR 등 자동 감지</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default RepositoryUploadTab;
