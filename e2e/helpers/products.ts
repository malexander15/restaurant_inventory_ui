// e2e/helpers/products.ts
import { expect, Page } from "@playwright/test";
import { createIngredient } from "./ingredients";

type CreateProductOptions = {
  name?: string;
  stock?: string;
  cost?: string;
  unit?: "Oz" | "Pcs";
  barcode?: string;
  category?: string;
  ingredientName?: string;
  ingredientUnit?: "oz" | "pcs";
};

type EditProductOptions = {
  name?: string;
  category?: string;
  barcode?: string;
  unit?: "Ounces (oz)" | "Pieces (pcs)";
  cost?: string;
};

export async function createProduct(
  page: Page,
  options: CreateProductOptions = {}
) {
  const productName = options.name ?? `PW Product ${Date.now()}`;
  const barcode = options.barcode ?? `PW-${Date.now()}`;
  const ingredient =
    options.ingredientName
      ? {
          optionLabel: `${options.ingredientName} (${options.ingredientUnit ?? "oz"})`,
          unit: options.ingredientUnit ?? "oz",
        }
      : await createIngredient(page, {
          unit: options.ingredientUnit,
        });

  const productUnit =
    options.unit ?? (ingredient.unit === "pcs" ? "Pcs" : "Oz");

  await page.goto("/products/new");

  const nameInput = page.getByTestId("product-name");
  await nameInput.click();
  await nameInput.type(productName, { delay: 10 });

  if (options.category !== undefined) {
    await page.getByTestId("product-category").click();
    await page.getByRole("option", { name: options.category }).click();
  }

  const barcodeInput = page.getByTestId("product-barcode");
  await barcodeInput.click();
  await barcodeInput.type(barcode, { delay: 10 });

  await page.getByTestId("product-ingredient").click();
  await page
    .getByRole("option", {
      name: ingredient.optionLabel,
    })
    .click();

  await page.getByTestId("product-unit").click();
  await page
    .getByRole("option", {
      name: productUnit,
    })
    .click();

  await page.getByTestId("product-stock").fill(options.stock ?? "10");
  await page.getByTestId("product-cost").fill(options.cost ?? "1.25");

  await page.getByTestId("submit-products").click();

  await page.waitForURL("**/products**", { timeout: 15000 });

  const productsList = page.getByTestId("products-list");
  await expect(productsList).toBeVisible();
  await expect(productsList.getByText(productName)).toBeVisible({
    timeout: 15000,
  });

  return {
    name: productName,
    ingredientName: ingredient.optionLabel,
  };
}

export async function editProduct(
  page: Page,
  originalName: string,
  options: EditProductOptions
) {
  await page.getByTestId(`edit-product-${originalName}`).click();

  await expect(page.getByText("Edit Product")).toBeVisible();

  if (options.name) {
    const nameInput = page.getByLabel("Name");
    await nameInput.click();
    await nameInput.fill("");
    await nameInput.type(options.name, { delay: 10 });
  }

  if (options.category !== undefined) {
    const dialog = page.getByRole("dialog");

    await dialog.getByTestId("edit-product-category").click();
    await page.getByRole("option", { name: options.category }).click();
  }

  if (options.barcode !== undefined) {
    const barcodeInput = page.getByLabel("Barcode");
    await barcodeInput.click();
    await barcodeInput.fill("");
    await barcodeInput.type(options.barcode, { delay: 10 });
  }

  if (options.unit) {
    const dialog = page.getByRole("dialog");

    await dialog.getByTestId("edit-product-unit").click();
    await page.getByRole("option", { name: options.unit }).click();
  }

  if (options.cost) {
    const costInput = page.getByLabel("Unit Cost");
    await costInput.fill(options.cost);
  }

  await page.getByRole("button", { name: "Save Changes" }).click();

  await expect(page.getByText("Edit Product")).not.toBeVisible();

  return {
    name: options.name ?? originalName,
  };
}

export async function deleteProduct(page: Page, productName: string) {
  const productsList = page.getByTestId("products-list");

  await page.getByTestId(`delete-product-${productName}`).click();

  await page.getByRole("button", { name: "Delete" }).click();

  await expect(productsList.getByText(productName)).not.toBeVisible({
    timeout: 15000,
  });
}
