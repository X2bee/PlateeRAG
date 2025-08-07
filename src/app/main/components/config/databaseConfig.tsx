import React from 'react';
import BaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/main/components/config/baseConfigPanel';

interface DatabaseConfigProps {
    configData?: ConfigItem[];
    onTestConnection?: (category: string) => void;
}

// Database 관련 설정 필드의 메타데이터 정의
const DATABASE_CONFIG_FIELDS: Record<string, FieldConfig> = {
    DATABASE_TYPE: {
        label: '데이터베이스 타입',
        type: 'select',
        options: [
            { value: 'postgresql', label: 'PostgreSQL' },
            { value: 'sqlite', label: 'SQLite' },
            { value: 'mysql', label: 'MySQL' },
            { value: 'mongodb', label: 'MongoDB' },
        ],
        description: '사용할 데이터베이스 타입을 선택하세요.',
        required: true,
    },
    POSTGRES_HOST: {
        label: 'PostgreSQL 호스트',
        type: 'text',
        placeholder: 'localhost',
        description: 'PostgreSQL 서버의 호스트 주소를 입력하세요.',
        required: false,
    },
    POSTGRES_PORT: {
        label: 'PostgreSQL 포트',
        type: 'number',
        min: 1,
        max: 65535,
        placeholder: '5432',
        description: 'PostgreSQL 서버의 포트 번호를 입력하세요. (기본값: 5432)',
        required: false,
    },
    POSTGRES_DB: {
        label: '데이터베이스 이름',
        type: 'text',
        placeholder: 'plateerag',
        description: '연결할 PostgreSQL 데이터베이스 이름을 입력하세요.',
        required: false,
    },
    POSTGRES_USER: {
        label: '사용자명',
        type: 'text',
        placeholder: 'username',
        description: 'PostgreSQL 데이터베이스 사용자명을 입력하세요.',
        required: false,
    },
    POSTGRES_PASSWORD: {
        label: '비밀번호',
        type: 'password',
        placeholder: 'password',
        description:
            'PostgreSQL 데이터베이스 비밀번호를 입력하세요. 안전하게 암호화되어 저장됩니다.',
        required: false,
    },
    SQLITE_PATH: {
        label: 'SQLite 파일 경로',
        type: 'text',
        placeholder: 'constants/config.db',
        description: 'SQLite 데이터베이스 파일의 경로를 입력하세요.',
        required: false,
    },
    AUTO_MIGRATION: {
        label: '자동 마이그레이션',
        type: 'boolean',
        description:
            '데이터베이스 스키마 변경 시 자동으로 마이그레이션을 실행할지 설정합니다.',
        required: false,
    },
};

const DatabaseConfig: React.FC<DatabaseConfigProps> = ({
    configData = [],
    onTestConnection,
}) => {
    return (
        <BaseConfigPanel
            configData={configData}
            fieldConfigs={DATABASE_CONFIG_FIELDS}
            filterPrefix="database"
            onTestConnection={onTestConnection}
            testConnectionLabel="데이터베이스 연결 테스트"
            testConnectionCategory="database"
        />
    );
};

export default DatabaseConfig;
