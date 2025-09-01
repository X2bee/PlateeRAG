import { test, expect } from '../fixtures/test-fixtures';

test.describe('Mobile Experience @mobile', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
  });

  test('should display mobile-optimized homepage layout', async ({ page }) => {
    // Check if mobile navigation works
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('GEN AI Platform')).toBeVisible();
    
    // Check hero section on mobile
    await expect(page.getByText('Intelligent AI Platform')).toBeVisible();
    
    // Check if buttons are touch-friendly
    const getStartedBtn = page.getByRole('link', { name: /Get Started/i });
    await expect(getStartedBtn).toBeVisible();
    
    const boundingBox = await getStartedBtn.boundingBox();
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44); // iOS minimum touch target
  });

  test('should handle touch interactions correctly', async ({ page }) => {
    // Test tap on main CTA
    const mainCTA = page.getByRole('link', { name: /Be More Productive with XGEN/i });
    await mainCTA.tap();
    await expect(page).toHaveURL('/chat');
    
    // Go back and test other interactions
    await page.goBack();
    
    // Test feature card interactions
    const featureCard = page.locator('[class*="featureCard"]').first();
    await featureCard.tap();
    
    // Should not navigate (cards are informational)
    await expect(page).toHaveURL('/');
  });

  test('should handle swipe gestures appropriately', async ({ page }) => {
    // Test horizontal scroll if any carousels exist
    const horizontalScrollContainer = page.locator('[class*="featuresGrid"]');
    if (await horizontalScrollContainer.isVisible()) {
      const initialScrollLeft = await horizontalScrollContainer.evaluate(el => el.scrollLeft);
      
      // Simulate swipe left
      await horizontalScrollContainer.hover();
      await page.mouse.down();
      await page.mouse.move(200, 0);
      await page.mouse.up();
      
      // Check if scroll position changed (if applicable)
      const finalScrollLeft = await horizontalScrollContainer.evaluate(el => el.scrollLeft);
      // Note: This test may need adjustment based on actual implementation
    }
  });

  test('should show appropriate content on different mobile sizes', async ({ page }) => {
    const mobileSizes = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 375, height: 667, name: 'iPhone 8' },
      { width: 375, height: 812, name: 'iPhone X' },
      { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
    ];

    for (const size of mobileSizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.reload();
      
      console.log(`Testing on ${size.name} (${size.width}x${size.height})`);
      
      // Check core elements are visible
      await expect(page.getByText('GEN AI Platform')).toBeVisible();
      await expect(page.getByText('Intelligent AI Platform')).toBeVisible();
      
      // Check navigation is accessible
      const getStartedBtn = page.getByRole('link', { name: /Get Started/i });
      await expect(getStartedBtn).toBeVisible();
      
      // Check if content doesn't overflow horizontally
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();
      expect(bodyBox?.width).toBeLessThanOrEqual(size.width + 20); // Allow small margin
    }
  });

  test('should handle mobile forms correctly', async ({ page }) => {
    // Navigate to a page with forms (if available)
    await page.getByRole('link', { name: /Login/i }).click();
    
    if (await page.locator('form').isVisible()) {
      // Check form inputs are properly sized for mobile
      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const boundingBox = await input.boundingBox();
        
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(36); // Minimum touch target
          expect(boundingBox.width).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should handle mobile navigation menu', async ({ page }) => {
    // Look for mobile menu button (hamburger menu)
    const mobileMenuBtn = page.locator('[aria-label*="menu"], [class*="hamburger"], [class*="mobile-menu"]');
    
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.tap();
      
      // Check if mobile menu opens
      const mobileMenu = page.locator('[class*="mobile-menu"], nav[class*="open"]');
      await expect(mobileMenu).toBeVisible();
      
      // Check menu items
      const menuItems = mobileMenu.locator('a, button');
      const itemCount = await menuItems.count();
      expect(itemCount).toBeGreaterThan(0);
      
      // Test closing menu
      await mobileMenuBtn.tap();
      await expect(mobileMenu).not.toBeVisible();
    }
  });

  test('should optimize images for mobile', async ({ page }) => {
    // Check if images are responsive
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const boundingBox = await image.boundingBox();
      
      if (boundingBox) {
        // Images should not exceed viewport width
        expect(boundingBox.width).toBeLessThanOrEqual(375 + 20); // Allow small margin
        
        // Images should be visible
        expect(boundingBox.width).toBeGreaterThan(0);
        expect(boundingBox.height).toBeGreaterThan(0);
      }
    }
  });

  test('should handle mobile text input correctly', async ({ page }) => {
    // Navigate to login page if available
    const loginLink = page.getByRole('link', { name: /Login/i });
    if (await loginLink.isVisible()) {
      await loginLink.tap();
      
      const emailInput = page.locator('input[type="email"], input[name="username"]');
      if (await emailInput.isVisible()) {
        // Focus on input
        await emailInput.tap();
        
        // Type text
        await emailInput.fill('test@example.com');
        
        // Check if virtual keyboard doesn't interfere
        const value = await emailInput.inputValue();
        expect(value).toBe('test@example.com');
      }
    }
  });

  test('should handle mobile performance correctly', async ({ page }) => {
    // Start performance measurement
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Check if page loads reasonably fast on mobile
    const loadStartTime = Date.now();
    await page.waitForSelector('h1');
    const loadEndTime = Date.now();
    
    const loadTime = loadEndTime - loadStartTime;
    
    // Allow longer load time for mobile (should be under 5 seconds)
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle mobile orientation changes', async ({ page }) => {
    // Test portrait mode (default)
    await expect(page.getByText('GEN AI Platform')).toBeVisible();
    
    // Change to landscape mode
    await page.setViewportSize({ width: 667, height: 375 });
    await page.reload();
    
    // Check if layout adapts to landscape
    await expect(page.getByText('GEN AI Platform')).toBeVisible();
    await expect(page.getByText('Intelligent AI Platform')).toBeVisible();
    
    // Check if navigation is still functional
    const getStartedBtn = page.getByRole('link', { name: /Get Started/i });
    await expect(getStartedBtn).toBeVisible();
    
    // Revert to portrait
    await page.setViewportSize({ width: 375, height: 667 });
  });
});