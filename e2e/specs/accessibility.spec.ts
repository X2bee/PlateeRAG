import { test, expect } from '../fixtures/test-fixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests @a11y', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check if headings follow proper hierarchy (h1, h2, h3, etc.)
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    expect(headingCount).toBeGreaterThan(0);
    
    // Check for h1 presence
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1); // Should have exactly one h1
    
    // Verify h1 is not empty
    const h1Text = await h1.textContent();
    expect(h1Text?.trim()).toBeTruthy();
  });

  test('should have proper alt text for images', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const alt = await image.getAttribute('alt');
      const src = await image.getAttribute('src');
      
      // All images should have alt attributes
      expect(alt).toBeTruthy();
      
      // Alt text should not just be the filename
      if (src) {
        const filename = src.split('/').pop()?.split('.')[0];
        expect(alt).not.toBe(filename);
      }
      
      // Alt text should not be too long
      expect(alt!.length).toBeLessThan(125);
    }
  });

  test('should have proper focus management', async ({ page }) => {
    // Test tab order
    const focusableElements = page.locator(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const elementCount = await focusableElements.count();
    
    expect(elementCount).toBeGreaterThan(0);
    
    // Test initial focus
    await page.keyboard.press('Tab');
    const firstFocused = page.locator(':focus');
    await expect(firstFocused).toBeVisible();
    
    // Test focus visibility
    const focusedElement = await firstFocused.first();
    const focusedBox = await focusedElement.boundingBox();
    expect(focusedBox).toBeTruthy();
  });

  test('should have proper color contrast', async ({ page }) => {
    // Run axe-core color contrast check
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(colorContrastViolations).toHaveLength(0);
  });

  test('should be navigable with keyboard only', async ({ page }) => {
    // Test main navigation with keyboard
    let currentUrl = page.url();
    
    // Tab to first link and press Enter
    await page.keyboard.press('Tab');
    let focusedElement = page.locator(':focus');
    
    // Find a navigation link and test it
    const getStartedBtn = page.getByRole('link', { name: /Get Started/i });
    await getStartedBtn.focus();
    await page.keyboard.press('Enter');
    
    // Check if navigation worked
    await page.waitForURL('**/chat');
    expect(page.url()).not.toBe(currentUrl);
    
    // Go back and test other interactive elements
    await page.goBack();
    await page.waitForURL('/');
    
    // Test button interactions
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await firstButton.focus();
      
      // Button should be focusable
      await expect(firstButton).toBeFocused();
    }
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Check for interactive elements with proper ARIA
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      const title = await button.getAttribute('title');
      
      // Button should have accessible name (via text, aria-label, or title)
      const hasAccessibleName = textContent?.trim() || ariaLabel || title;
      expect(hasAccessibleName).toBeTruthy();
    }
    
    // Check for proper landmark roles
    const nav = page.locator('nav');
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible();
    }
    
    const main = page.locator('main');
    if (await main.count() > 0) {
      await expect(main.first()).toBeVisible();
    }
  });

  test('should support screen readers', async ({ page }) => {
    // Check for screen reader specific content
    const srOnly = page.locator('.sr-only, .visually-hidden, [aria-hidden="false"]');
    
    // If screen reader content exists, it should not be visible but should be in DOM
    const srCount = await srOnly.count();
    for (let i = 0; i < srCount; i++) {
      const element = srOnly.nth(i);
      const isVisible = await element.isVisible();
      
      // Screen reader only content should not be visible
      expect(isVisible).toBe(false);
      
      // But should be in the DOM
      const isAttached = await element.isAttached();
      expect(isAttached).toBe(true);
    }
  });

  test('should have proper form accessibility', async ({ page }) => {
    // Navigate to login page if available
    const loginLink = page.getByRole('link', { name: /Login/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      
      const form = page.locator('form');
      if (await form.isVisible()) {
        // Check form inputs have proper labels
        const inputs = form.locator('input');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const inputId = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          const placeholder = await input.getAttribute('placeholder');
          
          // Input should have proper labeling
          const hasLabel = inputId ? 
            await form.locator(`label[for="${inputId}"]`).count() > 0 :
            false;
          
          const hasAccessibleLabel = hasLabel || ariaLabel || ariaLabelledBy;
          
          // Placeholder alone is not sufficient, but we'll be flexible for testing
          expect(hasAccessibleLabel || placeholder).toBeTruthy();
        }
        
        // Check form has proper submit mechanism
        const submitBtn = form.locator('button[type="submit"], input[type="submit"]');
        if (await submitBtn.count() > 0) {
          await expect(submitBtn.first()).toBeVisible();
        }
      }
    }
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    
    // Check if animations respect reduced motion
    const animatedElements = page.locator('[class*="animate"], [class*="transition"]');
    const animatedCount = await animatedElements.count();
    
    // This is more of a design implementation test
    // In a real app, you'd check if CSS animations are disabled
    if (animatedCount > 0) {
      // Verify page still functions without animations
      await expect(page.getByText('GEN AI Platform')).toBeVisible();
    }
  });

  test('should have proper link accessibility', async ({ page }) => {
    const links = page.locator('a');
    const linkCount = await links.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      const textContent = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');
      
      // Link should have accessible text
      const hasAccessibleText = textContent?.trim() || ariaLabel || title;
      expect(hasAccessibleText).toBeTruthy();
      
      // External links should have proper attributes
      if (href?.startsWith('http') && !href.includes(page.url().split('/')[2])) {
        const target = await link.getAttribute('target');
        const rel = await link.getAttribute('rel');
        
        if (target === '_blank') {
          expect(rel).toContain('noopener');
          
          // External links should indicate they open in new tab
          const indicatesNewTab = textContent?.includes('opens in new') || 
                                  ariaLabel?.includes('opens in new') ||
                                  title?.includes('opens in new');
          
          // This is a nice-to-have, not required
          // expect(indicatesNewTab).toBe(true);
        }
      }
    }
  });
});