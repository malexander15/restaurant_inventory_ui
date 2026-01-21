"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
   Dialog,
   DialogTitle,
   DialogContent,
   DialogActions,
   Tooltip,
   Popover,
   Divider,
  } 
from "@mui/material";
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import FilterListIcon from "@mui/icons-material/FilterList";
import EditIcon from "@mui/icons-material/Edit";
import AppAlert from "@/app/components/ui/AppAlert";
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
  category: string | null
}

type EditProductForm = {
  name: string;
  barcode: string;
  unit: "oz" | "pcs";
  unit_cost: string;
  category: string | null;
};


export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
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
  const [categoryFilter, setCategoryFilter] = useState<string>("");
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
    category: "",
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
  }, []);

  if (loading) {
    return <ProductPageSkeleton />;
  }

  // 📂 Unique categories (alphabetized)
  const categories = Array.from(
    new Set(products.map((p) => p.category || "No Category"))
  ).sort();

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
      const cat = product.category || "No Category";
      if (cat !== categoryFilter) return false;
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
            category: editForm.category,
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
    } catch {
      setAlert({
        open: true,
        severity: "error",
        message: "Failed to update product",
      });
    } finally {
      setEditTarget(null);
    }
  }

  function resetFilters() {
    setCategoryFilter("");
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

          // Optional but recommended: clear URL params
          router.replace("/products");
        }}
      />
      <div className="flex flex-col gap-4 mb-6">
        {/* Top row: header + search + filters */}
        <div className="flex items-center justify-between gap-4">
          {/* Left: Title */}
          <h1 className="text-3xl font-bold whitespace-nowrap">
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
                p: 2,
                width: 260,
              },
            }}
          >
            <div className="space-y-3">
              <div className="text-sm font-semibold text-white">
                Filters
              </div>

              <Divider sx={{ borderColor: "#333" }} />

              <AppSelect
                label="Category"
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val as string)}
                options={[
                  { label: "All", value: "" },
                  ...categories.map((c) => ({
                    label: c,
                    value: c,
                  })),
                ]}
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
              />

              <Divider sx={{ borderColor: "#333" }} />

              <AppButton
                variant="secondary"
                fullWidth
                onClick={() => {
                  resetFilters();
                  setFiltersOpen(false);
                }}
              >
                Reset Filters
              </AppButton>
            </div>
          </Popover>

          {/* Right: Search + Filters */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="max-w-xs w-full">
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
              variant="ghost"
              startIcon={<FilterListIcon />}
              onClick={() => setFiltersOpen(true)}
            >
              Filters
            </AppButton>
          </div>
        </div>

        {/* Second row: New Product button */}
        <div>
          <Link
            href="/products/new"
            className="inline-block text-sm px-4 py-2 border rounded hover:bg-gray-100/10"
          >
            + New Product
          </Link>
        </div>
      </div>

      {!loading && filteredProducts.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="border rounded p-4 flex items-center justify-between"
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
                    className="cursor-pointer text-blue-400 hover:text-blue-300"
                    sx={{ fontSize: '.9rem' }}
                    onClick={() => {
                      setEditTarget(product);
                      setEditForm({
                        name: product.name,
                        barcode: product.barcode || "",
                        unit: product.unit,
                        unit_cost: product.unit_cost,
                        category: product.category,
                      });
                    }}
                  />
                  <HighlightOffIcon
                    className="cursor-pointer text-red-500 hover:text-red-400"
                    sx={{ fontSize: '.9rem' }}
                    onClick={() => setDeleteTarget(product)}
                  />
                </div>
              </div>
              <div className="text-sm text-white/70">
              <span>Category: {product.category || "N/A"}</span>
              </div>
            </div>

              {/* RIGHT: price */}
              <div className="text-sm text-white/70">
                ${product.unit_cost}/oz
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

      <Dialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        maxWidth="sm"
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
        <DialogTitle>Edit Product</DialogTitle>

        <DialogContent className="space-y-4 pt-2">
          {/* Name */}
          <div>
            <AppInput
              label="Name"
              value={editForm.name}
              onChange={(val) =>
                setEditForm({ ...editForm, name: val })
              }
            />
          </div>

          {/* Category */}
          <div>
            <AppInput
              label="Category"
              value={editForm.category || ""}
              onChange={(val) =>
                setEditForm({ ...editForm, category: val })
              }
            />
          </div>

          {/* Barcode */}
          <div>
            <AppInput
              label="Barcode"
              value={editForm.barcode}
              onChange={(val) =>
                setEditForm({ ...editForm, barcode: val })
              }
            />
          </div>

          {/* Unit */}
          <div>
            <AppSelect<"oz" | "pcs">
              label="Unit"
              value={editForm.unit}
              onChange={(val) =>
                setEditForm({ ...editForm, unit: val as "oz" | "pcs" })
              }
              options={[
                { label: "Ounces (oz)", value: "oz" },
                { label: "Pieces (pcs)", value: "pcs" },
              ]}
            />

          </div>

          {/* Unit Cost */}
          <div>
            <AppInput
              type="number"
              label="Unit Cost"
              step={0.01}
              value={editForm.unit_cost}
              onChange={(val) =>
                setEditForm({ ...editForm, unit_cost: val })
              }
            />
          </div>

          {/* Stock Quantity (disabled) */}
          <Tooltip title="To change quantity, use the Replenish Inventory page">
            <div>
              {/* <label className="block text-sm font-medium">
                Stock Quantity
              </label> */}
              <AppInput
                type="number"
                label="Stock Quantity"
                value={editTarget?.stock_quantity || ""}
                onChange={() => {}}
                disabled
              />
            </div>
          </Tooltip>
        </DialogContent>

        <DialogActions>
          <AppButton
            variant="secondary"
            onClick={() => setEditTarget(null)}
          >
            Cancel
          </AppButton>

          <AppButton onClick={handleEditSave}>
            Save Changes
          </AppButton>
        </DialogActions>

      </Dialog>
    </div>
  )
}
