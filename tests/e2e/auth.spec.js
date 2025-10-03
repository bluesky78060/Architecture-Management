const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    await page.goto('/');
  });

  test('should show login form when not authenticated', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Should see login form
    await expect(page.locator('h1')).toContainText('건축 관리 시스템');
    await expect(page.locator('text=로그인하여 시작하세요')).toBeVisible();
    
    // Check form elements
    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/login-form.png', fullPage: true });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Enter invalid credentials
    await page.fill('input[id="username"]', 'invalid');
    await page.fill('input[id="password"]', 'wrong');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.text-red-700')).toContainText('아이디 또는 비밀번호가 올바르지 않습니다.');
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/login-error.png', fullPage: true });
  });

  test('should login successfully with valid admin credentials', async ({ page }) => {
    await page.goto('/');
    
    // Enter valid admin credentials
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or admin panel
    await page.waitForURL(/\/(admin|$)/);
    
    // Should see navigation bar
    await expect(page.locator('nav')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/admin-logged-in.png', fullPage: true });
  });

  test('should login successfully with manager credentials', async ({ page }) => {
    await page.goto('/');
    
    // Enter valid manager credentials
    await page.fill('input[id="username"]', 'manager');
    await page.fill('input[id="password"]', 'manager123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('/');
    
    // Should see navigation bar
    await expect(page.locator('nav')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/manager-logged-in.png', fullPage: true });
  });

  test('should login successfully with user credentials', async ({ page }) => {
    await page.goto('/');
    
    // Enter valid user credentials
    await page.fill('input[id="username"]', 'user');
    await page.fill('input[id="password"]', 'user123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('/');
    
    // Should see navigation bar
    await expect(page.locator('nav')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/user-logged-in.png', fullPage: true });
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await page.goto('/');
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('.text-red-700')).toContainText('아이디와 비밀번호를 입력해주세요.');
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/validation-error.png', fullPage: true });
  });

  test('should bypass login when disabled', async ({ page }) => {
    // Set login disabled flag
    await page.goto('/?bypassLogin=1');
    
    // Should go directly to dashboard
    await expect(page.locator('nav')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/login-bypassed.png', fullPage: true });
  });
});