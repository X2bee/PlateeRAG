'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from '@/app/admin/login-superuser/AdminLogin.module.scss';
import { superuserLogin } from '@/app/admin/api/users';
import { useAuth } from '@/app/_common/components/CookieProvider';

const AdminLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    // CookieProvider의 useAuth 훅 사용
    const { setUser } = useAuth();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!email || !password) {
            setError('이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        setIsLoading(true);

        try {
            const loginData = { email, password };
            const result = await superuserLogin(loginData) as any;

            // CookieProvider에 사용자 정보 설정
            if (result.user_id && result.username && result.access_token) {
                setUser({
                    user_id: result.user_id,
                    username: result.username,
                    access_token: result.access_token,
                });
            }

            // 로그인 성공
            showSuccessToastKo(`관리자 로그인 성공! 환영합니다, ${result.username}님!`);

            // 관리자 페이지로 리다이렉트
            router.replace('/admin');

        } catch (err: any) {
            setError(err.message || '관리자 로그인에 실패했습니다.');
            showErrorToastKo(err.message || '관리자 로그인에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.adminLoginPage}>
            {/* 좌측 로그인 패널 */}
            <div className={styles.loginPanel}>
                <div className={styles.loginBox}>
                    <div className={styles.header}>
                        <div className={styles.logoArea}>
                            <h1 className={styles.title}>관리자 로그인</h1>
                        </div>
                        <p className={styles.subtitle}>관리자 권한이 필요한 서비스입니다.</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.loginForm}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email">관리자 이메일</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                required
                                className={styles.adminInput}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="password">관리자 비밀번호</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="관리자 비밀번호를 입력하세요"
                                required
                                className={styles.adminInput}
                            />
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <button
                            type="submit"
                            className={styles.adminLoginButton}
                            disabled={isLoading}
                        >
                            {isLoading ? '로그인 중...' : '관리자 로그인'}
                        </button>
                    </form>
                </div>
            </div>

            {/* 우측 비주얼 패널 */}
            <div className={styles.visualPanel}>
                <div className={styles.visualContent}>
                    <h2 className={styles.visualTitle}>XGEN</h2>
                    <p className={styles.visualSubtitle}>
                        Only One LLM Platform.<br />
                        XGEN Is All You Need.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
