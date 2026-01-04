"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

type Recipe = {
  id: number;
  name: string;
  recipe_type: "menu_item" | "prepped_item";
  recipe_ingredients: any[];
};

export default function RecipesPage() {
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
  }, []);

  // For editing recipes
  async function handleEditSave() {
    if (!editTarget) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/recipes/${editTarget.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: editForm }),
      }
    );

    if (!res.ok) return;

    const updated = await res.json();

    setRecipes((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );

    setEditTarget(null);
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

    // Remove from UI
    setRecipes((prev) =>
      prev.filter((r) => r.id !== deleteTarget.id)
    );
  } catch (err) {
    console.error(err);
    // later: snackbar error
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
                      <button
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
                        className="text-xs px-3 py-1 border rounded hover:bg-gray-100/10"
                      >
                        Edit Ingredients
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleIngredientsSave(recipe)}
                          className="text-xs px-3 py-1 border rounded text-green-400"
                        >
                          Save
                        </button>

                        <button
                          onClick={() => {
                            setIsEditingIngredients(false);
                            setIngredientDrafts({});
                          }}
                          className="text-xs px-3 py-1 border rounded text-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Ingredient list */}
                  {recipe.recipe_ingredients.length === 0 ? (
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
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={ingredientDrafts[ri.id] ?? ""}
                                onChange={(e) =>
                                  setIngredientDrafts({
                                    ...ingredientDrafts,
                                    [ri.id]: e.target.value,
                                  })
                                }
                                className="w-24 border rounded px-2 py-1 bg-black text-white"
                              />
                              <span className="text-gray-500">
                                {ri.ingredient?.unit ?? ""}
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
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
      >
        <DialogTitle>Delete Recipe</DialogTitle>

        <DialogContent>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.name}</strong>?
            <br />
            This action cannot be undone.
          </p>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>

          <Button
            color="error"
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Recipe</DialogTitle>

        <DialogContent className="space-y-4 pt-2">
          {/* Recipe Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Recipe Name
            </label>
            <input
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              className="w-full border p-2 rounded bg-white text-black"
            />
          </div>

          {/* Recipe Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Recipe Type
            </label>

            <select
              value={editForm.recipe_type}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  recipe_type: e.target.value as
                    | "menu_item"
                    | "prepped_item",
                })
              }
              className="w-full border p-2 rounded bg-white text-black"
            >
              <option value="menu_item">Menu Item</option>
              <option value="prepped_item">Prepped Item</option>
            </select>
          </div>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setEditTarget(null)}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleEditSave}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
