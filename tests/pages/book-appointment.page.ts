import { expect, type Locator, type Page } from '@playwright/test';
import { setIsoDate } from './date-field';

export type BookedVisit = {
  patient: string;
  doctor: string;
  date: string;
  time: string;
  confirmation: string;
};

export class BookAppointmentPage {
  readonly dialogs: string[] = [];
  private readonly nextDetails: Locator;
  private readonly nextReview: Locator;

  constructor(private readonly page: Page) {
    this.page.on('dialog', async (dialog) => {
      this.dialogs.push(dialog.message());
      await dialog.accept();
    });
    this.nextDetails = page.getByRole('button', { name: 'Next: Appointment Details' });
    this.nextReview = page.getByRole('button', { name: 'Next: Review' });
  }

  async open() {
    await this.page.goto('/staff/appointments/new');
    await expect(this.page.getByRole('heading', { name: /Book New Appointment/ }).first()).toBeVisible();
  }

  async rejectEmptyPatient() {
    const before = this.dialogs.length;
    await this.nextDetails.click();
    await expect.poll(() => this.dialogs.slice(before).join('\n')).toContain('Please enter patient first name');
    await this.page.getByPlaceholder('First Name').fill('A');
    await this.nextDetails.click();
    await expect.poll(() => this.dialogs.at(-1) || '').toContain('Please enter patient last name');
    await this.page.getByPlaceholder('Last Name').fill('B');
    await this.nextDetails.click();
    await expect(this.page.getByText('Please enter a valid phone number')).toBeVisible();
    await this.page.getByPlaceholder('10-digit mobile number').fill('5123456789');
    await this.nextDetails.click();
    await expect(this.page.getByText('Please enter a valid phone number')).toBeVisible();
    await this.page.getByPlaceholder('Age').fill('0');
    await this.nextDetails.click();
    await expect(this.page.getByText(/age|Age|between 1 and 150/).first()).toBeVisible();
  }

  async selectPatient(name: string) {
    const search = this.page.getByPlaceholder('Search by name, phone, or patient ID...');
    await search.fill(name);
    const result = this.page.locator('main').getByText(new RegExp(name, 'i')).last();
    await expect(result).toBeVisible({ timeout: 20_000 });
    await result.click();
  }

  async continueToDetails() {
    await this.nextDetails.click();
    await expect(this.page.getByRole('heading', { name: 'Appointment Details' })).toBeVisible();
  }

  async expectReviewBlocked() {
    await expect(this.nextReview).toBeDisabled();
  }

  async expectReviewEnabled() {
    await expect(this.nextReview).toBeEnabled();
  }

  async selectDepartment(name: string) {
    await this.pickOption(this.page.getByRole('combobox').filter({ hasText: 'Select Department' }), name);
  }

  async setDate(isoDate: string) {
    const dateField = this.page.locator('main').locator('div').filter({ has: this.page.getByText('Date *', { exact: true }) }).last();
    await setIsoDate(dateField, isoDate);
  }

  async selectDoctor(name: string): Promise<string> {
    const doctor = this.page.getByPlaceholder('Select or search doctor...');
    await expect(doctor).toBeVisible({ timeout: 20_000 });
    await doctor.click();
    await doctor.fill(name.split(' ')[0]);
    const choice = this.page.locator('body').getByText(new RegExp(name, 'i')).last();
    await expect(choice).toBeVisible();
    const label = (await choice.innerText()).replace(/\s+/g, ' ').trim();
    await choice.click();
    return label;
  }

  async selectOpenSlot(): Promise<string> {
    const afternoon = this.page.getByRole('button', { name: /^(1[0-9]|2[0-3]):[0-5][0-9]$/ });
    const slot = (await afternoon.count())
      ? afternoon.first()
      : this.page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first();
    await expect(slot).toBeVisible({ timeout: 20_000 });
    const time = (await slot.innerText()).trim();
    await slot.click();
    return time;
  }

  async rejectInvalidCoupon(code: string) {
    await this.page.getByPlaceholder('Enter coupon code').fill(code);
    await this.page.getByRole('button', { name: 'Apply' }).click();
    await expect(this.page.getByText(/coupon|invalid|not valid|not found/i).first()).toBeVisible();
    await this.page.getByPlaceholder('Enter coupon code').fill('');
  }

  async rejectReferralWithoutDoctor() {
    const before = this.dialogs.length;
    await this.page.getByRole('checkbox', { name: /referred by a doctor/ }).check();
    await this.nextReview.click();
    await expect.poll(() => this.dialogs.slice(before).join('\n')).toContain(
      'Referring Doctor Name and Hospital Name are required',
    );
    await this.page.getByRole('checkbox', { name: /referred by a doctor/ }).uncheck();
  }

  async bookPayOnVisit(patient: string, doctorQuery: string, date: string): Promise<BookedVisit> {
    await this.selectPatient(patient);
    await this.continueToDetails();
    await this.selectDepartment('Cardiology');
    await this.setDate(date);
    const doctor = await this.selectDoctor(doctorQuery);
    const time = await this.selectOpenSlot();
    await this.page.getByPlaceholder('Brief description of the reason for appointment').fill(
      'In-person review for Ramya Amirishetti',
    );
    await this.nextReview.click();
    const proceed = this.page.getByRole('button', { name: 'Proceed to Payment' });
    const payOnVisit = this.page.getByRole('button', { name: 'Pay on Visit' });
    const confirm = this.page.getByRole('button', { name: 'Confirm & Book Appointment' });
    await expect(proceed.or(payOnVisit).or(confirm)).toBeVisible();
    if (await proceed.isVisible()) await proceed.click();
    await expect(payOnVisit.or(confirm)).toBeVisible();
    if (await payOnVisit.isVisible()) {
      await expect(this.page.getByRole('button', { name: /Pay Now/ })).toBeVisible();
      await expect(this.page.getByRole('button', { name: /Send Payment Link/ })).toBeVisible();
      await payOnVisit.click();
    } else {
      await confirm.click();
    }
    await expect.poll(() => this.dialogs.join('\n'), { timeout: 25_000 }).toMatch(/booked successfully/i);
    return {
      patient,
      doctor,
      date,
      time,
      confirmation: this.dialogs.at(-1) || '',
    };
  }

  private async pickOption(combo: Locator, option: string) {
    await expect(async () => {
      if ((await combo.getAttribute('aria-expanded')) !== 'true') await combo.click();
      await this.page.getByRole('option', { name: option, exact: true }).first().click({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
  }
}
