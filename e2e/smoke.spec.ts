import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    try {
      localStorage.setItem('CMS_DISABLE_LOGIN', '1');
    } catch {}
  });
});

test('메인 네비게이션 스모크', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('건축 관리 시스템')).toBeVisible();
  // 네비게이션 링크 이동
  await page.getByRole('link', { name: '견적서 관리' }).click();
  await expect(page).toHaveURL(/\/estimates$/);

  await page.getByRole('link', { name: '청구서 관리' }).click();
  await expect(page).toHaveURL(/\/invoices$/);

  await page.getByRole('link', { name: '건축주 관리' }).click();
  await expect(page).toHaveURL(/\/clients$/);

  await page.getByRole('link', { name: '작업 항목 관리' }).click();
  await expect(page).toHaveURL(/\/work-items$/);

  await page.getByRole('link', { name: '환경설정' }).click();
  await expect(page).toHaveURL(/\/company-info$/);
});

