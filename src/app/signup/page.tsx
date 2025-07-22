"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './SignupPage.module.scss';
import { registerUser } from '../api/userAPI';

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
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

    setIsLoading(true);

    try {
      const userData = { username, userId, password };
      // 2. API 호출 로직이 단순한 함수 호출로 변경되었습니다.
      await registerUser(userData); 
      
      alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      router.push('/login');

    } catch (err: any) {
      // 3. API 함수에서 던져진 에러를 여기서 잡아 UI에 표시합니다.
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
          <div className={styles.inputGroup}>
            <label htmlFor="username">이름</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="userId">아이디</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
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

export default SignupPage;