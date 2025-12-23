"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);

  useEffect(() => {
    async function loadRecipes() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recipes`
      );
      const data = await res.json();
      setRecipes(data);
    }

    loadRecipes();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Recipes</h1>

        <Link
          href="/recipes/new"
          className="text-sm px-4 py-2 border rounded hover:bg-gray-100"
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
              onClick={() =>
                setExpandedRecipeId(
                  isExpanded ? null : recipe.id
                )
              }
              className="border rounded p-4 cursor-pointer hover:border-gray-400
                         hover:bg-gray-100/10 transition"
            >
              {/* Recipe header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">
                    {recipe.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {recipe.recipe_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                </div>

                <div className="text-gray-400 text-xl">
                  {isExpanded ? "▾" : "▸"}
                </div>
              </div>

              {/* Ingredients */}
              {isExpanded && (
                <div className="mt-4 border-t pt-3">
                  {recipe.recipe_ingredients.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No ingredients yet
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {recipe.recipe_ingredients.map((ri: any) => (
                        <li
                          key={ri.id}
                          className="text-sm text-gray-700 flex justify-between"
                        >
                          <span className="text-gray-400">{ri.ingredient.name}</span>
                          <span className="text-gray-500">
                            {ri.quantity} {ri.ingredient.unit}
                          </span>
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
    </div>
  );
}
