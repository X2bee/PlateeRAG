import { test as base } from '@playwright/test';
import path from 'path';

// Custom test fixtures
export type TestFixtures = {
  authenticatedPage: any;
  testDataPath: string;
  mockApiResponses: () => Promise<void>;
};

export const test = base.extend<TestFixtures>({
  // Authenticated page fixture
  authenticatedPage: async ({ browser }, use) => {
    const authFile = path.join(__dirname, '../../test-data/auth.json');
    let context;
    
    try {
      context = await browser.newContext({ storageState: authFile });
    } catch {
      // Fallback to regular context if auth file doesn't exist
      context = await browser.newContext();
    }
    
    const page = await context.newPage();
    
    // Add custom page methods
    await page.addInitScript(() => {
      // Disable animations for more stable tests
      window.document.styleSheets[0]?.insertRule('*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }');
    });
    
    await use(page);
    await context.close();
  },

  // Test data path fixture
  testDataPath: async ({}, use) => {
    const dataPath = path.join(__dirname, '../../test-data');
    await use(dataPath);
  },

  // Mock API responses fixture
  mockApiResponses: async ({ page }, use) => {
    const mockResponses = async () => {
      // Mock common API endpoints
      await page.route('**/api/auth/**', async (route, request) => {
        const url = request.url();
        
        if (url.includes('/login')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              token: 'mock-jwt-token',
              user: { id: 1, username: 'testuser', email: 'test@example.com' }
            })
          });
        } else if (url.includes('/logout')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        } else {
          await route.continue();
        }
      });

      // Mock document API endpoints
      await page.route('**/api/documents/**', async (route, request) => {
        const url = request.url();
        
        if (url.includes('/fetch')) {
          // Mock PDF document response
          await route.fulfill({
            status: 200,
            contentType: 'application/pdf',
            body: Buffer.from('Mock PDF content')
          });
        } else if (url.includes('/metadata')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              file_name: 'test.pdf',
              file_size: 1024,
              page_count: 5,
              permissions: { read: true, download: true }
            })
          });
        } else {
          await route.continue();
        }
      });

      // Mock AI workflow endpoints
      await page.route('**/api/workflows/**', async (route, request) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'mock-workflow-id',
            name: 'Test Workflow',
            nodes: [],
            status: 'active'
          })
        });
      });
    };
    
    await use(mockResponses);
  },
});

export { expect } from '@playwright/test';