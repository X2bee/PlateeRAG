import { test, expect } from '../fixtures/test-fixtures';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display main landing page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/GEN AI Platform/);

    // Check main navigation
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('GEN AI Platform')).toBeVisible();

    // Check hero section
    await expect(page.getByText('Intelligent AI Platform')).toBeVisible();
    await expect(page.getByText('with Visual Simplicity')).toBeVisible();
    
    // Check hero description
    await expect(page.getByText('GEN AI Platform is the all-in-one AI platform')).toBeVisible();
    
    // Check hero statistics
    await expect(page.getByText('5+')).toBeVisible();
    await expect(page.getByText('AI 노드 타입')).toBeVisible();
    await expect(page.getByText('실시간')).toBeVisible();
    await expect(page.getByText('채팅 인터페이스')).toBeVisible();
    
    // Check CTA buttons
    const getStartedBtn = page.getByRole('link', { name: /Get Started/i });
    const productiveBtn = page.getByRole('link', { name: /Be More Productive with XGEN/i });
    
    await expect(getStartedBtn).toBeVisible();
    await expect(productiveBtn).toBeVisible();
  });

  test('should navigate to chat page when clicking Get Started', async ({ page }) => {
    const getStartedBtn = page.getByRole('link', { name: /Get Started/i });
    await getStartedBtn.click();
    
    await expect(page).toHaveURL('/chat');
  });

  test('should navigate to chat page when clicking main CTA', async ({ page }) => {
    const mainCTABtn = page.getByRole('link', { name: /Be More Productive with XGEN/i });
    await mainCTABtn.click();
    
    await expect(page).toHaveURL('/chat');
  });

  test('should display all feature cards', async ({ page }) => {
    // Check features section header
    await expect(page.getByText('왜 XGEN인가요?')).toBeVisible();
    
    // Check all 6 feature cards
    const featureCards = [
      '비주얼 캔버스 에디터',
      '실시간 AI 채팅',
      '스마트 관리센터',
      '고성능 실행 엔진',
      '엔터프라이즈 보안',
      '개방형 생태계'
    ];
    
    for (const feature of featureCards) {
      await expect(page.getByText(feature)).toBeVisible();
    }
  });

  test('should display footer correctly', async ({ page }) => {
    // Scroll to footer
    await page.locator('footer').scrollIntoViewIfNeeded();
    
    // Check footer content
    await expect(page.getByText('XGEN')).toBeVisible();
    await expect(page.getByText('Next Generation AI Workflow')).toBeVisible();
    await expect(page.getByText('© 2025 Plateer AI-LAB. All rights reserved.')).toBeVisible();
  });

  test('should handle authentication state correctly', async ({ page }) => {
    // Check login button when not authenticated
    const loginBtn = page.getByRole('link', { name: /Login/i });
    
    if (await loginBtn.isVisible()) {
      await expect(loginBtn).toBeVisible();
      await expect(loginBtn).toHaveAttribute('href', '/login?redirect=%2F');
    } else {
      // Check welcome message when authenticated
      const welcomeMessage = page.locator('[class*="welcomeMessage"]');
      if (await welcomeMessage.isVisible()) {
        await expect(welcomeMessage).toContainText('환영합니다');
        
        // Check logout button
        const logoutBtn = page.locator('[title="로그아웃"]');
        await expect(logoutBtn).toBeVisible();
      }
    }
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Check if navigation is still functional
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('GEN AI Platform')).toBeVisible();
    
    // Check if main content is readable
    await expect(page.getByText('Intelligent AI Platform')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    // Check layout on tablet
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('Intelligent AI Platform')).toBeVisible();
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should load images correctly', async ({ page }) => {
    // Check if logo image loads
    const logoImage = page.locator('img[src="/simbol.png"]').first();
    await expect(logoImage).toBeVisible();
    
    // Check if all images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const altText = await image.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
  });

  test('should handle scroll behavior correctly', async ({ page }) => {
    // Scroll to features section
    const featuresSection = page.locator('#features');
    await featuresSection.scrollIntoViewIfNeeded();
    
    // Check if features section is visible
    await expect(featuresSection).toBeVisible();
    
    // Scroll to CTA section
    const ctaSection = page.locator('[class*="ctaSection"]');
    await ctaSection.scrollIntoViewIfNeeded();
    
    await expect(ctaSection).toBeVisible();
    await expect(page.getByText('지금 바로 시작해보세요')).toBeVisible();
  });

  test('should have proper SEO meta tags', async ({ page }) => {
    // Check if meta description exists
    const metaDescription = page.locator('meta[name="description"]');
    if (await metaDescription.count() > 0) {
      const content = await metaDescription.getAttribute('content');
      expect(content).toBeTruthy();
    }
    
    // Check if Open Graph tags exist
    const ogTitle = page.locator('meta[property="og:title"]');
    if (await ogTitle.count() > 0) {
      const content = await ogTitle.getAttribute('content');
      expect(content).toBeTruthy();
    }
  });
});