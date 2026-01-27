import { expect, Page } from '@playwright/test';

export async function navigateToDeplete(page: Page) {
  await page.goto('/recipes/deplete');
  await expect(
    page.getByTestId('deplete-page-title')
  ).toBeVisible();
}

export async function manualDeplete(
  page: Page,
  recipeName: string,
  quantity: string
) {
  // Open select
  await page.getByTestId('deplete-recipe-select').click();

  // Select recipe
  await page.getByRole('option', { name: recipeName }).click();

  // Close MUI select
  await page.keyboard.press('Escape');

  // Find the staged row by name → get its id via DOM
  const row = page
    .locator('[data-testid^="deplete-row-"]')
    .filter({ hasText: recipeName });

  await expect(row).toBeVisible();

  const testId = await row.getAttribute('data-testid');
  const recipeId = testId!.replace('deplete-row-', '');

  // Fill quantity
  await page
    .getByTestId(`deplete-qty-${recipeId}`)
    .fill(quantity);
}

export async function manualDepleteExisting(
  page: Page,
  recipeName: string,
  quantity: string
) {
  const row = page
    .locator('[data-testid^="deplete-row-"]')
    .filter({ hasText: recipeName });

  // Row already exists from CSV
  await expect(row).toBeVisible({ timeout: 10000 });

  const testId = await row.getAttribute('data-testid');
  const recipeId = testId!.replace('deplete-row-', '');

  const qtyInput = page.getByTestId(`deplete-qty-${recipeId}`);
  await expect(qtyInput).toBeVisible();
  await qtyInput.fill(quantity);
}


export async function confirmDeplete(page: Page) {
  // Click the button that OPENS the confirm dialog
  await page.getByTestId('deplete-submit').click();

  // Now the dialog should appear
  await expect(
    page.getByTestId('confirm-dialog')
  ).toBeVisible({ timeout: 10000 });

  // Confirm depletion
  await page
    .getByRole('button', { name: /deplete inventory/i })
    .click();
}

