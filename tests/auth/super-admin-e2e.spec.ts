import { expect, test, type Page } from '@playwright/test';
import { signInSuperAdmin, signOutSuperAdmin } from './session';

const password = process.env.WC_SUPER_ADMIN_PASSWORD;

type Screen = {
  menu: string;
  child?: string;
  path: string;
  heading: RegExp;
};

const screens: Screen[] = [
  { menu: 'Dashboard', path: '/super-admin/dashboard', heading: /^Dashboard$/ },
  { menu: 'Tenants', path: '/super-admin/tenants', heading: /Tenant/ },
  { menu: 'Service Management', path: '/super-admin/services', heading: /Service/ },
  { menu: 'Subscription Plans', path: '/super-admin/subscriptions', heading: /Subscription|Plan/ },
  { menu: 'Billing & Payments', child: 'All Payments', path: '/super-admin/billing', heading: /Payment|Billing/ },
  { menu: 'Billing & Payments', child: 'Billing Summary Report', path: '/super-admin/billing/summary-report', heading: /Billing|Summary|Report/ },
  { menu: 'Proforma Invoice', path: '/super-admin/proforma-invoices', heading: /Proforma|Invoice/ },
  { menu: 'Employee Management', child: 'All Users', path: '/super-admin/users', heading: /User|Employee/ },
  { menu: 'Employee Management', child: 'Roles & Permissions', path: '/super-admin/roles', heading: /Role/ },
  { menu: 'Employee Management', child: 'Departments', path: '/super-admin/departments', heading: /Department/ },
  { menu: 'Analytics', path: '/super-admin/analytics', heading: /Analytics/ },
  { menu: 'System Health', path: '/super-admin/system-health', heading: /Health|System/ },
  { menu: 'Reports', child: 'Revenue Reports', path: '/super-admin/revenue', heading: /Revenue|Report/ },
  { menu: 'Reports', child: 'Online Payments', path: '/super-admin/revenue/online-payments', heading: /Payment|Online/ },
  { menu: 'Support & Helpdesk', child: 'Support Dashboard', path: '/super-admin/support/dashboard', heading: /Support/ },
  { menu: 'Support & Helpdesk', child: 'Ticket Management', path: '/super-admin/support/tickets', heading: /Ticket/ },
  { menu: 'Documents', child: 'API URLs', path: '/super-admin/documents/api-urls', heading: /API|URL/ },
  { menu: 'Documents', child: 'User Manual', path: '/super-admin/documents/user-manual', heading: /Manual|Document/ },
  { menu: 'System Settings', child: 'General', path: '/super-admin/settings/general', heading: /General|Setting/ },
  { menu: 'System Settings', child: 'Email', path: '/super-admin/settings/email', heading: /Email/ },
  { menu: 'System Settings', child: 'Notifications', path: '/super-admin/settings/notifications', heading: /Notification/ },
  { menu: 'System Settings', child: 'Security', path: '/super-admin/settings/security', heading: /Security/ },
  { menu: 'System Settings', child: 'Payment Gateway', path: '/super-admin/settings/payment', heading: /Payment|Gateway/ },
  { menu: 'System Settings', child: 'SMS Template Tester', path: '/super-admin/settings/sms-tester', heading: /SMS|Template/ },
  { menu: 'System Settings', child: 'My Account', path: '/super-admin/settings/my-account', heading: /Account|Profile|My/ },
];

function menuButton(page: Page, label: string) {
  return page.getByRole('navigation').getByRole('button', { name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
}

async function openScreen(page: Page, screen: Screen) {
  if (screen.child) {
    const parent = menuButton(page, screen.menu).first();
    const child = menuButton(page, screen.child).first();
    if (!(await child.isVisible().catch(() => false))) {
      const expanded = (await parent.getAttribute('class'))?.includes('expanded') ?? false;
      if (!expanded) await parent.click();
      try {
        await expect(child).toBeVisible({ timeout: 3_000 });
      } catch {
        await parent.click();
        await expect(child).toBeVisible();
      }
    }
    await child.click();
  } else {
    await menuButton(page, screen.menu).first().click();
  }

  await expect(page).toHaveURL(new RegExp(`${screen.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\?)`), { timeout: 20_000 });
  await expect(page.getByText(/404 - Page Not Found|Something went wrong|Unexpected Application Error/)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: screen.heading }).first()).toBeVisible();
}

test('WC-SUP-E2E super admin can move through the workspace', async ({ page }) => {
  test.skip(!password, 'Set WC_SUPER_ADMIN_PASSWORD to run this sign-in.');
  test.setTimeout(240_000);

  await signInSuperAdmin(page, password!);
  await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Key Performance Indicators' })).toBeVisible();
  await expect(page.getByText('Super Administrator').first()).toBeVisible();

  for (const screen of screens) {
    await test.step(screen.child ? `${screen.menu} / ${screen.child}` : screen.menu, async () => {
      await openScreen(page, screen);
    });
  }

  await test.step('Tenants list can be searched and the add form closes without saving', async () => {
    await openScreen(page, screens.find((screen) => screen.path === '/super-admin/tenants')!);
    const search = page.getByPlaceholder('Search by name, subdomain, email, or category...');
    await search.fill('zzzz-not-a-real-tenant');
    await expect(page.getByRole('cell', { name: 'New Mobile', exact: true })).toHaveCount(0);
    await search.fill('');
    await expect(page.getByRole('cell', { name: 'New Mobile', exact: true })).toBeVisible();

    const addTenant = page.getByRole('button', { name: /Add Tenant/ });
    await addTenant.click();
    await expect(page.getByRole('button', { name: 'Create with Payment Now' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Generate Payment Link' })).toBeVisible();
    await page.locator('.tp-primary-action > div').first().click({ position: { x: 8, y: 8 } });
    await expect(page.getByRole('button', { name: 'Create with Payment Now' })).toBeHidden();

    await page.getByRole('button', { name: '👁️' }).first().click();
    const details = page.getByRole('heading', { name: /Tenant Details/ });
    await expect(details).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible();
    await expect(page.getByText('new.whitecoats.com').first()).toBeVisible();
    await page.getByRole('button', { name: '✕' }).click();
    await expect(details).toBeHidden();
    await expect(page).toHaveURL(/\/super-admin\/tenants/);
  });

  await signOutSuperAdmin(page);
  await page.goto('/super-admin/dashboard');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Modern Healthcare Management Platform' })).toBeVisible();
});
