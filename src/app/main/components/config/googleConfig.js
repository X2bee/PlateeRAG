import React from "react";
import styles from "@/app/main/assets/Settings.module.scss";

const GoogleConfig = ({ config = {}, onConfigChange, onTestConnection }) => {
    const handleChange = (field, value) => {
        onConfigChange("google", field, value);
    };

    const handleTest = () => {
        onTestConnection("google");
    };

    return (
        <div className={styles.configForm}>
            <div className={styles.formGroup}>
                <label>API Key</label>
                <input
                    type="password"
                    value={config.apiKey || ""}
                    onChange={(e) => handleChange("apiKey", e.target.value)}
                    placeholder="AIza..."
                />
                <small>Google AI Studio 또는 Google Cloud Console에서 발급받은 API 키를 입력하세요.</small>
            </div>

            <div className={styles.formGroup}>
                <label>모델</label>
                <select
                    value={config.model || "gemini-pro"}
                    onChange={(e) => handleChange("model", e.target.value)}
                >
                    <option value="gemini-pro">Gemini Pro</option>
                    <option value="gemini-pro-vision">Gemini Pro Vision</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="text-bison">PaLM Text Bison</option>
                    <option value="chat-bison">PaLM Chat Bison</option>
                </select>
                <small>사용할 Google AI 모델을 선택하세요.</small>
            </div>

            <div className={styles.formGroup}>
                <label>Temperature (0-1)</label>
                <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.temperature || 0.7}
                    onChange={(e) => handleChange("temperature", parseFloat(e.target.value))}
                />
                <small>응답의 창의성 수준을 조절합니다.</small>
            </div>

            <div className={styles.formGroup}>
                <label>Max Tokens</label>
                <input
                    type="number"
                    min="1"
                    max="8192"
                    value={config.maxTokens || 2048}
                    onChange={(e) => handleChange("maxTokens", parseInt(e.target.value))}
                />
                <small>생성할 최대 토큰 수입니다.</small>
            </div>

            <div className={styles.formGroup}>
                <label>Endpoint (선택사항)</label>
                <input
                    type="url"
                    value={config.endpoint || ""}
                    onChange={(e) => handleChange("endpoint", e.target.value)}
                    placeholder="https://generativelanguage.googleapis.com"
                />
                <small>기본값을 사용하거나 커스텀 엔드포인트를 설정할 수 있습니다.</small>
            </div>

            <div className={styles.formGroup}>
                <label>Project ID (선택사항)</label>
                <input
                    type="text"
                    value={config.projectId || ""}
                    onChange={(e) => handleChange("projectId", e.target.value)}
                    placeholder="your-project-id"
                />
                <small>Google Cloud 프로젝트 ID를 입력하세요.</small>
            </div>
        </div>
    );
};

export default GoogleConfig;
