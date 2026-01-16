"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormControl } from "@mui/material";
import AppInput from "@/app/components/ui/AppInput";
import AppCheckbox from "@/app/components/ui/AppCheckbox";
import { AppSelect } from "@/app/components/ui/AppSelect";
import AppButton from "@/app/components/ui/AppButton";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import AppAlert from "@/app/components/ui/AppAlert";
import NewRecipePageSkeleton from "@/app/(app)/recipes/new/NewRecipePageSkeleton";
import { apiFetch } from "@/app/lib/api";

type Product = {
  id: number;
  name: string;
  unit: "oz" | "pcs";
};

type PreppedRecipe = {
  id: number;
  name: string;
};

type Recipe = {
  id: number;
  name: string;
  recipe_type: "menu_item" | "prepped_item";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const products = ingredientOptions.filter(
    (i) => i.ingredientType === "Product"
  );

  const preppedRecipes = ingredientOptions.filter(
    (i) => i.ingredientType === "Recipe"
  );

  const groupedIngredientOptions = [
    {
      group: "Products",
      options: products
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({
          value: `Product-${p.id}`,
          label: `${p.name}${p.unit ? ` (${p.unit})` : ""}`,
        })),
    },
    {
      group: "Prepped Items",
      options: preppedRecipes
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((r) => ({
          value: `Recipe-${r.id}`,
          label: r.name,
        })),
    },
  ].filter((g) => g.options.length > 0);


  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
    ) {
    const { name, type, checked, value } = e.target;

    setForm({
        ...form,
        [name]: type === "checkbox" ? checked : value,
    });
    }

  // Confirm and save new recipe
  async function handleConfirmSave() {
    setSubmitting(true);
    setErrorAlert(null);

    try {
      // 1️⃣ Create recipe
      const recipe = await apiFetch<Recipe>("/recipes", {
        method: "POST",
        body: JSON.stringify({
          recipe: {
            name: form.name,
            recipe_type: form.is_prepped
              ? "prepped_item"
              : "menu_item",
          },
        }),
      });

      // 2️⃣ Create recipe ingredients
      for (const key of selectedIngredients) {
        const [ingredientType, id] = key.split("-");

        await apiFetch(
          `/recipes/${recipe.id}/recipe_ingredients`,
          {
            method: "POST",
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

      router.push("/recipes?created=1");
    } catch (err: any) {
      setErrorAlert(err.message || "Failed to create recipe");
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  // Form validation
  function validate() {
    if (!form.name.trim()) {
      setErrorAlert("Recipe name is required");
      return false;
    }

    if (selectedIngredients.length === 0) {
      setErrorAlert("Please select at least one ingredient");
      return false;
    }

    for (const key of selectedIngredients) {
      if (!quantities[key] || quantities[key] <= 0) {
        setErrorAlert("All ingredients must have a quantity");
        return false;
      }
    }

    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorAlert(null);

    if (!validate()) return;

    setConfirmOpen(true);
  }

  // Load ingredient options
  useEffect(() => {
    async function loadIngredients() {
      try {
        // 1️⃣ Load products
        const products = await apiFetch<Product[]>("/products", {
          cache: "no-store",
        });

        let options: IngredientOption[] = products.map((p) => ({
          id: p.id,
          name: p.name,
          ingredientType: "Product",
          unit: p.unit,
        }));

        // 2️⃣ Load prepped recipes (only if NOT prepped)
        if (!form.is_prepped) {
          const prepped = await apiFetch<PreppedRecipe[]>(
            "/recipes?recipe_type=prepped_item",
            { cache: "no-store" }
          );

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
      } finally {
        setLoading(false);
      }
    }

    loadIngredients();
  }, [form.is_prepped]);


  // Skeleton loading state
  if (loading) {
    return <NewRecipePageSkeleton />;
  }

  return (
    
    <div className="max-w-xl mx-auto p-6">
      {/* Header */}
      {errorAlert && (
        <AppAlert
          open={true}
          severity="error"
          message={errorAlert}
          onClose={() => setErrorAlert(null)}
        />
      )}
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
            <AppSelect<string>
              label="Select Ingredients"
              multiple
              checkbox
              value={selectedIngredients}
              onChange={(vals) =>
                setSelectedIngredients(Array.isArray(vals) ? vals : [vals])
              }
              options={groupedIngredientOptions}
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
      <ConfirmDialog
        open={confirmOpen}
        title={`Save "${form.name}"`}
        description="This will create the recipe and its ingredients."
        confirmText="Save Recipe"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
}
