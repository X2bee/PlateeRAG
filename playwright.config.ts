import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './e2e',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 4 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        ['html'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ...(process.env.CI ? [['github']] : []),
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',

        /* Take screenshot on failure */
        screenshot: 'only-on-failure',

        /* Record video on first retry */
        video: 'retain-on-failure',

        /* Global timeout for each test */
        actionTimeout: 10000,
        navigationTimeout: 30000,
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'setup',
            testMatch: '**/global.setup.ts',
            teardown: 'cleanup',
        },
        {
            name: 'cleanup',
            testMatch: '**/global.teardown.ts',
        },

        // Desktop browsers
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
            },
            dependencies: ['setup'],
        },
        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                viewport: { width: 1920, height: 1080 },
            },
            dependencies: ['setup'],
        },
        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari'],
                viewport: { width: 1920, height: 1080 },
            },
            dependencies: ['setup'],
        },

        // Mobile browsers
        {
            name: 'mobile',
            use: {
                ...devices[process.env.DEVICE_NAME || 'iPhone 14'],
            },
            dependencies: ['setup'],
            testMatch: '**/*mobile*.spec.ts',
        },

        // High DPI
        {
            name: 'high-dpi',
            use: {
                ...devices['Desktop Chrome HiDPI'],
            },
            dependencies: ['setup'],
            testMatch: '**/*visual*.spec.ts',
        },
    ],

    /* Folder for test artifacts such as screenshots, videos, traces, etc. */
    outputDir: 'test-results/',

    /* Global setup and teardown */
    globalSetup: require.resolve('./e2e/global.setup.ts'),
    globalTeardown: require.resolve('./e2e/global.teardown.ts'),

    /* Expect timeout */
    expect: {
        timeout: 10000,
    },

    /* Web server configuration */
    webServer: process.env.CI
        ? undefined
        : {
              command: 'npm run dev',
              port: 3000,
              reuseExistingServer: !process.env.CI,
              timeout: 120000,
          },
});
