"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './LoginPage.module.scss';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('로그인 시도:', { email, password });
    alert(`이메일: ${email}\n비밀번호: ${password}\n로그인을 시도합니다.`);
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

          <button type="submit" className={styles.loginButton}>
            로그인
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/forgot-password" replace>비밀번호를 잊으셨나요?</Link>
          <Link href="/signup" replace>회원가입</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
