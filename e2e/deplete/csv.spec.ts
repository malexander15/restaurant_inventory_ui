import { test, expect } from '@playwright/test';
import { createRecipe, deleteRecipe } from '../helpers/recipes';
import {
  navigateToDeplete,
  confirmDeplete,
} from '../helpers/deplete';

test('csv deplete with matched items', async ({ page }) => {
  const recipeName = await createRecipe(page, {
    recipe_type: 'menu_item',
  });

  await navigateToDeplete(page);

  const csv = `Item,Items Sold
${recipeName},2
`;

  await page.getByTestId('deplete-csv-input').setInputFiles({
    name: 'deplete.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });

  // Assert CSV matched section
  const matchedList = page.getByTestId('csv-matched-list');
  await expect(matchedList).toBeVisible();

  await expect(
    matchedList.getByText(recipeName)
  ).toBeVisible();

  // Submit depletion
  await confirmDeplete(page);

  await page.waitForURL('**/products**', { timeout: 10000 });
  
  // Cleanup
  await page.goto('/recipes');
  await deleteRecipe(page, recipeName);
});
