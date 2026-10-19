import { expect, test, type Locator, type Page } from '@playwright/test';
import { STAFF_EMAIL, STAFF_HOSPITAL, signInStaff, signOutStaff } from './staff-session';

const password = process.env.WC_STAFF_PASSWORD;

const screens: { path: string; heading: RegExp }[] = [
  { path: '/staff/dashboard', heading: /Dashboard/ },
  { path: '/staff/check-in', heading: /Check-In/ },
  { path: '/staff/appointments', heading: /All Appointments/ },
  { path: '/staff/appointments/today', heading: /Today/ },
  { path: '/staff/appointments/new', heading: /Book New Appointment/ },
  { path: '/staff/appointments/reschedule', heading: /Reschedule/ },
  { path: '/staff/appointments/cancel', heading: /Cancel/ },
  { path: '/staff/appointments/follow-ups', heading: /Follow/ },
  { path: '/staff/patients', heading: /Patient/ },
  { path: '/staff/patients/new', heading: /Register New Patient/ },
  { path: '/staff/patients/search', heading: /Search/ },
  { path: '/staff/billing', heading: /Billing/ },
  { path: '/staff/billing/new', heading: /Create New Invoice/ },
  { path: '/staff/billing/pending', heading: /Pending Payments/ },
  { path: '/staff/billing/refunds', heading: /Refund/ },
  { path: '/staff/insurance', heading: /Insurance Verification/ },
  { path: '/staff/support/dashboard', heading: /Support/ },
  { path: '/staff/support/tickets', heading: /Ticket/ },
  { path: '/staff/profile', heading: /My Profile/ },
];

