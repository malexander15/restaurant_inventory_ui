import { test, expect } from '@playwright/test';
import { createProduct, deleteProduct } from '../helpers/products';
import {
  navigateToReplenish,
  replenishManually,
} from '../helpers/replenish';

test('replenish product manually via select', async ({ page }) => {
  // Create product
  const { name } = await createProduct(page, {
    stock: '10',
  });

  // Go to replenish page
  await navigateToReplenish(page);

  // Replenish +5
  await replenishManually(page, name, '5');

  // Back on products page → assert quantity updated
  await expect(
    page.getByText(`${name}`)
  ).toBeVisible();

  const productRow = page.getByTestId(`product-row-${name}`);

  await expect(productRow).toContainText(/15(\.0)?\s*oz/i);

  // Cleanup
  await deleteProduct(page, name);
});
