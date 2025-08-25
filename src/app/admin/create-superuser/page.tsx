"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/(auth)/signup/SignupPage.module.scss';
import { createSuperuser } from '@/app/admin/api/admin';

const CreateSuperuserPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
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
        full_name: fullName || undefined
      };

      await createSuperuser(signupData);

      alert('슈퍼유저가 성공적으로 생성되었습니다. 관리자 로그인 페이지로 이동합니다.');
      router.push('/admin/login-superuser');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.signupPage}>
      <div className={styles.signupBox}>
        <h1 className={styles.title}>슈퍼유저 생성</h1>
        <p style={{ marginBottom: '2rem', color: '#666', fontSize: '0.9rem' }}>
          시스템 첫 번째 관리자 계정을 생성하세요.
        </p>

        <form onSubmit={handleSubmit} className={styles.signupForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="fullName">이름 (선택사항)</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="관리자 이름을 입력하세요"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="username">사용자명</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="관리자 사용자명을 입력하세요"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="관리자 이메일을 입력하세요"
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
              placeholder="안전한 비밀번호를 입력하세요"
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
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.signupButton}
            disabled={isLoading}
            style={{ backgroundColor: '#e74c3c' }}
          >
            {isLoading ? '슈퍼유저 생성 중...' : '슈퍼유저 생성'}
          </button>
        </form>

        <div className={styles.links} style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>
            ⚠️ 이 계정은 시스템의 모든 권한을 가집니다. 신중하게 생성하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateSuperuserPage;
