import React from 'react';
import styles from '@/app/main/assets/Settings.module.scss';

const AWSConfig = ({ config, onConfigChange, onTestConnection }) => {
    const handleChange = (field, value) => {
        onConfigChange('aws', field, value);
    };

    const handleTest = () => {
        onTestConnection('aws');
    };

    return (
        <div className={styles.configForm}>
            <div className={styles.formGroup}>
                <label>Access Key ID</label>
                <input
                    type="password"
                    value={config.accessKeyId || ""}
                    onChange={(e) => handleChange("accessKeyId", e.target.value)}
                    placeholder="AKIA..."
                />
            </div>
            <div className={styles.formGroup}>
                <label>Secret Access Key</label>
                <input
                    type="password"
                    value={config.secretAccessKey || ""}
                    onChange={(e) => handleChange("secretAccessKey", e.target.value)}
                    placeholder="Secret Access Key"
                />
            </div>
            <div className={styles.formGroup}>
                <label>리전</label>
                <select
                    value={config.region || "us-east-1"}
                    onChange={(e) => handleChange("region", e.target.value)}
                >
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="us-west-2">US West (Oregon)</option>
                    <option value="eu-west-1">Europe (Ireland)</option>
                    <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                    <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                    <option value="ap-northeast-2">Asia Pacific (Seoul)</option>
                </select>
            </div>
            <div className={styles.formGroup}>
                <label>서비스</label>
                <select
                    value={config.service || "bedrock"}
                    onChange={(e) => handleChange("service", e.target.value)}
                >
                    <option value="bedrock">AWS Bedrock</option>
                    <option value="sagemaker">SageMaker</option>
                    <option value="comprehend">Comprehend</option>
                    <option value="textract">Textract</option>
                </select>
            </div>
            <div className={styles.formGroup}>
                <label>모델 ID (Bedrock)</label>
                <select
                    value={config.modelId || "anthropic.claude-3-sonnet-20240229-v1:0"}
                    onChange={(e) => handleChange("modelId", e.target.value)}
                    disabled={config.service !== "bedrock"}
                >
                    <option value="anthropic.claude-3-sonnet-20240229-v1:0">Claude 3 Sonnet</option>
                    <option value="anthropic.claude-3-haiku-20240307-v1:0">Claude 3 Haiku</option>
                    <option value="amazon.titan-text-express-v1">Titan Text Express</option>
                    <option value="meta.llama2-70b-chat-v1">Llama 2 70B Chat</option>
                </select>
            </div>
            <div className={styles.formGroup}>
                <label>Session Token (선택사항)</label>
                <input
                    type="password"
                    value={config.sessionToken || ""}
                    onChange={(e) => handleChange("sessionToken", e.target.value)}
                    placeholder="임시 세션 토큰"
                />
            </div>
        </div>
    );
};

export default AWSConfig;
