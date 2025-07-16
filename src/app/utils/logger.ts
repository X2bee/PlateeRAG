// 환경 변수 + 수동 제어 가능한 로거
const isDev = process.env.NODE_ENV === 'development';

// 브라우저에서 production 환경을 감지하는 함수
const isProductionEnvironment = () => {
    if (typeof window !== 'undefined') {
        // 호스트명으로 production 환경 감지
        const hostname = window.location.hostname;
        const isLocalhost =
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.');

        // localhost가 아니면 production으로 간주
        if (!isLocalhost) {
            return true;
        }

        // 추가적인 production 환경 감지 로직
        // 예: 특정 도메인 패턴, 환경 변수 등
        if (
            hostname.includes('plateerag.com') ||
            hostname.includes('prod') ||
            hostname.includes('live')
        ) {
            return true;
        }
    }

    return false;
};

// 브라우저에서 수동으로 로그를 제어할 수 있는 플래그
const getDebugEnabled = () => {
    if (typeof window !== 'undefined') {
        const debugFlag = localStorage.getItem('DEBUG_ENABLED');
        if (debugFlag !== null) {
            return debugFlag === 'true';
        }
    }

    // production 환경에서는 기본적으로 로그 비활성화
    if (isProductionEnvironment()) {
        return false;
    }

    return isDev; // 기본값은 개발 환경 여부
};

let debugEnabled = getDebugEnabled();

// 브라우저 콘솔에서 로그를 켜고 끄는 함수들을 전역으로 등록
if (typeof window !== 'undefined') {
    (window as any).enableDebugLogs = () => {
        localStorage.setItem('DEBUG_ENABLED', 'true');
        debugEnabled = true;
        console.log('✅ Debug logs enabled (manual override)');
    };

    (window as any).disableDebugLogs = () => {
        localStorage.setItem('DEBUG_ENABLED', 'false');
        debugEnabled = false;
        console.log('❌ Debug logs disabled (manual override)');
    };

    (window as any).resetDebugLogs = () => {
        localStorage.removeItem('DEBUG_ENABLED');
        debugEnabled = getDebugEnabled();
        const envInfo = isProductionEnvironment()
            ? 'production'
            : isDev
              ? 'development'
              : 'unknown';
        console.log(
            `🔄 Debug logs reset to default (${debugEnabled ? 'enabled' : 'disabled'}) - Environment: ${envInfo}`,
        );
    };

    (window as any).checkEnvironment = () => {
        const envInfo = {
            NODE_ENV: process.env.NODE_ENV,
            isDev,
            isProduction: isProductionEnvironment(),
            hostname: window.location.hostname,
            debugEnabled,
            manualOverride: localStorage.getItem('DEBUG_ENABLED'),
        };
        console.log('🌍 Environment Info:', envInfo);
        return envInfo;
    };
}

export const devLog = {
    log: (...args: any[]) => {
        if (debugEnabled) console.log(...args);
    },
    error: (...args: any[]) => {
        if (debugEnabled) console.error(...args);
    },
    warn: (...args: any[]) => {
        if (debugEnabled) console.warn(...args);
    },
    info: (...args: any[]) => {
        if (debugEnabled) console.info(...args);
    },
};

// 항상 출력되는 로거 (중요한 에러용)
export const prodLog = {
    error: (...args: any[]) => console.error(...args),
    warn: (...args: any[]) => console.warn(...args),
};
