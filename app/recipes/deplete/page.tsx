"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormControl } from "@mui/material";
import { AppSelect } from "@/app/components/ui/AppSelect";
import AppButton from "@/app/components/ui/AppButton";
import AppInput from "@/app/components/ui/AppInput";

type Recipe = {
  id: number;
  name: string;
};

export default function DepleteInventoryPage() {
  const router = useRouter();

  const [selectedRecipeIds, setSelectedRecipeIds] = useState<number[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const selectedRecipes = recipes.filter((r) =>
    selectedRecipeIds.includes(r.id)
  );

  useEffect(() => {
    async function loadMenuItems() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recipes?recipe_type=menu_item`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setRecipes(data);
    }

    loadMenuItems();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (selectedRecipes.length === 0) {
      setError("Please select at least one menu item");
      return;
    }

    for (const recipe of selectedRecipes) {
      if (!quantities[recipe.id] || quantities[recipe.id] <= 0) {
        setError(`Please enter a quantity for ${recipe.name}`);
        return;
      }
    }


    for (const recipe of selectedRecipes) {
      const qty = quantities[recipe.id];

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recipes/${recipe.id}/deplete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: qty }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || `Failed to deplete ${recipe.name}`);
        return;
      }
    }

    setSuccess("Inventory depleted successfully");
    setSelectedRecipeIds([]);
    setQuantities({});
  }


  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Manual Inventory Depletion
      </h1>

      {error && (
        <div className="mb-4 border border-red-200 bg-red-50/50 p-3 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 border border-green-200 bg-green-50/50 p-3 rounded text-green-700 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4">
        <div>
          <FormControl fullWidth>
            <AppSelect<number>
              label="Menu Items"
              multiple
              checkbox
              value={selectedRecipeIds}
              onChange={(val) =>
                setSelectedRecipeIds(Array.isArray(val) ? val : [val])
              }
              options={recipes.map((recipe) => ({
                label: recipe.name,
                value: recipe.id,
              }))}
            />

            {selectedRecipes.map((recipe) => (
              <div key={recipe.id} className="flex items-center gap-3 mt-2">
                <span className="w-40 text-sm">{recipe.name}</span>

                <AppInput
                  type="number"
                  label="Quantity"
                  size="small"
                  min={1}
                  placeholder="Qty"
                  value={quantities[recipe.id] || ""}
                  onChange={(val) =>
                    setQuantities({
                      ...quantities,
                      [recipe.id]: Number(val),
                    })
                  }
                />
              </div>
            ))}
          </FormControl>
        </div>
        <AppButton 
          type="submit" 
          variant="danger"
          fullWidth={true}
        >
          Deplete Inventory
        </AppButton>
      </form>
    </div>
  );
}
