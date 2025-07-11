import React from "react";
import styles from "@/app/main/assets/Settings.module.scss";

const PostgreSQLConfig = ({ config = {}, onConfigChange, onTestConnection }) => {
    const handleChange = (field, value) => {
        onConfigChange("postgresql", field, value);
    };

    const handleTest = () => {
        onTestConnection("postgresql");
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
                <small>PostgreSQL 서버의 호스트 주소를 입력하세요.</small>
            </div>

            <div className={styles.formGroup}>
                <label>포트</label>
                <input
                    type="number"
                    min="1"
                    max="65535"
                    value={config.port || 5432}
                    onChange={(e) => handleChange("port", parseInt(e.target.value))}
                />
                <small>PostgreSQL의 기본 포트는 5432입니다.</small>
            </div>

            <div className={styles.formGroup}>
                <label>데이터베이스 이름</label>
                <input
                    type="text"
                    value={config.database || ""}
                    onChange={(e) => handleChange("database", e.target.value)}
                    placeholder="database_name"
                />
                <small>연결할 데이터베이스의 이름을 입력하세요.</small>
            </div>

            <div className={styles.formGroup}>
                <label>사용자명</label>
                <input
                    type="text"
                    value={config.username || ""}
                    onChange={(e) => handleChange("username", e.target.value)}
                    placeholder="username"
                />
                <small>데이터베이스 접근 권한이 있는 사용자명을 입력하세요.</small>
            </div>

            <div className={styles.formGroup}>
                <label>비밀번호</label>
                <input
                    type="password"
                    value={config.password || ""}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="password"
                />
                <small>사용자 계정의 비밀번호를 입력하세요.</small>
            </div>

            <div className={styles.formGroup}>
                <label>SSL 모드</label>
                <select
                    value={config.sslMode || "prefer"}
                    onChange={(e) => handleChange("sslMode", e.target.value)}
                >
                    <option value="disable">Disable</option>
                    <option value="allow">Allow</option>
                    <option value="prefer">Prefer</option>
                    <option value="require">Require</option>
                    <option value="verify-ca">Verify CA</option>
                    <option value="verify-full">Verify Full</option>
                </select>
                <small>SSL 연결 모드를 선택하세요. 프로덕션 환경에서는 'require' 이상을 권장합니다.</small>
            </div>

            <div className={styles.formGroup}>
                <label>Connection Pool Size</label>
                <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.poolSize || 10}
                    onChange={(e) => handleChange("poolSize", parseInt(e.target.value))}
                />
                <small>동시 연결 풀 크기를 설정하세요.</small>
            </div>
        </div>
    );
};

export default PostgreSQLConfig;
