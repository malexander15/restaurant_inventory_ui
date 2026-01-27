import { expect, Page } from '@playwright/test';

type CreateRecipeOptions = {
  name?: string;
  ingredientName?: RegExp;
  quantity?: string;
};

export async function createRecipe(
  page: Page,
  options: CreateRecipeOptions = {}
) {
  const recipeName =
    options.name ?? `PW Recipe ${Date.now()}`;
  const ingredient =
    options.ingredientName ?? /cheese/i;
  const quantity =
    options.quantity ?? '1';

  await page.goto('/recipes/new');

  await expect(
    page.getByTestId('new-recipe-page-title')
  ).toBeVisible();

  const nameInput = page.getByTestId('recipe-name');
  await expect(nameInput).toBeVisible();
  await nameInput.click();
  await nameInput.fill('');
  await nameInput.pressSequentially(recipeName, { delay: 20 });
  await expect(nameInput).toHaveValue(recipeName);

  await page.getByTestId('recipe-ingredient-select').click();
  await page.getByRole('option', { name: ingredient }).click();
  await page.keyboard.press('Escape');

  await page
    .getByTestId('recipe-ingredient-quantity')
    .fill(quantity);

  await page.getByTestId('submit-recipe').click();

  // Confirm dialog
  await expect(
    page.getByTestId('confirm-dialog')
  ).toBeVisible();

  await page.getByTestId('confirm-submit').click();

  // Assert redirect
  await expect(
    page.getByTestId('recipes-page-title')
  ).toBeVisible({ timeout: 10000 });

  return recipeName;
}

type EditRecipeOptions = {
  name?: string;
  recipeType?: 'prepped' | 'menu';
};

export async function editRecipe(
  page: Page,
  recipeId: number,
  updates: EditRecipeOptions
) {
  // Open edit dialog
  await page.getByTestId(`edit-recipe-${recipeId}`).click();

  const dialog = page.getByTestId('edit-recipe-dialog');
  await expect(dialog).toBeVisible();

  // Edit name if provided
  if (updates.name) {
    const nameInput = page.getByTestId('edit-recipe-name');
    await nameInput.click();
    await nameInput.fill('');
    await nameInput.pressSequentially(updates.name, { delay: 20 });
    await expect(nameInput).toHaveValue(updates.name);
  }

  // Edit recipe type if provided
  if (updates.recipeType) {
    await page.getByTestId('edit-recipe-type').click();
    await page
      .getByRole('option', { name: new RegExp(updates.recipeType, 'i') })
      .click();
  }

  // Save
  await page.getByTestId('edit-recipe-save').click();

  // Dialog closes
  await expect(dialog).not.toBeVisible();
}

export async function deleteRecipe(
  page: Page,
  recipeName: string
) {
  const recipeRow = page.getByTestId(`recipe-row-${recipeName}`);
  await expect(recipeRow).toBeVisible();

  // 🔑 scope the delete click to THIS row
  await recipeRow.getByTestId('delete-recipe').click();

  await expect(
    page.getByTestId('confirm-dialog')
  ).toBeVisible();

  await page.getByTestId('confirm-submit').click();

  await expect(recipeRow).not.toBeVisible({ timeout: 10000 });
}



