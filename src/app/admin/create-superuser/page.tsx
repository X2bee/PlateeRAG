"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/admin/assets/CreateSuperuser.module.scss';
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
    <div className={styles.createSuperuserPage}>
      {/* 좌측: 슈퍼유저 생성 폼 */}
      <div className={styles.leftSection}>
        <div className={styles.signupBox}>
          <h1 className={styles.title}>슈퍼유저 생성</h1>
          <p className={styles.subtitle}>
            시스템 첫 번째 관리자 계정을 생성하세요.<br />
            이 계정은 모든 시스템 권한을 가집니다.
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
            >
              {isLoading ? '슈퍼유저 생성 중...' : '슈퍼유저 생성'}
            </button>
          </form>

          <div className={styles.warning}>
            <span className={styles.warningIcon}>⚠️</span>
            이 계정은 시스템의 모든 권한을 가집니다. 신중하게 생성하세요.
          </div>
        </div>
      </div>

      {/* 우측: 소개 및 기능 안내 */}
      <div className={styles.rightSection}>
        <div className={styles.introContent}>
          <h1 className={styles.introTitle}>관리자 시스템</h1>
          <p className={styles.introSubtitle}>
            PlateeRAG의 모든 기능을 제어하고 관리할 수 있는 
            강력한 관리자 시스템에 오신 것을 환영합니다.
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>👥</div>
              <div className={styles.featureContent}>
                <h4>사용자 관리</h4>
                <p>시스템 사용자들의 계정과 권한을 관리하고 모니터링할 수 있습니다.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>⚙️</div>
              <div className={styles.featureContent}>
                <h4>시스템 설정</h4>
                <p>전역 환경변수와 시스템 설정을 직접 제어하고 최적화할 수 있습니다.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>📊</div>
              <div className={styles.featureContent}>
                <h4>모니터링</h4>
                <p>실시간 시스템 성능과 사용자 활동을 종합적으로 모니터링합니다.</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>🔒</div>
              <div className={styles.featureContent}>
                <h4>보안 관리</h4>
                <p>시스템 보안 정책과 접근 로그를 관리하여 안전성을 보장합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSuperuserPage;
