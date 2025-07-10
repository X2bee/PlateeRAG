const isDev = process.env.NODE_ENV === 'development';

export const devLog = {
    log: (...args: any[]) => {
        if (isDev) console.log(...args);
    },
    error: (...args: any[]) => {
        if (isDev) console.error(...args);
    },
    warn: (...args: any[]) => {
        if (isDev) console.warn(...args);
    },
    info: (...args: any[]) => {
        if (isDev) console.info(...args);
    }
};

export const prodLog = {
    error: (...args: any[]) => console.error(...args),
    warn: (...args: any[]) => console.warn(...args)
};
