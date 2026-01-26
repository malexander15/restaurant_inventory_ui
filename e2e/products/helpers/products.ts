// e2e/helpers/products.ts
import { expect, Page } from '@playwright/test';

type CreateProductOptions = {
  name?: string;
  stock?: string;
  cost?: string;
  unit?: 'Oz' | 'Pcs';
};

export async function createProduct(
  page: Page,
  options: CreateProductOptions = {}
) {
  const productName =
    options.name ?? `PW Product ${Date.now()}`;

  await page.goto('/products/new');

  const nameInput = page.getByTestId('product-name');
  await nameInput.click();
  await nameInput.type(productName, { delay: 10 });

  await page.getByTestId('product-unit').click();
  await page.getByRole('option', {
    name: options.unit ?? 'Oz',
  }).click();

  await page
    .getByTestId('product-stock')
    .fill(options.stock ?? '10');

  await page
    .getByTestId('product-cost')
    .fill(options.cost ?? '1.25');

  await page.getByTestId('submit-products').click();

  // Wait for navigation + hydration
  await page.waitForURL('**/products**', { timeout: 15000 });

  const productsList = page.getByTestId('products-list');
  await expect(productsList).toBeVisible();

  await expect(
    productsList.getByText(productName)
  ).toBeVisible({ timeout: 15000 });

  return {
    name: productName,
  };
}

export async function deleteProduct(
  page: Page,
  productName: string
) {
  const productsList = page.getByTestId('products-list');

  await page
    .getByTestId(`delete-product-${productName}`)
    .click();

  await page
    .getByRole('button', { name: 'Delete' })
    .click();

  await expect(
    productsList.getByText(productName)
  ).not.toBeVisible({ timeout: 15000 });
}
