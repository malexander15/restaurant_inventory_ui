"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormControl } from "@mui/material";
import { AppSelect } from "@/app/components/ui/AppSelect";
import AppButton from "@/app/components/ui/AppButton";
import AppInput from "@/app/components/ui/AppInput";
import DepleteInventoryPageSkeleton from "@/app/recipes/deplete/DepleteInventoryPageSkeleton";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import Papa from "papaparse";

type Recipe = {
  id: number;
  name: string;
};

type StagedDepletion = {
  recipe_id: number;
  recipe_name: string;
  quantity: number;
  source: "csv";
};


export default function DepleteInventoryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<number[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const selectedRecipes = recipes.filter((r) =>
    selectedRecipeIds.includes(r.id)
  );
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvStagedItems, setCsvStagedItems] = useState<StagedDepletion[]>( []);
  const [csvParsed, setCsvParsed] = useState(false);
  const [csvApplied, setCsvApplied] = useState(false);
  const [showAllUnmatched, setShowAllUnmatched] = useState(false);

  useEffect(() => {
    async function loadMenuItems() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recipes?recipe_type=menu_item`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setRecipes(data);
      setLoading(false);
    }

    loadMenuItems();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setConfirmOpen(true);
  }

  function normalizeName(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " "); // collapse extra spaces
  }

  const csvDepletions = normalizeSales(csvRows);
  console.log("Normalized CSV depletions:", csvDepletions);

  const matchedRecipes = recipes
    .map((recipe) => {
      const matchQty = csvDepletions[normalizeName(recipe.name)];
      if (!matchQty) return null;

      return {
        recipe,
        quantity: matchQty,
      };
    })
    .filter(Boolean) as { recipe: Recipe; quantity: number }[];

  const unmatchedCsvItems = Object.keys(csvDepletions).filter(
    (name) =>
      !recipes.some(
        (r) => normalizeName(r.name) === normalizeName(name)
      )
  );

  const MAX_UNMATCHED_PREVIEW = 10;

  const hasMoreUnmatched =
    unmatchedCsvItems.length > MAX_UNMATCHED_PREVIEW;

  const visibleUnmatchedItems = showAllUnmatched
    ? unmatchedCsvItems
    : unmatchedCsvItems.slice(0, MAX_UNMATCHED_PREVIEW);

    const MAX_MATCHED_PREVIEW = 10;

  const [showAllMatched, setShowAllMatched] = useState(false);

  const hasMoreMatched =
    matchedRecipes.length > MAX_MATCHED_PREVIEW;

  const visibleMatchedItems = showAllMatched
    ? matchedRecipes
    : matchedRecipes.slice(0, MAX_MATCHED_PREVIEW);

  useEffect(() => {
    if (matchedRecipes.length === 0) return;
    if (csvApplied) return;

    setSelectedRecipeIds(
      matchedRecipes.map((m) => m.recipe.id)
    );

    setQuantities(
      Object.fromEntries(
        matchedRecipes.map((m) => [
          m.recipe.id,
          m.quantity,
        ])
      )
    );

    setCsvApplied(true);
  }, [matchedRecipes, csvApplied]);

  async function handleConfirmDeplete() {
  setSubmitting(true);
  setError(null);

  try {
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
        throw new Error(
          data.error || `Failed to deplete ${recipe.name}`
        );
      }
    }

    // ✅ success → redirect
    router.push("/products/?depleted=1");
  } catch (err: any) {
    setError(err.message);
    setConfirmOpen(false);
  } finally {
    setSubmitting(false);
  }
}

  function validate() {
    if (selectedRecipes.length === 0) {
      setError("Please select at least one menu item");
      return false;
    }

    for (const recipe of selectedRecipes) {
      if (!quantities[recipe.id] || quantities[recipe.id] <= 0) {
        setError(`Please enter a quantity for ${recipe.name}`);
        return false;
      }
    }

    return true;
  }

  function normalizeSales(rows: any[]) {
    const map: Record<string, number> = {};

    for (const row of rows) {
      // Inspect raw row shape
      const rawName = row.item ?? row.Item ?? row.ITEM;
      const rawQty =
        row["items sold"] ??
        row["Items Sold"] ??
        row.items_sold ??
        row.quantity;

      if (!rawName || rawQty == null) continue;

      const name = normalizeName(String(rawName));
      const qty = Number(String(rawQty).replace(/,/g, ""));

      if (!Number.isFinite(qty) || qty <= 0) continue;

      map[name] = (map[name] || 0) + qty;
    }

    return map;
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setCsvError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvRows(results.data as any[]);
        setCsvParsed(true);
      },
      error: (error) => {
        setCsvError(`CSV parsing error: ${error.message}`);
      },
    });
    setCsvParsed(false);
  }

  useEffect(() => {
    if (!csvParsed) return;

    console.log("CSV keys:", Object.keys(csvDepletions));
    console.log(
      "Recipe names:",
      recipes.map((r) => normalizeName(r.name))
    );
  }, [csvParsed, csvDepletions, recipes]);

  if (loading) {
    return <DepleteInventoryPageSkeleton />;
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
              options={recipes
                .slice() // avoid mutating state
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((recipe) => ({
                  label: recipe.name,
                  value: recipe.id,
                }))}
            />

            {selectedRecipes.map((recipe) => (
              <div key={recipe.id} className="flex items-center gap-3 mt-2">
                <span className="w-40 text-sm">{recipe.name}</span>

                <AppInput
                  type="number"
                  label="Qty"
                  fullWidth={false}
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
          disabled={submitting}
        >
          Deplete Inventory
        </AppButton>
      </form>
      <div className="border rounded p-3 space-y-2">
        <h2 className="font-semibold text-sm">
          Upload POS Sales Report (CSV)
        </h2>

        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          hidden
          onChange={handleCsvUpload}
        />

        <AppButton
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload CSV
        </AppButton>

        {csvError && (
          <p className="text-sm text-red-500">{csvError}</p>
        )}
      </div>
      {csvParsed && (
        <div className="border rounded p-3 text-sm space-y-1 bg-white/5">
          <div>
            <strong>File:</strong> {csvFile?.name}
          </div>

          <div>
            <strong>Rows parsed:</strong> {csvRows.length}
          </div>

          <div>
            <strong>Matched menu items:</strong> {matchedRecipes.length}
          </div>

          {unmatchedCsvItems.length > 0 && (
            <div className="text-yellow-400">
              {unmatchedCsvItems.length} item(s) could not be matched
            </div>
          )}
        </div>
      )}

      {matchedRecipes.length > 0 && (
        <div className="border border-green-600 bg-green-50/10 p-3 rounded text-sm space-y-2">
          <strong className="text-green-400">
            Matched menu items (ready to deplete):
          </strong>

          <ul className="list-disc ml-4">
            {visibleMatchedItems.map(({ recipe, quantity }) => (
              <li key={recipe.id} className="flex justify-between gap-4">
                <span>{recipe.name}</span>
                <span className="text-green-400 font-medium">
                  {quantity}
                </span>
              </li>
            ))}
          </ul>

          {hasMoreMatched && !showAllMatched && (
            <div className="text-green-400">
              +{matchedRecipes.length - MAX_MATCHED_PREVIEW} more items
            </div>
          )}

          {hasMoreMatched && (
            <AppButton
              variant="ghost"
              onClick={() => setShowAllMatched((prev) => !prev)}
            >
              {showAllMatched ? "See less" : "See more"}
            </AppButton>
          )}
        </div>
      )}


      {unmatchedCsvItems.length > 0 && (
        <div className="border border-yellow-500 bg-yellow-50/10 p-3 rounded text-sm space-y-2">
          <strong>Unmatched items (not depleted):</strong>

          <ul className="list-disc ml-4">
            {visibleUnmatchedItems.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>

          {hasMoreUnmatched && !showAllUnmatched && (
            <div className="text-yellow-400">
              +{unmatchedCsvItems.length - MAX_UNMATCHED_PREVIEW} more items
            </div>
          )}

          {hasMoreUnmatched && (
            <AppButton
              variant="ghost"
              onClick={() => setShowAllUnmatched((prev) => !prev)}
            >
              {showAllUnmatched ? "See less" : "See more"}
            </AppButton>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Inventory Depletion"
        description="This will permanently reduce inventory based on the selected menu items. This action cannot be undone."
        confirmText="Deplete Inventory"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDeplete}
      />
    </div>
  );
}
