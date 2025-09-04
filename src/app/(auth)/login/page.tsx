"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from '@/app/(auth)/login/LoginPage.module.scss';
import { login } from '@/app/api/authAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';
import ReverseAuthGuard from '@/app/_common/components/authGuard/ReverseAuthGuard';

const LoginPage = () => {
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
            const result = await login(loginData) as any;

            // CookieProvider에 사용자 정보 설정
            if (result.user_id && result.username && result.access_token) {
                setUser({
                    user_id: result.user_id,
                    username: result.username,
                    access_token: result.access_token,
                });
            }

            // 로그인 성공
            showSuccessToastKo(`로그인 성공! 환영합니다, ${result.username}님!`);

            // 이전 페이지로 리다이렉트 (URL 파라미터 확인)
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect');

            if (redirectUrl) {
                router.replace(decodeURIComponent(redirectUrl));
            } else {
                // sessionStorage에서 이전 페이지 확인
                const previousPage = sessionStorage.getItem('previousPage');
                if (previousPage) {
                    sessionStorage.removeItem('previousPage'); // 사용 후 제거
                    router.replace(previousPage);
                } else {
                    router.replace('/');
                }
            }

        } catch (err: any) {
            setError(err.message || '로그인에 실패했습니다.');
            showErrorToastKo(err.message || '로그인에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.loginBox}>
                <h1 className={styles.title}>로그인</h1>
                <p className={styles.subtitle}>서비스를 이용하려면 로그인해 주세요.</p>

                <form onSubmit={handleSubmit} className={styles.loginForm}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">이메일</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호를 입력하세요"
                            required
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <div className={styles.buttons} >
                        <button type="submit" className={styles.loginButton} disabled={isLoading}>
                            {isLoading ? '로그인 중...' : '로그인'}
                        </button>
                    </div>
                </form>

                <div className={styles.links}>
                    <Link href="/forgot-password" replace>비밀번호를 잊으셨나요?</Link>
                    <Link href="/signup" replace>회원가입</Link>
                </div>
            </div>
        </div>
    );
};

// ReverseAuthGuard로 감싸서 내보내기
export default function Page() {
    return (
        <ReverseAuthGuard>
            <LoginPage />
        </ReverseAuthGuard>
    );
}
