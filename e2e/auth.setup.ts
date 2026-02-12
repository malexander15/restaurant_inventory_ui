import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/email/i).fill('admin@thebreakroom.com');
  await page.getByLabel(/password/i).fill('breakroom2025');

  await Promise.all([
    page.waitForURL('**/products'),
    page.getByRole('button', { name: /sign in/i }).click(),
    
  ]);
  await page.context().storageState({ path: 'e2e/auth.json' });
});
