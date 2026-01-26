"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AppInput from "@/app/components/ui/AppInput";
import ReplenishPageSkeleton from "@/app/(app)/products/replenish/ReplenishPageSkeleton";
import { AppSelect } from "@/app/components/ui/AppSelect";
import AppButton from "@/app/components/ui/AppButton";
import AppAlert from "@/app/components/ui/AppAlert";
import { IconButton, Tooltip } from "@mui/material";
import { SelectOption } from "@/app/components/ui/types";
import { apiFetch } from "@/app/lib/api";
import CancelIcon from "@mui/icons-material/Cancel"

type Product = {
  id: number;
  name: string;
  unit: "oz" | "pcs";
  category: string;
};

type AlertState = {
  type: "success" | "error" | "info" | "warning";
  message: string;
  variant: "outlined" | "filled" | "standard"
} | null;

export default function ReplenishInventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [alert, setAlert] = useState<AlertState>(null);
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
            variant: "filled"
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
    if (selectedProductIds.length === 0) {
      throw new Error("No products selected");
    }

    for (const productId of selectedProductIds) {
      const product = products.find((p) => p.id === productId);
      const qty = quantities[productId];

      if (!qty) {
        throw new Error(
          `Quantity is required for ${product?.name || "a product"}`
        );
      }

      if (qty <= 0) {
        throw new Error(
          `Quantity must be greater than zero for ${product?.name || "a product"}`
        );
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
    } catch (err: any) {
      setAlert({
        type: "error",
        message: err.message || "Failed to replenish inventory",
        variant: "filled"
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
    } catch (err: any) {
      setAlert({
        type: "error",
        message: err.message || "Failed to process inventory",
        variant: "standard"
      });
    }
  }

  async function handleBarcodeScan(code: string) {
    if (!code.trim()) {
      setAlert({
        type: "warning",
        message: "Barcode cannot be empty",
        variant: "standard"
      });
      return;
    }

    try {
      const product = await apiFetch<Product & { id: number }>(
        `/products/by-barcode/${encodeURIComponent(code)}`
      );

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
      <AppAlert
        open
        severity={alert.type}
        message={alert.message}
        onClose={() => setAlert(null)}
      />
    )}
      <h1 className="flex justify-center text-3xl font-bold mb-6">
        Inventory Replenishment
      </h1>

      <p className="text-sm text-center text-gray-400 mb-4">
        To replenish inventory, you can manually select products from the list, or scan product barcodes.
        When a barcode is scanned or entered, the matching product will be automatically added to the 
        replenishment list if it exists in the system.
      </p>

      <div className="flex justify-center mb-3">
        <AppInput
          inputRef={barcodeInputRef}
          label="Scan Barcode (or type)"
          testId="replenish-barcode-input"
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
          <AppSelect<number>
            label="Select Products"
            options={groupedProductOptions}
            value={selectedProductIds}
            testId="replenish-product-select"
            onChange={(val) =>
              setSelectedProductIds(
                Array.isArray(val) ? val : [val]
              )
            }
            multiple
            checkbox
          />
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
                  testId="replenish-quantity-input"
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
              intent="primary"
              data-testid="replenish-submit"
            >
              Replenish Inventory
            </AppButton>
          )}

          {/* Create only */}
          {unknownProducts.length > 0 && selectedProductIds.length === 0 && (
            <AppButton
              type="button"
              fullWidth
              intent="primary"
              data-testid="create-products-from-barcode"
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
              intent="primary"
              onClick={handleReplenishAndCreate}
            >
              Replenish & Create Products
            </AppButton>
          )}
        </div>
      </form>
      {unknownProducts.length > 0 && (
        <div 
          className="mt-6 border rounded p-4 space-y-3"
          data-testid="unrecognized-products-section"
        >
          <h3 className="font-semibold">
            Unrecognized Products
          </h3>

          <div className="space-y-2">
            {unknownProducts.map((item, index) => (
              <div
                key={item.barcode}
                className="grid grid-cols-[2fr_2fr_32px] gap-3 items-center"
                data-testid={`unrecognized-product-${item.barcode}`}

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