const { test, expect } = require('@playwright/test');

test.describe('Construction Management System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('Authentication Flow - Login Form Display', async ({ page }) => {
    await page.goto('/');
    
    // Should see login form
    await expect(page.locator('h1')).toContainText('건축 관리 시스템');
    await expect(page.locator('text=로그인하여 시작하세요')).toBeVisible();
    
    // Check form elements
    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/01-login-form.png', fullPage: true });
  });

  test('Authentication Flow - Invalid Login', async ({ page }) => {
    await page.goto('/');
    
    // Enter invalid credentials
    await page.fill('input[id="username"]', 'invalid');
    await page.fill('input[id="password"]', 'wrong');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.text-red-700')).toContainText('아이디 또는 비밀번호가 올바르지 않습니다.');
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/02-login-error.png', fullPage: true });
  });

  test('Authentication Flow - Regular User Login Success', async ({ page }) => {
    await page.goto('/');
    
    // Enter valid user credentials (not admin)
    await page.fill('input[id="username"]', 'user');
    await page.fill('input[id="password"]', 'user123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    // Should see navigation bar for regular users
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=건축 관리 시스템')).toBeVisible();
    
    // Check navigation links for regular users
    await expect(page.locator('text=대시보드')).toBeVisible();
    await expect(page.locator('text=건축주 관리')).toBeVisible();
    await expect(page.locator('text=작업 항목 관리')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/03-user-dashboard.png', fullPage: true });
  });

  test('Authentication Flow - Admin Login Success', async ({ page }) => {
    await page.goto('/');
    
    // Enter valid admin credentials
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    // Admin should see admin panel
    await expect(page.locator('text=관리자 패널')).toBeVisible();
    await expect(page.locator('text=사용자 관리')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/04-admin-panel.png', fullPage: true });
  });

  test('Regular User Navigation - Clients Management', async ({ page }) => {
    // Login as regular user
    await page.goto('/');
    await page.fill('input[id="username"]', 'user');
    await page.fill('input[id="password"]', 'user123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Navigate to clients
    await page.click('text=건축주 관리');
    await page.waitForTimeout(1000);
    
    // Should be on clients page
    await expect(page.locator('text=건축주')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/05-clients-page.png', fullPage: true });
  });

  test('Regular User Navigation - Work Items Management', async ({ page }) => {
    // Login as regular user
    await page.goto('/');
    await page.fill('input[id="username"]', 'user');
    await page.fill('input[id="password"]', 'user123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Navigate to work items
    await page.click('text=작업 항목 관리');
    await page.waitForTimeout(1000);
    
    // Should be on work items page
    await expect(page.locator('text=작업')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/06-workitems-page.png', fullPage: true });
  });

  test('Regular User Navigation - Invoices Management', async ({ page }) => {
    // Login as regular user
    await page.goto('/');
    await page.fill('input[id="username"]', 'user');
    await page.fill('input[id="password"]', 'user123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Navigate to invoices
    await page.click('text=청구서 관리');
    await page.waitForTimeout(1000);
    
    // Should be on invoices page
    await expect(page.locator('text=청구서')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/07-invoices-page.png', fullPage: true });
  });

  test('Korean Text Rendering Verification', async ({ page }) => {
    // Login and check various Korean texts
    await page.goto('/');
    await page.fill('input[id="username"]', 'user');
    await page.fill('input[id="password"]', 'user123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Check various Korean text elements
    const koreanTexts = [
      '건축 관리 시스템',
      '대시보드',
      '건축주 관리',
      '작업 항목 관리',
      '청구서 관리'
    ];
    
    for (const text of koreanTexts) {
      const element = await page.locator(`text=${text}`).first();
      await expect(element).toBeVisible();
      
      // Verify text content is properly rendered
      const textContent = await element.textContent();
      expect(textContent).toContain(text);
    }
    
    // Take screenshot to verify Korean text rendering
    await page.screenshot({ path: 'tests/screenshots/08-korean-text-rendering.png', fullPage: true });
  });

  test('Responsive Design - Mobile Viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login as user
    await page.goto('/');
    await page.fill('input[id="username"]', 'user');
    await page.fill('input[id="password"]', 'user123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Check mobile navigation
    await expect(page.locator('nav')).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ path: 'tests/screenshots/09-mobile-dashboard.png', fullPage: true });
    
    // Test navigation on mobile
    await page.click('text=건축주 관리');
    await page.waitForTimeout(1000);
    
    // Take mobile screenshot of clients page
    await page.screenshot({ path: 'tests/screenshots/10-mobile-clients.png', fullPage: true });
  });

  test('Login Bypass Functionality', async ({ page }) => {
    // Test bypass login feature
    await page.goto('/?bypassLogin=1');
    
    // Should go directly to dashboard/interface
    await page.waitForTimeout(2000);
    
    // Should see some interface (either admin panel or regular dashboard)
    const hasAdminPanel = await page.locator('text=관리자 패널').isVisible();
    const hasRegularNav = await page.locator('text=대시보드').isVisible();
    
    expect(hasAdminPanel || hasRegularNav).toBeTruthy();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/11-login-bypassed.png', fullPage: true });
  });

  test('User Session Management', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('input[id="username"]', 'manager');
    await page.fill('input[id="password"]', 'manager123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Should see interface
    await expect(page.locator('nav')).toBeVisible();
    
    // Check user info in navigation
    await expect(page.locator('text=사용자')).toBeVisible();
    
    // Take screenshot showing logged in state
    await page.screenshot({ path: 'tests/screenshots/12-user-session.png', fullPage: true });
  });
});