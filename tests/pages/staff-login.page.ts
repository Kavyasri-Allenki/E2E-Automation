import { expect, type Page } from '@playwright/test';

export const STAFF_EMAIL = process.env.WC_STAFF_EMAIL || 'kavyanaresh0903@gmail.com';
export const STAFF_HOSPITAL = 'Sunshine';

export class StaffLoginPage {
  constructor(private readonly page: Page) {}

  async signIn(password: string, email = STAFF_EMAIL) {
    await this.page.goto('/login/staff');
    await expect(this.page.getByRole('heading', { name: 'Find your hospital' })).toBeVisible();
    await this.page.getByPlaceholder("Start typing your hospital's name").fill(STAFF_HOSPITAL);
    await this.page.getByRole('button', { name: new RegExp(STAFF_HOSPITAL) }).first().click();
    await this.page.getByPlaceholder('Enter your email').fill(email);
    await this.page.getByPlaceholder('Enter your password').fill(password);
    const remember = this.page.getByRole('checkbox', { name: 'Remember me' });
    if (await remember.isChecked()) await remember.uncheck();
    await this.page.getByRole('button', { name: 'Sign In' }).click();

    const alreadyLoggedIn = this.page.getByRole('heading', { name: 'Already Logged In' });
    const loginError = this.page.locator('.login-error');
    await expect
      .poll(async () => {
        if (/\/staff\//.test(this.page.url())) return 'signed-in';
        if (await alreadyLoggedIn.isVisible().catch(() => false)) return 'already-logged-in';
        if (await loginError.isVisible().catch(() => false)) return 'rejected';
        return '';
      }, { timeout: 25_000 })
      .not.toBe('');

    if (await alreadyLoggedIn.isVisible().catch(() => false)) {
      await this.page.getByRole('button', { name: 'Yes, Logout & Continue' }).click();
    } else if (await loginError.isVisible().catch(() => false)) {
      throw new Error(`Sign-in was rejected: ${(await loginError.innerText()).trim()}`);
    }

    await expect(this.page).toHaveURL(/\/staff\/dashboard/, { timeout: 25_000 });
    await expect(this.page.getByRole('heading', { name: 'Dashboard' }).first()).toBeVisible();
  }
}
