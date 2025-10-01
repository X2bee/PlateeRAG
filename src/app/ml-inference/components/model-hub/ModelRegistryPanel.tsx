'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import styles from './ModelRegistryPanel.module.scss';
import type { ModelDetailResponse, RegisteredModel } from '../../types';
import ModelDetailModal from './ModelDetailModal';
import { useMlModelWorkspace, normalizeSchema } from '../MlModelWorkspaceContext';
import { formatStageDisplay, normalizeMlflowStage } from '../../utils/stageUtils';

interface ModelRegistryPanelProps {
    models: RegisteredModel[];
    selectedModelId: number | null;
    onSelect: (modelId: number) => void;
    onDelete?: (model: RegisteredModel) => void;
    className?: string;
    onSelectedCardChange?: (element: HTMLElement | null) => void;
}

type ViewMode = 'grouped' | 'flat';

interface RegistryGroup {
    groupKey: string;
    groupLabel: string;
    items: RegisteredModel[];
    variant: ViewMode;
    meta?: {
        isNewest?: boolean;
        versionIndex?: number;
    };
}

const formatBytes = (bytes?: number | null) => {
    if (!bytes || Number.isNaN(bytes)) {
        return '-';
    }
    const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
    if (bytes < 1024) {
        return `${formatter.format(bytes)} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${formatter.format(bytes / 1024)} KB`;
    }
    return `${formatter.format(bytes / (1024 * 1024))} MB`;
};

const formatTimestamp = (value?: string | null) => {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toLocaleString();
};

