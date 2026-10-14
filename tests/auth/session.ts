import { expect, type Page } from '@playwright/test';

export const SUPER_ADMIN_EMAIL = 'superadmin@whitecoats.com';

export async function signInSuperAdmin(page: Page, password: string) {
  await page.goto('/login/super-admin');
  await expect(page.getByRole('heading', { name: 'Super Admin Portal' })).toBeVisible();
  await page.getByPlaceholder('Enter your email').fill(SUPER_ADMIN_EMAIL);
  await page.getByPlaceholder('Enter your password').fill(password);
  const remember = page.getByRole('checkbox', { name: 'Remember me' });
  if (await remember.isChecked()) await remember.uncheck();
  await page.getByRole('button', { name: 'Sign In' }).click();

  const alreadyLoggedIn = page.getByRole('heading', { name: 'Already Logged In' });
  const loginError = page.locator('.login-error');
  const passwordChange = page.getByText('Password must contain:');

  await expect
    .poll(async () => {
      if (/\/super-admin\//.test(page.url())) return 'signed-in';
      if (await alreadyLoggedIn.isVisible().catch(() => false)) return 'already-logged-in';
      if (await loginError.isVisible().catch(() => false)) return 'rejected';
      if (await passwordChange.isVisible().catch(() => false)) return 'password-change';
      return '';
    }, { timeout: 25_000 })
    .not.toBe('');

  if (await alreadyLoggedIn.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Yes, Logout & Continue' }).click();
  } else if (await loginError.isVisible().catch(() => false)) {
    throw new Error(`Sign-in was rejected: ${(await loginError.innerText()).trim()}`);
  } else if (await passwordChange.isVisible().catch(() => false)) {
    throw new Error('Sign-in asked for a password change and stopped before the dashboard.');
  }

  await expect(page).toHaveURL(/\/super-admin\/dashboard/, { timeout: 25_000 });
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('button', { name: 'Tenants' })).toBeVisible();
  await expect(page.getByText('Super Administrator').first()).toBeVisible();
}

export async function signOutSuperAdmin(page: Page) {
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '🚪' }).click();
  await expect(page.getByRole('heading', { name: 'Logout' })).toBeVisible();
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
}
