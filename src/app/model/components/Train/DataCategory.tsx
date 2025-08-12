'use client';
import React, { useState } from 'react';
import styles from '@/app/model/assets/Train.module.scss';
import DataStorageModal from '@/app/model/components/Train/DataStorageModal';
import useSidebarManager from '@/app/_common/hooks/useSidebarManager';

interface DataConfig {
    dataset_load_method: string;
    train_data: string;
    train_data_dir: string;
    train_data_split: string;
    test_data: string;
    test_data_dir: string;
    test_data_split: string;
    dataset_main_column: string;
    dataset_sub_column: string;
    dataset_minor_column: string;
    dataset_last_column: string;
    train_test_split_ratio: number;
    data_filtering: boolean;
    minio_data_load_bucket: string;
}

interface DataCategoryProps {
    dataConfig: DataConfig;
    handleDataConfigChange: (key: string, value: any) => void;
}

const DataCategory: React.FC<DataCategoryProps> = ({
    dataConfig,
    handleDataConfigChange,
}) => {
    const [isTrainDataModalOpen, setIsTrainDataModalOpen] = useState(false);
    const [isTestDataModalOpen, setIsTestDataModalOpen] = useState(false);

    useSidebarManager(isTrainDataModalOpen||isTestDataModalOpen)

    const handleOpenTrainDataModal = () => {
        setIsTrainDataModalOpen(true);
    };

    const handleCloseTrainDataModal = () => {
        setIsTrainDataModalOpen(false);
    };

    const handleSelectTrainData = (datasetId: string) => {
        handleDataConfigChange('train_data', datasetId);
    };

    const handleOpenTestDataModal = () => {
        setIsTestDataModalOpen(true);
    };

    const handleCloseTestDataModal = () => {
        setIsTestDataModalOpen(false);
    };

    const handleSelectTestData = (datasetId: string) => {
        handleDataConfigChange('test_data', datasetId);
    };
    return (
        <div className={styles.configSection}>
            <div className={styles.configForm}>
                {/* 데이터 소스 선택 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>데이터 소스 선택</label>
                    </div>
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>데이터 로드 방법</label>
                        <select
                            value={dataConfig.dataset_load_method}
                            onChange={(e) => handleDataConfigChange('dataset_load_method', e.target.value)}
                            className={styles.formSelect}
                        >
                            <option value="huggingface">Huggingface</option>
                            <option value="minio">Minio</option>
                        </select>
                    </div>
                </div>

                {/* Huggingface 설정 */}
                {dataConfig.dataset_load_method === 'huggingface' && (
                    <div className={styles.formGroup}>
                        <div className={styles.configHeader}>
                            <label>Huggingface 설정</label>
                        </div>

                        {/* 훈련 데이터 row - 5:3:3 비율 */}
                        <div className={styles.formGrid} style={{ gridTemplateColumns: '5fr 3fr 3fr' }}>
                            <div className={styles.formField}>
                                <label className={`${styles.formLabel} ${styles.required}`}>훈련 데이터 (URL Path)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={dataConfig.train_data}
                                        onChange={(e) => handleDataConfigChange('train_data', e.target.value)}
                                        className={styles.formInput}
                                        placeholder="예: squad_v2"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleOpenTrainDataModal}
                                        className={`${styles.button} ${styles.secondary}`}
                                    >
                                        불러오기
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>훈련 데이터 디렉토리</label>
                                <input
                                    type="text"
                                    value={dataConfig.train_data_dir}
                                    onChange={(e) => handleDataConfigChange('train_data_dir', e.target.value)}
                                    className={styles.formInput}
                                    placeholder="데이터 디렉토리 경로"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>훈련 데이터 분할</label>
                                <input
                                    type="text"
                                    value={dataConfig.train_data_split}
                                    onChange={(e) => handleDataConfigChange('train_data_split', e.target.value)}
                                    className={styles.formInput}
                                    placeholder="train"
                                />
                            </div>
                        </div>

                        {/* 테스트 데이터 row - 5:3:3 비율 */}
                        <div className={styles.formGrid} style={{ gridTemplateColumns: '5fr 3fr 3fr' }}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>테스트 데이터 (URL Path)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={dataConfig.test_data}
                                        onChange={(e) => handleDataConfigChange('test_data', e.target.value)}
                                        className={styles.formInput}
                                        placeholder="테스트 데이터셋 경로"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleOpenTestDataModal}
                                        className={`${styles.button} ${styles.secondary}`}
                                    >
                                        불러오기
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>테스트 데이터 디렉토리</label>
                                <input
                                    type="text"
                                    value={dataConfig.test_data_dir}
                                    onChange={(e) => handleDataConfigChange('test_data_dir', e.target.value)}
                                    className={styles.formInput}
                                    placeholder="데이터 디렉토리 경로"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>테스트 데이터 분할</label>
                                <input
                                    type="text"
                                    value={dataConfig.test_data_split}
                                    onChange={(e) => handleDataConfigChange('test_data_split', e.target.value)}
                                    className={styles.formInput}
                                    placeholder="test"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Minio 설정 */}
                {dataConfig.dataset_load_method === 'minio' && (
                    <div className={styles.formGroup}>
                        <div className={styles.configHeader}>
                            <label>Minio 설정</label>
                        </div>

                        {/* 버킷 선택 - 전체 너비 */}
                        <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>데이터 로드 버킷</label>
                                <select
                                    value={dataConfig.minio_data_load_bucket}
                                    onChange={(e) => handleDataConfigChange('minio_data_load_bucket', e.target.value)}
                                    className={styles.formSelect}
                                >
                                    <option value="data">data</option>
                                    <option value="models">models</option>
                                    <option value="datasets">datasets</option>
                                </select>
                            </div>
                        </div>

                        {/* 훈련 데이터 row - 5:3:3 비율 */}
                        <div className={styles.formGrid} style={{ gridTemplateColumns: '5fr 3fr 3fr' }}>
                            <div className={styles.formField}>
                                <label className={`${styles.formLabel} ${styles.required}`}>훈련 데이터 (URL Path)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={dataConfig.train_data}
                                        onChange={(e) => handleDataConfigChange('train_data', e.target.value)}
                                        className={styles.formInput}
                                        placeholder="예: datasets/train.json"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleOpenTrainDataModal}
                                        className={`${styles.button} ${styles.secondary}`}
                                    >
                                        불러오기
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>훈련 데이터 디렉토리</label>
                                <input
                                    type="text"
                                    value={dataConfig.train_data_dir}
                                    onChange={(e) => handleDataConfigChange('train_data_dir', e.target.value)}
                                    className={styles.formInput}
                                    placeholder="데이터 디렉토리 경로"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>훈련 데이터 분할</label>
                                <input
                                    type="text"
                                    value={dataConfig.train_data_split}
                                    onChange={(e) => handleDataConfigChange('train_data_split', e.target.value)}
                                    className={styles.formInput}
                                    placeholder="train"
                                />
                            </div>
                        </div>

                        {/* 테스트 데이터 row - 5:3:3 비율 */}
                        <div className={styles.formGrid} style={{ gridTemplateColumns: '5fr 3fr 3fr' }}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>테스트 데이터 (URL Path)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={dataConfig.test_data}
                                        onChange={(e) => handleDataConfigChange('test_data', e.target.value)}
                                        className={styles.formInput}
                                        placeholder="예: datasets/test.json"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleOpenTestDataModal}
                                        className={`${styles.button} ${styles.secondary}`}
                                    >
                                        불러오기
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>테스트 데이터 디렉토리</label>
                                <input
                                    type="text"
                                    value={dataConfig.test_data_dir}
                                    onChange={(e) => handleDataConfigChange('test_data_dir', e.target.value)}
                                    className={styles.formInput}
                                    placeholder="데이터 디렉토리 경로"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>테스트 데이터 분할</label>
                                <input
                                    type="text"
                                    value={dataConfig.test_data_split}
                                    onChange={(e) => handleDataConfigChange('test_data_split', e.target.value)}
                                    className={styles.formInput}
                                    placeholder="test"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 데이터셋 열 설정 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>데이터셋 열 설정</label>
                    </div>
                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Major Column</label>
                            <input
                                type="text"
                                value={dataConfig.dataset_main_column}
                                onChange={(e) => handleDataConfigChange('dataset_main_column', e.target.value)}
                                className={styles.formInput}
                                placeholder="Major Column"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Sub Column</label>
                            <input
                                type="text"
                                value={dataConfig.dataset_sub_column}
                                onChange={(e) => handleDataConfigChange('dataset_sub_column', e.target.value)}
                                className={styles.formInput}
                                placeholder="Sub Column: Context, Answer, Etc"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>3rd Column</label>
                            <input
                                type="text"
                                value={dataConfig.dataset_minor_column}
                                onChange={(e) => handleDataConfigChange('dataset_minor_column', e.target.value)}
                                className={styles.formInput}
                                placeholder="Use for additional context"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>4th Column</label>
                            <input
                                type="text"
                                value={dataConfig.dataset_last_column}
                                onChange={(e) => handleDataConfigChange('dataset_last_column', e.target.value)}
                                className={styles.formInput}
                                placeholder="Use for additional context"
                            />
                        </div>
                    </div>
                </div>

                {/* 추가 옵션 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>추가 옵션</label>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={dataConfig.data_filtering}
                                    onChange={(e) => handleDataConfigChange('data_filtering', e.target.checked)}
                                    className={styles.checkbox}
                                />
                                데이터 필터링
                            </label>
                        </div>
                    </div>
                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>[Optional] 훈련/테스트 분할 비율 - 테스트 데이터가 없는 경우에만 선택적으로 사용</label>
                            <input
                                type="number"
                                value={dataConfig.train_test_split_ratio}
                                onChange={(e) => handleDataConfigChange('train_test_split_ratio', parseFloat(e.target.value))}
                                className={styles.formInput}
                                step="0.01"
                                min="0"
                                max="1"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Storage Modals */}
            <DataStorageModal
                isOpen={isTrainDataModalOpen}
                onClose={handleCloseTrainDataModal}
                onSelectDataset={handleSelectTrainData}
                currentDatasetId={dataConfig.train_data}
            />

            <DataStorageModal
                isOpen={isTestDataModalOpen}
                onClose={handleCloseTestDataModal}
                onSelectDataset={handleSelectTestData}
                currentDatasetId={dataConfig.test_data}
            />
        </div>
    );
};

export default DataCategory;
