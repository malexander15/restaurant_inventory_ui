// e2e/helpers/products.ts
import { expect, Page } from '@playwright/test';

type CreateProductOptions = {
  name?: string;
  stock?: string;
  cost?: string;
  unit?: 'Oz' | 'Pcs';
  barcode?: string;
};

type EditProductOptions = {
  name?: string;
  category?: string;
  barcode?: string;
  unit?: 'Ounces (oz)' | 'Pieces (pcs)';
  cost?: string;
};

export async function createProduct(
  page: Page,
  options: CreateProductOptions = {}
) {
  const productName =
    options.name ?? `PW Product ${Date.now()}`;
    const barcode = options.barcode;

  await page.goto('/products/new');

  const nameInput = page.getByTestId('product-name');
  await nameInput.click();
  await nameInput.type(productName, { delay: 10 });

  if (barcode) {
    const barcodeInput = page.getByTestId('product-barcode');
    await barcodeInput.click();
    await barcodeInput.type(barcode, { delay: 10 });
  }

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

export async function editProduct(
  page: Page,
  originalName: string,
  options: EditProductOptions
) {
  // Click edit icon
  await page.getByTestId(`edit-product-${originalName}`).click();

  // Assert dialog opens
  await expect(
    page.getByText('Edit Product')
  ).toBeVisible();

  // Name
  if (options.name) {
    const nameInput = page.getByLabel('Name');
    await nameInput.click();
    await nameInput.fill('');
    await nameInput.type(options.name, { delay: 10 });
  }

  // Category
  if (options.category !== undefined) {
    const categoryInput = page.getByLabel('Category');
    await categoryInput.click();
    await categoryInput.fill('');
    await categoryInput.type(options.category, { delay: 10 });
  }

  // Barcode
  if (options.barcode !== undefined) {
    const barcodeInput = page.getByLabel('Barcode');
    await barcodeInput.click();
    await barcodeInput.fill('');
    await barcodeInput.type(options.barcode, { delay: 10 });
  }

  // Unit
  if (options.unit) {
    await page.getByLabel('Unit').click();
    await page.getByRole('option', {
      name: options.unit,
    }).click();
  }

  // Unit cost
  if (options.cost) {
    const costInput = page.getByLabel('Unit Cost');
    await costInput.fill(options.cost);
  }

  // Save
  await page.getByRole('button', {
    name: 'Save Changes',
  }).click();

  // Assert dialog closes
  await expect(
    page.getByText('Edit Product')
  ).not.toBeVisible();

  // Return updated name for chaining
  return {
    name: options.name ?? originalName,
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
