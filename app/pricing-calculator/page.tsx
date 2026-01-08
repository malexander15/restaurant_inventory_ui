"use client";

import { useEffect, useMemo, useState } from "react";
import AppInput from "@/app/components/ui/AppInput";
import AppButton from "@/app/components/ui/AppButton";
import { AppSelect } from "@/app/components/ui/AppSelect";
import { Stack } from "@mui/material";

type Product = {
  id: number;
  name: string;
  unit: "oz" | "pcs";
  unit_cost: number;
};

export default function PricingCalculatorPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [marginLow, setMarginLow] = useState(3);
  const [marginHigh, setMarginHigh] = useState(4);

  // Load products
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

  const selectedProducts = products.filter((p) =>
    selectedProductIds.includes(p.id)
  );

  // Cost calculation
  const totalCost = useMemo(() => {
    return selectedProducts.reduce((sum, product) => {
      const qty = quantities[product.id] || 0;
      return sum + qty * product.unit_cost;
    }, 0);
  }, [selectedProducts, quantities]);

  const suggestedLow = totalCost * marginLow;
  const suggestedHigh = totalCost * marginHigh;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Menu Pricing Calculator</h1>
        <p className="text-sm text-gray-500">
          Estimate food cost and suggested menu price
        </p>
      </div>
      
      <Stack spacing={3}>
        <AppInput
          label="Menu Item Name (optional)"
          disabled={true}
          inputPadding="1rem"
          value=""
          onChange={() => {}}
          placeholder="e.g. Chicken Quesadilla"
        />

        <AppSelect<number>
          label="Select Ingredients"
          multiple
          checkbox
          value={selectedProductIds}
          onChange={(val) =>
            setSelectedProductIds(Array.isArray(val) ? val : [val])
          }
          options={products.map((p) => ({
            value: p.id,
            label: `${p.name} ($${p.unit_cost}/${p.unit})`,
          }))}
        />
      </Stack>

      {/* Quantities */}
      {selectedProducts.length > 0 && (
        <div className="space-y-3">
          {selectedProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="text-sm">
                <div className="font-medium">{product.name}</div>
                <div className="text-gray-500">
                  ${product.unit_cost} / {product.unit}
                </div>
              </div>

              <AppInput
                type="number"
                label="Qty"
                size="small"
                min={0}
                step={0.01}
                fullWidth={false}
                value={quantities[product.id] || ""}
                onChange={(val) =>
                  setQuantities({
                    ...quantities,
                    [product.id]: Number(val),
                  })
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* Margin Controls */}
      <div className="flex gap-4">
        <AppInput
          type="number"
          label="Min Markup"
          size="small"
          min={1}
          step={0.1}
          fullWidth={false}
          value={marginLow}
          onChange={(val) => setMarginLow(Number(val))}
        />
        <AppInput
          type="number"
          label="Max Markup"
          size="small"
          min={1}
          step={0.1}
          fullWidth={false}
          value={marginHigh}
          onChange={(val) => setMarginHigh(Number(val))}
        />
      </div>

      {/* Results */}
      <div className="border rounded p-4 space-y-2">
        <div className="text-sm text-gray-500">Total Cost</div>
        <div className="text-2xl font-bold">
          ${totalCost.toFixed(2)}
        </div>

        <div className="text-sm text-gray-500 mt-3">
          Suggested Price Range
        </div>
        <div className="text-lg font-semibold">
          ${suggestedLow.toFixed(2)} – ${suggestedHigh.toFixed(2)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <AppButton variant="ghost" onClick={() => {
          setSelectedProductIds([]);
          setQuantities({});
          setMarginLow(3);
          setMarginHigh(4);
        }}>
          Reset
        </AppButton>
      </div>
    </div>
  );
}
