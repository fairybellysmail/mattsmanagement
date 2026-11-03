import { test, expect } from '@playwright/test';

test('home page exposes navigation landmarks, skip link and concept disclosure', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  await expect(page.getByText(/does not claim to represent or be affiliated/i)).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('all three experience pages load and explain that they are concepts', async ({ page }) => {
  for (const [path, heading] of [
    ['/experiences/fan-memberships.html', /Fan/],
    ['/experiences/academy-courses.html', /Academy/],
    ['/experiences/celebrity-access.html', /Celebrity/],
  ]) {
    await page.goto(path);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
    await expect(page.getByText(/concept/i).first()).toBeVisible();
  }
});

test('demo enquiry validates and displays a non-transmission notice', async ({ page }) => {
  let formRequests = 0;
  page.on('request', request => {
    if (request.method() === 'POST' || request.method() === 'PUT') formRequests++;
  });
  await page.goto('/#contact');
  const form = page.locator('[data-demo-form]');
  await form.getByRole('button', { name: 'Preview enquiry' }).click();
  await expect(form.locator('input[name="name"]')).toHaveJSProperty('validity.valid', false);
  await form.locator('input[name="name"]').fill('Test Person');
  await form.locator('input[name="email"]').fill('test@example.com');
  await form.locator('select[name="topic"]').selectOption({ label: 'Other enquiry' });
  await form.locator('textarea[name="message"]').fill('Testing the demo interaction.');
  await form.locator('input[name="acknowledgement"]').check();
  await form.getByRole('button', { name: 'Preview enquiry' }).click();
  await expect(form.getByRole('status')).toContainText(/not sent or saved/i);
  expect(formRequests).toBe(0);
});

test('mobile navigation can open, close on Escape and return focus', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Open navigation' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

test('all pages reflow without horizontal overflow at required viewport widths', async ({ page }) => {
  const paths = ['/', '/experiences/fan-memberships.html', '/experiences/academy-courses.html', '/experiences/celebrity-access.html'];
  for (const width of [320, 360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of paths) {
      await page.goto(path);
      const dimensions = await page.evaluate(() => ({ inner: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(dimensions.scroll, `${path} at ${width}px`).toBeLessThanOrEqual(dimensions.inner);
    }
  }
});
