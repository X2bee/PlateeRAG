"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/app/(auth)/signup/SignupPage.module.scss';
import { signup } from '@/app/api/authAPI';
import { showSuccessToastKo } from '@/app/_common/utils/toastUtilsKo';
import ReverseAuthGuard from '@/app/_common/components/authGuard/ReverseAuthGuard';

const SignupPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [fullName, setFullName] = useState('');
    const [mobilePhoneNumber, setMobilePhoneNumber] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (password !== passwordConfirm) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (!email || !username || !password) {
            setError('모든 필수 항목을 입력해주세요.');
            return;
        }

        setIsLoading(true);

        try {
            const signupData = {
                username,
                email,
                password,
                full_name: fullName || undefined,
                mobile_phone_number: mobilePhoneNumber || undefined
            };

            await signup(signupData);

            showSuccessToastKo('회원가입 신청이 완료되었습니다. 관리자 승인을 기다려주십시오.');
            router.push('/');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.signupPage}>
            <div className={styles.signupBox}>
                <h1 className={styles.title}>회원가입</h1>

                <form onSubmit={handleSubmit} className={styles.signupForm}>
                    <div className={styles.formRow}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="username">사용자명</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email">이메일 (로그인에 사용됩니다)</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="password">비밀번호</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="passwordConfirm">비밀번호 확인</label>
                            <input
                                type="password"
                                id="passwordConfirm"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="fullName">이름 (선택사항)</label>
                            <input
                                type="text"
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="mobilePhoneNumber">휴대폰 번호 (선택사항)</label>
                            <input
                                type="tel"
                                id="mobilePhoneNumber"
                                value={mobilePhoneNumber}
                                onChange={(e) => setMobilePhoneNumber(e.target.value)}
                                placeholder="010-1234-5678"
                            />
                        </div>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" className={styles.signupButton} disabled={isLoading}>
                        {isLoading ? '가입 처리 중...' : '가입하기'}
                    </button>
                </form>

                <div className={styles.links}>
                    <Link href="/login">이미 계정이 있으신가요? 로그인</Link>
                </div>
            </div>
        </div>
    );
};

// ReverseAuthGuard로 감싸서 내보내기
export default function Page() {
    return (
        <ReverseAuthGuard>
            <SignupPage />
        </ReverseAuthGuard>
    );
}
