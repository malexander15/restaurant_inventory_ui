import { expect, Page } from "@playwright/test";

type CreateIngredientOptions = {
  name?: string;
  unit?: "oz" | "pcs";
};

const UNIT_LABELS = {
  oz: "Ounces (oz)",
  pcs: "Pieces (pcs)",
} as const;

export async function createIngredient(
  page: Page,
  options: CreateIngredientOptions = {}
) {
  const name = options.name ?? `PW Ingredient ${Date.now()}`;
  const unit = options.unit ?? "oz";

  await page.goto("/ingredients");
  await expect(page.getByTestId("ingredients-page-title")).toBeVisible();

  await page.getByTestId("new-ingredient").click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByTestId("ingredient-name").fill(name);
  await dialog.getByTestId("ingredient-unit").click();
  await page.getByRole("option", { name: UNIT_LABELS[unit] }).click();

  await dialog.getByRole("button", { name: "Create Ingredient" }).click();

  const ingredientsList = page.getByTestId("ingredients-list");
  await expect(ingredientsList).toBeVisible({ timeout: 15000 });
  await expect(ingredientsList.getByText(name)).toBeVisible({
    timeout: 15000,
  });

  return {
    name,
    unit,
    optionLabel: `${name} (${unit})`,
  };
}
