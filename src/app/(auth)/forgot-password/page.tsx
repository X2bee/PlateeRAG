"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './ForgotPassword.module.scss';
// import { requestPasswordReset } from '@/app/api/userAPI'; // API 요청 함수 (아래에서 생성)
import ReverseAuthGuard from '@/app/_common/components/ReverseAuthGuard';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | undefined | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    // setIsLoading(true);

    // try {
    //   const result: ApiResponse = await requestPasswordReset({ email });
    //   setMessage(result.message);
    // } catch (err: any) {
    //   setError(err.message);
    // } finally {
    //   setIsLoading(false);
    // }
  };

  return (
    <div className={styles.forgotPasswordPage}>
      <div className={styles.formBox}>
        <h1 className={styles.title}>비밀번호 찾기</h1>
        <p className={styles.subtitle}>
          가입 시 사용한 이메일 주소를 입력하시면, 비밀번호 재설정 안내 메일을 보내드립니다.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
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

          {message && <p className={styles.successMessage}>{message}</p>}
          {error && <p className={styles.errorMessage}>{error}</p>}

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? '전송 중...' : '재설정 링크 받기'}
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/login" replace>로그인 페이지로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
};

// ReverseAuthGuard로 감싸서 내보내기
export default function Page() {
  return (
    <ReverseAuthGuard>
      <ForgotPasswordPage />
    </ReverseAuthGuard>
  );
}
