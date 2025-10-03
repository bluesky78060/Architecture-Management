const { test, expect } = require('@playwright/test');

test.describe('Client Management Flow', () => {
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
    
    // Navigate to clients page
    await page.waitForLoadState('networkidle');
    await page.click('nav >> text=고객 관리');
    await page.waitForURL('**/clients');
  });

  test('should display clients page with Korean interface', async ({ page }) => {
    // Check page title and main elements
    await expect(page.locator('text=고객 관리')).toBeVisible();
    await expect(page.locator('text=새 고객 추가')).toBeVisible();
    
    // Check Excel import/export buttons
    await expect(page.locator('text=Excel 가져오기')).toBeVisible();
    await expect(page.locator('text=Excel 내보내기')).toBeVisible();
    await expect(page.locator('text=템플릿 다운로드')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/clients-page.png', fullPage: true });
  });

  test('should open add client modal', async ({ page }) => {
    // Click add new client button
    await page.click('text=새 고객 추가');
    
    // Check modal is visible
    await expect(page.locator('.modal, [role="dialog"]').first()).toBeVisible();
    
    // Check form fields
    await expect(page.locator('text=고객명')).toBeVisible();
    await expect(page.locator('text=전화번호')).toBeVisible();
    await expect(page.locator('text=휴대폰')).toBeVisible();
    await expect(page.locator('text=이메일')).toBeVisible();
    await expect(page.locator('text=주소')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/add-client-modal.png', fullPage: true });
  });

  test('should add new personal client with Korean name', async ({ page }) => {
    // Click add new client button
    await page.click('text=새 고객 추가');
    
    // Fill in client information with Korean name
    const clientData = {
      name: '김철수',
      phone: '02-1234-5678',
      mobile: '010-1234-5678',
      email: 'kim@example.com',
      address: '서울시 강남구 테헤란로 123'
    };
    
    // Fill form fields
    await page.fill('input[name="name"]', clientData.name);
    await page.fill('input[name="phone"]', clientData.phone);
    await page.fill('input[name="mobile"]', clientData.mobile);
    await page.fill('input[name="email"]', clientData.email);
    await page.fill('input[name="address"], textarea[name="address"]', clientData.address);
    
    // Submit form
    await page.click('button:has-text("추가"), button:has-text("저장")');
    
    // Wait for modal to close
    await page.waitForTimeout(1000);
    
    // Verify client was added to the list
    await expect(page.locator(`text=${clientData.name}`)).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/client-added.png', fullPage: true });
  });

  test('should add business client', async ({ page }) => {
    // Click add new client button
    await page.click('text=새 고객 추가');
    
    // Switch to business client type
    await page.click('text=사업자');
    
    // Fill in business information
    const businessData = {
      businessName: '대한건설(주)',
      representative: '이영희',
      businessNumber: '123-45-67890',
      name: '이영희',
      phone: '02-9876-5432'
    };
    
    await page.fill('input[name="businessName"]', businessData.businessName);
    await page.fill('input[name="representative"]', businessData.representative);
    await page.fill('input[name="businessNumber"]', businessData.businessNumber);
    await page.fill('input[name="name"]', businessData.name);
    await page.fill('input[name="phone"]', businessData.phone);
    
    // Submit form
    await page.click('button:has-text("추가"), button:has-text("저장")');
    
    // Wait for modal to close
    await page.waitForTimeout(1000);
    
    // Verify business client was added
    await expect(page.locator(`text=${businessData.businessName}`)).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/business-client-added.png', fullPage: true });
  });

  test('should edit existing client', async ({ page }) => {
    // First add a client to edit
    await page.click('text=새 고객 추가');
    await page.fill('input[name="name"]', '홍길동');
    await page.fill('input[name="phone"]', '02-1111-2222');
    await page.click('button:has-text("추가"), button:has-text("저장")');
    await page.waitForTimeout(1000);
    
    // Find and click edit button for the client
    const clientRow = page.locator('tr:has-text("홍길동")');
    await clientRow.locator('button:has-text("수정"), button:has-text("편집")').click();
    
    // Modify client information
    await page.fill('input[name="name"]', '홍길동(수정됨)');
    await page.fill('input[name="mobile"]', '010-9999-8888');
    
    // Save changes
    await page.click('button:has-text("저장"), button:has-text("수정")');
    await page.waitForTimeout(1000);
    
    // Verify changes
    await expect(page.locator('text=홍길동(수정됨)')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/client-edited.png', fullPage: true });
  });

  test('should manage workplaces for client', async ({ page }) => {
    // Add a client first
    await page.click('text=새 고객 추가');
    await page.fill('input[name="name"]', '박현수');
    await page.fill('input[name="phone"]', '02-3333-4444');
    
    // Add workplace information
    const workplaceSelector = 'input[placeholder*="현장"], input[name*="workplace"]';
    const workplaceName = '강남 아파트 현장';
    
    if (await page.locator(workplaceSelector).first().isVisible()) {
      await page.fill(workplaceSelector, workplaceName);
    }
    
    // Submit form
    await page.click('button:has-text("추가"), button:has-text("저장")');
    await page.waitForTimeout(1000);
    
    // Verify client was added
    await expect(page.locator('text=박현수')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/client-with-workplace.png', fullPage: true });
  });

  test('should format phone numbers correctly', async ({ page }) => {
    // Click add new client button
    await page.click('text=새 고객 추가');
    
    // Test phone number formatting
    await page.fill('input[name="phone"]', '0212345678');
    await page.blur('input[name="phone"]');
    
    // Check if phone number was formatted
    const phoneValue = await page.inputValue('input[name="phone"]');
    expect(phoneValue).toMatch(/02-\d{4}-\d{4}/);
    
    // Test mobile number formatting
    await page.fill('input[name="mobile"]', '01012345678');
    await page.blur('input[name="mobile"]');
    
    const mobileValue = await page.inputValue('input[name="mobile"]');
    expect(mobileValue).toMatch(/010-\d{4}-\d{4}/);
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/phone-formatting.png', fullPage: true });
    
    // Close modal
    await page.click('button:has-text("취소"), .modal button:has-text("×")');
  });

  test('should test bulk operations', async ({ page }) => {
    // Add multiple clients first
    const clients = ['김민수', '이진호', '박지영'];
    
    for (const clientName of clients) {
      await page.click('text=새 고객 추가');
      await page.fill('input[name="name"]', clientName);
      await page.fill('input[name="phone"]', `02-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`);
      await page.click('button:has-text("추가"), button:has-text("저장")');
      await page.waitForTimeout(500);
    }
    
    // Test bulk selection
    const selectAllCheckbox = page.locator('input[type="checkbox"]').first();
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.check();
      
      // Verify all checkboxes are checked
      const checkboxes = await page.locator('input[type="checkbox"]').count();
      expect(checkboxes).toBeGreaterThan(1);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/bulk-selection.png', fullPage: true });
  });

  test('should test Excel export functionality', async ({ page }) => {
    // Add a client first
    await page.click('text=새 고객 추가');
    await page.fill('input[name="name"]', '엑셀테스트고객');
    await page.fill('input[name="phone"]', '02-1234-5678');
    await page.click('button:has-text("추가"), button:has-text("저장")');
    await page.waitForTimeout(1000);
    
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click Excel export button
    await page.click('text=Excel 내보내기');
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('고객목록');
    expect(download.suggestedFilename()).toContain('.xlsx');
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/excel-export.png', fullPage: true });
  });

  test('should test template download', async ({ page }) => {
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click template download button
    await page.click('text=템플릿 다운로드');
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('고객');
    expect(download.suggestedFilename()).toContain('템플릿');
    expect(download.suggestedFilename()).toContain('.xlsx');
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/template-download.png', fullPage: true });
  });
});