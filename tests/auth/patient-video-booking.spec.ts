import { test } from '@playwright/test';
import {
  bookVideoWithAmitha,
  restorePatientSession,
  selectAyuman,
  showPatientLogin,
  signInPatientWithOtp,
} from './patient-booking';

const otp = process.env.WC_PATIENT_OTP;
const sessionFile = process.env.WC_PATIENT_SESSION_FILE;

test.use({
  video: 'on',
  viewport: { width: 1280, height: 800 },
  launchOptions: { slowMo: 250 },
});

test('WC-PAT-VIDEO patient books a video visit with Dr Amitha Sai at Ayuman', async ({ page }) => {
  test.skip(!otp && !sessionFile, 'Set WC_PATIENT_OTP or WC_PATIENT_SESSION_FILE to run this booking.');
  test.setTimeout(180_000);

  await test.step('Open the patient login and enter the mobile number', async () => {
    await showPatientLogin(page);
    await page.screenshot({ path: 'test-results/patient-video/01-patient-login.png', fullPage: true });
  });

  if (otp) {
    await test.step('Submit the SMS code', async () => {
      await signInPatientWithOtp(page, otp);
    });
  } else {
    await test.step('Continue the session already verified for this mobile number', async () => {
      await restorePatientSession(page, sessionFile!);
    });
  }

  await test.step('Select Ayuman Hospitals', async () => {
    await selectAyuman(page);
    const notNow = page.getByRole('button', { name: 'Not Now' });
    if (await notNow.isVisible({ timeout: 3_000 }).catch(() => false)) await notNow.click();
    await page.screenshot({ path: 'test-results/patient-video/03-ayuman-dashboard.png', fullPage: true });
  });

  await test.step('Book a video visit with Dr Amitha Sai', async () => {
    const slot = await bookVideoWithAmitha(page);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/patient-video/05-video-checkout.png', fullPage: true });
    test.info().annotations.push({ type: 'slot', description: slot });
  });
});
