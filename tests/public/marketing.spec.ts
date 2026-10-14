import { test, expect } from '../fixtures';

const FEATURES = [
  {
    title: 'Smart Appointments',
    description: 'AI-powered scheduling that optimizes doctor time and reduces patient wait times by 60%.',
  },
  {
    title: 'Electronic Medical Records',
    description: 'Comprehensive digital health records with instant access and military-grade security.',
  },
  {
    title: 'Telemedicine',
    description: 'HD video consultations with integrated prescriptions and payment processing.',
  },
  {
    title: 'Analytics & Insights',
    description: 'Real-time dashboards and predictive analytics to optimize hospital operations.',
  },
  {
    title: 'Billing & Payments',
    description: 'Automated invoicing, insurance claims, and seamless payment collection.',
  },
  {
    title: 'Lab & Pharmacy',
    description: 'Integrated lab orders, results tracking, and pharmacy inventory management.',
  },
];

test.describe('Marketing home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('WC-MKT-01 the home page introduces the platform', async ({ page }) => {
    await expect(page).toHaveTitle(/WhiteCoats \| Healthcare Management Platform/);
    await expect(page.getByRole('heading', { level: 1, name: 'Modern Healthcare Management Platform' })).toBeVisible();
    await expect(page.getByText('Trusted by 500+ Healthcare Providers')).toBeVisible();
    await expect(
      page.getByText('From appointments to billing, EMR to telemedicine'),
    ).toBeVisible();

    for (const stat of ['500+', 'Hospitals', '2M+', 'Patients Served', '15K+', 'Doctors', '99.9%', 'Uptime']) {
      await expect(page.getByText(stat, { exact: true }).first()).toBeVisible();
    }

    await expect(page.getByRole('heading', { name: 'Loved by Healthcare Leaders' })).toBeVisible();
    await expect(page.getByText('Dr. Rajesh Kumar')).toBeVisible();
    await expect(page.getByText('Dr. Priya Sharma')).toBeVisible();
    await expect(page.getByText('Amit Patel')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ready to Transform Your Hospital?' })).toBeVisible();
    await expect(page.getByText('© 2024 WhiteCoats Healthcare Solutions. All rights reserved.')).toBeVisible();
  });

  test('WC-MKT-02 every product area is listed', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Everything You Need to Run Your Hospital' })).toBeVisible();
    for (const feature of FEATURES) {
      await expect(page.getByRole('heading', { name: feature.title })).toBeVisible();
      await expect(page.getByText(feature.description)).toBeVisible();
    }
  });

  test('WC-MKT-03 header links move to features and testimonials', async ({ page }) => {
    await page.locator('nav').getByRole('link', { name: 'Features' }).click();
    await expect(page.locator('#features')).toBeInViewport();

    await page.locator('nav').getByRole('link', { name: 'Testimonials' }).click();
    await expect(page.locator('#testimonials')).toBeInViewport();
  });

  test('WC-MKT-04 footer groups product, company, and support links', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByRole('heading', { name: 'Product' })).toBeVisible();
    await expect(footer.getByRole('heading', { name: 'Company' })).toBeVisible();
    await expect(footer.getByRole('heading', { name: 'Support' })).toBeVisible();
    for (const label of ['Features', 'Pricing', 'Integrations', 'Security', 'About Us', 'Careers', 'Blog', 'Contact', 'Help Center', 'Documentation', 'Training', 'System Status']) {
      await expect(footer.getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('WC-MKT-05 an unknown path shows the not-found page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.getByText('404 - Page Not Found')).toBeVisible();
  });

  test('WC-MKT-06 trial and demo calls to action are on the page', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Start Free Trial' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Watch Demo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Schedule a Demo' })).toBeVisible();

    await page.getByRole('button', { name: 'Start Free Trial' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Modern Healthcare Management Platform' })).toBeVisible();
  });
});

test.describe('Marketing home on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('WC-MKT-07 the phone menu reaches features and sign-in', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav').getByRole('link', { name: 'Features' })).toBeHidden();

    await page.getByRole('button', { name: 'Toggle menu' }).click();
    const menu = page.locator('.mobile-menu');
    await expect(menu.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Testimonials' })).toBeVisible();
    await expect(menu.getByRole('button', { name: 'Sign In' })).toBeVisible();

    await menu.getByRole('link', { name: 'Features' }).click();
    await expect(page.locator('#features')).toBeInViewport();
    await expect(menu).toBeHidden();
  });
});
