import { test, expect } from '@playwright/test';
import { createRecipe, deleteRecipe } from '../helpers/recipes';

test('create a recipe', async ({ page }) => {
  const recipeName = await createRecipe(page);

  const recipeRow = page.getByTestId(
    `recipe-row-${recipeName}`
  );
  await expect(recipeRow).toBeVisible();

  // Cleanup
  await deleteRecipe(page, recipeName,);
});
