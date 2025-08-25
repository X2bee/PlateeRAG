'use client';
import React from 'react';
import styles from '@/app/admin/assets/AdminPage.module.scss';

const LoginSuperuserPage: React.FC = () => {
    return (
        <div className={styles.container}>
            <div className={styles.contentArea}>
                <div className={styles.contentHeader}>
                    <div className={styles.headerContent}>
                        <h1>슈퍼유저 로그인</h1>
                        <p>관리자 권한으로 로그인하세요.</p>
                    </div>
                </div>
                <div>
                    <p>슈퍼유저 로그인 폼이 여기에 표시됩니다.</p>
                    <p>현재는 라우팅 테스트용 임시 페이지입니다.</p>
                </div>
            </div>
        </div>
    );
};

export default LoginSuperuserPage;
