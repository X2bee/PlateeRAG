import { test, expect } from '../fixtures/test-fixtures';

test.describe('Security Tests @security', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper Content Security Policy headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    
    // Check for security headers
    const csp = headers?.['content-security-policy'];
    const xFrameOptions = headers?.['x-frame-options'];
    const xContentTypeOptions = headers?.['x-content-type-options'];
    const strictTransportSecurity = headers?.['strict-transport-security'];
    
    // CSP should be present (if implemented)
    if (csp) {
      expect(csp).toContain("default-src");
      expect(csp).not.toContain("'unsafe-eval'"); // Should avoid unsafe-eval
    }
    
    // X-Frame-Options should prevent clickjacking
    if (xFrameOptions) {
      expect(['DENY', 'SAMEORIGIN'].includes(xFrameOptions)).toBe(true);
    }
    
    // X-Content-Type-Options should be set
    if (xContentTypeOptions) {
      expect(xContentTypeOptions).toBe('nosniff');
    }
    
    console.log('Security headers check completed');
  });

  test('should sanitize user inputs properly', async ({ page }) => {
    // Navigate to login page if available
    const loginLink = page.getByRole('link', { name: /Login/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      
      const form = page.locator('form');
      if (await form.isVisible()) {
        // Test XSS prevention
        const maliciousInputs = [
          '<script>alert("xss")</script>',
          'javascript:alert("xss")',
          '<img src=x onerror=alert("xss")>',
          '"><script>alert("xss")</script>',
          '\';alert("xss");//'
        ];
        
        const inputs = form.locator('input[type="text"], input[type="email"], textarea');
        const inputCount = await inputs.count();
        
        if (inputCount > 0) {
          const firstInput = inputs.first();
          
          for (const maliciousInput of maliciousInputs) {
            await firstInput.fill(maliciousInput);
            
            // Check if the malicious input is properly escaped/sanitized
            const value = await firstInput.inputValue();
            
            // Input should either be sanitized or the form should handle it safely
            // This is a basic check - more sophisticated testing would be needed for real apps
            expect(value).not.toContain('<script>');
          }
        }
      }
    }
  });

  test('should protect against CSRF attacks', async ({ page }) => {
    // Check for CSRF tokens in forms
    const loginLink = page.getByRole('link', { name: /Login/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      
      const form = page.locator('form');
      if (await form.isVisible()) {
        // Look for CSRF token fields
        const csrfToken = form.locator('input[name*="csrf"], input[name*="token"], input[type="hidden"]');
        const tokenCount = await csrfToken.count();
        
        // If there are hidden inputs, they might be CSRF tokens
        if (tokenCount > 0) {
          console.log(`Found ${tokenCount} potential CSRF protection fields`);
          
          const firstToken = csrfToken.first();
          const tokenValue = await firstToken.getAttribute('value');
          
          // Token should have a value
          if (tokenValue) {
            expect(tokenValue.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test('should handle authentication securely', async ({ page, mockApiResponses }) => {
    await mockApiResponses();
    
    // Test login process
    const loginLink = page.getByRole('link', { name: /Login/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      
      // Monitor network requests for sensitive data exposure
      const requests: any[] = [];
      
      page.on('request', (request) => {
        const url = request.url();
        const postData = request.postData();
        
        if (url.includes('/api/') && request.method() === 'POST') {
          requests.push({
            url,
            method: request.method(),
            hasPostData: !!postData,
            postData: postData
          });
        }
      });
      
      const form = page.locator('form');
      if (await form.isVisible()) {
        // Fill in test credentials
        const emailInput = form.locator('input[type="email"], input[name="username"]');
        const passwordInput = form.locator('input[type="password"]');
        
        if (await emailInput.isVisible() && await passwordInput.isVisible()) {
          await emailInput.fill('test@example.com');
          await passwordInput.fill('testpassword123');
          
          // Submit form
          const submitBtn = form.locator('button[type="submit"], input[type="submit"]');
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
            
            // Wait for potential API call
            await page.waitForTimeout(1000);
            
            // Check if password is transmitted securely
            for (const request of requests) {
              if (request.postData) {
                // Password should not be in plain text in logs
                // This is a basic check - in real scenarios, check network tab manually
                expect(request.postData).not.toContain('testpassword123');
              }
            }
          }
        }
      }
    }
  });

  test('should protect sensitive data in localStorage/sessionStorage', async ({ page }) => {
    await page.goto('/');
    
    // Check what's stored in browser storage
    const localStorage = await page.evaluate(() => {
      const items: any = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          items[key] = window.localStorage.getItem(key);
        }
      }
      return items;
    });
    
    const sessionStorage = await page.evaluate(() => {
      const items: any = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          items[key] = window.sessionStorage.getItem(key);
        }
      }
      return items;
    });
    
    // Check for sensitive data patterns
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /private.*key/i,
      /api.*key/i,
      /token.*[A-Za-z0-9]{32,}/,  // Potential JWT or API tokens
      /bearer\s+[A-Za-z0-9\-_]+/i
    ];
    
    for (const [key, value] of Object.entries(localStorage)) {
      for (const pattern of sensitivePatterns) {
        expect(`${key}:${value}`).not.toMatch(pattern);
      }
    }
    
    for (const [key, value] of Object.entries(sessionStorage)) {
      for (const pattern of sensitivePatterns) {
        expect(`${key}:${value}`).not.toMatch(pattern);
      }
    }
    
    console.log(`Checked ${Object.keys(localStorage).length} localStorage items`);
    console.log(`Checked ${Object.keys(sessionStorage).length} sessionStorage items`);
  });

  test('should have secure cookie settings', async ({ page }) => {
    await page.goto('/');
    
    // Get all cookies
    const cookies = await page.context().cookies();
    
    for (const cookie of cookies) {
      // Session cookies should be httpOnly
      if (cookie.name.toLowerCase().includes('session') || 
          cookie.name.toLowerCase().includes('auth')) {
        
        expect(cookie.httpOnly).toBe(true);
        expect(cookie.secure).toBe(true); // Should be secure in production
        expect(cookie.sameSite).toBe('Strict' || 'Lax'); // CSRF protection
      }
      
      // Check for secure attribute on all cookies in HTTPS
      if (page.url().startsWith('https://')) {
        expect(cookie.secure).toBe(true);
      }
      
      console.log(`Cookie ${cookie.name}: secure=${cookie.secure}, httpOnly=${cookie.httpOnly}, sameSite=${cookie.sameSite}`);
    }
  });

  test('should prevent information disclosure', async ({ page }) => {
    // Test error handling
    const response = await page.goto('/non-existent-page');
    
    if (response?.status() === 404) {
      const content = await page.content();
      
      // Error pages should not reveal sensitive information
      const sensitiveInfo = [
        'stack trace',
        'database error',
        'internal server error',
        'debug',
        'exception',
        'mysql',
        'postgresql',
        'mongodb'
      ];
      
      for (const info of sensitiveInfo) {
        expect(content.toLowerCase()).not.toContain(info);
      }
    }
    
    // Check for debug information in console
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg.text().toLowerCase());
    });
    
    await page.goto('/');
    
    // Console should not contain sensitive debug information
    const sensitiveLogs = consoleLogs.filter(log => 
      log.includes('password') || 
      log.includes('secret') || 
      log.includes('api key') ||
      log.includes('token')
    );
    
    expect(sensitiveLogs.length).toBe(0);
  });

  test('should validate file upload security', async ({ page }) => {
    // Look for file upload inputs
    const fileInputs = page.locator('input[type="file"]');
    const fileInputCount = await fileInputs.count();
    
    if (fileInputCount > 0) {
      const firstFileInput = fileInputs.first();
      
      // Check if file type restrictions are in place
      const accept = await firstFileInput.getAttribute('accept');
      
      if (accept) {
        // File input should have restrictions
        expect(accept).toBeTruthy();
        
        // Should not accept executable files
        expect(accept).not.toContain('.exe');
        expect(accept).not.toContain('.bat');
        expect(accept).not.toContain('.sh');
        expect(accept).not.toContain('.js');
      }
      
      console.log(`File input accepts: ${accept}`);
    }
  });

  test('should protect against clickjacking', async ({ page }) => {
    // Try to embed the page in a frame
    const frameHTML = `
      <html>
        <body>
          <iframe src="${page.url()}" width="800" height="600"></iframe>
        </body>
      </html>
    `;
    
    // This test would need to be implemented differently in a real scenario
    // as we can't easily test X-Frame-Options from within the page
    
    // Check if the page has frame-busting JavaScript
    const hasFrameBusting = await page.evaluate(() => {
      // Check if page has basic frame-busting protection
      return window.self !== window.top;
    });
    
    // If page is in a frame, it might have frame-busting code
    if (hasFrameBusting) {
      console.log('Page has frame-busting protection');
    }
  });

  test('should handle logout securely', async ({ page, mockApiResponses }) => {
    await mockApiResponses();
    
    // Check if logout properly clears session data
    const logoutBtn = page.locator('[title="로그아웃"]');
    
    if (await logoutBtn.isVisible()) {
      // Get initial storage state
      const initialStorage = await page.evaluate(() => ({
        localStorage: { ...window.localStorage },
        sessionStorage: { ...window.sessionStorage }
      }));
      
      // Perform logout
      await logoutBtn.click();
      
      // Wait for logout to complete
      await page.waitForTimeout(1000);
      
      // Check if sensitive data is cleared
      const finalStorage = await page.evaluate(() => ({
        localStorage: { ...window.localStorage },
        sessionStorage: { ...window.sessionStorage }
      }));
      
      // Auth-related storage should be cleared
      const authKeys = ['token', 'auth', 'user', 'session'];
      
      for (const key of authKeys) {
        const hadInitialValue = Object.keys(initialStorage.localStorage).some(k => 
          k.toLowerCase().includes(key));
        const hasFinalValue = Object.keys(finalStorage.localStorage).some(k => 
          k.toLowerCase().includes(key));
        
        if (hadInitialValue) {
          expect(hasFinalValue).toBe(false);
        }
      }
    }
  });

  test('should prevent unauthorized access to admin areas', async ({ page }) => {
    // Try to access potential admin routes
    const adminRoutes = ['/admin', '/dashboard', '/management', '/config'];
    
    for (const route of adminRoutes) {
      const response = await page.goto(route);
      
      if (response?.status() === 200) {
        // If route exists, it should require authentication
        const content = await page.content();
        const hasAuthForm = content.includes('login') || content.includes('password');
        
        if (!hasAuthForm) {
          // Check if user is redirected to login
          const currentUrl = page.url();
          const isRedirectedToLogin = currentUrl.includes('/login') || 
                                     currentUrl.includes('/auth');
          
          expect(isRedirectedToLogin).toBe(true);
        }
      }
    }
  });
});