const ModelRegistryPanel: React.FC<ModelRegistryPanelProps> = ({ models, selectedModelId, onSelect, onDelete, className, onSelectedCardChange }) => {
    const {
        modelDetail,
        detailLoading,
        detailError,
        fetchModelDetail,
        openStageDialog,
    } = useMlModelWorkspace();

    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [modalSelectedModel, setModalSelectedModel] = useState<ModelDetailResponse | null>(null);
    const [columnCount, setColumnCount] = useState(2);
    const [viewMode, setViewMode] = useState<ViewMode>('grouped');
    const [searchTerm, setSearchTerm] = useState('');
    const [openVersionPickerFor, setOpenVersionPickerFor] = useState<string | null>(null);
    const registryRef = React.useRef<HTMLElement | null>(null);

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const groupedModels = useMemo<RegistryGroup[]>(() => {
        const groupMap = new Map<string, RegisteredModel[]>();

        models.forEach(model => {
            const groupKey = model.mlflow_metadata?.registered_model_name || model.model_name;
            const existing = groupMap.get(groupKey) ?? [];
            existing.push(model);
            groupMap.set(groupKey, existing);
        });

        const parseVersion = (model: RegisteredModel) => {
            const versionString = model.mlflow_metadata?.model_version ?? model.model_version ?? '';
            const parsed = Number(versionString);
            return Number.isNaN(parsed) ? null : parsed;
        };

        const getTimestamp = (model: RegisteredModel) => {
            const value = model.updated_at ?? model.created_at ?? null;
            if (!value) {
                return 0;
            }
            const time = new Date(value).getTime();
            return Number.isNaN(time) ? 0 : time;
        };

        return Array.from(groupMap.entries()).map(([groupKey, items]) => {
            const sorted = [...items].sort((a, b) => {
                const versionA = parseVersion(a);
                const versionB = parseVersion(b);

                if (versionA !== null && versionB !== null && versionA !== versionB) {
                    return versionB - versionA;
                }

                const timestampA = getTimestamp(a);
                const timestampB = getTimestamp(b);
                if (timestampA !== timestampB) {
                    return timestampB - timestampA;
                }

                return b.model_id - a.model_id;
            });

            return {
                groupKey,
                groupLabel: groupKey,
                items: sorted,
                variant: 'grouped' as const,
            } as RegistryGroup;
        });
    }, [models]);

    const flattenedGroups = useMemo<RegistryGroup[]>(() => {
        return groupedModels.flatMap(group =>
            group.items.map((item, index) => ({
                groupKey: `${group.groupKey}-${item.model_id}`,
                groupLabel: group.groupLabel,
                items: [item],
                variant: 'flat' as const,
                meta: {
                    isNewest: index === 0,
                    versionIndex: index,
                },
            } as RegistryGroup)),
        );
    }, [groupedModels]);

    const matchesFilter = useMemo(() => {
        if (!normalizedSearch) {
            return () => true;
        }
        return (model: RegisteredModel, groupLabel: string) => {
            const candidates: Array<string | null | undefined> = [
                groupLabel,
                model.model_name,
                model.model_version,
                model.framework,
                model.status,
                model.mlflow_metadata?.registered_model_name,
                model.mlflow_metadata?.additional_metadata?.stage,
                model.mlflow_metadata?.run_id,
            ];

            return candidates.some(candidate => {
                if (!candidate) {
                    return false;
                }
                return candidate.toString().toLowerCase().includes(normalizedSearch);
            });
        };
    }, [normalizedSearch]);

    const filteredGrouped = useMemo<RegistryGroup[]>(() => {
        if (!normalizedSearch) {
            return groupedModels;
        }

        return groupedModels
            .map(group => {
                const filteredItems = group.items.filter(item => matchesFilter(item, group.groupLabel));
                if (filteredItems.length === 0) {
                    return null;
                }
                return { ...group, items: filteredItems } as RegistryGroup;
            })
            .filter((group): group is RegistryGroup => Boolean(group));
    }, [groupedModels, matchesFilter, normalizedSearch]);

    const filteredFlat = useMemo<RegistryGroup[]>(() => {
        if (!normalizedSearch) {
            return flattenedGroups;
        }

        return flattenedGroups.filter(group => {
            const [item] = group.items;
            if (!item) {
                return false;
            }
            return matchesFilter(item, group.groupLabel);
        });
    }, [flattenedGroups, matchesFilter, normalizedSearch]);

    const groupsToRender = viewMode === 'grouped' ? filteredGrouped : filteredFlat;
    const filteredModelCount = viewMode === 'grouped'
        ? filteredGrouped.reduce((total, group) => total + group.items.length, 0)
        : filteredFlat.length;
    const totalModelCount = models.length;

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const handleOpenDetailModal = (modelId: number, model: RegisteredModel) => {
        setModalSelectedModel({
            ...(model as ModelDetailResponse),
            input_schema: normalizeSchema(model.input_schema ?? null),
            output_schema: normalizeSchema(model.output_schema ?? null),
        });
        if (!detailLoading && (!modelDetail || modelDetail.model_id !== modelId)) {
            fetchModelDetail(modelId, { silent: true }).catch(() => {
                /* error state handled in context */
            });
        }
        setDetailModalOpen(true);
        setOpenVersionPickerFor(null);
    };

    useEffect(() => {
        if (!isDetailModalOpen || !modelDetail || selectedModelId == null) {
            return;
        }

        if (modelDetail.model_id !== selectedModelId) {
            return;
        }

        setModalSelectedModel({
            ...modelDetail,
            input_schema: normalizeSchema(modelDetail.input_schema ?? null),
            output_schema: normalizeSchema(modelDetail.output_schema ?? null),
        });
    }, [isDetailModalOpen, modelDetail, selectedModelId]);

    useEffect(() => {
        setOpenVersionPickerFor(null);
    }, [viewMode, normalizedSearch]);

    const handleCloseDetailModal = () => {
        setDetailModalOpen(false);
        setModalSelectedModel(null);
    };

    const findActiveModel = (groupItems: RegisteredModel[]) => {
        return groupItems.find(item => item.model_id === selectedModelId) ?? groupItems[0];
    };

    useEffect(() => {
        if (!onSelectedCardChange) {
            return;
        }

        let frame = 0;
        if (selectedModelId == null) {
            frame = requestAnimationFrame(() => onSelectedCardChange(null));
            return () => cancelAnimationFrame(frame);
        }

        frame = requestAnimationFrame(() => {
            const selector = `[data-model-id="${selectedModelId}"]`;
            const element = registryRef.current?.querySelector(selector) as HTMLElement | null;
            onSelectedCardChange(element ?? null);
        });

        return () => cancelAnimationFrame(frame);
    }, [selectedModelId, viewMode, normalizedSearch, models, onSelectedCardChange]);

    if (models.length === 0) {
        return (
            <section className={styles.registryEmpty}>
                <h3>등록된 모델이 없습니다.</h3>
                <p>업로드한 모델은 이곳에 표시됩니다. 업로드 후 추론 콘솔에서 빠르게 선택할 수 있습니다.</p>
            </section>
        );
    }

    const listStyle: CSSProperties = { '--registry-columns': String(columnCount) } as CSSProperties;

    const toggleVersionPicker = (groupKey: string) => {
        setOpenVersionPickerFor(prev => (prev === groupKey ? null : groupKey));
    };

    const registryClassName = className ? `${styles.registry} ${className}` : styles.registry;

    return (
        <section ref={registryRef} className={registryClassName}>
            <header className={styles.header}>
                <div className={styles.headerRow}>
                    <div className={styles.headerTitles}>
                        <h3>모델 레지스트리</h3>
                        <p>등록된 모델과 버전을 빠르게 찾고 비교할 수 있습니다.</p>
                    </div>
                    <span className={styles.totalBadge}>총 {totalModelCount}개</span>
                </div>
                <div className={styles.controls}>
                    <div className={styles.viewToggle} role="tablist" aria-label="모델 보기 방식">
                        <button
                            type="button"
                            onClick={() => setViewMode('grouped')}
                            className={viewMode === 'grouped' ? styles.toggleButtonActive : styles.toggleButton}
                            aria-pressed={viewMode === 'grouped'}
                        >
                            그룹 보기
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('flat')}
                            className={viewMode === 'flat' ? styles.toggleButtonActive : styles.toggleButton}
                            aria-pressed={viewMode === 'flat'}
                        >
                            버전 보기
                        </button>
                    </div>
                    <div className={styles.columnControl}>
                        <label htmlFor="registry-column-count">컬럼 수</label>
                        <input
                            id="registry-column-count"
                            type="range"
                            min={1}
                            max={4}
                            step={1}
                            value={columnCount}
                            onChange={event => setColumnCount(Number(event.target.value))}
                        />
                        <span>{columnCount}</span>
                    </div>
                    <div className={styles.searchField}>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={event => setSearchTerm(event.target.value)}
                            placeholder="모델 이름, 버전, 스테이지 검색"
                            className={styles.searchInput}
                            aria-label="모델 검색"
                        />
                        {searchTerm ? (
                            <button type="button" onClick={handleClearSearch} className={styles.resetButton} aria-label="검색어 지우기">
                                지우기
                            </button>
                        ) : null}
                    </div>
                </div>
                <div className={styles.countRow}>
                    <span>총 {totalModelCount}개 중 {filteredModelCount}개 표시</span>
                    {viewMode === 'grouped' ? <span>그룹 {groupsToRender.length}개</span> : null}
                    {normalizedSearch ? (
                        <button type="button" onClick={handleClearSearch} className={styles.resetLink}>
                            검색 초기화
                        </button>
                    ) : null}
                </div>
            </header>

            {groupsToRender.length === 0 ? (
                <div className={styles.emptyState}>
                    <h4>일치하는 모델이 없습니다.</h4>
                    <p>다른 검색어를 입력하거나 검색을 초기화해보세요.</p>
                    {normalizedSearch ? (
                        <button type="button" onClick={handleClearSearch} className={styles.clearSearchButton}>
                            검색 초기화
                        </button>
                    ) : null}
                </div>
            ) : (
                <ul className={styles.list} style={listStyle}>
                    {groupsToRender.map(group => {
                        const activeModel = findActiveModel(group.items);
                        const isActiveGroup = group.items.some(item => item.model_id === selectedModelId);
                        const stage = activeModel?.mlflow_metadata?.additional_metadata?.stage ?? null;
                        const normalizedStage = normalizeMlflowStage(stage);
                        const stageLabel = formatStageDisplay(normalizedStage);
                        const flavor = activeModel?.mlflow_metadata?.load_flavor ?? null;
                        const version = activeModel?.mlflow_metadata?.model_version ?? activeModel?.model_version ?? 'latest';
                        const deleteHandler = () => {
                            if (!onDelete || !activeModel) {
                                return;
                            }
                            onDelete(activeModel);
                        };
                        const deleteDisabled = !activeModel || normalizedStage === 'Production';
                        const createdAt = formatTimestamp(activeModel?.created_at);
                        const updatedAt = formatTimestamp(activeModel?.updated_at);
                        const showVersionPicker = group.variant === 'grouped' && openVersionPickerFor === group.groupKey;

                        return (
                            <li
                                key={group.groupKey}
                                className={isActiveGroup ? styles.listItemActive : styles.listItem}
                            >
                                <div
                                    className={styles.groupCard}
                                    data-model-id={activeModel?.model_id ?? undefined}
                                >
                                    <div className={styles.groupHeader}>
                                        <div>
                                            <div className={styles.modelTitle}>
                                                <strong>{group.groupLabel}</strong>
                                                <div className={styles.titleMeta}>
                                                    <span>{group.variant === 'grouped' ? `활성 버전 ${version}` : `버전 ${version}`}</span>
                                                    {group.variant === 'grouped' ? (
                                                        <span className={styles.versionCount}>총 {group.items.length}개 버전</span>
                                                    ) : null}
                                                    {group.variant === 'flat' && group.meta?.isNewest ? (
                                                        <span className={styles.latestTag}>최신</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className={styles.modelMeta}>
                                                <span>ID {activeModel?.model_id}</span>
                                                <span>{activeModel?.framework ?? '-'}</span>
                                                <span>{formatBytes(activeModel?.file_size ?? null)}</span>
                                                {activeModel?.status ? <span className={styles.statusTag}>{activeModel.status}</span> : null}
                                                <button
                                                    type="button"
                                                    className={styles.stageTag}
                                                    data-stage={normalizedStage}
                                                    onClick={() => activeModel ? openStageDialog(activeModel) : undefined}
                                                    aria-label="MLflow 스테이지 변경"
                                                >
                                                    {stageLabel}
                                                </button>
                                            </div>
                                            {(group.groupLabel !== activeModel?.model_name || flavor) ? (
                                                <div className={styles.mlflowMeta}>
                                                    {group.groupLabel !== activeModel?.model_name ? <span>등록 모델명 {group.groupLabel}</span> : null}
                                                    {flavor ? <span>Flavor {flavor}</span> : null}
                                                </div>
                                            ) : null}
                                            {activeModel?.input_schema && activeModel.input_schema.length > 0 ? (
                                                <div className={styles.schemaChips}>
                                                    {activeModel.input_schema.slice(0, 4).map(field => (
                                                        <span key={field}>{field}</span>
                                                    ))}
                                                    {activeModel.input_schema.length > 4 ? <span>+{activeModel.input_schema.length - 4}</span> : null}
                                                </div>
                                            ) : null}
                                            {(createdAt || updatedAt) ? (
                                                <div className={styles.timestampRow}>
                                                    {createdAt ? <span>생성 {createdAt}</span> : null}
                                                    {updatedAt ? <span>업데이트 {updatedAt}</span> : null}
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className={styles.groupActions}>
                                            {isActiveGroup ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenDetailModal(activeModel!.model_id, activeModel!)}
                                                    className={styles.detailButton}
                                                >
                                                    상세 보기
                                                </button>
                                            ) : null}
                                            {onDelete ? (
                                                <button
                                                    type="button"
                                                    onClick={deleteHandler}
                                                    className={styles.deleteButton}
                                                    aria-label={`${group.groupLabel} 모델 삭제`}
                                                    disabled={deleteDisabled}
                                                    title={deleteDisabled ? 'Production 스테이지에서는 삭제 전에 스테이지를 변경해야 합니다.' : undefined}
                                                >
                                                    선택 삭제
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className={styles.versionSection}>
                                        {group.variant === 'grouped' ? (
                                            <button
                                                type="button"
                                                className={styles.versionSummary}
                                                onClick={() => onSelect(activeModel!.model_id)}
                                            >
                                                <div>
                                                    <div className={styles.versionSummaryHeader}>
                                                        <span className={styles.versionLabel}>버전 {version}</span>
                                                        {stageLabel ? <span className={styles.versionStage} data-stage={normalizedStage}>{stageLabel}</span> : null}
                                                    </div>
                                                    <div className={styles.versionSummaryMeta}>
                                                        <span className={styles.versionMetaLabel}>Run</span>
                                                        <span className={styles.versionMetaValue}>{String(activeModel?.mlflow_metadata?.run_id ?? activeModel?.model_id)}</span>
                                                    </div>
                                                    {(createdAt || updatedAt) ? (
                                                        <div className={styles.versionSummaryMeta}>
                                                            {createdAt ? <span>생성 {createdAt}</span> : null}
                                                            {updatedAt ? <span>업데이트 {updatedAt}</span> : null}
                                                        </div>
                                                    ) : null}
                                                </div>
                                                <span className={styles.versionToggleLabel}>선택</span>
                                            </button>
                                        ) : null}

                                        {group.variant === 'grouped' ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className={styles.versionToggleSecondary}
                                                    onClick={() => toggleVersionPicker(group.groupKey)}
                                                    aria-expanded={showVersionPicker}
                                                >
                                                    버전 변경
                                                </button>
                                                {showVersionPicker ? (
                                                    <div className={styles.versionPicker}>
                                                        {group.items.map(item => {
                                                            const itemVersion = item.mlflow_metadata?.model_version ?? item.model_version ?? 'latest';
                                                            const versionStage = item.mlflow_metadata?.additional_metadata?.stage ?? null;
                                                            const normalizedVersionStage = normalizeMlflowStage(versionStage);
                                                            const versionStageLabel = versionStage ? formatStageDisplay(normalizedVersionStage) : null;
                                                            const runIdentifier = String(item.mlflow_metadata?.run_id ?? item.model_id);
                                                            return (
                                                                <button
                                                                    key={item.model_id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        onSelect(item.model_id);
                                                                        setOpenVersionPickerFor(null);
                                                                    }}
                                                                    className={item.model_id === selectedModelId ? styles.versionButtonActive : styles.versionButton}
                                                                >
                                                                    <span className={styles.versionLabel}>버전 {itemVersion}</span>
                                                                    {versionStageLabel ? (
                                                                        <span className={styles.versionStage} data-stage={normalizedVersionStage}>
                                                                            {versionStageLabel}
                                                                        </span>
                                                                    ) : null}
                                                                    <span className={styles.versionMeta} title={`Run ${runIdentifier}`}>
                                                                        <span className={styles.versionMetaLabel}>Run</span>
                                                                        <span className={styles.versionMetaValue}>{runIdentifier}</span>
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : null}
                                            </>
                                        ) : (
                                            <div className={styles.versionList}>
                                                {group.items.map(item => {
                                                    const itemVersion = item.mlflow_metadata?.model_version ?? item.model_version ?? 'latest';
                                                    const versionStage = item.mlflow_metadata?.additional_metadata?.stage ?? null;
                                                    const normalizedVersionStage = normalizeMlflowStage(versionStage);
                                                    const versionStageLabel = versionStage ? formatStageDisplay(normalizedVersionStage) : null;
                                                    const runIdentifier = String(item.mlflow_metadata?.run_id ?? item.model_id);
                                                    const isActiveVersion = item.model_id === selectedModelId;
                                                    return (
                                                        <button
                                                            key={item.model_id}
                                                            type="button"
                                                            onClick={() => onSelect(item.model_id)}
                                                            className={isActiveVersion ? styles.versionButtonActive : styles.versionButton}
                                                        >
                                                            <span className={styles.versionLabel}>버전 {itemVersion}</span>
                                                            {versionStageLabel ? (
                                                                <span className={styles.versionStage} data-stage={normalizedVersionStage}>
                                                                    {versionStageLabel}
                                                                </span>
                                                            ) : null}
                                                            <span className={styles.versionMeta} title={`Run ${runIdentifier}`}>
                                                                <span className={styles.versionMetaLabel}>Run</span>
                                                                <span className={styles.versionMetaValue}>{runIdentifier}</span>
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <ModelDetailModal
                isOpen={isDetailModalOpen}
                model={modalSelectedModel}
                isLoading={detailLoading}
                errorMessage={detailError}
                onClose={handleCloseDetailModal}
                onRefetch={selectedModelId ? () => fetchModelDetail(selectedModelId) : undefined}
            />
        </section>
    );
};

export default ModelRegistryPanel;
