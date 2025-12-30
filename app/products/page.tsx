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
   Button
  } 
from "@mui/material";
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

type Product = {
  id: number
  name: string
  unit: string
  stock_quantity: string
  unit_cost: string
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

                  <HighlightOffIcon
                    className="
                      cursor-pointer
                      text-red-500
                      text-[6px]
                      hover:text-red-400
                    "
                    onClick={() => setDeleteTarget(product)}
                  />
                </div>
              </div>

              {/* RIGHT: price */}
              <div className="text-sm text-white/70">
                ${product.unit_cost}
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
    </div>
  )
}