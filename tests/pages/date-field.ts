import { expect, type Locator } from '@playwright/test';

export async function setIsoDate(scope: Locator, iso: string) {
  const native = scope.locator('input[type="date"]');
  if (await native.count()) {
    await native.first().fill(iso);
    return;
  }

  const [year, month, day] = iso.split('-').map(Number);
  await scope.locator('.wc-datepicker-trigger').first().click();
  const dialog = scope.page().getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Month', { exact: true }).selectOption(String(month - 1));
  await dialog.getByLabel('Year', { exact: true }).selectOption(String(year));
  await dialog.locator('button.wc-datepicker-day').filter({ hasText: new RegExp(`^${day}$`) }).click();
  await expect(dialog).toBeHidden();
}
