import React from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCopy } from 'react-icons/fi';
import { showCopySuccessToastKo } from '@/app/_common/utils/toastUtilsKo';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/admin/assets/settings/AdminVastAiConfigModal.module.scss';

interface PortMapping {
    external_ip: string;
    external_port: number;
}

interface AdminVastAiConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    instanceId: string;
    portMappings: string | null;
}

const AdminVastAiConfigModal: React.FC<AdminVastAiConfigModalProps> = ({
    isOpen,
    onClose,
    instanceId,
    portMappings
}) => {
    if (!isOpen) return null;

    // 포트 매핑 파싱
    const parsePortMappings = (): Record<string, PortMapping> => {
        if (!portMappings) return {};

        try {
            return JSON.parse(portMappings);
        } catch (error) {
            devLog.error('Failed to parse port mappings:', error);
            return {};
        }
    };

    const mappings = parsePortMappings();
    const portKeys = Object.keys(mappings).sort((a, b) => parseInt(a) - parseInt(b));

    const handleCopyUrl = (port: string, mapping: PortMapping) => {
        const url = `http://${mapping.external_ip}:${mapping.external_port}`;
        navigator.clipboard.writeText(url);
        showCopySuccessToastKo(`포트 ${port} URL이 복사되었습니다.`);
    };

    const modalContent = (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>포트 매핑 정보</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.instanceInfo}>
                        <span className={styles.instanceLabel}>인스턴스 ID:</span>
                        <span className={styles.instanceValue}>#{instanceId}</span>
                    </div>

                    {portKeys.length === 0 ? (
                        <div className={styles.noPortMappings}>
                            포트 매핑 정보가 없습니다.
                        </div>
                    ) : (
                        <div className={styles.portMappingsList}>
                            {portKeys.map((port) => {
                                const mapping = mappings[port];
                                return (
                                    <div key={port} className={styles.portMappingItem}>
                                        <div className={styles.portInfo}>
                                            <div className={styles.portNumber}>
                                                포트 {port}
                                            </div>
                                            <div className={styles.portMapping}>
                                                {mapping.external_ip}:{mapping.external_port}
                                            </div>
                                        </div>
                                        <button
                                            className={`${styles.button} ${styles.small} ${styles.secondary}`}
                                            onClick={() => handleCopyUrl(port, mapping)}
                                        >
                                            <FiCopy className={styles.icon} />
                                            URL 복사
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AdminVastAiConfigModal;
