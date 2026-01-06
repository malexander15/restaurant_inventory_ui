"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FormControl,
  InputLabel,
} from "@mui/material";
import AppInput from "@/app/components/ui/AppInput";
import AppCheckbox from "@/app/components/ui/AppCheckbox";
import { AppSelect } from "@/app/components/ui/AppSelect";
import AppButton from "@/app/components/ui/AppButton";

type Product = {
  id: number;
  name: string;
  unit: "oz" | "pcs";
};

type PreppedRecipe = {
  id: number;
  name: string;
};

type IngredientOption = {
  id: number;
  name: string;
  ingredientType: "Product" | "Recipe";
  unit?: "oz" | "pcs"; // only for products
};

export default function NewRecipePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    is_prepped: false,
  });
  const [ingredientOptions, setIngredientOptions] = useState<IngredientOption[]>([]);
  const [selectedIngredients, setSelectedIngredients] =
  useState<string[]>([]);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);

  function handleChange(
  e: React.ChangeEvent<HTMLInputElement>
  ) {
  const { name, type, checked, value } = e.target;

  setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
  });
  }


    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setErrors([]);

      // 1️⃣ Create recipe
      const recipeRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recipes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipe: {
              name: form.name,
              recipe_type: form.is_prepped ? "prepped_item" : "menu_item",
            },
          }),
        }
      );

      if (!recipeRes.ok) {
        const data = await recipeRes.json();
        setErrors(data.errors || ["Failed to create recipe"]);
        return;
      }

      const recipe = await recipeRes.json();

      // 2️⃣ Create recipe ingredients
      for (const key of selectedIngredients) {
        const [ingredientType, id] = key.split("-");

        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/recipes/${recipe.id}/recipe_ingredients`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipe_ingredient: {
                ingredient_id: Number(id),
                ingredient_type: ingredientType,
                quantity: quantities[key],
              },
            }),
          }
        );
      }

      // 3️⃣ Done
      router.push("/recipes");
    }


  useEffect(() => {
    async function loadIngredients() {
      try {
        // Always load products
        const productsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products`,
          { cache: "no-store" }
        );
        const products: Product[] = await productsRes.json();

        let options: IngredientOption[] = products.map((p) => ({
          id: p.id,
          name: p.name,
          ingredientType: "Product",
          unit: p.unit,
        }));

        // Only load prepped recipes if NOT a prepped item
        if (!form.is_prepped) {
          const recipesRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/recipes?recipe_type=prepped_item`,
            { cache: "no-store" }
          );
          const prepped: PreppedRecipe[] = await recipesRes.json();

          options = options.concat(
            prepped.map((r) => ({
              id: r.id,
              name: r.name,
              ingredientType: "Recipe",
            }))
          );
        }

        setIngredientOptions(options);
        setSelectedIngredients([]);
        setQuantities({});
      } catch (err) {
        console.error("Failed to load ingredients", err);
      }
    }

    loadIngredients();
  }, [form.is_prepped]);

  return (
    
    <div className="max-w-xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">New Recipe</h1>
        <p className="text-sm text-gray-500">
          Create a menu item or prepped item
        </p>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-4 border border-red-200 bg-red-50/50 rounded p-3">
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="border rounded p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">
            Recipe Name
          </label>
          <AppInput
            type="text"
            name="name"
            label=""
            value={form.name}
            onChange={(val: string) => setForm({ ...form, name: val })}
            placeholder="e.g. Quesadilla"
          /> 
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Recipe Type
          </label>
          <div className="flex items-start gap-3">
            {/* <input
              type="checkbox"
              name="is_prepped"
              checked={form.is_prepped}
              onChange={handleChange}
              className="mt-1"
            /> */}
            <AppCheckbox
              label=""
              checked={form.is_prepped}
              onChange={(checked: boolean) =>
                setForm({ ...form, is_prepped: checked })
              }
            />

            <div>
              <label className="font-medium">
                Prepped Item
              </label>
              <p className="text-sm text-gray-500">
                Check this if the recipe is prepared ahead of time
                (e.g. grilled chicken, pico de gallo).
              </p>
            </div>
          </div>
        </div>

        <div>
          <FormControl fullWidth>
            <InputLabel sx={{ color: "white" }}>
              Select Ingredients
            </InputLabel>     
            <AppSelect
              label="Select Ingredients"
              multiple
              checkbox
              value={selectedIngredients}
              onChange={(vals: string | string[]) =>
                setSelectedIngredients(Array.isArray(vals) ? vals : [vals])
              }
              options={ingredientOptions.map((option) => ({
                value: `${option.ingredientType}-${option.id}`,
                label:
                  option.ingredientType === "Product"
                    ? `${option.name} (Product${option.unit ? ` - ${option.unit}` : ""})`
                    : `${option.name} (Prepped Item)`,
              }))}
            />
          
            {selectedIngredients.map((key) => {
              const ingredient = ingredientOptions.find(
                (o) => `${o.ingredientType}-${o.id}` === key
              );

              if (!ingredient) return null;

              return (
                <div key={key} className="flex items-center gap-3 mt-2">
                  <span className="text-sm w-40">{ingredient.name}</span>
                  <AppInput
                    label=""
                    type="number"
                    size="small"
                    min={0}
                    step={0.01}
                    placeholder={ingredient.unit ? ingredient.unit : "qty"}
                    value={quantities[key] || ""}
                    onChange={(val: string) =>
                      setQuantities({
                        ...quantities,
                        [key]: Number(val),
                      })
                    }
                    fullWidth={false}
                  />
                </div>
              );
            })}
          </FormControl>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <AppButton variant="ghost">
            <Link href="/recipes">
            Cancel
            </Link>
          </AppButton>
          <AppButton type="submit">Create Recipe</AppButton>
        </div>
      </form>
    </div>
  );
}
