import { useAuth } from '@/app/_common/components/CookieProvider';
import { clearAllUserData } from '@/app/_common/utils/storageUtils';
import { devLog } from '@/app/_common/utils/logger';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * 로그아웃 처리를 위한 커스텀 훅
 */
export const useLogout = () => {
    const { clearAuth } = useAuth();
    const router = useRouter();

    const handleLogout = useCallback(async (options: {
        showToast?: boolean;
        redirectTo?: string;
        clearStorage?: boolean;
        clearConfigs?: boolean;
    } = {}) => {
        const {
            showToast = true,
            redirectTo = '/login',
            clearStorage = true,
            clearConfigs = false
        } = options;

        try {
            devLog.log('Starting logout process...');

            // 인증 정보 및 localStorage 정리
            clearAuth(clearStorage);

            // 추가로 설정까지 정리가 필요한 경우
            if (clearStorage && clearConfigs) {
                const result = clearAllUserData(true); // 설정도 함께 정리
                if (result && result.success) {
                    devLog.log('All user data including configs cleared:', result.message);
                }
            }

            // 성공 메시지 표시
            if (showToast) {
                toast.success('성공적으로 로그아웃되었습니다.');
            }

            devLog.log('Logout completed, redirecting to:', redirectTo);

            // 리다이렉트
            router.push(redirectTo);

        } catch (error) {
            devLog.error('Error during logout:', error);

            if (showToast) {
                toast.error('로그아웃 처리 중 오류가 발생했습니다.');
            }

            // 오류가 발생해도 로그인 페이지로 리다이렉트
            router.push(redirectTo);
        }
    }, [clearAuth, router]);

    return { handleLogout };
};

/**
 * 빠른 로그아웃 (기본 옵션 사용)
 */
export const useQuickLogout = () => {
    const { handleLogout } = useLogout();

    const quickLogout = useCallback(() => {
        handleLogout({
            showToast: true,
            redirectTo: '/login',
            clearStorage: true,
            clearConfigs: false
        });
    }, [handleLogout]);

    return { quickLogout };
};

/**
 * 완전 로그아웃 (설정까지 모두 정리)
 */
export const useCompleteLogout = () => {
    const { handleLogout } = useLogout();

    const completeLogout = useCallback(() => {
        handleLogout({
            showToast: true,
            redirectTo: '/login',
            clearStorage: true,
            clearConfigs: true
        });
    }, [handleLogout]);

    return { completeLogout };
};

/**
 * 세션 만료 처리 (토스트 없이 조용히 로그아웃)
 */
export const useSessionExpiredLogout = () => {
    const { handleLogout } = useLogout();

    const sessionExpiredLogout = useCallback(() => {
        handleLogout({
            showToast: false,
            redirectTo: '/login?reason=session_expired',
            clearStorage: true,
            clearConfigs: false
        });
    }, [handleLogout]);

    return { sessionExpiredLogout };
};
