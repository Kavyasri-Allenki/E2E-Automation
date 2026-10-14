import { expect, type Page } from '@playwright/test';
import fs from 'fs';

export const PATIENT_PHONE = '7893934952';
export const AYUMAN = 'Ayuman Hospitals';
export const DOCTOR = /Amitha+ Sai/;

type SavedSession = {
  accessToken: string;
  refreshToken?: string;
  user: Record<string, unknown>;
  hospital: Record<string, unknown>;
  hospitals: Record<string, unknown>[];
};

export async function showPatientLogin(page: Page) {
  await page.goto('/login/patient');
  await expect(page.getByRole('heading', { name: 'Patient Login' })).toBeVisible();
  await expect(page.getByText('+91')).toBeVisible();
  await page.getByPlaceholder('Enter 10-digit mobile number').fill(PATIENT_PHONE);
  await expect(page.getByRole('button', { name: 'Send OTP' })).toBeEnabled();
}

export async function signInPatientWithOtp(page: Page, otp: string) {
  await showPatientLogin(page);
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await expect(page.getByText('+91 78939 34952')).toBeVisible();
  const boxes = page.locator('.otp-input');
  await expect(boxes).toHaveCount(6);
  for (let i = 0; i < 6; i += 1) {
    await boxes.nth(i).fill(otp[i] || '');
  }
  await page.getByRole('button', { name: 'Verify & Login' }).click();
  await expect(page).toHaveURL(/\/(patient\/dashboard|select-hospital)/, { timeout: 25_000 });
}

export async function restorePatientSession(page: Page, sessionFile: string) {
  const saved = JSON.parse(fs.readFileSync(sessionFile, 'utf8')) as SavedSession;
  await page.goto('/');
  await page.evaluate((session) => {
    localStorage.setItem('authToken', session.accessToken);
    if (session.refreshToken) localStorage.setItem('refreshToken', session.refreshToken);
    localStorage.setItem('user', JSON.stringify(session.user));
    localStorage.setItem('patientHospitals', JSON.stringify(session.hospitals));
    localStorage.setItem('selectedHospital', JSON.stringify(session.hospital));
  }, saved);
}

export async function selectAyuman(page: Page) {
  await page.goto('/select-hospital');
  await expect(page.getByText('Select a hospital to continue')).toBeVisible();
  await page.getByRole('heading', { name: AYUMAN, level: 3 }).click();
  await page.screenshot({ path: 'test-results/patient-video/02-select-ayuman.png', fullPage: true });
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 25_000 });
  const notNow = page.getByRole('button', { name: 'Not Now' });
  if (await notNow.isVisible().catch(() => false)) await notNow.click();
  await expect(page.getByText(AYUMAN).first()).toBeVisible();
}

export async function bookVideoWithAmitha(page: Page) {
  await page.goto('/patient/appointments/specializations');
  await expect(page.getByRole('heading', { name: 'What type of care do you need?' })).toBeVisible();
  await page.getByText('Dermatology Specialization', { exact: true }).click();
  await page.getByRole('button', { name: /Search Doctors/ }).click();
  await expect(page.getByText(DOCTOR).first()).toBeVisible();
  await page.screenshot({ path: 'test-results/patient-video/04-doctor-amithaa.png', fullPage: true });
  await page.getByRole('button', { name: 'Book Appointment' }).click();
  await expect(page).toHaveURL(/\/patient\/book\//, { timeout: 20_000 });
  await expect(page.getByText(DOCTOR).first()).toBeVisible();

  await page.getByText('Video Consultation', { exact: true }).click();
  const slot = page.locator('button.slot-option:not([disabled])').filter({ hasText: /PM$/ });
  await expect(slot.first()).toBeVisible();
  const labels = (await slot.allInnerTexts()).map((text) => text.replace(/\s+/g, ' ').trim());
  const preferred = labels.find((label) => /^(4|5|6|7|8):/.test(label)) || labels[labels.length - 1];
  await page.locator('button.slot-option:not([disabled])', { hasText: preferred }).first().click();

  await page.getByPlaceholder(/Briefly describe your symptoms/).fill(
    'Video dermatology consultation for a skin review',
  );
  await page.getByRole('button', { name: /Pay & Book/ }).click();

  await expect.poll(async () => page.frames().some((frame) => /razorpay/i.test(frame.url())), {
    timeout: 25_000,
  }).toBe(true);
  await page.getByText(/Secured by Razorpay|UPI|Card/i).first().waitFor({ timeout: 15_000 }).catch(() => undefined);

  return preferred;
}
