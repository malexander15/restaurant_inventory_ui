import { test } from '@playwright/test';

test('restaurant can log in', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password');

  await page.getByText(/sign in/i).click();

});
