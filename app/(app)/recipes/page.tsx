"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Popover,
  Divider,
} from "@mui/material";
import AppDialog from "../../components/ui/AppDialog";
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
  recipe_ingredients: RecipeIngredient[];
};

type RecipeIngredient = {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  ingredient_type?: "Ingredient" | "Recipe";
  quantity: number;
  ingredient: {
    id: number;
    name: string;
    unit?: string;
  } | null;
};

type IngredientOption = {
  id: number;
  name: string;
  ingredientType: "Ingredient" | "Recipe";
  unit?: "oz" | "pcs";
};

type Ingredient = {
  id: number;
  name: string;
  unit: "oz" | "pcs";
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
  const [ingredientOptions, setIngredientOptions] = useState<IngredientOption[]>([]);
  const [newIngredientKeys, setNewIngredientKeys] = useState<string[]>([]);
  const [newIngredientQuantities, setNewIngredientQuantities] = useState<Record<string, string>>({});
  const [deletedIngredientIds, setDeletedIngredientIds] = useState<number[]>([]);
// 🔍 Filters
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const filtersOpen = Boolean(filterAnchor);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
  useState<"" | "menu_item" | "prepped_item">("");

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

  useEffect(() => {
    loadRecipes();
  }, [searchParams]);

  useEffect(() => {
    async function loadIngredientOptions() {
      try {
        const ingredients = await apiFetch<Ingredient[]>("/ingredients", {
          cache: "no-store",
        });

        const preppedRecipes = await apiFetch<Recipe[]>("/recipes?recipe_type=prepped_item", {
          cache: "no-store",
        });

        setIngredientOptions([
          ...ingredients.map((ingredient) => ({
            id: ingredient.id,
            name: ingredient.name,
            ingredientType: "Ingredient" as const,
            unit: ingredient.unit,
          })),
          ...preppedRecipes.map((recipe) => ({
            id: recipe.id,
            name: recipe.name,
            ingredientType: "Recipe" as const,
          })),
        ]);
      } catch (err) {
        console.error("Failed to load ingredient options", err);
      }
    }

    loadIngredientOptions();
  }, []);


  useEffect(() => {
    setIsEditingIngredients(false);
    setIngredientDrafts({});
    setNewIngredientKeys([]);
    setNewIngredientQuantities({});
    setDeletedIngredientIds([]);
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
    const hasInvalidNewQuantity = newIngredientKeys.some((key) => {
      const quantity = Number(newIngredientQuantities[key]);
      return !quantity || quantity <= 0;
    });

    if (hasInvalidNewQuantity) {
      setAlert({
        open: true,
        severity: "error",
        message: "All new ingredients must have a quantity",
      });
      return;
    }

    try {
      for (const ri of recipe.recipe_ingredients) {
        if (deletedIngredientIds.includes(ri.id)) continue;

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

      for (const ingredientId of deletedIngredientIds) {
        await apiFetch(
          `/recipes/${recipe.id}/recipe_ingredients/${ingredientId}`,
          {
            method: "DELETE",
          }
        );
      }

      for (const key of newIngredientKeys) {
        const quantity = Number(newIngredientQuantities[key]);
        if (!quantity || quantity <= 0) continue;

        const [ingredientType, id] = key.split("-");

        await apiFetch(
          `/recipes/${recipe.id}/recipe_ingredients`,
          {
            method: "POST",
            body: JSON.stringify({
              recipe_ingredient: {
                ingredient_id: Number(id),
                ingredient_type: ingredientType,
                quantity,
              },
            }),
          }
        );
      }

      await loadRecipes();

      setIsEditingIngredients(false);
      setIngredientDrafts({});
      setNewIngredientKeys([]);
      setNewIngredientQuantities({});
      setDeletedIngredientIds([]);
    } catch {
      setAlert({
        open: true,
        severity: "error",
        message: "Failed to update ingredients",
      });
    }
  }

  function getIngredientKey(option: IngredientOption) {
    return `${option.ingredientType}-${option.id}`;
  }

  function getRecipeIngredientKey(ri: RecipeIngredient) {
    return `${ri.ingredient_type ?? "Ingredient"}-${ri.ingredient_id}`;
  }

  function getIngredientOption(key: string) {
    return ingredientOptions.find((option) => getIngredientKey(option) === key);
  }

  function getGroupedIngredientOptions(recipe: Recipe) {
    const existingKeys = new Set(
      recipe.recipe_ingredients
        .filter((ri) => !deletedIngredientIds.includes(ri.id))
        .map(getRecipeIngredientKey)
    );

    const ingredients = ingredientOptions.filter(
      (option) =>
        option.ingredientType === "Ingredient" &&
        !existingKeys.has(getIngredientKey(option))
    );

    const preppedRecipes = ingredientOptions.filter(
      (option) =>
        recipe.recipe_type !== "prepped_item" &&
        option.ingredientType === "Recipe" &&
        option.id !== recipe.id &&
        !existingKeys.has(getIngredientKey(option))
    );

    return [
      {
        group: "Ingredients",
        options: ingredients
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((ingredient) => ({
            value: getIngredientKey(ingredient),
            label: `${ingredient.name}${ingredient.unit ? ` (${ingredient.unit})` : ""}`,
          })),
      },
      {
        group: "Prepped Items",
        options: preppedRecipes
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((recipe) => ({
            value: getIngredientKey(recipe),
            label: recipe.name,
          })),
      },
    ].filter((group) => group.options.length > 0);
  }

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-3 md:gap-4">
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
        <div className="md:w-auto flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
          <div className="md:w-64">
            <AppInput
              label=""
              placeholder="Search recipes…"
              value={search}
              onChange={(val) => setSearch(val)}
              size="small"
            />
          </div>

          <AppButton
            intent="ghost"
            startIcon={<FilterListIcon />}
            size="small"
            
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
          const visibleRecipeIngredients = recipe.recipe_ingredients.filter(
            (ri) => !deletedIngredientIds.includes(ri.id)
          );
          const groupedIngredientOptions = getGroupedIngredientOptions(recipe);

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

                  <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition">
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
                              (acc: Record<number, string>, ri: RecipeIngredient) => {
                                acc[ri.id] = String(ri.quantity);
                                return acc;
                              },
                              {}
                            )
                          );
                          setNewIngredientKeys([]);
                          setNewIngredientQuantities({});
                          setDeletedIngredientIds([]);
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
                              setIngredientDrafts({});
                              setNewIngredientKeys([]);
                              setNewIngredientQuantities({});
                              setDeletedIngredientIds([]);
                            }}
                            intent="ghost"
                          >
                          Cancel
                        </AppButton>
                      </div>
                    )}
                  </div>

                  {/* Ingredient list */}
                  {isEditingIngredients && (
                    <div className="space-y-2">
                      {groupedIngredientOptions.length > 0 && (
                        <AppSelect<string>
                          label="Add Ingredients"
                          multiple
                          checkbox
                          value={newIngredientKeys}
                          testId={`recipe-ingredients-add-${recipe.id}`}
                          onChange={(vals) => {
                            const nextKeys = Array.isArray(vals) ? vals : [vals];
                            setNewIngredientKeys(nextKeys);
                            setNewIngredientQuantities((prev) =>
                              nextKeys.reduce<Record<string, string>>((acc, key) => {
                                acc[key] = prev[key] ?? "";
                                return acc;
                              }, {})
                            );
                          }}
                          options={groupedIngredientOptions}
                        />
                      )}

                      {newIngredientKeys.map((key) => {
                        const ingredient = getIngredientOption(key);

                        if (!ingredient) return null;

                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between text-sm gap-4"
                            data-testid={`recipe-new-ingredient-row-${key}`}
                          >
                            <span className="text-gray-400 flex-1">
                              {ingredient.name}
                            </span>

                            <div className="flex items-center gap-2">
                              <AppInput
                                type="text"
                                label=""
                                testId={`recipe-new-ingredient-qty-${key}`}
                                min={0.01}
                                step={0.01}
                                width={60}
                                inputPadding="4px 6px"
                                fullWidth={false}
                                value={newIngredientQuantities[key] ?? ""}
                                onChange={(val) =>
                                  setNewIngredientQuantities({
                                    ...newIngredientQuantities,
                                    [key]: val,
                                  })
                                }
                                size="small"
                              />
                              <span className="text-gray-500 w-8">
                                {ingredient.unit ?? "qty"}
                              </span>
                              <HighlightOffIcon
                                className="cursor-pointer text-red-400 hover:text-red-300"
                                sx={{ fontSize: ".9rem" }}
                                data-testid={`recipe-new-ingredient-remove-${key}`}
                                onClick={() => {
                                  setNewIngredientKeys((prev) =>
                                    prev.filter((item) => item !== key)
                                  );
                                  setNewIngredientQuantities((prev) => {
                                    const next = { ...prev };
                                    delete next[key];
                                    return next;
                                  });
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!visibleRecipeIngredients || visibleRecipeIngredients.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No ingredients yet
                    </div>
                  ) : (
                    <ul 
                      className="space-y-2"
                      data-testid={`recipe-ingredients-list-${recipe.id}`}
                    >
                      {visibleRecipeIngredients.map((ri: RecipeIngredient) => (
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
                            <div className="flex items-center gap-2">
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
                              <HighlightOffIcon
                                className="cursor-pointer text-red-400 hover:text-red-300"
                                sx={{ fontSize: ".9rem" }}
                                data-testid={`recipe-ingredient-remove-${ri.id}`}
                                onClick={() =>
                                  setDeletedIngredientIds((prev) =>
                                    prev.includes(ri.id) ? prev : [...prev, ri.id]
                                  )
                                }
                              />
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
      <AppDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        testId="edit-recipe-dialog"
        title="Edit Recipe"
        contentSx={{
          pt: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
        paperSx={{
          backgroundColor: "#262626",
          color: "white",
          border: "1px solid #333",
        }}
        actions={
          <>
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
          </>
        }
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
      </AppDialog>
    </div>
  );
}
