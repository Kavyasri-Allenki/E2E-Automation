import { expect, test } from '@playwright/test';
import { signInSuperAdmin, signOutSuperAdmin } from './session';
import {
  E2E_TENANT,
  chooseOption,
  closeTenantModal,
  fieldGroup,
  openCreateTenant,
  openPaymentLink,
  submitTenant,
  trackTenantCreates,
} from './tenant-form';

const password = process.env.WC_SUPER_ADMIN_PASSWORD;

test.describe.configure({ mode: 'serial', retries: 0 });

test.beforeEach(async ({ page }) => {
  test.skip(!password, 'Set WC_SUPER_ADMIN_PASSWORD to run Add Tenant checks.');
  await signInSuperAdmin(page, password!);
  await page.getByRole('navigation').getByRole('button', { name: 'Tenants' }).click();
  await expect(page).toHaveURL(/\/super-admin\/tenants/);
  await expect(page.getByRole('heading', { name: 'Tenants' })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  if (!/\/super-admin\//.test(page.url())) return;
  const gotIt = page.getByRole('button', { name: 'Got it' });
  if (await gotIt.isVisible().catch(() => false)) await gotIt.click();
  const cancel = page.locator('.modal-content').getByRole('button', { name: 'Cancel' });
  if (await cancel.isVisible().catch(() => false)) await cancel.click();
  await signOutSuperAdmin(page);
});

test('WC-SUP-ADD-01 Add Tenant form exposes every field', async ({ page }) => {
  const creates = trackTenantCreates(page);
  await openCreateTenant(page);
  const modal = page.locator('.modal-content');

  for (const heading of [
    'Tenant Information',
    'Contact & Admin Information',
    'Healthcare Classification',
    'Subscription & Billing',
    'Payment Information',
    'Location',
    'Branding',
  ]) {
    await expect(modal.getByRole('heading', { name: heading })).toBeVisible();
  }

  await expect(modal.getByPlaceholder('Apollo Hospitals')).toBeVisible();
  await expect(modal.getByPlaceholder('apollo', { exact: true })).toBeVisible();
  await expect(modal.getByText('.whitecoats.com')).toBeVisible();
  await expect(modal.getByPlaceholder('John Doe')).toBeVisible();
  await expect(modal.getByPlaceholder('contact@apollo.com')).toBeVisible();
  await expect(modal.getByPlaceholder('+91 6XXXXXXXXX or 6XXXXXXXXX')).toBeVisible();
  await expect(modal.locator('input[name="tenant-admin-email"]')).toBeVisible();
  await expect(modal.getByText('A secure password will be auto-generated and sent to the admin email address above.')).toBeVisible();

  for (const label of [
    'Category',
    'Bed Size',
    'Stream of Practice',
    'Type of Specialty',
    'Subscription Plan',
    'Billing Cycle',
    'Payment Method',
    'Country',
    'State',
    'City',
  ]) {
    await expect(fieldGroup(page, label).getByRole('combobox')).toBeVisible();
  }

  await expect(modal.getByRole('checkbox', { name: 'Do you have a GST number for this business?' })).toBeVisible();
  await expect(modal.getByPlaceholder('e.g., pay_XXXXXXXXXXXXXX or bank reference no.')).toBeVisible();
  await expect(fieldGroup(page, 'Payment Date').locator('input[type="date"]')).toBeVisible();
  await expect(fieldGroup(page, 'Next Due Date').locator('input[type="date"]')).toBeVisible();
  await expect(fieldGroup(page, 'Next Billing Date').locator('input[type="date"]')).toBeVisible();
  await expect(modal.getByPlaceholder('123 Main Street')).toBeVisible();
  await expect(modal.getByPlaceholder('400001')).toBeVisible();
  await expect(modal.getByPlaceholder('#39c94c')).toHaveValue('#39c94c');
  await expect(modal.getByPlaceholder('#107fd6')).toHaveValue('#107fd6');
  await expect(modal.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Create Tenant' })).toBeVisible();

  await closeTenantModal(page);
  expect(creates).toEqual([]);
});

test('WC-SUP-ADD-02 empty create is rejected', async ({ page }) => {
  const creates = trackTenantCreates(page);
  await openCreateTenant(page);
  await submitTenant(page);

  await expect(page.getByRole('heading', { name: 'Validation Errors' })).toBeVisible();
  await expect(page.getByText('Please fix the following errors before submitting:')).toBeVisible();
  for (const message of [
    'Tenant name is required',
    'Subdomain is required',
    'Contact email is required',
    'Admin email is required',
    'Subscription plan is required',
    'Payment date is required. Enter the date when payment was received.',
    'Payment method is required',
    'Category is required',
    'Stream of Practice is required',
    'Type of Specialty is required',
    'Contact phone is required',
  ]) {
    await expect(page.locator('.modal-content').getByText(message).first()).toBeVisible();
  }

  await page.getByRole('button', { name: 'Got it' }).click();
  await expect(page.getByRole('heading', { name: 'Add New Tenant' })).toBeVisible();
  await closeTenantModal(page);
  expect(creates).toEqual([]);
});

test('WC-SUP-ADD-03 invalid tenant values are rejected', async ({ page }) => {
  const creates = trackTenantCreates(page);
  await openCreateTenant(page);
  const modal = page.locator('.modal-content');

  await modal.getByPlaceholder('apollo', { exact: true }).fill('Bad_Subdomain');
  await modal.getByPlaceholder('contact@apollo.com').fill('a@b.c');
  await modal.getByPlaceholder('+91 6XXXXXXXXX or 6XXXXXXXXX').fill('12345');
  await modal.locator('input[name="tenant-admin-email"]').fill('not-an-email');
  await modal.getByPlaceholder('400001').fill('12');
  await modal.getByRole('checkbox', { name: 'Do you have a GST number for this business?' }).check();
  await modal.getByPlaceholder('e.g., 22AAAAA0000A1Z5').fill('BADGST');
  await chooseOption(page, 'Payment Method', 'UPI');
  await submitTenant(page);

  await expect(page.getByRole('heading', { name: 'Validation Errors' })).toBeVisible();
  for (const message of [
    'Subdomain can only contain lowercase letters, numbers, and hyphens',
    'Invalid email format. Email must start/end with alphanumeric characters and have a valid domain (e.g., user@example.com)',
    'Invalid phone number. Indian mobile numbers must start with 6, 7, 8 or 9 (10 digits)',
    'Invalid admin email format. Email must start/end with alphanumeric characters and have a valid domain',
    'Postal code must be exactly 6 digits',
    'Invalid GST number format (e.g. 22AAAAA0000A1Z5)',
    'Transaction ID is required when recording a payment',
  ]) {
    await expect(modal.getByText(message).first()).toBeVisible();
  }

  await page.getByRole('button', { name: 'Got it' }).click();
  await closeTenantModal(page);
  await expect(page.getByRole('cell', { name: 'Bad_Subdomain', exact: true })).toHaveCount(0);
  expect(creates).toEqual([]);
});

test('WC-SUP-ADD-04 payment link form explains payment happens later', async ({ page }) => {
  const creates = trackTenantCreates(page);
  await openPaymentLink(page);
  const modal = page.locator('.modal-content');

  await expect(modal.getByText('Payment details (method, transaction ID) will be recorded automatically once the Hospital Admin completes payment via the generated link. The tenant account will be created only after payment succeeds.')).toBeVisible();
  await expect(modal.getByText('Payment Method', { exact: true })).toHaveCount(0);
  await expect(modal.getByText('Payment Date', { exact: true })).toHaveCount(0);
  await expect(modal.getByText('Transaction ID', { exact: true })).toHaveCount(0);
  await expect(modal.getByRole('button', { name: 'Generate Payment Link' })).toBeVisible();
  await expect(modal.getByPlaceholder('Apollo Hospitals')).toBeVisible();
  await expect(modal.locator('input[name="tenant-admin-email"]')).toBeVisible();

  await closeTenantModal(page);
  expect(creates).toEqual([]);
});

test('WC-SUP-ADD-05 super admin can create one clinic tenant', async ({ page }) => {
  test.setTimeout(120_000);
  const creates = trackTenantCreates(page);
  const search = page.getByPlaceholder('Search by name, subdomain, email, or category...');
  const listed = page.waitForResponse((response) => (
    response.request().method() === 'GET' && response.url().includes('/super-admin/tenants')
  ));
  await search.fill(E2E_TENANT.subdomain);
  await listed;
  const existing = page.getByRole('cell', { name: E2E_TENANT.savedName, exact: true });
  const alreadyThere = await existing.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);

  if (!alreadyThere) {
    await search.fill('');
    await openCreateTenant(page);
    const modal = page.locator('.modal-content');
    await modal.getByPlaceholder('Apollo Hospitals').fill(E2E_TENANT.name);
    await modal.getByPlaceholder('apollo', { exact: true }).fill(E2E_TENANT.subdomain);
    await modal.getByPlaceholder('John Doe').fill(E2E_TENANT.contactName);
    await modal.getByPlaceholder('contact@apollo.com').fill(E2E_TENANT.contactEmail);
    await modal.getByPlaceholder('+91 6XXXXXXXXX or 6XXXXXXXXX').fill(E2E_TENANT.phone);
    await modal.locator('input[name="tenant-admin-email"]').fill(E2E_TENANT.adminEmail);
    await chooseOption(page, 'Category', 'Clinic');
    await chooseOption(page, 'Bed Size', 'No Beds (OPD Only)');
    await chooseOption(page, 'Stream of Practice', 'Allopathy');
    await chooseOption(page, 'Type of Specialty', 'Single Specialty');
    await chooseOption(page, 'Subscription Plan', /Starter/);
    await expect(modal.getByText('Price Summary')).toBeVisible();
    await expect(modal.getByText('GST (18%)')).toBeVisible();
    await expect(modal.getByText('Total Amount')).toBeVisible();
    await chooseOption(page, 'Payment Method', 'Cash');
    const paymentDate = fieldGroup(page, 'Payment Date').locator('input[type="date"]');
    const today = await paymentDate.getAttribute('min');
    await paymentDate.fill(today || '');
    await expect(modal.getByText('PAID', { exact: true })).toBeVisible();
    await expect(fieldGroup(page, 'Next Due Date').locator('input[type="date"]')).not.toHaveValue('');
    await expect(fieldGroup(page, 'Next Billing Date').locator('input[type="date"]')).not.toHaveValue('');
    await modal.getByPlaceholder('123 Main Street').fill(E2E_TENANT.address);
    await chooseOption(page, 'State', 'Telangana');
    const cityText = fieldGroup(page, 'City').getByPlaceholder('Enter city name');
    const cityList = cityText.waitFor({ state: 'visible', timeout: 4_000 }).then(() => 'text').catch(() => 'list');
    if (await cityList === 'text') {
      await cityText.fill(E2E_TENANT.city);
    } else {
      await chooseOption(page, 'City', 'Hyderabad');
    }
    await modal.getByPlaceholder('400001').fill(E2E_TENANT.postal);

    let message = '';
    page.once('dialog', async (popup) => {
      message = popup.message();
      await popup.accept();
    });
    await submitTenant(page);
    await expect.poll(async () => {
      if (message) return message;
      if (await page.getByRole('heading', { name: 'Validation Errors' }).isVisible().catch(() => false)) {
        return await page.locator('.modal-content').innerText();
      }
      return '';
    }, { timeout: 30_000 }).not.toBe('');
    if (!message.includes('Tenant created successfully')) {
      throw new Error(`Create was rejected:\n${(message || await page.locator('.modal-content').innerText()).slice(0, 1500)}`);
    }
    expect(creates).toHaveLength(1);
  }

  await search.fill(E2E_TENANT.subdomain);
  const row = page.getByRole('row', { name: new RegExp(E2E_TENANT.savedName) });
  await expect(row).toBeVisible();
  await expect(row.getByText(`${E2E_TENANT.subdomain}.whitecoats.com`)).toBeVisible();
  await row.getByRole('button', { name: '👁️' }).click();
  await expect(page.getByRole('heading', { name: /Tenant Details/ })).toBeVisible();
  await expect(page.getByText(E2E_TENANT.savedName).first()).toBeVisible();
  await expect(page.getByText(`${E2E_TENANT.subdomain}.whitecoats.com`).first()).toBeVisible();
  await page.getByRole('button', { name: '✕' }).click();
  await expect(page.getByRole('heading', { name: /Tenant Details/ })).toBeHidden();
});
