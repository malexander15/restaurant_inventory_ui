"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
   Tooltip,
   Popover,
   Divider,
  } 
from "@mui/material";
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import FilterListIcon from "@mui/icons-material/FilterList";
import EditIcon from "@mui/icons-material/Edit";
import AppAlert from "@/app/components/ui/AppAlert";
import AppDialog from "@/app/components/ui/AppDialog";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import AppButton from "../../components/ui/AppButton";
import AppInput from "../../components/ui/AppInput";
import InputSkeleton from "../../components/ui/skeletons/InputSkeleton";
import { AppSelect } from "../../components/ui/AppSelect";
import { useRef } from "react";
import ProductPageSkeleton from "./ProductPageSkeleton";
import { apiFetch }  from "@/app/lib/api";

type Product = {
  id: number
  name: string
  unit: "oz" | "pcs"
  stock_quantity: string
  unit_cost: string
  barcode?: string | null
  product_category_id?: number | null
  product_category?: {
    id: number
    name: string
  } | null
  ingredient?: {
    id: number
    name: string
    unit?: string
  } | null
}

type Category = {
  id: number
  name: string
}

type Ingredient = {
  id: number
  name: string
  unit?: string
}

type EditProductForm = {
  name: string;
  barcode: string;
  unit: "oz" | "pcs";
  unit_cost: string;
  product_category_id?: number
  ingredient_id: number
};

const NO_CATEGORY_VALUE = 0;
const NO_INGREDIENT_VALUE = 0;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  // 🔍 Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);
  const [ingredientFilter, setIngredientFilter] = useState<Ingredient | null>(null);
  const [unitFilter, setUnitFilter] = useState<"oz" | "pcs" | "">("");
  const [costSort, setCostSort] = useState<"asc" | "desc" | "">("");
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // ✏️ Edit product
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<EditProductForm>({
    name: "",
    barcode: "",
    unit: "oz",
    unit_cost: "",
    product_category_id: NO_CATEGORY_VALUE,
    ingredient_id: NO_INGREDIENT_VALUE,
  });
  // 📜 URL params
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("replenished") === "1") {
      setAlert({
        open: true,
        severity: "success",
        message: "Inventory replenished successfully!",
      });
    }

    if (searchParams.get("deleted") === "1") {
      setAlert({
        open: true,
        severity: "success",
        message: "Product deleted successfully!",
      });
    }

    if (searchParams.get("created") === "1") {
      setAlert({
        open: true,
        severity: "success",
        message: "Product created successfully!",
      });
    }
    if (searchParams.get("depleted") === "1") {
    setAlert({
      open: true,
      severity: "success",
      message: "Inventory successfully depleted!",
    });
  }
  }, [searchParams]);

  // ✅ fetch categories in an effect
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await apiFetch<Category[]>("/product_categories");
        setCategories(data)
      } catch (err) {
        console.error(err);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    async function loadIngredients() {
      try {
        const data = await apiFetch<Ingredient[]>("/ingredients", {
          cache: "no-store",
        });
        setIngredients(data);
      } catch (err) {
        console.error(err);
      }
    }

    loadIngredients();
  }, []);

  // ✅ fetch products in an effect
  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await apiFetch<Product[]>("/products");
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [searchParams]);

  if (loading) {
    return <ProductPageSkeleton />;
  }

  const categoryOptions = [
  { label: "No Category", value: NO_CATEGORY_VALUE },
  ...categories.map((c) => ({
    label: c.name,
    value: (c.id),
  })),
]

const ingredientOptions = [
  { label: "Select Ingredient", value: NO_INGREDIENT_VALUE },
  ...ingredients
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((ingredient) => ({
      label: `${ingredient.name}${ingredient.unit ? ` (${ingredient.unit})` : ""}`,
      value: ingredient.id,
    })),
]

