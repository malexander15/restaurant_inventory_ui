import { test, expect } from '@playwright/test';
import {
  navigateToReplenish,
  scanRecognizedBarcode,
  scanUnrecognizedBarcode,
  submitReplenishAndCreate,
} from '../helpers/replenish';
import {
  createProduct,
  deleteProduct,
} from '../helpers/products';

test('recognized + unrecognized barcode can be replenished and created together', async ({ page }) => {
  // ---- Setup recognized product
  const recognizedBarcode = `REC-${Date.now()}`;
  const { name: recognizedName } = await createProduct(page, {
    barcode: recognizedBarcode,
    stock: '10',
  });

  // ---- Unknown barcode
  const unknownBarcode = `UNKWN-${Date.now()}`;
  const unknownProductName = `From Combined ${Date.now()}`;

  // ---- Go to replenish
  await navigateToReplenish(page);

  // ---- Scan recognized barcode (+5)
  await scanRecognizedBarcode(page, recognizedBarcode, '5');

  // ---- Scan unrecognized barcode
  await scanUnrecognizedBarcode(page, unknownBarcode);

  // ---- Combined action should appear
  await submitReplenishAndCreate(page);

  // ---- New Product page
  await expect(
    page.getByTestId('new-products-page-title')
  ).toBeVisible({ timeout: 10000 });

  // Barcode should be prefilled for unknown
  await expect(
    page.getByTestId('product-barcode')
  ).toHaveValue(unknownBarcode);

  // Complete creation
  await page.getByTestId('product-name').type(
    unknownProductName,
    { delay: 10 }
  );
  await page.getByTestId('product-unit').click();
  await page.getByRole('option', { name: 'Oz' }).click();
  await page.getByTestId('product-stock').fill('10');
  await page.getByTestId('product-cost').fill('1.25');
  await page.getByTestId('submit-products').click();

  // ---- Assert both outcomes on Products page

  // Recognized product stock updated
  const recognizedRow = page.getByTestId(
    `product-row-${recognizedName}`
  );
  await expect(recognizedRow).toContainText(/15(\.0)?\s*oz/i);

  // New product exists
  const newProductRow = page.getByTestId(
    `product-row-${unknownProductName}`
  );
  await expect(newProductRow).toBeVisible({ timeout: 10000 });

  // ---- Cleanup
  await deleteProduct(page, recognizedName);
  await deleteProduct(page, unknownProductName);
});
