"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
   Snackbar, 
   Alert,
   Dialog,
   DialogTitle,
   DialogContent,
   DialogActions,
   Button,
   Tooltip,
   Paper
  } 
from "@mui/material";
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import EditIcon from "@mui/icons-material/Edit";

type Product = {
  id: number
  name: string
  unit: string
  stock_quantity: string
  unit_cost: string
  barcode?: string | null
}

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
  const [editForm, setEditForm] = useState({
    name: "",
    barcode: "",
    unit: "oz",
    unit_cost: "",
  });
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
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
              </div>

              {/* RIGHT: price */}
              <div className="text-sm text-white/70">
                ${product.unit_cost}/oz
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
      >
        <DialogTitle>Delete Product</DialogTitle>

        <DialogContent>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.name}</strong>?
            <br />
            This action cannot be undone.
          </p>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>

          <Button
            color="error"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
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
            <label className="block text-sm font-medium">Name</label>
            <input
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-sm font-medium">Barcode</label>
            <input
              value={editForm.barcode}
              onChange={(e) =>
                setEditForm({ ...editForm, barcode: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium">Unit</label>
            <select
              value={editForm.unit}
              onChange={(e) =>
                setEditForm({ ...editForm, unit: e.target.value })
              }
              className="w-full border p-2 rounded bg-black"
            >
              <option value="oz">Ounces (oz)</option>
              <option value="pcs">Pieces (pcs)</option>
            </select>
          </div>

          {/* Unit Cost */}
          <div>
            <label className="block text-sm font-medium">Unit Cost</label>
            <input
              type="number"
              step="0.01"
              value={editForm.unit_cost}
              onChange={(e) =>
                setEditForm({ ...editForm, unit_cost: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
          </div>

          {/* Stock Quantity (disabled) */}
          <Tooltip title="To change quantity, use the Replenish Inventory page">
            <div>
              <label className="block text-sm font-medium">
                Stock Quantity
              </label>
              <input
                value={`${editTarget?.stock_quantity} ${editTarget?.unit}`}
                disabled
                className="w-full border p-2 rounded bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
          </Tooltip>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}