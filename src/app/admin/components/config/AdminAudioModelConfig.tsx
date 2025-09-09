import React, { useState } from 'react';
import { FiMic, FiVolumeX } from 'react-icons/fi';
import AdminSTTConfig from '@/app/admin/components/config/AdminSTTConfig';
import AdminTTSConfig from '@/app/admin/components/config/AdminTTSConfig';
import styles from '@/app/admin/assets/settings/AdminSettings.module.scss';
interface AdminAudioModelConfigProps {
    configData?: ConfigItem[];
    onTestConnection?: (category: string) => void;
}

interface ConfigItem {
    env_name: string;
    config_path: string;
    current_value: any;
    default_value: any;
    is_saved: boolean;
}

const AdminAudioModelConfig: React.FC<AdminAudioModelConfigProps> = ({
    configData = [],
    onTestConnection,
}) => {
    const [activeTab, setActiveTab] = useState<'stt' | 'tts'>('stt');

    const renderSTTTab = () => (
        <AdminSTTConfig
            configData={configData}
            onConfigUpdate={async () => {
                // 필요시 설정 업데이트 로직 추가
            }}
        />
    );

    const renderTTSTab = () => (
        <AdminTTSConfig
            configData={configData}
            onConfigUpdate={async () => {
                // 필요시 설정 업데이트 로직 추가
            }}
        />
    );

    return (
        <div className={styles.audioModelContainer}>
            {/* 탭 네비게이션 */}
            <div className={styles.tabNavigation}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'stt' ? styles.active : ''}`}
                    onClick={() => setActiveTab('stt')}
                >
                    <FiMic />
                    Speech to Text
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'tts' ? styles.active : ''}`}
                    onClick={() => setActiveTab('tts')}
                >
                    <FiVolumeX />
                    Text to Speech
                </button>
            </div>

            {/* 탭 콘텐츠 */}
            <div className={styles.tabContent}>
                {activeTab === 'stt' && renderSTTTab()}
                {activeTab === 'tts' && renderTTSTab()}
            </div>
        </div>
    );
};

export default AdminAudioModelConfig;
