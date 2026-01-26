"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppSelect } from '@/app/components/ui/AppSelect';
import AppInput from '@/app/components/ui/AppInput';
import AppAlert from '@/app/components/ui/AppAlert';
import AppButton from '@/app/components/ui/AppButton';
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
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
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

  useEffect(() => {
    const raw = sessionStorage.getItem("draft_products");
    if (!raw) return;

    const drafts: { barcode: string; name: string }[] =
      JSON.parse(raw);

    setProducts(
      drafts.map((d) => ({
        name: d.name || "",
        barcode: d.barcode,
        unit: "oz",
        stock_quantity: "",
        unit_cost: "",
        category: "",
      }))
    );

    sessionStorage.removeItem("draft_products");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // 1️⃣ VALIDATION PHASE
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

    // 2️⃣ SUBMISSION PHASE
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
        onClose={() =>
          setAlert((prev) => ({ ...prev, open: false }))
        }
      />
      <h1 
        className="text-2xl font-bold mb-6"
        data-testid="new-products-page-title"
      >
        New Product
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          {products.map((product, index) => (
            <div
              key={index}
              className={`grid ${GRID_COLS} gap-3 items-center`}
            >
              <AppInput
                label="Name"
                value={product.name}
                testId="product-name"
                onChange={(val) =>
                  updateProduct(index, { name: val })
                }
              />

              <AppInput
                label="Category"
                value={product.category}
                testId="product-category"
                onChange={(val) =>
                  updateProduct(index, { category: val })
                }
                placeholder="Category"
              />

              <AppInput
                label="Barcode"
                value={product.barcode}
                testId="product-barcode"
                onChange={(val) =>
                  updateProduct(index, { barcode: val })
                }
                placeholder="Barcode"
              />

              <AppSelect
                label="Unit"
                options={unitOptions}
                value={product.unit}
                testId="product-unit"
                onChange={(val) =>
                  updateProduct(index, { unit: val as "oz" | "pcs" })
                }
              />

              <AppInput
                label="Quantity"
                type="number"
                value={product.stock_quantity}
                testId="product-stock"
                onChange={(val) =>
                  updateProduct(index, { stock_quantity: val })
                }
                placeholder="Qty"
              />

              <AppInput
                label="Cost"
                type="number"
                step={0.01}
                value={product.unit_cost}
                testId="product-cost"
                onChange={(val) =>
                  updateProduct(index, { unit_cost: val })
                }
                placeholder="Cost"
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
    </div>
  )
}