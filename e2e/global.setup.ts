import { chromium, FullConfig } from '@playwright/test';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🧪 Starting global E2E test setup...');

  // Create test data directory
  const testDataDir = path.join(__dirname, '../test-data');
  await require('fs').promises.mkdir(testDataDir, { recursive: true });

  // Create browser context for authentication setup
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    // Navigate to login page and perform authentication if needed
    const baseURL = config.webServer?.url || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    
    console.log('🌐 Checking application availability...');
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    
    // Check if app is running properly
    await page.waitForSelector('h1', { timeout: 30000 });
    
    // Store authentication state if login is needed
    // This is a placeholder - implement actual login logic if required
    const hasLoginForm = await page.locator('form').count() > 0;
    
    if (hasLoginForm && process.env.TEST_USERNAME && process.env.TEST_PASSWORD) {
      console.log('🔐 Setting up test authentication...');
      await page.fill('input[name="username"], input[type="email"]', process.env.TEST_USERNAME);
      await page.fill('input[name="password"], input[type="password"]', process.env.TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      
      // Save authentication state
      await context.storageState({ path: path.join(testDataDir, 'auth.json') });
      console.log('✅ Authentication state saved');
    }

    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;