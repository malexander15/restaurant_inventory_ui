"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSelect } from "@/app/components/ui/AppSelect";
import AppInput from "@/app/components/ui/AppInput";
import AppAlert from "@/app/components/ui/AppAlert";
import AppButton from "@/app/components/ui/AppButton";
import { apiFetch } from "@/app/lib/api";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

type Category = {
  id: number;
  name: string;
};

type ProductForm = {
  name: string;
  barcode: string;
  unit: "oz" | "pcs";
  stock_quantity: string;
  unit_cost: string;
  product_category_id: number;
};

type AlertState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
};

const ADD_CATEGORY_VALUE = -1;
const NO_CATEGORY_VALUE = 0;

export default function NewProductPage() {
  const router = useRouter();

  const unitOptions = [
    { value: "oz", label: "Oz" },
    { value: "pcs", label: "Pcs" },
  ];

  const [products, setProducts] = useState<ProductForm[]>([emptyProduct()]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "success",
  });

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryRowIndex, setCategoryRowIndex] = useState<number | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const GRID_COLS =
    "grid-cols-3 md:grid-cols-[2fr_2fr_2fr_1fr_1.5fr_1.5fr_32px]";

  function emptyProduct(): ProductForm {
    return {
      name: "",
      barcode: "",
      unit: "oz",
      stock_quantity: "",
      unit_cost: "",
      product_category_id: NO_CATEGORY_VALUE,
    };
  }

  function updateProduct(index: number, updates: Partial<ProductForm>) {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  }

  function addProduct() {
    setProducts((prev) => [...prev, emptyProduct()]);
  }

  function removeProduct(index: number) {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }

  function openCreateCategoryDialog(rowIndex: number) {
    setCategoryRowIndex(rowIndex);
    setNewCategoryName("");
    setCategoryDialogOpen(true);
  }

  function closeCreateCategoryDialog() {
    setCategoryDialogOpen(false);
    setNewCategoryName("");
    setCategoryRowIndex(null);
  }

  async function loadCategories() {
    const data = await apiFetch<Category[]>("/product_categories");
    setCategories(data);
  }

  useEffect(() => {
    loadCategories().catch(() => {
      setAlert({
        open: true,
        severity: "error",
        message: "Failed to load categories",
      });
    });
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem("draft_products");
    if (!raw) return;

    const drafts: { barcode: string; name: string }[] = JSON.parse(raw);

    setProducts(
      drafts.map((d) => ({
        name: d.name || "",
        barcode: d.barcode,
        unit: "oz",
        stock_quantity: "",
        unit_cost: "",
        product_category_id: NO_CATEGORY_VALUE,
      }))
    );

    sessionStorage.removeItem("draft_products");
  }, []);

  const categoryOptions = [
    { label: "No Category", value: NO_CATEGORY_VALUE },
    ...categories
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        label: c.name,
        value: c.id,
      })),
    { label: "+ Add Category", value: ADD_CATEGORY_VALUE },
  ];

  async function handleCreateCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed || categoryRowIndex === null) return;

    const existing = categories.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      updateProduct(categoryRowIndex, {
        product_category_id: existing.id,
      });
      closeCreateCategoryDialog();
      return;
    }

    try {
      setCreatingCategory(true);

      const created = await apiFetch<Category>("/product_categories", {
        method: "POST",
        body: JSON.stringify({
          product_category: {
            name: trimmed,
          },
        }),
      });

      setCategories((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );

      updateProduct(categoryRowIndex, {
        product_category_id: created.id,
      });

      closeCreateCategoryDialog();
    } catch {
      setAlert({
        open: true,
        severity: "error",
        message: "Failed to create category",
      });
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    for (const product of products) {
      if (!product.name.trim()) {
        setAlert({
          open: true,
          severity: "error",
          message: "Product name is required for all products",
        });
        setLoading(false);
        return;
      }

      if (!product.stock_quantity || Number(product.stock_quantity) <= 0) {
        setAlert({
          open: true,
          severity: "error",
          message: "Stock quantity must be greater than 0",
        });
        setLoading(false);
        return;
      }

      if (!product.unit_cost || Number(product.unit_cost) <= 0) {
        setAlert({
          open: true,
          severity: "error",
          message: "Unit cost must be greater than 0",
        });
        setLoading(false);
        return;
      }
    }

    try {
      for (const product of products) {
        await apiFetch("/products", {
          method: "POST",
          body: JSON.stringify({
            product: {
              name: product.name,
              barcode: product.barcode,
              unit: product.unit,
              stock_quantity: Number(product.stock_quantity),
              unit_cost: Number(product.unit_cost),
              product_category_id:
                product.product_category_id === NO_CATEGORY_VALUE
                  ? null
                  : product.product_category_id,
            },
          }),
        });
      }

      setAlert({
        open: true,
        severity: "success",
        message: "Products created successfully",
      });

      router.push("/products?created=1");
    } catch {
      setAlert({
        open: true,
        severity: "error",
        message: "Failed to create one or more products",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="m-8">
      <AppAlert
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
      />

      <h1 className="text-2xl font-bold mb-6" data-testid="new-products-page-title">
        New Product
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          {products.map((product, index) => (
            <div
              key={index}
              className={`grid ${GRID_COLS} gap-2 md:gap-3 items-start md:items-center`}
            >
              <div>
                <AppInput
                  label="Name"
                  value={product.name}
                  testId="product-name"
                  onChange={(val) => updateProduct(index, { name: val })}
                />
              </div>

              <div>
                <AppSelect<number>
                  label="Category"
                  value={product.product_category_id}
                  testId="product-category"
                  onChange={(val) => {
                    const selected = Number(val);

                    if (selected === ADD_CATEGORY_VALUE) {
                      openCreateCategoryDialog(index);
                      return;
                    }

                    updateProduct(index, {
                      product_category_id: selected,
                    });
                  }}
                  options={categoryOptions}
                />
              </div>

              <div>
                <AppInput
                  label="Barcode"
                  value={product.barcode}
                  testId="product-barcode"
                  onChange={(val) => updateProduct(index, { barcode: val })}
                  placeholder="Barcode"
                />
              </div>

              <div>
                <AppInput
                  label="Quantity"
                  type="number"
                  value={product.stock_quantity}
                  testId="product-stock"
                  onChange={(val) => updateProduct(index, { stock_quantity: val })}
                  placeholder="Qty"
                />
              </div>

              <div>
                <AppSelect<"oz" | "pcs">
                  label="Unit"
                  options={unitOptions}
                  value={product.unit}
                  testId="product-unit"
                  onChange={(val) =>
                    updateProduct(index, { unit: val as "oz" | "pcs" })
                  }
                />
              </div>

              <div>
                <AppInput
                  label="Cost"
                  type="number"
                  step={0.01}
                  value={product.unit_cost}
                  testId="product-cost"
                  onChange={(val) => updateProduct(index, { unit_cost: val })}
                  placeholder="Cost"
                />
              </div>

              <div className="order-7 md:order-none col-span-3 md:col-span-1 flex justify-end md:justify-center">
                {products.length > 1 && (
                  <Tooltip title="Remove product" arrow>
                    <IconButton
                      size="small"
                      onClick={() => removeProduct(index)}
                      sx={{
                        color: "#9ca3af",
                        "&:hover": { color: "#ef4444" },
                        padding: "4px",
                      }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
        </div>

        <AppButton
          type="button"
          onClick={addProduct}
          intent="secondary"
          data-testid="add-product-row"
        >
          + Add Product
        </AppButton>

        <AppButton
          type="submit"
          disabled={loading}
          intent="primary"
          data-testid="submit-products"
        >
          {loading ? "Saving..." : "Create Products"}
        </AppButton>
      </form>

      <Dialog
        open={categoryDialogOpen}
        onClose={closeCreateCategoryDialog}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#000",
              color: "#fff",
            },
          },
        }}
      >
        <DialogTitle>Add Category</DialogTitle>

        <DialogContent>
          <div className="pt-2">
            <AppInput
              label="Category Name"
              value={newCategoryName}
              onChange={setNewCategoryName}
              placeholder="e.g. Produce"
            />
          </div>
        </DialogContent>

        <DialogActions>
          <AppButton intent="secondary" onClick={closeCreateCategoryDialog}>
            Cancel
          </AppButton>
          <AppButton onClick={handleCreateCategory} disabled={creatingCategory}>
            {creatingCategory ? "Creating..." : "Create Category"}
          </AppButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}