import { test, expect } from '@playwright/test';
import { createRecipe, deleteRecipe } from '../helpers/recipes';
import {
  navigateToDeplete,
  manualDeplete,
  confirmDeplete,
} from '../helpers/deplete';

test('manual inventory depletion', async ({ page }) => {
  const recipeName = await createRecipe(page, {
    recipe_type: 'menu_item',
  });

  await navigateToDeplete(page);

  await manualDeplete(page, recipeName, '2');
  await confirmDeplete(page);

  await expect(page).toHaveURL(/products/);
  await page.goto('/recipes')

  await deleteRecipe(page, recipeName);
});
