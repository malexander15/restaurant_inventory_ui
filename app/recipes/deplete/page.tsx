"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FormControl,
  InputLabel, 
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText
 } from "@mui/material";

type Recipe = {
  id: number;
  name: string;
};

export default function DepleteInventoryPage() {
  const router = useRouter();

  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    setSelectedRecipes([]);
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
          <label className="block text-sm font-medium mb-1">
            Menu Item
          </label>
          <FormControl fullWidth>
            <InputLabel>Menu Items</InputLabel>
            <Select
              multiple
              value={selectedRecipes}
              onChange={(e) =>
                setSelectedRecipes(e.target.value as Recipe[])
              }
              input={<OutlinedInput label="Menu Items" />}
              renderValue={(selected) =>
                selected.map((r) => r.name).join(", ")
              }
              className="bg-black text-white"
              sx={{
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#333",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#555",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#777",
                },
              }}            >
              {recipes.map((recipe) => (
              <MenuItem key={recipe.id} 
                        value={recipe}
                        sx={{
                          backgroundColor: "#111",
                          color: "white",
                          "&.Mui-selected": { backgroundColor: "#222" },
                          "&:hover": { backgroundColor: "#1a1a1a" },
                        }}
                >
                <Checkbox
                  checked={selectedRecipes.some(r => r.id === recipe.id)}
                />
                <ListItemText primary={recipe.name} />
              </MenuItem>
              ))}
            </Select>
            {selectedRecipes.map((recipe) => (
              <div key={recipe.id} className="flex items-center gap-3 mt-2">
                <span className="w-40 text-sm">{recipe.name}</span>

                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={quantities[recipe.id] || ""}
                  onChange={(e) =>
                    setQuantities({
                      ...quantities,
                      [recipe.id]: Number(e.target.value),
                    })
                  }
                  className="w-24 border rounded px-2 py-1 text-sm bg-black text-white"
                />
              </div>
            ))}
          </FormControl>

        </div>

        <button
          type="submit"
          className="
            w-full py-2 border rounded
            hover:bg-gray-100/10
            transition
          "
        >
          Deplete Inventory
        </button>
      </form>
    </div>
  );
}