function isoDate(daysAhead: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function stamp() {
  return Date.now().toString();
}

async function pickOption(page: Page, combo: Locator, option: string | RegExp) {
  await expect(async () => {
    if ((await combo.getAttribute('aria-expanded')) !== 'true') await combo.click();
    const choice = page.getByRole('option', { name: option, exact: typeof option === 'string' }).first();
    await choice.click({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

test.describe('Staff EMR on emr.whitecoats.com', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!password, 'Set WC_STAFF_PASSWORD to run the staff EMR suite.');

  test('WC-STF-AUTH staff sign-in fields reject bad input and then open the dashboard', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/login/staff');
    await expect(page.getByRole('heading', { name: 'Find your hospital' })).toBeVisible();
    const search = page.getByPlaceholder("Start typing your hospital's name");
    await search.fill('zzzz-not-a-real-hospital');
    await expect(page.getByText('No hospitals found matching "zzzz-not-a-real-hospital".')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toHaveCount(0);

    await search.fill(STAFF_HOSPITAL);
    await page.getByRole('button', { name: new RegExp(STAFF_HOSPITAL) }).first().click();
    const email = page.getByPlaceholder('Enter your email');
    const secret = page.getByPlaceholder('Enter your password');
    await expect(page.getByRole('checkbox', { name: 'Remember me' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();

    await email.fill('');
    await email.blur();
    await expect(page.getByText('Email is required')).toBeVisible();
    await email.fill('not-an-email');
    await email.blur();
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    await secret.fill('not-submitted');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/login\/staff/);

    await secret.fill('visible-only-in-this-field');
    await expect(secret).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(secret).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(secret).toHaveAttribute('type', 'password');

    await email.fill(STAFF_EMAIL);
    await secret.fill('definitely-not-the-password');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.locator('.login-error')).toContainText(/invalid credentials/i);
    await expect(page).toHaveURL(/\/login\/staff/);

    await signInStaff(page, password!);
    await expect(page.getByRole('img', { name: 'Sunshine Logo' })).toBeVisible();
    await expect(page.getByText('Gatchibowli Main Center').first()).toBeVisible();
    await expect(page.getByText('Nanii Nani').first()).toBeVisible();
    await signOutStaff(page);
    await page.goto('/staff/dashboard');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Modern Healthcare Management Platform' })).toBeVisible();
  });

  test('WC-STF-E2E staff can register, book, reschedule, invoice, and take cash', async ({ page }) => {
    test.setTimeout(12 * 60_000);
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.accept();
    });

    const id = stamp().slice(-8);
    const phone = `9${stamp().slice(-9)}`;
    const emergencyPhone = `8${stamp().slice(-9)}`;
    const aadhar = `8${stamp().slice(-11)}`;
const alphabet = 'ABCDEFGHIJ';
  const nameSuffix = stamp().slice(-4).split('').map((digit) => alphabet[Number(digit)]).join('');
  const firstName = 'Testchart';
  const lastName = `Probe${nameSuffix}`;
    const patientName = `${firstName} ${lastName}`;
    const bookDate = isoDate(3);
    const rescheduleDate = isoDate(4);

    await test.step('Sign in as staff at Sunshine', async () => {
      await signInStaff(page, password!);
      await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();
      await expect(page.getByText('Today\'s Appointments Summary')).toBeVisible();
    });

    await test.step('Every staff page opens and is not a 404', async () => {
      for (const screen of screens) {
        await page.goto(screen.path);
        await expect(page).toHaveURL(new RegExp(`${screen.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\?)`));
        await expect(page.getByText('404 - Page Not Found')).toHaveCount(0);
        await expect(page.getByRole('heading', { name: screen.heading }).first()).toBeVisible();
      }
    });

    await test.step('Profile, insurance, support, check-in, and list filters respond', async () => {
      await page.goto('/staff/profile');
      await expect(page.getByText(STAFF_EMAIL)).toBeVisible();
      await expect(page.getByText('Name, email, phone number, and Aadhaar details cannot be changed here.')).toBeVisible();
      await page.getByRole('button', { name: 'Edit Profile' }).click();
      await expect(page.getByRole('button', { name: /Cancel|Close|Back/ }).first()).toBeVisible();
      await page.getByRole('button', { name: /Cancel|Close/ }).first().click();

      await page.goto('/staff/insurance');
      await page.getByRole('button', { name: /Verify Eligibility/ }).click();
      await expect.poll(() => dialogs.join('\n')).toContain('Please enter a Patient ID or Policy Number');
      await page.getByPlaceholder('Enter patient ID').fill(`NO-SUCH-${id}`);
      await page.getByRole('button', { name: /Verify Eligibility/ }).click();
      await expect(page.getByText(/not found|Failed to verify|Not Eligible|No recent/i).first()).toBeVisible();
      await page.getByRole('button', { name: 'Clear' }).click();
      await expect(page.getByPlaceholder('Enter patient ID')).toHaveValue('');

      await page.goto('/staff/support/tickets');
      await page.getByPlaceholder('Search tickets by ID or subject...').fill('zzzz-no-ticket');
      await expect(page.getByText('GA-SUP-26-4')).toBeHidden();
      await page.getByPlaceholder('Search tickets by ID or subject...').fill('');
      await expect(page.getByText('GA-SUP-26-4')).toBeVisible();
      await page.getByRole('button', { name: 'Create New Ticket' }).click();
      await expect(page.getByRole('heading', { name: 'Create New Support Ticket' })).toBeVisible();
      const createTicket = page.getByRole('button', { name: 'Create Ticket' });
      await createTicket.click();
      await expect(page.getByText('Please enter a subject')).toBeVisible();
      await page.getByPlaceholder('Brief description of the issue').fill('Field check only');
      await createTicket.click();
      await expect(page.getByText('Please select a category')).toBeVisible();
      await page.getByRole('combobox').filter({ hasText: 'Select category' }).click();
      const category = page.getByRole('option').filter({ hasNotText: /select/i }).first();
      await expect(category).toBeVisible();
      await category.click();
      await createTicket.click();
      await expect(page.getByText('Please enter a description')).toBeVisible();
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('heading', { name: 'Create New Support Ticket' })).toBeHidden();

      await page.goto('/staff/check-in');
      await expect(page.getByText("Today's Patients")).toBeVisible();
      await page.goto('/staff/appointments');
      await expect(page.getByText('Total')).toBeVisible();
      await page.goto('/staff/billing/refunds');
      await expect(page.getByText('Refunds Management')).toBeVisible();
    });

    await test.step('Register Patient rejects each invalid field, then saves a new chart', async () => {
      await page.goto('/staff/patients/new');
      await expect(page.getByText('Registering at Branch')).toBeVisible();
      await expect(page.getByText('Gatchibowli Main Center').first()).toBeVisible();

      const first = page.getByPlaceholder('Enter first name');
      const last = page.getByPlaceholder('Enter last name');
      const age = page.getByPlaceholder('Enter age (1-150)');
      const aadharField = page.getByPlaceholder('12-digit Aadhar number');
      const phoneField = page.getByPlaceholder('10-digit mobile number');
      const email = page.getByPlaceholder('email@example.com (optional)');
      const register = page.getByRole('button', { name: 'Register Patient', exact: true });

      await first.click();
      await first.blur();
      await expect(page.getByText('First name is required')).toBeVisible();
      await register.click();
      await expect(page.getByText('Please fill in all required fields')).toBeVisible();
      await expect(page.getByText('Last name is required')).toBeVisible();
      await expect(page.getByText('Phone is required')).toBeVisible();
      await expect(page.getByText('Age is required').first()).toBeVisible();

      await first.fill('A1');
      await last.fill('Q');
      await phoneField.fill('90000');
      await age.fill('0');
      await expect(page.getByText('Age must be between 1 and 150')).toBeVisible();
      await age.fill('151');
      await expect(page.getByText('Age must be between 1 and 150')).toBeVisible();
      await age.fill('10');
      await register.click();
      await expect(page.getByText('Guardian name is required for patients under 18')).toBeVisible();
      await expect(page.getByText('Guardian phone is required for patients under 18')).toBeVisible();
      await expect(page.getByText('Guardian relationship is required for patients under 18')).toBeVisible();
      await expect(page.getByText('Guardian consent is mandatory for patients under 18')).toBeVisible();

      await age.fill('34');
      await expect(age).toHaveValue('34');
      await aadharField.fill('12ab');
      await expect(aadharField).toHaveValue('12');
      await expect(page.getByText('Aadhar must be exactly 12 digits (2/12 entered)')).toBeVisible();
      await aadharField.fill(aadhar);
      await register.click();
      await expect(page.getByText('Patient source is required')).toBeVisible();

      await pickOption(page, page.getByRole('combobox').filter({ hasText: 'Select Source' }), 'Referral-Doctor');
      await expect(page.getByPlaceholder('Doctor/Hospital/Patient name')).toBeVisible();
      await pickOption(page, page.getByRole('combobox').filter({ hasText: 'Referral-Doctor' }), 'Walk-in');
      await register.click();
      await expect(page.getByText('Patient consent is required. Please confirm that the patient has provided consent before registering.')).toBeVisible();

      await page.getByRole('checkbox').check();
      await email.fill('not-an-email');
      await phoneField.fill('5123456789');
      await register.click();
      await expect(page.getByText('Must contain only letters').first()).toBeVisible();
      await expect(page.getByText('Must be at least 2 characters').first()).toBeVisible();
      await expect(page.getByText('Phone number must start with 6, 7, 8, or 9').first()).toBeVisible();
      await expect(page.getByText('Email must contain @').first()).toBeVisible();

      await first.fill(firstName);
      await last.fill(lastName);
      await phoneField.fill(phone);
      await email.fill('');
      await pickOption(page, page.getByRole('combobox').nth(0), 'Female');
      await pickOption(page, page.getByRole('combobox').filter({ hasText: 'Select...' }), /^A\+$/);
      await page.getByPlaceholder('14-digit ABHA number').fill('12ab34');
      await expect(page.getByPlaceholder('14-digit ABHA number')).toHaveValue('1234');
      await page.getByPlaceholder('14-digit ABHA number').fill('12345678901234');
      await page.getByPlaceholder('Street address').fill('12 Test Lane, Gachibowli');
      await pickOption(page, page.getByRole('combobox').filter({ hasText: 'Select State' }), 'Telangana');
      const cityCombo = page.getByRole('combobox').filter({ hasText: 'Select City/District' });
      if (await cityCombo.count()) {
        await cityCombo.click();
        const hyderabad = page.getByRole('option', { name: 'Hyderabad', exact: true });
        if (await hyderabad.count()) await hyderabad.click();
        else await page.getByRole('option').nth(1).click();
      } else {
        await page.getByPlaceholder('City').fill('Hyderabad');
      }
      await page.getByPlaceholder('Zip/PIN Code').fill('500032');
      await page.getByPlaceholder('Emergency contact name').fill('Ada Probe');
      await page.getByPlaceholder('Phone number').fill(emergencyPhone);
      await pickOption(page, page.getByRole('combobox').filter({ hasText: 'Select Relation' }), 'Spouse');
      await page.getByPlaceholder(/Primary reason for visit/).fill('Routine checkup');
      await page.getByPlaceholder(/Describe symptoms/).fill('Functional test visit. No clinical complaint.');
      await page.getByPlaceholder(/existing medical conditions/).fill('None recorded for this test chart.');
      await page.getByPlaceholder(/Penicillin/).fill('None');
      await page.getByPlaceholder('List current medications').fill('None');
      await page.getByPlaceholder(/Star Health/).fill('Test Cover');
      await page.getByPlaceholder('Insurance policy number').fill(`POL-${id}`);
      await page.getByPlaceholder(/Coverage\/eligibility amount/).fill('1000');

      await expect(page.getByText('Checking for existing patient...')).toBeHidden();
      await register.click();
      await expect(page.getByText(/Patient registered successfully/)).toBeVisible({ timeout: 20_000 });
      await expect(page).toHaveURL(/\/staff\/patients(?:$|\?)/, { timeout: 20_000 });
    });

    await test.step('The new patient is searchable', async () => {
      await page.goto('/staff/patients/search');
      await page.getByPlaceholder('Enter name...').fill('1');
      await page.getByPlaceholder('Enter ID...').fill(`NO-SUCH-${id}`);
      await page.getByPlaceholder('Enter email...').fill('not-an-email');
      await page.getByPlaceholder('Min age').fill('200');
      await page.getByPlaceholder('Max age').fill('1');
      await page.getByRole('button', { name: 'Search Patients' }).click();
      await expect(page.getByText(patientName)).toHaveCount(0);
      await page.getByRole('button', { name: 'Reset' }).click();
      await expect(page.getByPlaceholder('Enter name...')).toHaveValue('');
      await page.getByPlaceholder('Enter phone...').fill(phone);
      await page.getByRole('button', { name: 'Search Patients' }).click();
      await expect(page.getByText(patientName).first()).toBeVisible();
      await expect(page.getByText(phone).first()).toBeVisible();
    });

    await test.step('Book an in-person visit with the Kavya doctor', async () => {
      await page.goto('/staff/appointments/new');
      await page.getByRole('button', { name: 'Next: Appointment Details' }).click();
      await expect.poll(() => dialogs.at(-1) || '').toContain('Please enter patient first name');
      await expect(page.getByText('Patient Information')).toBeVisible();

      await page.getByPlaceholder('First Name').fill('A');
      await page.getByRole('button', { name: 'Next: Appointment Details' }).click();
      await expect.poll(() => dialogs.at(-1) || '').toContain('Please enter patient last name');
      await page.getByPlaceholder('Last Name').fill('B');
      await page.getByRole('button', { name: 'Next: Appointment Details' }).click();
      await expect(page.getByText('Please enter a valid phone number')).toBeVisible();
      await page.getByPlaceholder('10-digit mobile number').fill('5123456789');
      await page.getByRole('button', { name: 'Next: Appointment Details' }).click();
      await expect(page.getByText('Please enter a valid phone number')).toBeVisible();
      await page.getByPlaceholder('Age').fill('0');
      await page.getByRole('button', { name: 'Next: Appointment Details' }).click();
      await expect(page.getByText(/age|Age|between 1 and 150/).first()).toBeVisible();

      await page.getByPlaceholder('Search by name, phone, or patient ID...').fill(phone);
      await page.getByText(patientName).first().click();
      await page.getByRole('button', { name: 'Next: Appointment Details' }).click();
      await expect(page.getByRole('heading', { name: 'Appointment Details' })).toBeVisible();

      const nextReview = page.getByRole('button', { name: 'Next: Review' });
      await expect(nextReview).toBeDisabled();
      await pickOption(page, page.getByRole('combobox').filter({ hasText: 'Select Department' }), 'Cardiology');
      await page.locator('input[type="date"]').fill(bookDate);
      const doctor = page.getByPlaceholder('Select or search doctor...');
      await expect(doctor).toBeVisible({ timeout: 20_000 });
      await doctor.click();
      await doctor.fill('Kavya');
      const doctorChoice = page.getByText(/Kavya/i).last();
      await expect(doctorChoice).toBeVisible();
      const doctorLabel = (await doctorChoice.innerText()).replace(/\s+/g, ' ').trim();
      test.info().annotations.push({
        type: 'doctor',
        description: `Booked ${doctorLabel}. The staff directory has no doctor named Kavyasri; Dr. Kavyaa Allenki is the active Kavya doctor.`,
      });
      await doctorChoice.click();
      await expect(nextReview).toBeDisabled();

      const openSlot = page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first();
      await expect(openSlot).toBeVisible({ timeout: 20_000 });
      const bookedTime = (await openSlot.innerText()).trim();
      await openSlot.click();
      await page.getByPlaceholder('Brief description of the reason for appointment').fill('Functional test consultation');
      await page.getByPlaceholder('Any additional information...').fill('Staff booking for the new test chart.');
      await page.getByPlaceholder('Enter coupon code').fill('NOT-A-REAL-CODE');
      await page.getByRole('button', { name: 'Apply' }).click();
      await expect(page.getByText(/coupon|invalid|not valid|not found/i).first()).toBeVisible();
      await page.getByPlaceholder('Enter coupon code').fill('');

      await page.getByRole('checkbox', { name: /referred by a doctor/ }).check();
      await nextReview.click();
      await expect.poll(() => dialogs.at(-1) || '').toContain('Referring Doctor Name and Hospital Name are required');
      await page.getByRole('checkbox', { name: /referred by a doctor/ }).uncheck();
      await nextReview.click();
      await expect(page.getByRole('button', { name: /Proceed to Payment|Confirm & Book Appointment/ })).toBeVisible();
      await expect(page.getByText(patientName).first()).toBeVisible();
      await expect(page.getByText(/Kavya/i).first()).toBeVisible();

      if (await page.getByRole('button', { name: 'Proceed to Payment' }).isVisible().catch(() => false)) {
        await page.getByRole('button', { name: 'Proceed to Payment' }).click();
        await expect(page.getByRole('heading', { name: 'Complete Payment' })).toBeVisible();
        await expect(page.getByRole('button', { name: /Pay Now/ })).toBeVisible();
        await expect(page.getByRole('button', { name: /Send Payment Link/ })).toBeVisible();
        await page.getByRole('button', { name: 'Pay on Visit' }).click();
      } else {
        await page.getByRole('button', { name: 'Confirm & Book Appointment' }).click();
      }
      await expect.poll(() => dialogs.join('\n')).toMatch(/booked successfully/i);
      test.info().annotations.push({ type: 'slot', description: `${bookDate} ${bookedTime}` });
    });

    await test.step('Reschedule that visit to a later open slot', async () => {
      await page.goto('/staff/appointments/reschedule');
      const row = page.getByRole('row', { name: new RegExp(phone) });
      await expect(row).toBeVisible({ timeout: 20_000 });
      await row.getByRole('button', { name: 'Reschedule', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Reschedule Appointment', exact: true })).toBeVisible();
      const confirm = page.getByRole('button', { name: 'Confirm Reschedule' });
      await expect(confirm).toBeDisabled();
      const dateField = page.locator('input[type="date"]').last();
      await dateField.fill(rescheduleDate);
      const afternoon = page.getByRole('button', { name: /^(1[0-9]|2[0-3]):[0-5][0-9]$/ });
      const slot = (await afternoon.count()) ? afternoon.first() : page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first();
      await expect(slot).toBeVisible({ timeout: 20_000 });
      const newTime = (await slot.innerText()).trim();
      await slot.click();
      await expect(confirm).toBeEnabled();
      await page.getByPlaceholder('Enter reason for rescheduling (optional)...').fill('Patient requested a later functional-test slot');
      const beforeReschedule = dialogs.length;
      await confirm.click();
      await expect.poll(() => dialogs.slice(beforeReschedule).join('\n'), { timeout: 25_000 }).toMatch(/rescheduled successfully/i);
      await expect(page.getByRole('heading', { name: 'Reschedule Appointment', exact: true })).toBeHidden();
      await expect(page.getByRole('row', { name: new RegExp(phone) })).toContainText(/Oct|2026|\d{2}:\d{2}/);
      test.info().annotations.push({ type: 'rescheduled', description: `${rescheduleDate} ${newTime}` });
    });

    await test.step('Create an invoice and collect it in cash', async () => {
      await page.goto('/staff/billing/new');
      const createInvoice = page.getByRole('button', { name: /Create Invoice \(₹/ });
      await expect(createInvoice).toBeDisabled();
      await page.getByPlaceholder('Service description').fill('Functional test consultation');
      await page.getByPlaceholder('0').fill('1');
      await expect(createInvoice).toBeDisabled();

      await page.getByPlaceholder('Search patient by name, phone, or ID...').fill(phone);
      await page.getByText(patientName).last().click();
      await expect(createInvoice).toBeEnabled();
      await page.getByPlaceholder('0').fill('');
      const missingLine = dialogs.length;
      await createInvoice.click();
      await expect.poll(() => dialogs.slice(missingLine).join('\n')).toContain('Please add at least one service');
      await page.getByPlaceholder('0').fill('1');
      await page.getByPlaceholder('Add any notes or payment instructions...').fill('Cash collection for the staff functional test.');
      await expect(page.getByRole('button', { name: 'Create Invoice (₹1)' })).toBeVisible();
      const creating = dialogs.length;
      await createInvoice.click();
      await expect.poll(() => dialogs.slice(creating).join('\n')).toContain('Invoice created successfully');
      const invoiceMessage = dialogs.slice(creating).join('\n');
      const invoiceId = invoiceMessage.match(/INV[_-]?\d+/i)?.[0] || '';
      test.info().annotations.push({ type: 'invoice', description: invoiceMessage.replace(/\s+/g, ' ').trim() });

      await page.goto('/staff/billing');
      const invoiceRow = invoiceId
        ? page.getByRole('row', { name: new RegExp(invoiceId) })
        : page.getByRole('row', { name: new RegExp(patientName) }).first();
      await expect(invoiceRow).toBeVisible({ timeout: 20_000 });
      await invoiceRow.getByRole('button', { name: 'Pay', exact: true }).click();
      await expect(page).toHaveURL(/\/staff\/billing\/payment/);
      await expect(page.getByRole('heading', { name: 'Process Payment' }).first()).toBeVisible();
      await expect(page.getByRole('heading', { name: /INV_/ })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(patientName).first()).toBeVisible();
      const method = page.locator('select').filter({ has: page.locator('option', { hasText: 'Cash' }) });
      await expect(method).toHaveValue('cash');
      await page.getByPlaceholder('Add any payment notes...').fill('Cash collected at the Gatchibowli desk.');
      await page.getByRole('button', { name: /Pay ₹|Record Payment/ }).click();
      await expect(page.getByText('Payment Successful!')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(/paid via/i)).toBeVisible();
      await expect(page.getByText(/cash/i).first()).toBeVisible();

      const downloadButton = page.getByRole('button', { name: /Download Receipt/ }).or(page.getByRole('link', { name: /Download Receipt/ }));
      if (await downloadButton.count()) {
        const downloadPromise = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null);
        await downloadButton.first().click();
        const download = await downloadPromise;
        if (download) expect(download.suggestedFilename().length).toBeGreaterThan(0);
      }
    });

    await test.step('The booked visit and paid invoice show on the staff lists', async () => {
      await page.goto('/staff/appointments');
      await expect(page.getByRole('heading', { name: 'All Appointments' }).first()).toBeVisible();
      const dates = page.locator('main input[type="date"]');
      await expect(dates).toHaveCount(2);
      await expect(page.locator('main table tbody tr').first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole('row', { name: new RegExp(phone) })).toHaveCount(0);
      await dates.nth(1).fill(rescheduleDate);
      await dates.nth(0).fill(rescheduleDate);
      await page.getByPlaceholder('Search patient name, phone, appointment...').fill(phone);
      const visit = page.getByRole('row', { name: new RegExp(phone) });
      await expect(visit).toBeVisible({ timeout: 20_000 });
      await expect(visit).toContainText(/Kavyaa Allenki/);

      await page.goto('/staff/billing');
      await page.getByPlaceholder('Search by invoice number, patient name, or ID...').fill(lastName);
      const invoice = page.getByRole('row', { name: new RegExp(`${lastName}.*\\bpaid\\b`, 'i') });
      await expect(invoice).toBeVisible({ timeout: 20_000 });

      await page.goto('/staff/patients');
      const search = page.getByPlaceholder(/search/i).first();
      await search.fill(phone);
      await expect(page.getByText(patientName).first()).toBeVisible();
    });

    await test.step('Logout closes the staff workspace', async () => {
      await signOutStaff(page);
      await page.goto('/staff/patients/new');
      await expect(page).toHaveURL(/\/$/);
    });
  });
});
