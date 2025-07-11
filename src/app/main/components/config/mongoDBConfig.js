import React from 'react';
import styles from '@/app/main/assets/Settings.module.scss';

const MongoDBConfig = ({ config, onConfigChange, onTestConnection }) => {
    const handleChange = (field, value) => {
        onConfigChange('mongodb', field, value);
    };

    const handleTest = () => {
        onTestConnection('mongodb');
    };

    return (
        <div className={styles.configForm}>
            <div className={styles.formGroup}>
                <label>호스트</label>
                <input
                    type="text"
                    value={config.host || ""}
                    onChange={(e) => handleChange("host", e.target.value)}
                    placeholder="localhost"
                />
            </div>
            <div className={styles.formGroup}>
                <label>포트</label>
                <input
                    type="number"
                    value={config.port || 27017}
                    onChange={(e) => handleChange("port", parseInt(e.target.value))}
                />
            </div>
            <div className={styles.formGroup}>
                <label>데이터베이스 이름</label>
                <input
                    type="text"
                    value={config.database || ""}
                    onChange={(e) => handleChange("database", e.target.value)}
                    placeholder="database_name"
                />
            </div>
            <div className={styles.formGroup}>
                <label>사용자명</label>
                <input
                    type="text"
                    value={config.username || ""}
                    onChange={(e) => handleChange("username", e.target.value)}
                    placeholder="username"
                />
            </div>
            <div className={styles.formGroup}>
                <label>비밀번호</label>
                <input
                    type="password"
                    value={config.password || ""}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="password"
                />
            </div>
            <div className={styles.formGroup}>
                <label>Connection URI (선택사항)</label>
                <input
                    type="text"
                    value={config.uri || ""}
                    onChange={(e) => handleChange("uri", e.target.value)}
                    placeholder="mongodb://username:password@host:port/database"
                />
                <small>직접 URI를 입력하면 위 설정들이 무시됩니다.</small>
            </div>
            <div className={styles.formGroup}>
                <label>인증 데이터베이스</label>
                <input
                    type="text"
                    value={config.authDatabase || "admin"}
                    onChange={(e) => handleChange("authDatabase", e.target.value)}
                    placeholder="admin"
                />
            </div>
        </div>
    );
};

export default MongoDBConfig;
