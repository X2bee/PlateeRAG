module.exports = {
    ci: {
        collect: {
            url: [
                'http://localhost:3000',
                'http://localhost:3000/chat',
                'http://localhost:3000/canvas',
                'http://localhost:3000/main',
            ],
            startServerCommand: 'npm start',
            startServerReadyPattern: 'ready on',
            settings: {
                chromeFlags: '--no-sandbox --disable-dev-shm-usage',
            },
        },
        assert: {
            assertions: {
                'categories:performance': ['warn', { minScore: 0.8 }],
                'categories:accessibility': ['error', { minScore: 0.9 }],
                'categories:best-practices': ['warn', { minScore: 0.8 }],
                'categories:seo': ['warn', { minScore: 0.8 }],
                'categories:pwa': 'off', // PWA not required for this project

                // Core Web Vitals
                'largest-contentful-paint': [
                    'error',
                    { maxNumericValue: 2500 },
                ],
                'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
                'total-blocking-time': ['warn', { maxNumericValue: 300 }],

                // Accessibility
                'color-contrast': 'error',
                'heading-order': 'error',
                'html-has-lang': 'error',
                'image-alt': 'error',
                label: 'error',
                'link-name': 'error',

                // Performance
                'unused-css-rules': ['warn', { maxLength: 2 }],
                'unused-javascript': ['warn', { maxLength: 2 }],
                'uses-optimized-images': 'warn',
                'uses-webp-images': 'warn',
                'uses-responsive-images': 'warn',
                'efficient-animated-content': 'warn',

                // Best Practices
                'uses-https': 'error',
                'no-vulnerable-libraries': 'error',
                charset: 'error',
                doctype: 'error',
            },
        },
        upload: {
            target: 'temporary-public-storage',
        },
        server: {
            port: 9001,
            storage: '.lighthouseci',
        },
    },
};
