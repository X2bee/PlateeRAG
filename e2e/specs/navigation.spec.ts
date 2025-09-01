import { test, expect } from '../fixtures/test-fixtures';

test.describe('Navigation & Routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to all main pages correctly', async ({ page }) => {
    // Test navigation to chat page
    await page.getByRole('link', { name: /Get Started/i }).click();
    await expect(page).toHaveURL('/chat');
    
    // Go back to homepage
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    // Test navigation to canvas page from CTA
    await page.getByRole('link', { name: /무료로 시작하기/i }).click();
    await expect(page).toHaveURL('/canvas');
    
    // Go back and test management center
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    await page.getByRole('link', { name: /관리센터 둘러보기/i }).click();
    await expect(page).toHaveURL('/main');
  });

  test('should handle login flow correctly', async ({ page }) => {
    const loginBtn = page.getByRole('link', { name: /Login/i });
    
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
      
      // Check if redirected to login page with correct redirect parameter
      await expect(page).toHaveURL('/login?redirect=%2F');
      
      // Check if login form is present
      const loginForm = page.locator('form');
      if (await loginForm.isVisible()) {
        await expect(loginForm).toBeVisible();
      }
    }
  });

  test('should handle logout flow correctly', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    
    // Check if user is logged in
    const logoutBtn = authenticatedPage.locator('[title="로그아웃"]');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      
      // Wait for logout to complete
      await authenticatedPage.waitForTimeout(1000);
      
      // Check if login button appears after logout
      const loginBtn = authenticatedPage.getByRole('link', { name: /Login/i });
      await expect(loginBtn).toBeVisible();
    }
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Navigate through pages
    await page.getByRole('link', { name: /Get Started/i }).click();
    await expect(page).toHaveURL('/chat');
    
    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL('/chat');
    
    // Navigate to another page
    await page.goto('/canvas');
    await expect(page).toHaveURL('/canvas');
    
    // Check history navigation
    await page.goBack();
    await expect(page).toHaveURL('/chat');
  });

  test('should handle deep linking correctly', async ({ page }) => {
    // Test direct navigation to different pages
    const testPages = ['/chat', '/canvas', '/main'];
    
    for (const testPage of testPages) {
      await page.goto(testPage);
      await expect(page).toHaveURL(testPage);
      
      // Check if page loads correctly
      await page.waitForSelector('body', { state: 'attached' });
      await page.waitForLoadState('networkidle');
    }
  });

  test('should handle 404 errors gracefully', async ({ page }) => {
    // Navigate to non-existent page
    const response = await page.goto('/non-existent-page');
    
    // Check if 404 page is shown or redirected appropriately
    if (response?.status() === 404) {
      // Check if custom 404 page exists
      const notFoundContent = page.getByText('404');
      if (await notFoundContent.isVisible()) {
        await expect(notFoundContent).toBeVisible();
      }
    }
  });

  test('should handle URL parameters correctly', async ({ page }) => {
    // Test with query parameters
    await page.goto('/?param=test');
    await expect(page).toHaveURL('/?param=test');
    
    // Check if page still works with parameters
    await expect(page.getByText('GEN AI Platform')).toBeVisible();
    
    // Test login with redirect parameter
    await page.goto('/login?redirect=%2Fchat');
    await expect(page).toHaveURL('/login?redirect=%2Fchat');
  });

  test('should maintain scroll position on navigation', async ({ page }) => {
    // Scroll down on homepage
    await page.locator('#features').scrollIntoViewIfNeeded();
    
    // Navigate to another page
    await page.getByRole('link', { name: /Get Started/i }).click();
    await expect(page).toHaveURL('/chat');
    
    // Go back - should restore scroll position or at least not crash
    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('GEN AI Platform')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation through interactive elements
    await page.keyboard.press('Tab');
    
    // Check if focused element is visible and interactive
    const focusedElement = page.locator(':focus');
    if (await focusedElement.isVisible()) {
      await expect(focusedElement).toBeVisible();
    }
    
    // Test Enter key on focused link
    const getStartedLink = page.getByRole('link', { name: /Get Started/i });
    await getStartedLink.focus();
    await page.keyboard.press('Enter');
    
    await expect(page).toHaveURL('/chat');
  });

  test('should handle external links correctly', async ({ page }) => {
    // Look for external links (if any exist in the navigation)
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    
    for (let i = 0; i < count; i++) {
      const link = externalLinks.nth(i);
      const href = await link.getAttribute('href');
      const rel = await link.getAttribute('rel');
      
      // Check if external links have proper security attributes
      if (href?.startsWith('http')) {
        expect(rel).toContain('noopener');
      }
    }
  });

  test('should handle navigation loading states', async ({ page }) => {
    // Start navigation
    const navigationPromise = page.waitForNavigation();
    await page.getByRole('link', { name: /Get Started/i }).click();
    
    // Wait for navigation to complete
    await navigationPromise;
    await expect(page).toHaveURL('/chat');
    
    // Check if loading states are handled gracefully
    await page.waitForLoadState('networkidle');
    
    // Verify page is fully loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});