import { test, expect } from '@playwright/test';
import { createRecipe, deleteRecipe } from '../helpers/recipes';
import {
  navigateToDeplete,
  manualDepleteExisting,
  confirmDeplete,
} from '../helpers/deplete';

test('combined csv and manual deplete', async ({ page }) => {
  // Create menu item recipe
  const recipeName = await createRecipe(page, {
    recipe_type: 'menu_item',
  });

  await navigateToDeplete(page);

  // 🔑 Build CSV dynamically so it matches created recipe
  const csv = `Item,Items Sold
${recipeName},2
`;

  await page.getByTestId('deplete-csv-input').setInputFiles({
    name: 'deplete.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });

  // Assert CSV matched section appears
  await expect(
    page.getByTestId('csv-matched-list')
  ).toBeVisible();

  // Manual add on top of CSV
  await manualDepleteExisting(page, recipeName, '1');

  // Submit depletion
  await confirmDeplete(page);

  // 🔑 Wait for router.push to finish (Firefox-safe)
  await page.waitForURL('**/products**', { timeout: 10000 });

  // Cleanup
  await page.goto('/recipes');
  await deleteRecipe(page, recipeName);
});
