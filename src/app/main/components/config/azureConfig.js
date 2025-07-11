import React from 'react';
import styles from '@/app/main/assets/Settings.module.scss';

const AzureConfig = ({ config, onConfigChange, onTestConnection }) => {
    const handleChange = (field, value) => {
        onConfigChange('azure', field, value);
    };

    const handleTest = () => {
        onTestConnection('azure');
    };

    return (
        <div className={styles.configForm}>
            <div className={styles.formGroup}>
                <label>API Key</label>
                <input
                    type="password"
                    value={config.apiKey || ""}
                    onChange={(e) => handleChange("apiKey", e.target.value)}
                    placeholder="Azure OpenAI API Key"
                />
            </div>
            <div className={styles.formGroup}>
                <label>엔드포인트</label>
                <input
                    type="url"
                    value={config.endpoint || ""}
                    onChange={(e) => handleChange("endpoint", e.target.value)}
                    placeholder="https://your-resource.openai.azure.com/"
                />
            </div>
            <div className={styles.formGroup}>
                <label>API 버전</label>
                <select
                    value={config.apiVersion || "2024-02-01"}
                    onChange={(e) => handleChange("apiVersion", e.target.value)}
                >
                    <option value="2024-02-01">2024-02-01</option>
                    <option value="2023-12-01-preview">2023-12-01-preview</option>
                    <option value="2023-10-01-preview">2023-10-01-preview</option>
                    <option value="2023-07-01-preview">2023-07-01-preview</option>
                </select>
            </div>
            <div className={styles.formGroup}>
                <label>배포 이름</label>
                <input
                    type="text"
                    value={config.deploymentName || ""}
                    onChange={(e) => handleChange("deploymentName", e.target.value)}
                    placeholder="gpt-4-deployment"
                />
            </div>
            <div className={styles.formGroup}>
                <label>모델</label>
                <select
                    value={config.model || "gpt-4"}
                    onChange={(e) => handleChange("model", e.target.value)}
                >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-32k">GPT-4 32K</option>
                    <option value="gpt-35-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-35-turbo-16k">GPT-3.5 Turbo 16K</option>
                    <option value="text-embedding-ada-002">Text Embedding Ada 002</option>
                </select>
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
            </div>
            <div className={styles.formGroup}>
                <label>Max Tokens</label>
                <input
                    type="number"
                    value={config.maxTokens || 4096}
                    onChange={(e) => handleChange("maxTokens", parseInt(e.target.value))}
                />
            </div>
            <div className={styles.formGroup}>
                <label>리소스 그룹 (선택사항)</label>
                <input
                    type="text"
                    value={config.resourceGroup || ""}
                    onChange={(e) => handleChange("resourceGroup", e.target.value)}
                    placeholder="my-resource-group"
                />
            </div>
        </div>
    );
};

export default AzureConfig;
