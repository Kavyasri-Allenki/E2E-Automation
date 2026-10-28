import { expect, type Page } from '@playwright/test';
import type { BookedVisit } from './book-appointment.page';
import { setIsoDate } from './date-field';

export class BillingInvoicesPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/staff/billing');
    await expect(this.page.getByRole('heading', { name: /Billing & Invoices/ }).first()).toBeVisible();
  }

  async expectVisitInvoice(visit: BookedVisit) {
    const today = new Date().toISOString().slice(0, 10);
    const native = this.page.locator('main input[type="date"]');
    if (await native.count()) {
      await native.nth(1).fill(today);
      await native.nth(0).fill(today);
    } else if (await this.page.locator('main .wc-datepicker-trigger').count()) {
      const from = this.page.locator('main').locator('div').filter({ has: this.page.getByText('From', { exact: true }) }).last();
      const to = this.page.locator('main').locator('div').filter({ has: this.page.getByText('To', { exact: true }) }).last();
      await setIsoDate(to, today);
      await setIsoDate(from, today);
    }
    await this.page.getByPlaceholder('Search by invoice number, patient name, or ID...').fill(visit.patient);
    const time = visit.time.slice(0, 5);
    const row = this.page
      .getByRole('row')
      .filter({ hasText: new RegExp(visit.patient.split(' ')[0], 'i') })
      .filter({ hasText: time });
    await expect(row.first()).toBeVisible({ timeout: 20_000 });
    await expect(row.first()).toContainText(/due|pending|unpaid/i);
  }
}