const ingredientFilterOptions = [
  { label: "Ingredients", value: NO_INGREDIENT_VALUE },
  ...Array.from(
    new Map(
      products
        .filter((product) => product.ingredient)
        .map((product) => [
          product.ingredient!.id,
          {
            label: product.ingredient!.name,
            value: product.ingredient!.id,
          },
        ])
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label)),
]

// 🧠 Filtered + sorted products
const filteredProducts = products
  .filter((product) => {
    // Search
    if (
      search &&
      !product.name.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }

    // Category
    if (categoryFilter) {
      const cat = Number(product.product_category_id || "");
      if (cat !== categoryFilter.id) return false;
    }

    // Ingredient
    if (ingredientFilter) {
      const ingredientId = Number(product.ingredient?.id || "");
      if (ingredientId !== ingredientFilter.id) return false;
    }

    // Unit
    if (unitFilter && product.unit !== unitFilter) {
      return false;
    }

    return true;
  })
  .sort((a, b) => {
    // Alphabetize by name by default
    const nameCompare = a.name.localeCompare(b.name);

    // If no cost sort requested, use name ordering
    if (!costSort) return nameCompare;

    // When sorting by cost, use cost first but fall back to name for ties
    const aCost = Number(a.unit_cost);
    const bCost = Number(b.unit_cost);

    if (aCost === bCost) return nameCompare;

    return costSort === "asc" ? aCost - bCost : bCost - aCost;
  });

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      await apiFetch(`/products/${deleteTarget.id}`, {
        method: "DELETE",
      });

      // Optimistic UI update
      setProducts((prev) =>
        prev.filter((p) => p.id !== deleteTarget.id)
      );

      setAlert({
        open: true,
        severity: "success",
        message: `"${deleteTarget.name}" was deleted successfully`,
      });
    } catch (err) {
      console.error(err);
      setAlert({
        open: true,
        severity: "error",
        message: "Failed to delete product",
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleEditSave() {
  if (!editTarget) return;

  const selectedIngredient = ingredients.find(
    (ingredient) => ingredient.id === editForm.ingredient_id
  );

  if (!editForm.name.trim()) {
    setAlert({
      open: true,
      severity: "error",
      message: "The products name cannot be updated with name of blank",
    });
    return;
  }

  if (!editForm.barcode.trim()) {
    setAlert({
      open: true,
      severity: "error",
      message: "Barcode cannot be empty",
    });
    return;
  }

  if (selectedIngredient?.unit && selectedIngredient.unit !== editForm.unit) {
    setAlert({
      open: true,
      severity: "error",
      message: "Products unit must match the unit of the ingredient assigned to product",
    });
    return;
  }

  try {
    const updated = await apiFetch<Product>(
      `/products/${editTarget.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          product: {
            name: editForm.name,
            barcode: editForm.barcode,
            unit: editForm.unit,
            unit_cost: Number(editForm.unit_cost),
            product_category_id: editForm.product_category_id === NO_CATEGORY_VALUE
              ? null
              : editForm.product_category_id,
            ingredient_id: editForm.ingredient_id,
          },
        }),
      }
    );

    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );

    setAlert({
      open: true,
      severity: "success",
      message: "Product updated successfully!",
    });
    setEditTarget(null);
    } catch (err) {
      const message =
        err instanceof Error &&
        err.message.toLowerCase().includes("unit") &&
        err.message.toLowerCase().includes("ingredient")
          ? "Products unit must match the unit of the ingredient assigned to product"
          : "Failed to update product";

      setAlert({
        open: true,
        severity: "error",
        message,
      });
    }
  }

  function resetFilters() {
    setCategoryFilter(null);
    setIngredientFilter(null);
    setUnitFilter("");
    setCostSort("");
    setSearch("");
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <AppAlert
        open={alert.open}
        severity={alert.severity}
        message={alert.message}
        onClose={() => {
          setAlert({ ...alert, open: false });
          router.replace("/products", {scroll: false });
        }}
      />
      <div className="flex flex-col gap-4 mb-6">
        {/* Top row: header + search + filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          {/* Left: Title */}
          <h1 
            className="text-3xl font-bold whitespace-nowrap"
            data-testid="products-page-title"
          >
            Products
          </h1>

          <Popover
            open={filtersOpen}
            anchorEl={filterButtonRef.current}
            onClose={() => setFiltersOpen(false)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            PaperProps={{
              sx: {
                backgroundColor: "#262626",
                border: "1px solid #333",
                borderRadius: 2,
                p: 1.5,
                width: 260,
              },
            }}
          >
            <div className="space-y-3">
              <div className="text-sm font-semibold text-white">
                Filters
              </div>

              <Divider sx={{ borderColor: "#fefefe", mb: 1.5 }} />

              <AppSelect
                label="Category"
                value={categoryFilter?.id || ""}
                onChange={(val) => {
                  const category = categories.find(c => c.id === val);
                  setCategoryFilter((category as Category) || null);
                }}
                options={categoryOptions}
                sx={{ mb: 1.5 }}
              />

              <AppSelect
                label="Ingredient"
                value={ingredientFilter?.id || ""}
                onChange={(val) => {
                  const ingredient = ingredientFilterOptions.find(
                    (option) => option.value === Number(val)
                  );

                  if (!ingredient || ingredient.value === NO_INGREDIENT_VALUE) {
                    setIngredientFilter(null);
                    return;
                  }

                  setIngredientFilter({
                    id: ingredient.value,
                    name: ingredient.label,
                  });
                }}
                options={ingredientFilterOptions}
                sx={{ mb: 1.5}}
              />

              <AppSelect
                label="Unit"
                value={unitFilter}
                onChange={(val) =>
                  setUnitFilter(val as "oz" | "pcs" | "")
                }
                options={[
                  { label: "All", value: "" },
                  { label: "Ounces", value: "oz" },
                  { label: "Pieces", value: "pcs" },
                ]}
                sx={{ mb: 1.5 }}
              />

              <AppSelect
                label="Sort by Cost"
                value={costSort}
                onChange={(val) =>
                  setCostSort(val as "asc" | "desc" | "")
                }
                options={[
                  { label: "None", value: "" },
                  { label: "Low → High", value: "asc" },
                  { label: "High → Low", value: "desc" },
                ]}
                sx={{ mb: 1.5 }}
              />

              <AppButton
                intent="secondary"
                fullWidth
                onClick={() => {
                  resetFilters();
                  setFiltersOpen(false);
                }}
                sx={{ mt: 1 }}
              >
                Reset Filters
              </AppButton>
            </div>
          </Popover>

          {/* Right: Search + Filters */}
          <div className="w-full md:w-auto flex flex-col md:flex-row md:items-center gap-2 md:gap-3 md:flex-1 md:justify-end">
            <div className="w-full md:max-w-xs">
              {loading ? (
                <InputSkeleton />
              ) : (
              <AppInput
                label=""
                placeholder="Search products…"
                value={search}
                onChange={(val) => setSearch(val)}
                size="small"
              />
              )}
            </div>

            <AppButton
              ref={filterButtonRef}
              intent="ghost"
              startIcon={<FilterListIcon />}
              onClick={() => setFiltersOpen(true)}
              className="w-full md:w-auto"
            >
              Filters
            </AppButton>
          </div>
        </div>

        {/* Second row: New Product button */}
        <AppButton
          component={Link}
          href="/products/new"
          intent="secondary"
          data-testid="new-product"
        >
          + New Product
        </AppButton>
      </div>

      {!loading && filteredProducts.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <div className="space-y-4" data-testid="products-list">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="border rounded p-4 flex items-center justify-between"
              data-testid={`product-row-${product.name}`}
            >
              {/* LEFT: Name + stock */}
              <div>
                <h2 className="text-lg font-semibold">
                  {product.name}
                </h2>

                <div className="flex items-center gap-2 text-sm text-white/70">
                  <span>
                    {product.stock_quantity} {product.unit}
                  </span>
                  <span>•</span>
                <div className="flex items-center gap-2">
                  <EditIcon
                    data-testid={`edit-product-${product.name}`}
                    className="cursor-pointer text-blue-400 hover:text-blue-300"
                    sx={{ fontSize: '.9rem' }}
                    onClick={() => {
                      setEditTarget(product);
                      setEditForm({
                        name: product.name,
                        barcode: product.barcode || "",
                        unit: product.unit ?? "oz",
                        unit_cost: product.unit_cost,
                        product_category_id:
                          product.product_category?.id ?? NO_CATEGORY_VALUE,
                        ingredient_id:
                          product.ingredient?.id ?? NO_INGREDIENT_VALUE,
                      });
                    }}
                  />
                  <HighlightOffIcon
                    data-testid={`delete-product-${product.name}`}
                    className="cursor-pointer text-red-500 hover:text-red-400"
                    sx={{ fontSize: '.9rem' }}
                    onClick={() => setDeleteTarget(product)}
                  />
                </div>
              </div>
              <div className="text-sm text-white/70">
                <span>Category: {product.product_category?.name || "N/A"}</span>
              </div>
              <div className="text-sm text-white/70">
                <span>Ingredient: {product.ingredient?.name || "N/A"}</span>
              </div>
            </div>

              {/* RIGHT: price */}
              <div className="text-sm text-white/70">
                {`$${product.unit_cost}/${product.unit}`}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <AppDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Product"
        contentSx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
        actions={
          <>
            <AppButton
              intent="secondary"
              onClick={() => setEditTarget(null)}
            >
              Cancel
            </AppButton>

            <AppButton onClick={handleEditSave}>
              Save Changes
            </AppButton>
          </>
        }
      >
        <AppInput
          label="Name"
          value={editForm.name}
          onChange={(val) =>
            setEditForm({ ...editForm, name: val })
          }
        />

        <AppSelect<number>
          label="Category"
          testId="edit-product-category"
          value={editForm.product_category_id || 0}
          onChange={(val) =>
            setEditForm({
              ...editForm,
              product_category_id: Number(val),
            })
          }
          options={[
            { label: "No Category", value: NO_CATEGORY_VALUE },
            ...categories.map((c) => ({
              label: c.name,
              value: c.id,
            })),
          ]}
        />

        <AppSelect<number>
          label="Ingredient"
          testId="edit-product-ingredient"
          value={editForm.ingredient_id}
          onChange={(val) =>
            setEditForm({
              ...editForm,
              ingredient_id: Number(val),
            })
          }
          options={ingredientOptions}
        />

        <AppInput
          label="Barcode"
          value={editForm.barcode}
          onChange={(val) =>
            setEditForm({ ...editForm, barcode: val })
          }
        />

        <AppSelect<"oz" | "pcs">
          label="Unit"
          testId="edit-product-unit"
          value={editForm.unit}
          onChange={(val) =>
            setEditForm({ ...editForm, unit: val as "oz" | "pcs" })
          }
          options={[
            { label: "Ounces (oz)", value: "oz" },
            { label: "Pieces (pcs)", value: "pcs" },
          ]}
        />

        <AppInput
          type="number"
          label="Unit Cost"
          step={0.01}
          value={editForm.unit_cost}
          onChange={(val) =>
            setEditForm({ ...editForm, unit_cost: val })
          }
        />

        <Tooltip title="To change quantity, use the Replenish Inventory page">
          <div>
            <AppInput
              type="number"
              label="Stock Quantity"
              value={editTarget?.stock_quantity || ""}
              onChange={() => {}}
              disabled
            />
          </div>
        </Tooltip>
      </AppDialog>
    </div>
  )
}
