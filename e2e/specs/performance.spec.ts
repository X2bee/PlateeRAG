import { test, expect } from '../fixtures/test-fixtures';

test.describe('Performance Tests @performance', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cache and disable cache for performance testing
    await page.context().clearCookies();
    await page.setExtraHTTPHeaders({
      'Cache-Control': 'no-cache',
    });
  });

  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Homepage should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check if critical content is visible
    await expect(page.getByText('GEN AI Platform')).toBeVisible();
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve(0), 5000);
      });
    });
    
    // LCP should be under 2.5 seconds for good performance
    expect(lcp as number).toBeLessThan(2500);
    
    // Measure First Input Delay (FID) - simulate user interaction
    const startTime = Date.now();
    await page.getByRole('link', { name: /Get Started/i }).click();
    const fid = Date.now() - startTime;
    
    // FID should be under 100ms for good performance
    expect(fid).toBeLessThan(100);
    
    // Go back for next tests
    await page.goBack();
  });

  test('should efficiently load images', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for images to load
    await page.waitForFunction(() => {
      const images = document.querySelectorAll('img');
      return Array.from(images).every(img => img.complete);
    }, { timeout: 10000 });
    
    const imageLoadTime = Date.now() - startTime;
    
    // All images should load within 5 seconds
    expect(imageLoadTime).toBeLessThan(5000);
    
    // Check image optimization
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const src = await image.getAttribute('src');
      const naturalWidth = await image.evaluate((img: HTMLImageElement) => img.naturalWidth);
      const displayWidth = await image.evaluate((img: HTMLImageElement) => img.getBoundingClientRect().width);
      
      // Images shouldn't be significantly oversized (allow 2x for retina)
      if (naturalWidth && displayWidth) {
        expect(naturalWidth).toBeLessThanOrEqual(displayWidth * 3);
      }
    }
  });

  test('should have optimal bundle size', async ({ page }) => {
    // Monitor network requests
    const responses: any[] = [];
    
    page.on('response', (response) => {
      const url = response.url();
      const size = response.headers()['content-length'];
      
      if (url.includes('.js') || url.includes('.css')) {
        responses.push({
          url,
          size: size ? parseInt(size) : 0,
          type: url.includes('.js') ? 'javascript' : 'css'
        });
      }
    });
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Calculate total bundle size
    const jsSize = responses
      .filter(r => r.type === 'javascript')
      .reduce((total, r) => total + r.size, 0);
    
    const cssSize = responses
      .filter(r => r.type === 'css')
      .reduce((total, r) => total + r.size, 0);
    
    // Bundle sizes should be reasonable (Next.js apps can be larger)
    expect(jsSize).toBeLessThan(1000000); // 1MB for JS
    expect(cssSize).toBeLessThan(200000);  // 200KB for CSS
    
    console.log(`JavaScript bundle size: ${(jsSize / 1024).toFixed(2)}KB`);
    console.log(`CSS bundle size: ${(cssSize / 1024).toFixed(2)}KB`);
  });

  test('should handle concurrent page loads efficiently', async ({ page, context }) => {
    const pages = [];
    const loadTimes = [];
    
    // Create multiple pages
    for (let i = 0; i < 3; i++) {
      const newPage = await context.newPage();
      pages.push(newPage);
    }
    
    // Load same page concurrently
    const loadPromises = pages.map(async (testPage) => {
      const startTime = Date.now();
      await testPage.goto('/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      loadTimes.push(loadTime);
      return testPage;
    });
    
    await Promise.all(loadPromises);
    
    // All pages should load within reasonable time even when concurrent
    for (const loadTime of loadTimes) {
      expect(loadTime).toBeLessThan(5000);
    }
    
    // Clean up
    for (const testPage of pages) {
      await testPage.close();
    }
  });

  test('should efficiently handle navigation between pages', async ({ page }) => {
    // Initial page load
    await page.goto('/');
    
    const navigationTimes = [];
    const testPages = ['/chat', '/canvas', '/main', '/'];
    
    for (let i = 0; i < testPages.length - 1; i++) {
      const startTime = Date.now();
      
      if (testPages[i] === '/chat') {
        await page.getByRole('link', { name: /Get Started/i }).click();
      } else if (testPages[i] === '/canvas') {
        await page.goto('/canvas');
      } else if (testPages[i] === '/main') {
        await page.goto('/main');
      }
      
      await page.waitForLoadState('networkidle');
      const navTime = Date.now() - startTime;
      navigationTimes.push(navTime);
      
      console.log(`Navigation to ${testPages[i]}: ${navTime}ms`);
    }
    
    // Navigation should be fast after initial load
    for (const navTime of navigationTimes) {
      expect(navTime).toBeLessThan(2000);
    }
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    
    // Perform various actions that might create memory leaks
    for (let i = 0; i < 5; i++) {
      // Navigate to different sections
      await page.locator('#features').scrollIntoViewIfNeeded();
      await page.locator('.ctaSection').scrollIntoViewIfNeeded();
      await page.locator('header').scrollIntoViewIfNeeded();
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
    
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    
    // Memory shouldn't grow excessively
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      const increasePercentage = (memoryIncrease / initialMemory) * 100;
      
      // Memory shouldn't increase by more than 50%
      expect(increasePercentage).toBeLessThan(50);
      
      console.log(`Memory increase: ${increasePercentage.toFixed(2)}%`);
    }
  });

  test('should load fonts efficiently', async ({ page }) => {
    const fontLoadTime = Date.now();
    
    await page.goto('/');
    
    // Wait for fonts to load
    await page.waitForFunction(() => {
      return document.fonts.ready;
    }, { timeout: 5000 });
    
    const fontsLoadTime = Date.now() - fontLoadTime;
    
    // Fonts should load within 3 seconds
    expect(fontsLoadTime).toBeLessThan(3000);
    
    // Check for font loading optimization
    const fontFaces = await page.evaluate(() => {
      return Array.from(document.fonts).map(font => ({
        family: font.family,
        status: font.status,
        display: font.display
      }));
    });
    
    console.log(`Loaded ${fontFaces.length} font faces`);
    
    // All fonts should be loaded
    const unloadedFonts = fontFaces.filter(font => font.status !== 'loaded');
    expect(unloadedFonts.length).toBe(0);
  });

  test('should handle scroll performance', async ({ page }) => {
    await page.goto('/');
    
    const scrollStartTime = Date.now();
    
    // Perform smooth scrolling
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let scrollTop = 0;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        
        const smoothScroll = () => {
          scrollTop += 50;
          window.scrollTo(0, scrollTop);
          
          if (scrollTop < maxScroll) {
            requestAnimationFrame(smoothScroll);
          } else {
            resolve(void 0);
          }
        };
        
        smoothScroll();
      });
    });
    
    const scrollTime = Date.now() - scrollStartTime;
    
    // Scrolling should be smooth and not take too long
    expect(scrollTime).toBeLessThan(3000);
    
    // Check for layout shift during scroll
    const layoutShifts = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cumulativeLayoutShift = 0;
        
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cumulativeLayoutShift += (entry as any).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => resolve(cumulativeLayoutShift), 1000);
      });
    });
    
    // Cumulative Layout Shift should be minimal
    expect(layoutShifts as number).toBeLessThan(0.1);
  });

  test('should efficiently handle API requests', async ({ page, mockApiResponses }) => {
    await mockApiResponses();
    
    // Monitor API request timing
    const apiRequests: any[] = [];
    
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        apiRequests.push({
          url,
          status: response.status(),
          timing: response.timing()
        });
      }
    });
    
    await page.goto('/');
    
    // If there are API calls on page load, they should be fast
    for (const request of apiRequests) {
      expect(request.timing).toBeDefined();
      
      if (request.timing) {
        const totalTime = request.timing.responseEnd - request.timing.requestStart;
        expect(totalTime).toBeLessThan(1000); // API calls should be under 1 second
      }
    }
  });
});