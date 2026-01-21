"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AppInput from "@/app/components/ui/AppInput";
import ReplenishPageSkeleton from "@/app/(app)/products/replenish/ReplenishPageSkeleton";
import { AppSelect } from "@/app/components/ui/AppSelect";
import AppButton from "@/app/components/ui/AppButton";
import { FormControl, Snackbar, Alert, IconButton, Tooltip } from "@mui/material";
import { SelectOption } from "@/app/components/ui/types";
import { apiFetch } from "@/app/lib/api";
import CancelIcon from "@mui/icons-material/Cancel"

type Product = {
  id: number;
  name: string;
  unit: "oz" | "pcs";
  category: string;
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
  const [loading, setLoading] = useState(false);
  const [barcode, setBarcode] = useState("");
    type UnknownProductDraft = {
      barcode: string;
      name: string;
    };

  const [unknownProducts, setUnknownProducts] =
    useState<UnknownProductDraft[]>([]);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      async function loadProducts() {
        try {
          const data = await apiFetch<Product[]>(
            "/products",
            { cache: "no-store" }
          );

          setProducts(data);
        } catch (err) {
          setAlert({
            type: "error",
            message: "Failed to load products",
          });
        }
      }

      loadProducts();
    }, []);

  const groupedProductOptions = Object.entries(
    products.reduce<Record<string, SelectOption<number>[]>>(
      (acc, product) => {
        const category =
          product.category?.trim() || "No Category";

        acc[category] ??= [];
        acc[category].push({
          label: product.name,
          value: product.id,
        });

        return acc;
      },
      {}
    )
  )
    .map(([group, options]) => ({
      group,
      options: options.sort((a, b) =>
        a.label.localeCompare(b.label)
      ),
    }))
    .sort((a, b) => {
      if (a.group === "No Category") return 1;
      if (b.group === "No Category") return -1;
      return a.group.localeCompare(b.group);
    });

  async function replenishKnownProducts() {
    for (const productId of selectedProductIds) {
      const product = products.find((p) => p.id === productId);
      const qty = quantities[productId];

      if (!product || !qty || qty <= 0) {
        throw new Error("Invalid quantity");
      }

      await apiFetch(`/products/${productId}/replenish`, {
        method: "POST",
        body: JSON.stringify({ quantity: qty }),
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);

    try {
      await replenishKnownProducts();
      router.push("/products?replenished=1");
    } catch {
      setAlert({
        type: "error",
        message: "Failed to replenish inventory",
      });
    }
  }

  async function handleReplenishAndCreate() {
    setAlert(null);

    try {
      await replenishKnownProducts();

      sessionStorage.setItem(
        "draft_products",
        JSON.stringify(unknownProducts)
      );

      router.push("/products/new");
    } catch {
      setAlert({
        type: "error",
        message: "Failed to process inventory",
      });
    }
  }


  async function handleBarcodeScan(code: string) {
    console.log("Scanned:", code);
    if (!code) return;

    try {
      const product = await apiFetch<Product & { id: number }>(
        `/products/by-barcode/${encodeURIComponent(code)}`
      );

      // ✅ Stage product if not already selected
      setSelectedProductIds((prev) =>
        prev.includes(product.id) ? prev : [...prev, product.id]
      );
      } catch {
        setUnknownProducts((prev) =>
          prev.some((p) => p.barcode === code)
            ? prev
            : [...prev, { barcode: code, name: "" }]
        );

      } finally {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 0);
    }
  }

  function shipUnknownsToCreate() {
    sessionStorage.setItem(
      "draft_products",
      JSON.stringify(unknownProducts)
    );

    router.push("/products/new");
  }


  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [])

  if (loading) {
    return <ReplenishPageSkeleton />;
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
      <h1 className="flex justify-center text-3xl font-bold mb-6">
        Inventory Replenishment
      </h1>

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50/50 p-3 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <p className="text-sm text-center text-gray-400 mb-4">
        To replenish inventory, you can manually select products from the list, or scan product barcodes.
        When a barcode is scanned or entered, the matching product will be automatically added to the 
        replenishment list if it exists in the system.
      </p>

      <div className="flex justify-center mb-3">
        <AppInput
          inputRef={barcodeInputRef}
          label="Scan Barcode (or type)"
          fullWidth={false}
          value={barcode}
          onChange={(val) => setBarcode(val)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              handleBarcodeScan(barcode.trim());
              setBarcode("");
            }
          }}
          placeholder="Scan item barcode"
        />
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4">
        <FormControl fullWidth>
          <AppSelect<number>
            label="Select Products"
            options={groupedProductOptions}
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
        <div className="space-y-2 mt-4">
          {/* Replenish only */}
          {selectedProductIds.length > 0 && unknownProducts.length === 0 && (
            <AppButton
              type="submit"
              fullWidth
              variant="primary"
            >
              Replenish Inventory
            </AppButton>
          )}

          {/* Create only */}
          {unknownProducts.length > 0 && selectedProductIds.length === 0 && (
            <AppButton
              type="button"
              fullWidth
              variant="primary"
              onClick={shipUnknownsToCreate}
            >
              Create Products ({unknownProducts.length})
            </AppButton>
          )}

          {/* Combined action */}
          {unknownProducts.length > 0 && selectedProductIds.length > 0 && (
            <AppButton
              type="button"
              fullWidth
              variant="primary"
              onClick={handleReplenishAndCreate}
            >
              Replenish & Create Products
            </AppButton>
          )}
        </div>
      </form>
      {unknownProducts.length > 0 && (
        <div className="mt-6 border rounded p-4 space-y-3">
          <h3 className="font-semibold">
            Unrecognized Products
          </h3>

          <div className="space-y-2">
            {unknownProducts.map((item, index) => (
              <div
                key={item.barcode}
                className="grid grid-cols-[2fr_2fr_32px] gap-3 items-center"
              >
                <AppInput
                  label=""
                  value={item.name}
                  onChange={(val) => {
                    setUnknownProducts((prev) =>
                      prev.map((p, i) =>
                        i === index ? { ...p, name: val } : p
                      )
                    );
                  }}
                  placeholder="Product name (optional)"
                />

                <AppInput
                  label=""
                  onChange={() => []}
                  value={item.barcode}
                  disabled
                />

                <Tooltip title="Remove" arrow>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setUnknownProducts((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                    sx={{
                      color: "#9ca3af",
                      "&:hover": { color: "#ef4444" },
                      padding: "4px",
                    }}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}