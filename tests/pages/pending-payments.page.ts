import { expect, type Page } from '@playwright/test';
import type { BookedVisit } from './book-appointment.page';

export class PendingPaymentsPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/staff/billing/pending');
    await expect(this.page.getByRole('heading', { name: /Pending Payments/ }).first()).toBeVisible();
  }

  async expectPendingVisit(visit: BookedVisit) {
    const search = this.page.getByPlaceholder(/search/i).first();
    if (await search.count()) await search.fill(visit.patient);
    const time = visit.time.slice(0, 5);
    const byTime = this.page
      .getByRole('row')
      .filter({ hasText: new RegExp(visit.patient.split(' ')[0], 'i') })
      .filter({ hasText: time });
    const byName = this.page.getByText(new RegExp(visit.patient, 'i'));
    if (await byTime.count()) {
      await expect(byTime.first()).toBeVisible({ timeout: 20_000 });
      return;
    }
    await expect(byName.first()).toBeVisible({ timeout: 20_000 });
  }
}
