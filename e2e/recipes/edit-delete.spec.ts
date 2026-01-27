import { test, expect } from '@playwright/test';
import { createRecipe, editRecipe, deleteRecipe } from '../helpers/recipes';

test('edit and delete a recipe', async ({ page }) => {
  const recipeName = await createRecipe(page);

  const recipeRow = page.getByTestId(`recipe-row-${recipeName}`);
  await expect(recipeRow).toBeVisible();

  // Grab recipe ID from data attribute
  const recipeId = Number(
    await recipeRow.getAttribute('data-recipe-id')
  );

  const updatedName = `${recipeName} Updated`;

  await editRecipe(page, recipeId, {
    name: updatedName,
    recipeType: 'menu',
  });

  // Assert UI updated
  await expect(
    page.getByTestId(`recipe-row-${updatedName}`)
  ).toBeVisible();

  // Cleanup
  await deleteRecipe(page, updatedName);
});
