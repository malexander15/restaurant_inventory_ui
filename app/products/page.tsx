"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
   Dialog,
   DialogTitle,
   DialogContent,
   DialogActions,
   Tooltip,
  } 
from "@mui/material";
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import EditIcon from "@mui/icons-material/Edit";
import AppAlert from "@/app/components/ui/AppAlert";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import AppButton from "../components/ui/AppButton";
import AppInput from "../components/ui/AppInput";
import { AppSelect } from "../components/ui/AppSelect";

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
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<EditProductForm>({
    name: "",
    barcode: "",
    unit: "oz",
    unit_cost: "",
    category: "",
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("replenished") === "1") {
      setSnackbar({
        open: true,
        severity: "success",
        message: "Inventory replenished successfully!",
      });
    }

    if (searchParams.get("deleted") === "1") {
      setSnackbar({
        open: true,
        severity: "success",
        message: "Product deleted successfully!",
      });
    }

    if (searchParams.get("created") === "1") {
      setSnackbar({
        open: true,
        severity: "success",
        message: "Product created successfully!",
      });
    }
    if (searchParams.get("depleted") === "1") {
    setSnackbar({
      open: true,
      severity: "success",
      message: "Inventory successfully depleted!",
    });
  }
  }, [searchParams]);



  // ✅ fetch products in an effect
  useEffect(() => {
    async function loadProducts() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await res.json();
      setProducts(data);
      setLoading(false);
    }

    loadProducts();
  }, []);

  if (loading) {
    return <div className="p-8">Loading products…</div>;
  }

  async function handleDelete() {
  if (!deleteTarget) return;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products/${deleteTarget.id}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      throw new Error("Delete failed");
    }

    // Remove from UI
    setProducts((prev) =>
      prev.filter((p) => p.id !== deleteTarget.id)
    );

    setSnackbar({
      open: true,
      severity: "success",
      message: `"${deleteTarget.name}" was deleted successfully`,
    });
    } catch {
      setSnackbar({
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
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products/${editTarget.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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

    if (!res.ok) throw new Error("Update failed");

    const updated = await res.json();

    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );

    setSnackbar({
      open: true,
      severity: "success",
      message: "Product updated successfully!",
    });
    } catch {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to update product",
      });
    } finally {
      setEditTarget(null);
    }
  }


  return (
    <div className="p-8 max-w-4xl mx-auto">
      <AppAlert
        open={snackbar.open}
        severity={snackbar.severity}
        message={snackbar.message}
        onClose={() => {
          setSnackbar({ ...snackbar, open: false });

          // Optional but recommended: clear URL params
          router.replace("/products");
        }}
      />
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
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