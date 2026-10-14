import { test, expect } from '../fixtures';

const PICKER_ROLES = [
  { label: 'Super Admin', name: /Super Admin Platform-wide management/ },
  { label: 'Hospital Admin', name: /Hospital Admin Hospital operations/ },
  { label: 'Branch Admin', name: /Branch Admin Branch management/ },
  { label: 'Doctor', name: /Doctor Patient care & EMR/ },
  { label: 'Staff', name: /Staff Appointments & registration/ },
  { label: 'Patient', name: /Patient Book appointments & view records/ },
] as const;

const EMAIL_PORTALS = [
  {
    label: 'Super Admin',
    name: /Super Admin Platform-wide management/,
    path: '/login/super-admin',
    title: 'Super Admin Portal',
    subtitle: 'Platform-wide management access',
  },
  {
    label: 'Hospital Admin',
    name: /Hospital Admin Hospital operations/,
    path: '/login/hospital-admin',
    title: 'Hospital Admin Portal',
    subtitle: 'Hospital operations management',
  },
] as const;

const HOSPITAL_GATED = [
  { label: 'Branch Admin', path: '/login/branch-admin', role: 'Branch Admin' },
  { label: 'Doctor', path: '/login/doctor', role: 'Doctor' },
  { label: 'Staff', path: '/login/staff', role: 'Staff' },
] as const;

async function openPortalPicker(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('nav.navbar').getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByRole('heading', { name: 'Select Your Portal' })).toBeVisible();
  await expect(page.getByText('Choose how you want to sign in')).toBeVisible();
}

test.describe('Sign-in portals', () => {
  test('WC-AUTH-01 the portal picker lists every role', async ({ page }) => {
    await openPortalPicker(page);
    for (const role of PICKER_ROLES) {
      await expect(page.getByRole('button', { name: role.name })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /Sales/ })).toHaveCount(0);
    await expect(page.getByText('Platform-wide management')).toBeVisible();
    await expect(page.getByText('Book appointments & view records')).toBeVisible();
  });

  for (const portal of EMAIL_PORTALS) {
    test(`WC-AUTH-02 ${portal.title} collects email and password`, async ({ page }) => {
      await openPortalPicker(page);
      await page.getByRole('button', { name: portal.name }).click();
      await expect(page).toHaveURL(new RegExp(`${portal.path}$`));
      await expect(page.getByRole('heading', { name: portal.title })).toBeVisible();
      await expect(page.getByText(portal.subtitle)).toBeVisible();
      await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
      await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
      await expect(page.getByRole('checkbox', { name: 'Remember me' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });
  }

  for (const portal of HOSPITAL_GATED) {
    test(`WC-AUTH-03 ${portal.role} must pick a hospital before credentials`, async ({ page }) => {
      const directory = page.waitForResponse(
        (response) =>
          response.url().includes('/auth/hospital/hospitals') && response.request().method() === 'GET',
      );
      await page.goto(portal.path);
      const response = await directory;

      await expect(page.getByRole('heading', { name: 'Find your hospital' })).toBeVisible();
      await expect(
        page.getByText(`Search for your hospital to continue signing in as ${portal.role}`),
      ).toBeVisible();
      expect(response.status(), `hospital directory returned ${response.status()}`).toBeLessThan(400);

      const search = page.getByPlaceholder("Start typing your hospital's name");
      await search.fill('zzzz-not-a-real-hospital');
      await expect(page.getByText('No hospitals found matching "zzzz-not-a-real-hospital".')).toBeVisible();
      await expect(page.getByPlaceholder('Enter your email')).toHaveCount(0);
    });
  }

  test('WC-AUTH-04 a badly formed email never leaves the browser', async ({ page }) => {
    await page.goto('/login/hospital-admin');
    const email = page.getByPlaceholder('Enter your email');

    await email.fill('');
    await email.blur();
    await expect(page.getByText('Email is required')).toBeVisible();

    await email.fill('not-an-email');
    await email.blur();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();

    await page.getByPlaceholder('Enter your password').fill('not-submitted');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    await expect(page).toHaveURL(/\/login\/hospital-admin$/);
  });

  test('WC-AUTH-05 the password can be shown and hidden', async ({ page }) => {
    await page.goto('/login/super-admin');
    const password = page.getByPlaceholder('Enter your password');
    await password.fill('visible-only-in-this-field');
    await expect(password).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(password).toHaveAttribute('type', 'password');
  });

  test('WC-AUTH-06 Back returns to the marketing home', async ({ page }) => {
    await page.goto('/login/sales');
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Modern Healthcare Management Platform' })).toBeVisible();
  });

  test('WC-AUTH-02 Sales Portal collects email and password', async ({ page }) => {
    await page.goto('/login/sales');
    await expect(page.getByRole('heading', { name: 'Sales Portal' })).toBeVisible();
    await expect(page.getByText('Leads, conversions & follow-ups')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Remember me' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('WC-AUTH-07 forgot-password asks for an email before it sends anything', async ({ page }) => {
    await page.goto('/login/hospital-admin');
    const forgot = page.getByRole('link', { name: 'Forgot password?' });
    await expect(forgot).toHaveAttribute('href', '/forgot-password');
    await page.getByPlaceholder('Enter your email').blur();
    await expect(page.getByText('Email is required')).toBeVisible();
    await forgot.click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole('heading', { name: 'Forgot Password' })).toBeVisible();
    await expect(page.getByText("Enter your email address and we'll send you instructions to reset your password.")).toBeVisible();

    await page.getByRole('button', { name: 'Send Reset Instructions' }).click();
    await expect(page.getByText('Please enter your email address')).toBeVisible();
    await expect(page).toHaveURL(/\/forgot-password$/);

    await page.getByRole('link', { name: 'Sign in here' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('WC-AUTH-08 reset-password without a token does not call the API', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { name: 'Invalid Reset Link' })).toBeVisible();
    await expect(
      page.getByText('This password reset link is invalid or has expired. Please request a new password reset.'),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Request New Reset Link' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole('heading', { name: 'Forgot Password' })).toBeVisible();
  });

  test('WC-AUTH-09 /login returns home and /register opens signup', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Modern Healthcare Management Platform' })).toBeVisible();

    await page.goto('/register');
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole('heading', { name: 'Welcome to WhiteCoats' })).toBeVisible();
  });
});

test.describe('Patient sign-in shell', () => {
  test('WC-PAT-01 Send OTP stays off until the mobile number has 10 digits', async ({ page }) => {
    await page.goto('/');
    await page.locator('nav.navbar').getByRole('button', { name: 'Sign In' }).click();
    await page.getByRole('button', { name: /Patient Book appointments/ }).click();

    await expect(page).toHaveURL(/\/login\/patient$/);
    await expect(page.getByRole('heading', { name: 'Patient Login' })).toBeVisible();
    await expect(page.getByText('Sign in with mobile number')).toBeVisible();
    await expect(page.locator('.country-code')).toHaveText('+91');

    const send = page.getByRole('button', { name: 'Send OTP' });
    const mobile = page.getByPlaceholder('Enter 10-digit mobile number');
    await expect(send).toBeDisabled();

    await mobile.fill('12345');
    await expect(send).toBeDisabled();

    await mobile.fill('1234567890');
    await expect(send).toBeEnabled();

    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/\/signup\?role=patient$/);
    await expect(page.getByText('Create Your Patient Account')).toBeVisible();
  });
});
