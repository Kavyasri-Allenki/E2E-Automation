import { test } from '@playwright/test';
import { signInSuperAdmin, signOutSuperAdmin } from './session';

const password = process.env.WC_SUPER_ADMIN_PASSWORD;

test('WC-SUP-LOGIN super admin can open the dashboard', async ({ page }) => {
  test.skip(!password, 'Set WC_SUPER_ADMIN_PASSWORD to run this sign-in.');

  await signInSuperAdmin(page, password!);
  await signOutSuperAdmin(page);
});
