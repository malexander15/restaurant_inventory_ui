import { test, expect, Page } from '@playwright/test';
import { navigateToReplenish, scanUnrecognizedBarcode } from '../helpers/replenish';
import { deleteProduct } from '../helpers/products';

test('unrecognized barcode can be staged and created as product', async ({ page }) => {
  const barcode = `UNKWN-${Date.now()}`;
  const productName = `From Barcode ${Date.now()}`;

  // Go to replenish
  await navigateToReplenish(page);

  // Scan unknown barcode
  await scanUnrecognizedBarcode(page, barcode);

  // Click Create Products
  await page
    .getByTestId('create-products-from-barcode')
    .click();

  // Assert redirect to New Product page
  await expect(
    page.getByTestId('new-products-page-title')
  ).toBeVisible({ timeout: 10000 });

  // Barcode should be pre-filled
  await expect(
    page.getByTestId('product-barcode')
  ).toHaveValue(barcode);

  // Fill remaining fields
  await page.getByTestId('product-name').type(productName, { delay: 10 });
  await page.getByTestId('product-unit').click();
  await page.getByRole('option', { name: 'Oz' }).click();
  await page.getByTestId('product-stock').fill('10');
  await page.getByTestId('product-cost').fill('1.25');

  // Submit
  await page.getByTestId('submit-products').click();

  // Assert product exists
  const productRow = page.getByTestId(`product-row-${productName}`);
  await expect(productRow).toBeVisible({ timeout: 10000 });

  // Cleanup
  await deleteProduct(page, productName);
});

