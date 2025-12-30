"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FormControl,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from "@mui/material";

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
          <Select
            multiple
            value={selectedProductIds}
            onChange={(e) =>
              setSelectedProductIds(e.target.value as number[])
            }
            input={<OutlinedInput label="Products" />}
            renderValue={(selected) =>
              selected.map((id) => products.find((p) => p.id === id)?.name).join(", ")
            }
            className="bg-[#a8a5a5ff] text-white"
          >
            {products.map((product) => (
              <MenuItem
                key={product.id}
                value={product.id}   // ✅ number, NOT Product
                sx={{
                  backgroundColor: "#3d3b3bff",
                  color: "white",
                  "&.Mui-selected": { backgroundColor: "#3d3b3bff" },
                  "&.Mui-selected:hover": { backgroundColor: "#807c7cff" },
                  "&:hover": { backgroundColor: "#807c7cff" },
                }}
              >
                <Checkbox
                  checked={selectedProductIds.includes(product.id)}
                />
                <ListItemText
                  primary={product.name}
                  secondary={`Unit: ${product.unit}`}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedProductIds.map((productId) => {
          const product = products.find((p) => p.id === productId);
          if (!product) return null;

          return (
            <div key={product.id} className="flex items-center gap-3 mt-2">
              <span className="w-40 text-sm">{product.name}</span>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder={product.unit}
                value={quantities[product.id] || ""}
                onChange={(e) =>
                  setQuantities({
                    ...quantities,
                    [product.id]: Number(e.target.value),
                  })
                }
                className="w-24 border rounded px-2 py-1 text-sm bg-black text-white"
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