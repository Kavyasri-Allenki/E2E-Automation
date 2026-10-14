import { test, expect } from '../fixtures';

test.describe('Patient self-signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('WC-PAT-02 signup offers a patient account and a way back to sign-in', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome to WhiteCoats' })).toBeVisible();
    await expect(page.getByText('Choose your account type to get started')).toBeVisible();
    await expect(page.getByRole('heading', { name: "I'm a Patient" })).toBeVisible();
    await expect(
      page.getByText('Book appointments, manage health records, and connect with healthcare providers'),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Sign in here' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('WC-PAT-03 the wizard blocks an empty hospital and a nonsense search', async ({ page }) => {
    await page.getByRole('button', { name: /I'm a Patient/ }).click();
    await expect(page.getByText('Create Your Patient Account')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Choose Your Hospital' })).toBeVisible();

    for (const step of ['Hospital', 'Personal Info', 'Verify Phone', 'Consents']) {
      await expect(page.getByText(step, { exact: true })).toBeVisible();
    }

    const search = page.getByPlaceholder('Search hospital by name or city...');
    await expect(search).toBeVisible();
    await expect(page.getByText('Loading hospitals...')).toBeHidden({ timeout: 20_000 });

    await search.fill('zzzz-not-a-real-hospital');
    await expect(page.getByText('No hospitals match your search.')).toBeVisible();
    await search.fill('');

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Please select a hospital to continue')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Choose Your Hospital' })).toBeVisible();
  });

  test('WC-PAT-04 personal details are checked before any code is sent', async ({ page }) => {
    await page.getByRole('button', { name: /I'm a Patient/ }).click();
    await expect(page.getByText('Loading hospitals...')).toBeHidden({ timeout: 20_000 });

    const empty = page.getByText('No hospitals are available for registration right now.');
    if (await empty.isVisible()) {
      test.skip(true, 'No hospitals are published for self-registration right now.');
    }

    await page.locator('.form-step button').first().click();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('heading', { name: 'Personal Information' })).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Please enter your first name')).toBeVisible();

    await page.locator('input[name="firstName"]').fill('A');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('First name must be at least 2 characters')).toBeVisible();

    await page.locator('input[name="firstName"]').fill('Asha');
    await page.locator('input[name="lastName"]').fill('R');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Last name must be at least 2 characters')).toBeVisible();

    await page.locator('input[name="lastName"]').fill('Rao');
    await page.locator('input[name="email"]').fill('not-an-email');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Please enter a valid email address (e.g., example@domain.com)')).toBeVisible();

    await page.locator('input[name="email"]').fill('');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Please enter a valid 10-digit phone number')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Verify Phone' })).toBeHidden();
  });
});
