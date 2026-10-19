import { expect, type Page } from '@playwright/test';

export const STAFF_EMAIL = process.env.WC_STAFF_EMAIL || 'kavyanaresh0903@gmail.com';
export const STAFF_HOSPITAL = 'Sunshine';

export async function signInStaff(page: Page, password: string) {
  await page.goto('/login/staff');
  await expect(page.getByRole('heading', { name: 'Find your hospital' })).toBeVisible();
  await page.getByPlaceholder("Start typing your hospital's name").fill(STAFF_HOSPITAL);
  await page.getByRole('button', { name: new RegExp(STAFF_HOSPITAL) }).first().click();
  await page.getByPlaceholder('Enter your email').fill(STAFF_EMAIL);
  await page.getByPlaceholder('Enter your password').fill(password);
  const remember = page.getByRole('checkbox', { name: 'Remember me' });
  if (await remember.isChecked()) await remember.uncheck();
  await page.getByRole('button', { name: 'Sign In' }).click();

  const alreadyLoggedIn = page.getByRole('heading', { name: 'Already Logged In' });
  const loginError = page.locator('.login-error');

  await expect
    .poll(async () => {
      if (/\/staff\//.test(page.url())) return 'signed-in';
      if (await alreadyLoggedIn.isVisible().catch(() => false)) return 'already-logged-in';
      if (await loginError.isVisible().catch(() => false)) return 'rejected';
      return '';
    }, { timeout: 25_000 })
    .not.toBe('');

  if (await alreadyLoggedIn.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Yes, Logout & Continue' }).click();
  } else if (await loginError.isVisible().catch(() => false)) {
    throw new Error(`Sign-in was rejected: ${(await loginError.innerText()).trim()}`);
  }

  await expect(page).toHaveURL(/\/staff\/dashboard/, { timeout: 25_000 });
  await expect(page.getByRole('heading', { name: 'Dashboard' }).first()).toBeVisible();
}

export async function signOutStaff(page: Page) {
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '🚪' }).click();
  await expect(page.getByRole('heading', { name: 'Logout' })).toBeVisible();
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
}
