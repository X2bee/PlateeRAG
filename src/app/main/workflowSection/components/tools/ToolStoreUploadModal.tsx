'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from '../../assets/ToolStoreModal.module.scss';
import { showErrorToastKo, showSuccessToastKo } from '@/app/_common/utils/toastUtilsKo';
import { devLog } from '@/app/_common/utils/logger';
import { listTools, uploadToolToStore } from '@/app/_common/api/toolsAPI';

interface ToolStoreUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface MyTool {
    id: number;
    function_id: string;
    function_name: string;
    description: string;
}

const ToolStoreUploadModal: React.FC<ToolStoreUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [myTools, setMyTools] = useState<MyTool[]>([]);
    const [loadingTools, setLoadingTools] = useState(false);

    // 폼 상태
    const [selectedToolId, setSelectedToolId] = useState<number | null>(null);
    const [selectedFunctionId, setSelectedFunctionId] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [tags, setTags] = useState<string>('');
    const [metadata, setMetadata] = useState<string>('{}');

    // 내 도구 목록 불러오기
    useEffect(() => {
        if (isOpen) {
            loadMyTools();
        }
    }, [isOpen]);

    const loadMyTools = async () => {
        try {
            setLoadingTools(true);
            const tools = await listTools();
            setMyTools(tools as MyTool[]);
            devLog.info(`Loaded ${tools.length} tools from storage`);
        } catch (error) {
            devLog.error('Failed to load my tools:', error);
            showErrorToastKo('내 도구 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoadingTools(false);
        }
    };

    // 도구 선택 시 자동으로 정보 채우기
    const handleToolSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const toolId = e.target.value;

        if (toolId) {
            const selectedTool = myTools.find(tool => tool.id === Number(toolId));
            if (selectedTool) {
                setSelectedToolId(selectedTool.id);
                setSelectedFunctionId(selectedTool.function_id);
                setDescription(selectedTool.description || '');
            }
        } else {
            setSelectedToolId(null);
            setSelectedFunctionId('');
            setDescription('');
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        if (!selectedToolId) {
            showErrorToastKo('업로드할 도구를 선택해주세요.');
            return;
        }

        try {
            setUploading(true);

            // 태그 파싱 (쉼표로 구분된 문자열을 배열로 변환)
            const tagArray = tags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            // 메타데이터 파싱
            let metadataObj = {};
            if (metadata.trim()) {
                try {
                    metadataObj = JSON.parse(metadata);
                } catch (error) {
                    showErrorToastKo('메타데이터 JSON 형식이 올바르지 않습니다.');
                    return;
                }
            }

            // 업로드 데이터 구성
            const uploadData = {
                function_upload_id: selectedToolId.toString(),
                description: description.trim(),
                tags: tagArray,
                metadata: metadataObj,
            };

            devLog.log('Uploading tool to store:', { toolId: selectedToolId, data: uploadData });

            // API 호출 - toolId (DB ID)와 uploadData 전달
            await uploadToolToStore(selectedToolId, uploadData);

            showSuccessToastKo('도구가 스토어에 성공적으로 업로드되었습니다!');

            // 폼 초기화
            setSelectedToolId(null);
            setSelectedFunctionId('');
            setDescription('');
            setTags('');
            setMetadata('{}');

            // 성공 콜백 및 모달 닫기
            onSuccess();
            onClose();
        } catch (error) {
            devLog.error('Failed to upload tool to store:', error);
            const errorMessage = error instanceof Error ? error.message : '도구 업로드에 실패했습니다.';
            showErrorToastKo(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    return createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>도구 스토어에 업로드</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <IoClose />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        {/* 도구 선택 */}
                        <div className={styles.formGroup}>
                            <label htmlFor="toolSelect" className={styles.label}>
                                업로드할 도구 선택 <span className={styles.required}>*</span>
                            </label>
                            <select
                                id="toolSelect"
                                value={selectedToolId ?? ''}
                                onChange={handleToolSelect}
                                className={styles.select}
                                disabled={loadingTools || uploading}
                            >
                                <option value="">도구를 선택하세요</option>
                                {myTools.map((tool) => (
                                    <option key={tool.id} value={tool.id}>
                                        {tool.function_name} ({tool.function_id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 설명 */}
                        <div className={styles.formGroup}>
                            <label htmlFor="description" className={styles.label}>
                                설명
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="도구에 대한 설명을 입력하세요"
                                className={styles.textarea}
                                rows={4}
                                disabled={uploading}
                            />
                        </div>

                        {/* 태그 */}
                        <div className={styles.formGroup}>
                            <label htmlFor="tags" className={styles.label}>
                                태그
                            </label>
                            <input
                                type="text"
                                id="tags"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="태그를 쉼표로 구분하여 입력하세요 (예: api, utility, search)"
                                className={styles.input}
                                disabled={uploading}
                            />
                            <small className={styles.hint}>
                                쉼표(,)로 구분하여 여러 태그를 입력할 수 있습니다.
                            </small>
                        </div>

                        {/* 메타데이터 */}
                        <div className={styles.formGroup}>
                            <label htmlFor="metadata" className={styles.label}>
                                메타데이터 (JSON)
                            </label>
                            <textarea
                                id="metadata"
                                value={metadata}
                                onChange={(e) => setMetadata(e.target.value)}
                                placeholder='{"key": "value"}'
                                className={styles.textarea}
                                rows={3}
                                disabled={uploading}
                            />
                            <small className={styles.hint}>
                                JSON 형식으로 추가 메타데이터를 입력할 수 있습니다.
                            </small>
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.cancelButton} onClick={onClose} disabled={uploading}>
                            취소
                        </button>
                        <button type="submit" className={styles.uploadButton} disabled={uploading || !selectedToolId}>
                            {uploading ? '업로드 중...' : '업로드'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ToolStoreUploadModal;
