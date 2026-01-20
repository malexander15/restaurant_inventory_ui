"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSelect } from '@/app/components/ui/AppSelect';
import AppInput from '@/app/components/ui/AppInput';
import { apiFetch } from '@/app/lib/api';
import CancelIcon from "@mui/icons-material/Cancel"
import {IconButton, Tooltip} from "@mui/material"

type ProductForm = {
  name: string;
  barcode: string;
  unit: string;
  stock_quantity: string;
  unit_cost: string;
  category: string;
}

// New Product Page Component
export default function NewProductPage() {
  const router = useRouter();
  const unitOptions = [
    { value: "oz", label: "Oz" },
    { value: "pcs", label: "Pcs" },
  ];
  const [products, setProducts] = useState<ProductForm[]>([emptyProduct()])
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const GRID_COLS =
  "grid-cols-[2fr_2fr_2fr_1fr_1.5fr_1.5fr_32px]";


    function emptyProduct(): ProductForm {
    return {
      name: "",
      barcode: "",
      unit: "oz",
      stock_quantity: "",
      unit_cost: "",
      category: "",
    };
  }

  function updateProduct(
    index: number,
    updates: Partial<ProductForm>
  ) {
    setProducts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, ...updates } : p
      )
    );
  }

  function addProduct() {
    setProducts((prev) => [...prev, emptyProduct()]);
  }

  function removeProduct(index: number) {
    setProducts((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      for (const product of products) {
        await apiFetch("/products", {
          method: "POST",
          body: JSON.stringify({
            product: {
              ...product,
              stock_quantity: Number(product.stock_quantity),
              unit_cost: Number(product.unit_cost),
            },
          }),
        });
      }

      router.push("/products?created=1");
    } catch (err: any) {
      setErrors(["Failed to create one or more products"]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="m-8">
      <h1 className="text-2xl font-bold mb-6">New Product</h1>

      {errors.length > 0 && (
        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
          <ul className="list-disc list-inside">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          {/* Header row */}
          <div className={`grid ${GRID_COLS} gap-3 text-xs text-gray-400 px-1`}
          >
            <span>Name</span>
            <span>Category</span>
            <span>Barcode</span>
            <span>Unit</span>
            <span>Stock Qty</span>
            <span>Unit Cost</span>
            <span /> {/* remove column */}
          </div>

          {products.map((product, index) => (
            <div
              key={index}
              className={`grid ${GRID_COLS} gap-3 items-center`}
            >
              <AppInput
                label=""
                value={product.name}
                onChange={(val) =>
                  updateProduct(index, { name: val })
                }
                placeholder="Name"
                required
              />

              <AppInput
                label=""
                value={product.category}
                onChange={(val) =>
                  updateProduct(index, { category: val })
                }
                placeholder="Category"
              />

              <AppInput
                label=""
                value={product.barcode}
                onChange={(val) =>
                  updateProduct(index, { barcode: val })
                }
                placeholder="Barcode"
              />

              <AppSelect
                label=""
                options={unitOptions}
                value={product.unit}
                onChange={(val) =>
                  updateProduct(index, { unit: val as "oz" | "pcs" })
                }
              />

              <AppInput
                label=""
                type="number"
                value={product.stock_quantity}
                onChange={(val) =>
                  updateProduct(index, { stock_quantity: val })
                }
                placeholder="Qty"
                required
              />

              <AppInput
                label=""
                type="number"
                step={0.01}
                value={product.unit_cost}
                onChange={(val) =>
                  updateProduct(index, { unit_cost: val })
                }
                placeholder="Cost"
                required
              />

              <div className="flex justify-center">
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
        <button
          type="button"
          onClick={addProduct}
          className="border rounded px-4 py-2 hover:bg-gray-100/10 mr-8"
        >
          + Add Product
        </button>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Create Products"}
        </button>
      </form>
    </div>
  )
}