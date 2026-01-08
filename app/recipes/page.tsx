"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AppInput from "../components/ui/AppInput";
import AppButton from "../components/ui/AppButton";
import AppAlert from "../components/ui/AppAlert";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { AppSelect } from "../components/ui/AppSelect";


type Recipe = {
  id: number;
  name: string;
  recipe_type: "menu_item" | "prepped_item";
  recipe_ingredients: any[];
};

export default function RecipesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [alert, setAlert] = useState<{
  open: boolean;
  message: string;
  severity: "success" | "error";
}>({
  open: false,
  message: "",
  severity: "success",
});
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<Recipe | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    recipe_type: "menu_item" as "menu_item" | "prepped_item",
  });
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);
  const [isEditingIngredients, setIsEditingIngredients] = useState(false);
  const [ingredientDrafts, setIngredientDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    async function loadRecipes() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recipes`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setRecipes(data);
    }

    loadRecipes();
  }, [searchParams]);

  useEffect(() => {
    setIsEditingIngredients(false);
    setIngredientDrafts({});
  }, [expandedRecipeId]);

  useEffect(() => {
    if (searchParams.get("created") === "1") {
      setAlert({
        open: true,
        severity: "success",
        message: "Recipe saved successfully!",
      });
    }
    if (searchParams.get("updated") === "1") {
      setAlert({
        open: true,
        severity: "success",
        message: "Recipe updated successfully!",
      });
    }
    if (searchParams.get("deleted") === "1") {
      setAlert({
        open: true,
        severity: "success",
        message: "Recipe deleted successfully!",
      });
    }
  }, [searchParams]);

  // For editing recipes
  async function handleEditSave() {
    if (!editTarget) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recipes/${editTarget.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe: editForm }),
        }
      );

      if (!res.ok) {
        throw new Error("Update failed");
      }

      setEditTarget(null);

      // ✅ Redirect → triggers alert + closes dialog implicitly
      router.push("/recipes?updated=1");
    } catch (err) {
      setAlert({
        open: true,
        severity: "error",
        message: "Failed to update recipe",
      });
    }
  }


  // For deleting recipes
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recipes/${deleteTarget.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      // ✅ Redirect → page refetches
      router.push("/recipes?deleted=1");
    } catch (err) {
      setAlert({
        open: true,
        severity: "error",
        message: "Failed to delete recipe",
      });
    } finally {
      setDeleteTarget(null);
    }
  }


  // For editing ingredient quantities
  async function handleIngredientsSave(recipe: Recipe) {
  for (const ri of recipe.recipe_ingredients) {
    const draft = ingredientDrafts[ri.id];

    if (draft === undefined || draft === "") continue;

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/recipes/${recipe.id}/recipe_ingredients/${ri.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_ingredient: {
            quantity: Number(draft),
          },
        }),
      }
    );
  }

  // Update UI
  setRecipes((prev) =>
    prev.map((r) =>
      r.id === recipe.id
        ? {
            ...r,
            recipe_ingredients: r.recipe_ingredients.map((ri) => ({
              ...ri,
              quantity: Number(ingredientDrafts[ri.id] ?? ri.quantity),
            })),
          }
        : r
    )
  );

  setIsEditingIngredients(false);
  setIngredientDrafts({});
}

  // For deleting ingredients from a recipe
  async function handleIngredientDelete(ri: any) {
    if (!confirm("Remove this ingredient?")) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/recipes/${ri.recipe_id}/recipe_ingredients/${ri.id}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) return;

    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === ri.recipe_id
          ? {
              ...recipe,
              recipe_ingredients: recipe.recipe_ingredients.filter(
                (x: any) => x.id !== ri.id
              ),
            }
          : recipe
      )
    );
  }

  return (
    // Main container
    <div className="max-w-3xl mx-auto p-6">
      <AppAlert
        open={alert.open}
        severity={alert.severity}
        message={alert.message}
        onClose={() => {
          setAlert({ ...alert, open: false });
          router.replace("/recipes");
        }}
      />
      
      {/* Header & New Recipe Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Recipes</h1>

        <Link
          href="/recipes/new"
          className="text-sm px-4 py-2 border rounded hover:bg-gray-100/10"
        >
          + New Recipe
        </Link>
      </div>

      {/* Recipe list */}
      <div className="space-y-4">
        {recipes.map((recipe) => {
          const isExpanded = expandedRecipeId === recipe.id;

          return (
            <div
              key={recipe.id}
              className="border rounded p-4 hover:border-gray-400 transition"
            >
              {/* Header row */}
              <div className="group flex items-start justify-between">
                {/* Clickable area */}
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() =>
                    setExpandedRecipeId(
                      isExpanded ? null : recipe.id
                    )
                  }
                >
                  <div className="font-semibold text-lg">
                    {recipe.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {recipe.recipe_type
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-3">
                  <div className="text-gray-400 text-xl">
                    {isExpanded ? "▾" : "▸"}
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <EditIcon
                      className="cursor-pointer text-blue-400 hover:text-blue-300"
                      sx={{ fontSize: '.9rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTarget(recipe);
                        setEditForm({
                          name: recipe.name,
                          recipe_type: recipe.recipe_type,
                        });
                      }}
                    />

                    <HighlightOffIcon
                      className="cursor-pointer text-red-400 hover:text-red-300"
                      sx={{ fontSize: '.9rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(recipe);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              {isExpanded && (
                <div className="mt-4 border-t pt-3 space-y-3">
                  {/* Edit / Save / Cancel controls */}
                  <div className="flex justify-end">
                    {!isEditingIngredients ? (
                      <AppButton
                        onClick={() => {
                          setIngredientDrafts(
                            recipe.recipe_ingredients.reduce(
                              (acc: Record<number, string>, ri: any) => {
                                acc[ri.id] = String(ri.quantity);
                                return acc;
                              },
                              {}
                            )
                          );
                          setIsEditingIngredients(true);
                        }}
                        variant="secondary"
                      >
                        Edit Ingredients
                      </AppButton>
                    ) : (
                      <div className="flex gap-2">
                        <AppButton
                          onClick={() => handleIngredientsSave(recipe)}
                          variant="primary"
                        >
                          Save
                        </AppButton>
                        <AppButton
                          onClick={() => {
                            // No need to reset drafts here since we're deleting
                            setIsEditingIngredients(false);
                          }}
                          variant="ghost"
                        >
                          Cancel
                        </AppButton>
                      </div>
                    )}
                  </div>

                  {/* Ingredient list */}
                  {!recipe.recipe_ingredients ||recipe.recipe_ingredients.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No ingredients yet
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {recipe.recipe_ingredients.map((ri: any) => (
                        <li
                          key={ri.id}
                          className="flex items-center justify-between text-sm gap-4"
                        >
                          {/* Ingredient name */}
                          <span className="text-gray-400 flex-1">
                            {ri.ingredient?.name ?? "Missing Ingredient"}
                          </span>

                          {/* Quantity */}
                          {isEditingIngredients ? (
                            <div className="flex items-center gap-1">
                              <AppInput
                                type="text"
                                label=""
                                min={0.01}
                                step={0.01}
                                width={60}
                                inputPadding="4px 6px"
                                fullWidth={false}
                                value={ingredientDrafts[ri.id] ?? ""}
                                onChange={(val) =>
                                  setIngredientDrafts({
                                    ...ingredientDrafts,
                                    [ri.id]: val,
                                  })
                                }
                                size="small"
                              />
                              <span className="text-gray-500">
                                {ri.ingredient?.unit ?? "qty"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500 w-24 text-right">
                              {ri.quantity} {ri.ingredient?.unit ?? ""}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit & Delete Dialogs */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Recipe"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
      <Dialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#262626",
              color: "white",
              border: "1px solid #333",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: "1.25rem",
            marginBottom: 2,
            borderBottom: "1px solid #333",
            pb: 1.5,
          }}
        >
          Edit Recipe
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          {/* Recipe Name */}
          <div>
            <AppInput
              value={editForm.name}
              label="Recipe Name"
              onChange={(val) =>
                setEditForm({ ...editForm, name: val })
              }
              fullWidth={true}
            />
          </div>

          {/* Recipe Type */}
          <div>
            <AppSelect
              value={editForm.recipe_type}
              label="Menu Item"
              onChange={(val) =>
                setEditForm({
                  ...editForm,
                  recipe_type: val as "menu_item" | "prepped_item",
                })
              }
              options={[
                { value: "menu_item", label: "Menu Item" },
                { value: "prepped_item", label: "Prepped Item" },
              ]}
            />
          </div>
        </DialogContent>

        <DialogActions
          sx={{ p: 2, borderTop: "1px solid #333" }}>
          <AppButton
            variant="ghost"
            onClick={() => setEditTarget(null)}
          >
            Cancel
          </AppButton>
          <AppButton variant="primary" onClick={handleEditSave}>
            Save
          </AppButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
