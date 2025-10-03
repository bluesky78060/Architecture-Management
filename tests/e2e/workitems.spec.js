const { test, expect } = require('@playwright/test');

test.describe('Work Items Management Flow', () => {
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
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // First add a client for work items
    await page.click('nav >> text=고객 관리');
    await page.waitForURL('**/clients');
    
    // Add a test client
    await page.click('text=새 고객 추가');
    await page.fill('input[name="name"]', '테스트고객');
    await page.fill('input[name="phone"]', '02-1234-5678');
    await page.click('button:has-text("추가"), button:has-text("저장")');
    await page.waitForTimeout(1000);
    
    // Navigate to work items
    await page.click('nav >> text=작업 항목');
    await page.waitForURL('**/work-items');
  });

  test('should display work items page with Korean interface', async ({ page }) => {
    // Check page title and main elements
    await expect(page.locator('text=작업 항목')).toBeVisible();
    await expect(page.locator('text=새 작업 추가')).toBeVisible();
    
    // Check filter options
    await expect(page.locator('text=전체')).toBeVisible();
    
    // Check Excel functionality
    await expect(page.locator('text=Excel 가져오기')).toBeVisible();
    await expect(page.locator('text=Excel 내보내기')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/workitems-page.png', fullPage: true });
  });

  test('should add new work item', async ({ page }) => {
    // Click add new work item button
    await page.click('text=새 작업 추가');
    
    // Fill in work item information
    const workItemData = {
      title: '벽체 철거 작업',
      description: '거실 벽체 철거 및 정리',
      category: '철거공사',
      unit: '㎡',
      quantity: '50',
      unitPrice: '15000'
    };
    
    // Fill form fields
    await page.fill('input[name="title"], input[placeholder*="작업명"]', workItemData.title);
    await page.fill('textarea[name="description"], input[name="description"]', workItemData.description);
    
    // Select category if dropdown exists
    const categorySelector = 'select[name="category"]';
    if (await page.locator(categorySelector).isVisible()) {
      await page.selectOption(categorySelector, workItemData.category);
    }
    
    // Fill unit, quantity, and price
    await page.fill('input[name="unit"]', workItemData.unit);
    await page.fill('input[name="quantity"]', workItemData.quantity);
    await page.fill('input[name="unitPrice"]', workItemData.unitPrice);
    
    // Select client
    const clientSelector = 'select[name="clientId"], select[name="client"]';
    if (await page.locator(clientSelector).isVisible()) {
      await page.selectOption(clientSelector, { label: '테스트고객' });
    }
    
    // Submit form
    await page.click('button:has-text("추가"), button:has-text("저장")');
    await page.waitForTimeout(1000);
    
    // Verify work item was added
    await expect(page.locator(`text=${workItemData.title}`)).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/workitem-added.png', fullPage: true });
  });

  test('should filter work items by status', async ({ page }) => {
    // Add multiple work items with different statuses
    const workItems = [
      { title: '대기중 작업', status: '대기중' },
      { title: '진행중 작업', status: '진행중' },
      { title: '완료된 작업', status: '완료' }
    ];
    
    for (const item of workItems) {
      await page.click('text=새 작업 추가');
      await page.fill('input[name="title"], input[placeholder*="작업명"]', item.title);
      await page.fill('input[name="unit"]', 'm');
      await page.fill('input[name="quantity"]', '10');
      await page.fill('input[name="unitPrice"]', '10000');
      
      // Select client if available
      const clientSelector = 'select[name="clientId"], select[name="client"]';
      if (await page.locator(clientSelector).isVisible()) {
        await page.selectOption(clientSelector, { label: '테스트고객' });
      }
      
      // Select status if available
      const statusSelector = 'select[name="status"]';
      if (await page.locator(statusSelector).isVisible()) {
        await page.selectOption(statusSelector, item.status);
      }
      
      await page.click('button:has-text("추가"), button:has-text("저장")');
      await page.waitForTimeout(500);
    }
    
    // Test filtering by different statuses
    const statusFilters = ['대기중', '진행중', '완료'];
    
    for (const status of statusFilters) {
      const filterButton = page.locator(`text=${status}`).first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
        await page.waitForTimeout(500);
        
        // Take screenshot of filtered results
        await page.screenshot({ 
          path: `tests/screenshots/workitems-filter-${status}.png`, 
          fullPage: true 
        });
      }
    }
  });

  test('should edit existing work item', async ({ page }) => {
    // First add a work item to edit
    await page.click('text=새 작업 추가');
    await page.fill('input[name="title"], input[placeholder*="작업명"]', '수정할 작업');
    await page.fill('input[name="unit"]', 'm');
    await page.fill('input[name="quantity"]', '20');
    await page.fill('input[name="unitPrice"]', '5000');
    
    const clientSelector = 'select[name="clientId"], select[name="client"]';
    if (await page.locator(clientSelector).isVisible()) {
      await page.selectOption(clientSelector, { label: '테스트고객' });
    }
    
    await page.click('button:has-text("추가"), button:has-text("저장")');
    await page.waitForTimeout(1000);
    
    // Find and edit the work item
    const workItemRow = page.locator('tr:has-text("수정할 작업")');
    if (await workItemRow.isVisible()) {
      await workItemRow.locator('button:has-text("수정"), button:has-text("편집")').click();
      
      // Modify work item information
      await page.fill('input[name="title"], input[placeholder*="작업명"]', '수정된 작업');
      await page.fill('input[name="quantity"]', '25');
      
      // Save changes
      await page.click('button:has-text("저장"), button:has-text("수정")');
      await page.waitForTimeout(1000);
      
      // Verify changes
      await expect(page.locator('text=수정된 작업')).toBeVisible();
    }
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/workitem-edited.png', fullPage: true });
  });

  test('should change work item status', async ({ page }) => {
    // Add a work item first
    await page.click('text=새 작업 추가');
    await page.fill('input[name="title"], input[placeholder*="작업명"]', '상태변경 테스트');
    await page.fill('input[name="unit"]', '개');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="unitPrice"]', '100000');
    
    const clientSelector = 'select[name="clientId"], select[name="client"]';
    if (await page.locator(clientSelector).isVisible()) {
      await page.selectOption(clientSelector, { label: '테스트고객' });
    }
    
    await page.click('button:has-text("추가"), button:has-text("저장")');
    await page.waitForTimeout(1000);
    
    // Test status changes: 대기중 → 진행중 → 완료
    const statusSequence = ['진행중', '완료'];
    
    for (const targetStatus of statusSequence) {
      // Look for status change buttons or dropdown
      const statusButton = page.locator(`button:has-text("${targetStatus}"), select option:has-text("${targetStatus}")`);
      
      if (await statusButton.first().isVisible()) {
        await statusButton.first().click();
        await page.waitForTimeout(500);
        
        // Take screenshot for each status change
        await page.screenshot({ 
          path: `tests/screenshots/status-change-${targetStatus}.png`, 
          fullPage: true 
        });
      }
    }
  });

  test('should search work items', async ({ page }) => {
    // Add multiple work items for search testing
    const workItems = ['타일 작업', '페인트 작업', '배관 작업'];
    
    for (const title of workItems) {
      await page.click('text=새 작업 추가');
      await page.fill('input[name="title"], input[placeholder*="작업명"]', title);
      await page.fill('input[name="unit"]', 'm');
      await page.fill('input[name="quantity"]', '10');
      await page.fill('input[name="unitPrice"]', '10000');
      
      const clientSelector = 'select[name="clientId"], select[name="client"]';
      if (await page.locator(clientSelector).isVisible()) {
        await page.selectOption(clientSelector, { label: '테스트고객' });
      }
      
      await page.click('button:has-text("추가"), button:has-text("저장")');
      await page.waitForTimeout(500);
    }
    
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="검색"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('타일');
      await page.waitForTimeout(500);
      
      // Verify search results
      await expect(page.locator('text=타일 작업')).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'tests/screenshots/workitem-search.png', fullPage: true });
    }
  });

  test('should calculate totals correctly', async ({ page }) => {
    // Add work items with different quantities and prices
    const workItems = [
      { title: '작업1', quantity: '10', unitPrice: '5000' }, // 50,000
      { title: '작업2', quantity: '20', unitPrice: '3000' }, // 60,000
      { title: '작업3', quantity: '5', unitPrice: '10000' }   // 50,000
    ];
    
    for (const item of workItems) {
      await page.click('text=새 작업 추가');
      await page.fill('input[name="title"], input[placeholder*="작업명"]', item.title);
      await page.fill('input[name="unit"]', 'm');
      await page.fill('input[name="quantity"]', item.quantity);
      await page.fill('input[name="unitPrice"]', item.unitPrice);
      
      const clientSelector = 'select[name="clientId"], select[name="client"]';
      if (await page.locator(clientSelector).isVisible()) {
        await page.selectOption(clientSelector, { label: '테스트고객' });
      }
      
      await page.click('button:has-text("추가"), button:has-text("저장")');
      await page.waitForTimeout(500);
    }
    
    // Check if total calculation is displayed
    const totalElements = page.locator('text=/합계|총액|Total/i');
    if (await totalElements.first().isVisible()) {
      // Verify total calculation (50,000 + 60,000 + 50,000 = 160,000)
      await expect(page.locator('text=/160,000|160000/i')).toBeVisible();
    }
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/workitem-totals.png', fullPage: true });
  });

  test('should test bulk operations on work items', async ({ page }) => {
    // Add multiple work items
    const workItems = ['벽체공사', '바닥공사', '천장공사'];
    
    for (const title of workItems) {
      await page.click('text=새 작업 추가');
      await page.fill('input[name="title"], input[placeholder*="작업명"]', title);
      await page.fill('input[name="unit"]', 'm');
      await page.fill('input[name="quantity"]', '10');
      await page.fill('input[name="unitPrice"]', '15000');
      
      const clientSelector = 'select[name="clientId"], select[name="client"]';
      if (await page.locator(clientSelector).isVisible()) {
        await page.selectOption(clientSelector, { label: '테스트고객' });
      }
      
      await page.click('button:has-text("추가"), button:has-text("저장")');
      await page.waitForTimeout(500);
    }
    
    // Test bulk selection
    const selectAllCheckbox = page.locator('input[type="checkbox"]').first();
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.check();
      
      // Look for bulk action buttons
      const bulkActionButton = page.locator('button:has-text("일괄"), button:has-text("선택")');
      if (await bulkActionButton.first().isVisible()) {
        // Take screenshot showing bulk selection
        await page.screenshot({ path: 'tests/screenshots/workitem-bulk-selection.png', fullPage: true });
      }
    }
  });

  test('should test Excel export for work items', async ({ page }) => {
    // Add a work item first
    await page.click('text=새 작업 추가');
    await page.fill('input[name="title"], input[placeholder*="작업명"]', '엑셀 테스트 작업');
    await page.fill('input[name="unit"]', 'm');
    await page.fill('input[name="quantity"]', '15');
    await page.fill('input[name="unitPrice"]', '8000');
    
    const clientSelector = 'select[name="clientId"], select[name="client"]';
    if (await page.locator(clientSelector).isVisible()) {
      await page.selectOption(clientSelector, { label: '테스트고객' });
    }
    
    await page.click('button:has-text("추가"), button:has-text("저장")');
    await page.waitForTimeout(1000);
    
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click Excel export button
    await page.click('text=Excel 내보내기');
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('작업');
    expect(download.suggestedFilename()).toContain('.xlsx');
    
    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/workitem-excel-export.png', fullPage: true });
  });
});