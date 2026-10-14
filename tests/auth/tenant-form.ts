import { expect, type Page } from '@playwright/test';

export const E2E_TENANT = {
  name: 'Cursor E2E Clinic',
  // The form title-cases the name on blur, so the saved row reads "Cursor E2e Clinic".
  savedName: 'Cursor E2e Clinic',
  subdomain: 'cursor-e2e',
  contactName: 'Cursor Tester',
  contactEmail: 'cursor-e2e-contact@example.com',
  phone: '6000000001',
  adminEmail: 'cursor-e2e-admin@example.com',
  address: '1 Automation Lane',
  city: 'Hyderabad',
  postal: '500001',
};

export function trackTenantCreates(page: Page) {
  const creates: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'POST') return;
    const path = new URL(request.url()).pathname;
    if (/\/super-admin\/tenants\/?$/.test(path)) creates.push(request.url());
  });
  return creates;
}

export function fieldGroup(page: Page, label: string) {
  return page.locator('.modal-content .form-group').filter({
    has: page.locator('label', { hasText: label }),
  }).first();
}

function addTenantMenu(page: Page) {
  return page.getByRole('button', { name: /Add Tenant ▾/ });
}

export async function openCreateTenant(page: Page) {
  await addTenantMenu(page).click();
  await page.getByRole('button', { name: 'Create with Payment Now' }).click();
  await expect(page.getByRole('heading', { name: 'Add New Tenant' })).toBeVisible();
}

export async function openPaymentLink(page: Page) {
  await addTenantMenu(page).click();
  await page.getByRole('button', { name: 'Generate Payment Link' }).click();
  await expect(page.getByRole('heading', { name: 'Generate Payment Link for New Tenant' })).toBeVisible();
}

export async function closeTenantModal(page: Page) {
  const cancel = page.locator('.modal-content').getByRole('button', { name: 'Cancel' });
  if (await cancel.isVisible().catch(() => false)) await cancel.click();
  await expect(page.getByRole('heading', { name: /Add New Tenant|Generate Payment Link for New Tenant/ })).toBeHidden();
}

export async function chooseOption(page: Page, label: string, option: string | RegExp) {
  const combo = fieldGroup(page, label).getByRole('combobox');
  await combo.scrollIntoViewIfNeeded();
  const choice = page.getByRole('option', {
    name: option,
    exact: typeof option === 'string',
  });
  let opened = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await combo.click();
    opened = await choice.first().isVisible().catch(() => false);
    if (opened) break;
    await page.waitForTimeout(200);
    opened = await choice.first().isVisible().catch(() => false);
    if (opened) break;
  }
  await expect(choice.first()).toBeVisible();
  await choice.first().click();
}

export async function submitTenant(page: Page) {
  await page.locator('.modal-content').getByRole('button', { name: /Create Tenant|Generate Payment Link|Update Tenant/ }).click();
}
