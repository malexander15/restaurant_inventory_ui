import { test, expect } from '@playwright/test';
import {
  createProduct,
  editProduct,
  deleteProduct,
} from '../helpers/products';

test('create, edit, and delete a product', async ({ page }) => {
  // Create
  const { name: originalName } = await createProduct(page);

  const updatedName = `${originalName} Updated`;

  // Edit
  const { name: editedName } = await editProduct(
    page,
    originalName,
    {
      name: updatedName,
      category: 'Dairy',
      cost: '1.75',
    }
  );

  // Assert edited product appears
  const productsList = page.getByTestId('products-list');
  await expect(
    productsList.getByText(editedName)
  ).toBeVisible({ timeout: 15000 });

  // Delete (cleanup)
  await deleteProduct(page, editedName);
});
