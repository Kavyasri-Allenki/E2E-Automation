import { test as base, expect } from '@playwright/test';

/**
 * Public scenarios must not create accounts, send OTPs, or submit passwords.
 * Any non-GET call to an auth or booking endpoint fails the test.
 */
const BLOCKED = /\/(auth\/|appointments\/|patients\/register|patient\/register)/i;

export const test = base.extend({
  page: async ({ page }, use) => {
    const hits: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET' && BLOCKED.test(request.url())) {
        hits.push(`${request.method()} ${request.url()}`);
      }
    });
    await use(page);
    expect(
      hits,
      'Public scenarios must not call production auth or booking APIs',
    ).toEqual([]);
  },
});

export { expect };
