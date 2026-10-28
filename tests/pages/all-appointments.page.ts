import { expect, type Page } from '@playwright/test';
import type { BookedVisit } from './book-appointment.page';
import { setIsoDate } from './date-field';

export class AllAppointmentsPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/staff/appointments');
    await expect(this.page.getByRole('heading', { name: 'All Appointments' }).first()).toBeVisible();
  }

  async expectVisit(visit: BookedVisit) {
    const native = this.page.locator('main input[type="date"]');
    if (await native.count()) {
      await native.nth(1).fill(visit.date);
      await native.nth(0).fill(visit.date);
    } else {
      const from = this.page.locator('main').locator('div').filter({ has: this.page.getByText('From', { exact: true }) }).last();
      const to = this.page.locator('main').locator('div').filter({ has: this.page.getByText('To', { exact: true }) }).last();
      await setIsoDate(to, visit.date);
      await setIsoDate(from, visit.date);
    }
    await this.page.getByPlaceholder('Search patient name, phone, appointment...').fill(visit.patient);
    const time = visit.time.slice(0, 5);
    const row = this.page
      .getByRole('row')
      .filter({ hasText: new RegExp(visit.patient.split(' ')[0], 'i') })
      .filter({ hasText: time });
    await expect(row.first()).toBeVisible({ timeout: 20_000 });
    await expect(row.first()).toContainText(/Kavyaa Allenki/i);
  }
}
