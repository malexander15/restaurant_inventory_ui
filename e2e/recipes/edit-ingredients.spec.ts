import { test, expect } from '@playwright/test';
import { createRecipe, deleteRecipe } from '../helpers/recipes';

test('edit recipe ingredient quantity', async ({ page }) => {
  // Create a recipe with at least one ingredient
  const recipeName = await createRecipe(page);

  const recipeRow = page.getByTestId(`recipe-row-${recipeName}`);
  await expect(recipeRow).toBeVisible();

  const recipeId = Number(
    await recipeRow.getAttribute('data-recipe-id')
  );

  // Expand recipe
  await page
    .getByTestId(`recipe-toggle-${recipeId}`)
    .click();

  // Ingredient list should appear
  const ingredientList = page.getByTestId(
    `recipe-ingredients-list-${recipeId}`
  );
  await expect(ingredientList).toBeVisible();

  // Enter edit ingredients mode
  await page
    .getByTestId(`recipe-ingredients-edit-${recipeId}`)
    .click();

  // Grab first ingredient row
  const ingredientRow = ingredientList
    .getByTestId(/recipe-ingredient-row-/)
    .first();

  // Extract ingredient id from test id
  const ingredientTestId = await ingredientRow.getAttribute('data-testid');
  const ingredientId = ingredientTestId!.replace(
    'recipe-ingredient-row-',
    ''
  );

  const qtyInput = page.getByTestId(
    `recipe-ingredient-qty-${ingredientId}`
  );

  // Edit quantity (WebKit-safe pattern)
  await qtyInput.click();
  await qtyInput.fill('');
  await qtyInput.pressSequentially('2.5', { delay: 20 });

  await expect(qtyInput).toHaveValue('2.5');

  // Save ingredients
  await page
    .getByTestId(`recipe-ingredients-save-${recipeId}`)
    .click();

  // Exit edit mode — quantity should now be read-only text
  await expect(
    ingredientRow.getByText(/2\.5/)
  ).toBeVisible({ timeout: 10000 });

  // Cleanup
  await deleteRecipe(page, recipeName);
});
