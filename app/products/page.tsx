"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Snackbar, Alert } from "@mui/material";

type Product = {
  id: number
  name: string
  unit: string
  stock_quantity: string
  unit_cost: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("replenished") === "1") {
      setShowSuccess(true);
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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Inventory replenished successfully!
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
              className="border rounded p-4 flex justify-between items-center"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  {product.name}
                </h2>
                <p className="text-sm text-white-600">
                  {product.stock_quantity} {product.unit}
                </p>
              </div>

              <div className="text-sm text-white-700">
                ${product.unit_cost}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}