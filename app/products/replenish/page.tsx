"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppInput from "@/app/components/ui/AppInput";
import { AppSelect } from "@/app/components/ui/AppSelect";
import { FormControl, Snackbar, Alert } from "@mui/material";

type Product = {
  id: number;
  name: string;
  unit: "oz" | "pcs";
};

export default function ReplenishInventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    async function loadProducts() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setProducts(data);
    }

    loadProducts();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);

    if (selectedProductIds.length === 0) {
      setAlert({
        type: "error",
        message: "Products cannot be empty",
      });
      return;
    }

    for (const productId of selectedProductIds) {
      const product = products.find((p) => p.id === productId);
      const qty = quantities[productId];

      if (!product) continue;

      if (!qty || qty <= 0) {
        setAlert({
          type: "error",
          message: "All selected products must have a quantity",
        });
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/replenish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: qty }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setAlert({
          type: "error",
          message: data.error || `Failed to replenish ${product.name}`,
        });
        return;
      }
    }

    // ✅ SUCCESS
    router.push("/products?replenished=1");
  }



  return (
    <div className="max-w-md mx-auto p-6">
      {alert && (
        <Snackbar
          open
          autoHideDuration={6000}
          onClose={() => setAlert(null)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            severity={alert.type}
            onClose={() => setAlert(null)}
            sx={{ width: "100%" }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      )}
      <h1 className="text-3xl font-bold mb-6">
        Inventory Replenishment
      </h1>

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50/50 p-3 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4">
        <FormControl fullWidth>
          <AppSelect<number>
            label="Select Products"
            options={products.map((p) => ({
              label: p.name,
              value: p.id,
            }))}
            value={selectedProductIds}
            onChange={(val) =>
              setSelectedProductIds(
                Array.isArray(val) ? val : [val]
              )
            }
            multiple
            checkbox
          />
        </FormControl>

        {selectedProductIds.map((productId) => {
          const product = products.find((p) => p.id === productId);
          if (!product) return null;

          return (
            <div key={product.id} className="grid place-content-center items-center justify-center gap-3 mt-4">
                <AppInput
                  label={product.name}
                  name={`quantity_${product.id}`}
                  type="number"
                  placeholder={product.unit}
                  value={quantities[product.id] || ""}
                  size="small"
                  onChange={(val) =>
                    setQuantities({
                      ...quantities,
                      [product.id]: Number(val),
                    })
                  }
                />
              </div>
          );
        })}


        <button
          type="submit"
          className="
            w-full py-2 border rounded
            hover:bg-gray-100/10
            transition mt-4
          "
        >
          Replenish Inventory
        </button>
      </form>
    </div>
  );
}