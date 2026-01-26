import { test } from '@playwright/test';
import {
  createProduct,
  deleteProduct,
} from './helpers/products';

test('create and delete a product', async ({ page }) => {
  const { name } = await createProduct(page);
  await deleteProduct(page, name);
});
