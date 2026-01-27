"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popover,
  Divider,
} from "@mui/material";
import AppInput from "../../components/ui/AppInput";
import AppButton from "../../components/ui/AppButton";
import AppAlert from "../../components/ui/AppAlert";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { AppSelect } from "../../components/ui/AppSelect";
import RecipePageSkeleton from "./RecipePageSkeleton";
import { apiFetch } from "../../lib/api";


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
  const [loading, setLoading] = useState(true);
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
// 🔍 Filters
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const filtersOpen = Boolean(filterAnchor);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
  useState<"" | "menu_item" | "prepped_item">("");

  useEffect(() => {
    async function loadRecipes() {
      try {
        const data = await apiFetch<Recipe[]>("/recipes", {
          cache: "no-store",
        });
        setRecipes(data);
      } catch {
        // apiFetch will redirect on 401 automatically
      } finally {
        setLoading(false);
      }
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
      await apiFetch(`/recipes/${editTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          recipe: editForm,
        }),
      });

      setEditTarget(null);

      // ✅ Redirect → triggers alert via search params
      router.push("/recipes?updated=1");
    } catch {
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
      await apiFetch(`/recipes/${deleteTarget.id}`, {
        method: "DELETE",
      });

      // ✅ Redirect → page refetches
      router.push("/recipes?deleted=1");
    } catch {
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
    try {
      for (const ri of recipe.recipe_ingredients) {
        const draft = ingredientDrafts[ri.id];

        if (draft === undefined || draft === "") continue;

        await apiFetch(
          `/recipes/${recipe.id}/recipe_ingredients/${ri.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              recipe_ingredient: {
                quantity: Number(draft),
              },
            }),
          }
        );
      }

      // ✅ Update UI optimistically
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipe.id
            ? {
                ...r,
                recipe_ingredients: r.recipe_ingredients.map((ri) => ({
                  ...ri,
                  quantity: Number(
                    ingredientDrafts[ri.id] ?? ri.quantity
                  ),
                })),
              }
            : r
        )
      );

      setIsEditingIngredients(false);
      setIngredientDrafts({});
    } catch {
      setAlert({
        open: true,
        severity: "error",
        message: "Failed to update ingredients",
      });
    }
  }

  // For deleting ingredients from a recipe
  // (not used in UI yet)
  
  // async function handleIngredientDelete(ri: any) {
  //   if (!confirm("Remove this ingredient?")) return;

  //   const res = await fetch(
  //     `${process.env.NEXT_PUBLIC_API_URL}/recipes/${ri.recipe_id}/recipe_ingredients/${ri.id}`,
  //     {
  //       method: "DELETE",
  //     }
  //   );

  //   if (!res.ok) return;

  //   setRecipes((prev) =>
  //     prev.map((recipe) =>
  //       recipe.id === ri.recipe_id
  //         ? {
  //             ...recipe,
  //             recipe_ingredients: recipe.recipe_ingredients.filter(
  //               (x: any) => x.id !== ri.id
  //             ),
  //           }
  //         : recipe
  //     )
  //   );
  // }

  const filteredRecipes = recipes
    .filter((recipe) => {
      if (
        search &&
        !recipe.name.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      if (typeFilter && recipe.recipe_type !== typeFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
    
    if (loading) {
    return <RecipePageSkeleton />;
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
          router.replace("/recipes", { scroll: false });
        }}
      />
          
      {/* Header + search + filters */}
      <div className="flex items-center justify-between mb-2 gap-4">
        {/* Left: Title */}
        <h1 
        className="text-3xl font-bold whitespace-nowrap"
        data-testid="recipes-page-title"
        >
          Recipes
        </h1>
        <Popover
          open={filtersOpen}
          anchorEl={filterAnchor}
          onClose={() => setFilterAnchor(null)}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              backgroundColor: "#262626",
              border: "1px solid #333",
              borderRadius: 2,
              p: 2,
              width: 240,
            },
          }}
        >
          <div className="space-y-4">
            <div className="text-sm font-semibold text-white">
              Filters
            </div>

            <AppSelect
              label="Recipe Type"
              value={typeFilter}
              onChange={(val) =>
                setTypeFilter(val as "" | "menu_item" | "prepped_item")
              }
              options={[
                { label: "All", value: "" },
                { label: "Menu Items", value: "menu_item" },
                { label: "Prepped Items", value: "prepped_item" },
              ]}
            />

            <Divider sx={{ borderColor: "#dfd8d8", margin: 1 }} />

            <AppButton
              intent="ghost"
              fullWidth
              onClick={() => {
                setTypeFilter("");
                setSearch("")
                setFilterAnchor(null);
              }}
            >
              Reset Filters
            </AppButton>
          </div>
        </Popover>


        {/* Right: Search + Filter */}
        <div className="flex items-center gap-3">
          <div className="w-64">
            <AppInput
              label=""
              placeholder="Search recipes…"
              value={search}
              onChange={(val) => setSearch(val)}
              size="small"
            />
          </div>

          <AppButton
            intent="primary"
            startIcon={<FilterListIcon />}
            onClick={(e) => setFilterAnchor(e.currentTarget)}
          >
            Filters
          </AppButton>
        </div>
      </div>

      {/* New recipe button (own row) */}
      <div className="mb-6">
        <Link
          href="/recipes/new"
          className="inline-block text-sm px-4 py-2 border rounded hover:bg-gray-100/10"

        >
          + New Recipe
        </Link>
      </div>

      {/* Recipe list */}
      <div 
        className="space-y-4"
      >
        {filteredRecipes.map((recipe) => {
          const isExpanded = expandedRecipeId === recipe.id;

          return (
            <div
              key={recipe.id}
              className="border rounded p-4 hover:border-gray-400 transition"
              data-testid={`recipe-row-${recipe.name}`}
              data-recipe-id={recipe.id}
            >
              {/* Header row */}
              <div className="group flex items-start justify-between">
                {/* Clickable area */}
                <div
                  className="flex-1 cursor-pointer"
                  data-testid={`recipe-toggle-${recipe.id}`}
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
                      data-testid={`edit-recipe-${recipe.id}`}
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
                      data-testid="delete-recipe"
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
                        data-testid={`recipe-ingredients-edit-${recipe.id}`}
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
                        intent="secondary"
                      >
                        Edit Ingredients
                      </AppButton>
                    ) : (
                      <div className="flex gap-2">
                        <AppButton
                          data-testid={`recipe-ingredients-save-${recipe.id}`}
                          onClick={() => handleIngredientsSave(recipe)}
                          intent="primary"
                        >
                          Save
                        </AppButton>
                        <AppButton
                          data-testid={`recipe-ingredients-cancel-${recipe.id}`}
                          onClick={() => {
                            setIsEditingIngredients(false);
                          }}
                          intent="ghost"
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
                    <ul 
                      className="space-y-2"
                      data-testid={`recipe-ingredients-list-${recipe.id}`}
                    >
                      {recipe.recipe_ingredients.map((ri: any) => (
                        <li
                          key={ri.id}
                          data-testid={`recipe-ingredient-row-${ri.id}`}
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
                                testId={`recipe-ingredient-qty-${ri.id}`}
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
        data-testid="edit-recipe-dialog"
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
              testId="edit-recipe-name"
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
              testId="edit-recipe-type"
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
          sx={{ p: 2, borderTop: "1px solid #333" }}
        >
          <AppButton
            data-testid="edit-recipe-cancel"
            intent="ghost"
            onClick={() => setEditTarget(null)}
          >
            Cancel
          </AppButton>
          <AppButton 
            intent="primary" 
            onClick={handleEditSave}
            data-testid="edit-recipe-save"
          >
            Save
          </AppButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
