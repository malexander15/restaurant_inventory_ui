import { expect, Page } from '@playwright/test';

export async function navigateToReplenish(page: Page) {
  await page.goto('/products/replenish');

  await expect(
    page.getByRole('heading', { name: /replenish/i })
  ).toBeVisible({ timeout: 10000 });
}

export async function replenishManually(
  page: Page,
  productName: string,
  quantity: string
) {
  // Open product select
  await page.getByTestId('replenish-product-select').click();

  // Choose product
  await page.getByRole('option', { name: productName }).click();

  // ✅ Close MUI Select (important!)
  await page.keyboard.press('Escape');

  // Quantity input should now be visible
  const qtyInput = page.getByTestId('replenish-quantity-input');
  await expect(qtyInput).toBeVisible();
  await qtyInput.fill(quantity);

  // Submit replenish
  await page.getByTestId('replenish-submit').click();

  // Assert success feedback
  await expect(
    page.getByText(/replenished successfully/i)
  ).toBeVisible({ timeout: 10000 });
}
