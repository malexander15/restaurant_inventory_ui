import { test, expect } from "@playwright/test";
import {
  createProduct,
  editProduct,
  deleteProduct,
} from "../helpers/products";

test("create, edit, and delete a product", async ({ page }) => {
  const { name: originalName } = await createProduct(page, {
    category: "No Category",
  });

  const updatedName = `${originalName} Updated`;

  const { name: editedName } = await editProduct(page, originalName, {
    name: updatedName,
    category: "Dairy",
    cost: "1.75",
  });

  const productsList = page.getByTestId("products-list");
  await expect(productsList.getByText(editedName)).toBeVisible({
    timeout: 15000,
  });

  await deleteProduct(page, editedName);
});