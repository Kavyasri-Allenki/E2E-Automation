import { test, expect } from '../fixtures';

const PROTECTED_ROUTES = [
  '/patient/dashboard',
  '/patient/my-appointments',
  '/patient/appointments/specializations',
  '/patient/appointments/new',
  '/patient/billing',
  '/patient/prescriptions',
  '/patient/family-members',
  '/doctor/dashboard',
  '/doctor/appointments/today',
  '/doctor/emr/cases',
  '/staff/dashboard',
  '/staff/check-in',
  '/staff/appointments/new',
  '/staff/patients/new',
  '/branch-admin/dashboard',
  '/branch-admin/appointments/new',
  '/hospital-admin/dashboard',
  '/hospital-admin/billing/invoices',
  '/hospital-admin/patients',
  '/sales/dashboard',
  '/sales/leads/new',
  '/super-admin/dashboard',
  '/super-admin/tenants',
];

test.describe('Anonymous access', () => {
  for (const path of PROTECTED_ROUTES) {
    test(`WC-SEC-01 ${path} returns an anonymous visitor to the home page`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole('heading', { name: 'Modern Healthcare Management Platform' })).toBeVisible();
      await expect(page.getByText('404 - Page Not Found')).toHaveCount(0);
    });
  }
});
