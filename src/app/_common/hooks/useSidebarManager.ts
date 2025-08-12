import { useEffect, useRef } from 'react';
import { usePagesLayout } from '@/app/_common/components/PagesLayoutContent';

/**
 * 모달/팝업이 열릴 때 사이드바를 자동으로 관리하는 커스텀 훅
 * 
 * @param isModalOpen - 모달이나 팝업의 열림 상태를 나타내는 boolean 값
 * @param options - 추가 옵션 (현재는 사용하지 않지만 확장성을 위해 남겨둠)
 * 
 * @example
 * ```tsx
 * const [showModal, setShowModal] = useState(false);
 * useSidebarManager(showModal);
 * ```
 * 
 * @example
 * ```tsx
 * // 여러 모달이 있는 경우
 * const [showDeploymentModal, setShowDeploymentModal] = useState(false);
 * const [showCollectionModal, setShowCollectionModal] = useState(false);
 * const isAnyModalOpen = showDeploymentModal || showCollectionModal;
 * useSidebarManager(isAnyModalOpen);
 * ```
 */
export const useSidebarManager = (
    isModalOpen: boolean,
) => {
    const layoutContext = usePagesLayout();
    const sidebarWasOpenRef = useRef<boolean | null>(null);

    useEffect(() => {
        if (layoutContext) {
            const { isSidebarOpen, setIsSidebarOpen } = layoutContext;
            
            if (isModalOpen) {
                if (sidebarWasOpenRef.current === null) {
                    sidebarWasOpenRef.current = isSidebarOpen;
                    if (isSidebarOpen) {
                        setIsSidebarOpen(false);
                    }
                }
            } else {
                if (sidebarWasOpenRef.current === true) {
                    setIsSidebarOpen(true);
                }
                sidebarWasOpenRef.current = null;
            }
        }
    }, [isModalOpen, layoutContext]);
};

export default useSidebarManager;