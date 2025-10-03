const { test, expect } = require('@playwright/test');

test.describe('Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session and login
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    await page.goto('/');
    
    // Login as admin
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard with Korean navigation', async ({ page }) => {
    // Check navigation menu items
    const navItems = [
      '대시보드',
      '견적서',
      '청구서',
      '고객 관리',
      '작업 항목',
      '회사 정보'
    ];
    
    for (const item of navItems) {
      await expect(page.locator(`nav >> text=${item}`)).toBeVisible();
    }
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/dashboard-navigation.png', fullPage: true });
  });

  test('should navigate between different sections', async ({ page }) => {
    // Test navigation to different sections
    const sections = [
      { text: '고객 관리', url: '/clients' },
      { text: '작업 항목', url: '/work-items' },
      { text: '청구서', url: '/invoices' },
      { text: '견적서', url: '/estimates' },
      { text: '회사 정보', url: '/company-info' }
    ];
    
    for (const section of sections) {
      await page.click(`nav >> text=${section.text}`);
      await page.waitForURL(`**${section.url}`);
      await expect(page).toHaveURL(new RegExp(section.url));
      
      // Take screenshot of each section
      await page.screenshot({ 
        path: `tests/screenshots/section-${section.url.replace('/', '')}.png`, 
        fullPage: true 
      });
    }
  });

  test('should display company information correctly', async ({ page }) => {
    // Navigate to company info
    await page.click('nav >> text=회사 정보');
    await page.waitForURL('**/company-info');
    
    // Check for form elements
    await expect(page.locator('text=회사명')).toBeVisible();
    await expect(page.locator('text=대표자명')).toBeVisible();
    await expect(page.locator('text=사업자등록번호')).toBeVisible();
    await expect(page.locator('text=전화번호')).toBeVisible();
    await expect(page.locator('text=주소')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/company-info.png', fullPage: true });
  });

  test('should handle responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to dashboard
    await page.goto('/');
    
    // Check if mobile navigation works
    await expect(page.locator('nav')).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ path: 'tests/screenshots/mobile-dashboard.png', fullPage: true });
    
    // Test navigation on mobile
    await page.click('nav >> text=고객 관리');
    await page.waitForURL('**/clients');
    
    // Take mobile screenshot of clients page
    await page.screenshot({ path: 'tests/screenshots/mobile-clients.png', fullPage: true });
  });

  test('should display Korean text correctly', async ({ page }) => {
    // Check various Korean text elements
    const koreanTexts = [
      '대시보드',
      '건축 관리 시스템',
      '고객 관리',
      '작업 항목',
      '청구서'
    ];
    
    for (const text of koreanTexts) {
      const element = await page.locator(`text=${text}`).first();
      await expect(element).toBeVisible();
      
      // Check that text is properly rendered (not showing as boxes or question marks)
      const textContent = await element.textContent();
      expect(textContent).toContain(text);
    }
    
    // Take screenshot to verify Korean text rendering
    await page.screenshot({ path: 'tests/screenshots/korean-text-rendering.png', fullPage: true });
  });
});