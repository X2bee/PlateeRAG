import React from "react";
import styles from "@/app/main/assets/Settings.module.scss";

const OpenAIConfig = ({ config = {}, onConfigChange, onTestConnection }) => {
    const handleChange = (field, value) => {
        onConfigChange("openai", field, value);
    };

    const handleTest = () => {
        onTestConnection("openai");
    };

    return (
        <div className={styles.configForm}>
            <div className={styles.formGroup}>
                <label>API Key</label>
                <input
                    type="password"
                    value={config.apiKey || ""}
                    onChange={(e) => handleChange("apiKey", e.target.value)}
                    placeholder="sk-..."
                />
                <small>OpenAI API 키를 입력하세요. API 키는 안전하게 암호화되어 저장됩니다.</small>
            </div>

            <div className={styles.formGroup}>
                <label>모델</label>
                <select
                    value={config.model || "gpt-4"}
                    onChange={(e) => handleChange("model", e.target.value)}
                >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
                <small>워크플로우에서 사용할 기본 모델을 선택하세요.</small>
            </div>

            <div className={styles.formGroup}>
                <label>Temperature (0-2)</label>
                <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature || 0.7}
                    onChange={(e) => handleChange("temperature", parseFloat(e.target.value))}
                />
                <small>0에 가까울수록 일관된 답변, 2에 가까울수록 창의적인 답변을 생성합니다.</small>
            </div>

            <div className={styles.formGroup}>
                <label>Max Tokens</label>
                <input
                    type="number"
                    min="1"
                    max="32000"
                    value={config.maxTokens || 4096}
                    onChange={(e) => handleChange("maxTokens", parseInt(e.target.value))}
                />
                <small>응답에서 생성할 최대 토큰 수입니다. (1 토큰 ≈ 4글자)</small>
            </div>

            <div className={styles.formGroup}>
                <label>Organization ID (선택사항)</label>
                <input
                    type="text"
                    value={config.organization || ""}
                    onChange={(e) => handleChange("organization", e.target.value)}
                    placeholder="org-..."
                />
                <small>OpenAI Organization에 속해 있는 경우 Organization ID를 입력하세요.</small>
            </div>
        </div>
    );
};

export default OpenAIConfig;
