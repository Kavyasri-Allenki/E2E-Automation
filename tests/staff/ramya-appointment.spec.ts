import { expect, test } from '@playwright/test';
import { AllAppointmentsPage } from '../pages/all-appointments.page';
import { BillingInvoicesPage } from '../pages/billing-invoices.page';
import { BookAppointmentPage } from '../pages/book-appointment.page';
import { PendingPaymentsPage } from '../pages/pending-payments.page';
import { StaffLoginPage } from '../pages/staff-login.page';

const password = process.env.WC_STAFF_PASSWORD;
const patient = 'Ramya Amirishetti';
const doctor = 'Kavyaa Allenki';

function isoDate(daysAhead: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

test.use({
  video: 'on',
  viewport: { width: 1280, height: 800 },
  launchOptions: { slowMo: 200 },
});

test.describe('Ramya Amirishetti visit with Dr. Kavyaa Allenki', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!password, 'Set WC_STAFF_PASSWORD to book a staff appointment.');

  test.beforeEach(async ({ page }) => {
    await page.addLocatorHandler(page.getByRole('heading', { name: 'Enable Notifications' }), async () => {
      await page.getByRole('button', { name: 'Not Now' }).click();
    });
  });

  test('negative booking rejects an incomplete patient, schedule, coupon, and referral', async ({ page }) => {
    test.setTimeout(4 * 60_000);
    const login = new StaffLoginPage(page);
    const booking = new BookAppointmentPage(page);
    await login.signIn(password!);
    await booking.open();
    await booking.rejectEmptyPatient();
    await booking.selectPatient(patient);
    await booking.continueToDetails();
    await booking.expectReviewBlocked();
    await booking.setDate(isoDate(6));
    await booking.expectReviewBlocked();
    await booking.selectDepartment('Cardiology');
    await booking.selectDoctor(doctor);
    await booking.expectReviewBlocked();
    const time = await booking.selectOpenSlot();
    await booking.expectReviewEnabled();
    await booking.rejectInvalidCoupon('NOT-A-REAL-CODE');
    await booking.rejectReferralWithoutDoctor();
    test.info().annotations.push({ type: 'unchecked-slot', description: `${isoDate(6)} ${time}` });
    await expect(page).toHaveURL(/\/staff\/appointments\/new/);
  });

  test('positive booking is listed under appointments, invoices, and pending payments', async ({ page }) => {
    test.setTimeout(6 * 60_000);
    const visitDate = isoDate(7);
    const login = new StaffLoginPage(page);
    const booking = new BookAppointmentPage(page);
    const appointments = new AllAppointmentsPage(page);
    const invoices = new BillingInvoicesPage(page);
    const pending = new PendingPaymentsPage(page);

    await login.signIn(password!);
    await booking.open();
    const visit = await booking.bookPayOnVisit(patient, doctor, visitDate);
    test.info().annotations.push({ type: 'visit', description: `${visit.date} ${visit.time} ${visit.confirmation}` });

    await appointments.open();
    await appointments.expectVisit(visit);
    await invoices.open();
    await invoices.expectVisitInvoice(visit);
    await pending.open();
    await pending.expectPendingVisit(visit);
  });
});
