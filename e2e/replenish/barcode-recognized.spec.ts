import { test, expect } from '@playwright/test';
import {
  createProduct,
  deleteProduct,
} from '../helpers/products';
import {
  navigateToReplenish,
  scanRecognizedBarcode,
  submitReplenish,
} from '../helpers/replenish';

test('replenish product by recognized barcode', async ({ page }) => {
  // Create product with barcode
  const barcode = `PW-${Date.now()}`;

  const { name } = await createProduct(page, {
    barcode,
    stock: '10',
  });

  // Navigate to replenish
  await navigateToReplenish(page);

  // Replenish +5 via barcode
  await scanRecognizedBarcode(page, barcode, '5');
  await submitReplenish(page)

  // Assert stock updated
  const productRow = page.getByTestId(`product-row-${name}`);
  await expect(productRow).toContainText(/15(\.0)?\s*oz/i);

  // Cleanup
  await deleteProduct(page, name);
});
