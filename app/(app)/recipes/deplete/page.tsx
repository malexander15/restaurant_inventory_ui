"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormControl } from "@mui/material";
import { AppSelect } from "@/app/components/ui/AppSelect";
import AppButton from "@/app/components/ui/AppButton";
import AppInput from "@/app/components/ui/AppInput";
import AppAlert from "@/app/components/ui/AppAlert";
import DepleteInventoryPageSkeleton from "@/app/(app)/recipes/deplete/DepleteInventoryPageSkeleton";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { apiFetch } from "@/app/lib/api"
import Papa from "papaparse";

type CsvRow = Record<string, string>;

type Recipe = {
  id: number;
  name: string;
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
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const selectedRecipes = recipes.filter((r) =>
    selectedRecipeIds.includes(r.id)
  );
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParsed, setCsvParsed] = useState(false);
  const [csvApplied, setCsvApplied] = useState(false);
  const [showAllUnmatched, setShowAllUnmatched] = useState(false);

  //Load menu item recipes  
  useEffect(() => {
    async function loadMenuItems() {
      try {
        const data = await apiFetch<Recipe[]>(
          "/recipes?recipe_type=menu_item",
          { cache: "no-store" }
        );

        if (!data) return;

        setRecipes(data);
      } catch (err) {
        console.error("Failed to load menu items", err);
      } finally {
        setLoading(false);
      }
    }

    loadMenuItems();
  }, []);

  function getErrorMessage(err: unknown, fallback: string) {
    return err instanceof Error ? err.message : fallback;
  }

  //Validate submission data and open dialog box to confirm submission
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;
    setConfirmOpen(true);
  }

  //Make name lowercase and trim white space.
  // Used to make comparison of parsed csv file and recipe menu
  // items easier and uniform
  function normalizeName(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " "); // collapse extra spaces
  }

  const csvDepletions = normalizeSales(csvRows);

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

  //Handles the POST of the depleting product inventory by mean of Menu Item Recipes
  async function handleConfirmDeplete() {
    setSubmitting(true);

    try {
      for (const recipe of selectedRecipes) {
        const qty = quantities[recipe.id];

        if (!qty || qty <= 0) {
          throw new Error(`Invalid quantity for ${recipe.name}`);
        }

        await apiFetch(`/recipes/${recipe.id}/deplete`, {
          method: "POST",
          body: JSON.stringify({ quantity: qty }),
        });
      }

      router.push("/products/?depleted=1");
    } catch (err: unknown) {
      setAlert({
        open: true,
        severity: "error",
        message: getErrorMessage(err, "Failed to deplete inventory"),
      });
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  //In order to depelet this criteria must be met:
  //One Menu Item must be selected
  //A quantity asscoiated with each menu item
  function validate() {
    if (selectedRecipes.length === 0) {
      setAlert({
        open: true,
        severity: "error",
        message: "Please select at least one menu item",
      });
      return false;
    }

    for (const recipe of selectedRecipes) {
      if (!quantities[recipe.id] || quantities[recipe.id] <= 0) {
        setAlert({
          open: true,
          severity: "error",
          message: `Please enter a valid quantity for ${recipe.name}`,
        });
        return false;
      }
    }

    return true;
  }

  function normalizeSales(rows: CsvRow[]) {
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

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvRows(results.data);
        setCsvParsed(true);
      },
      error: (error: Error) => {
        setAlert({
          open: true,
          severity: "error",
          message: `CSV parsing error: ${error.message}`,
        });
      },
    });
    setCsvParsed(false);
  }

  if (loading) {
    return <DepleteInventoryPageSkeleton />;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <AppAlert
        open={alert.open}
        severity={alert.severity}
        message={alert.message}
        onClose={() =>
          setAlert((prev) => ({ ...prev, open: false }))
        }
      />
      <h1 
        className="text-3xl font-bold mb-6"
        data-testid="deplete-page-title"
      >
        Manual Inventory Depletion
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4">
        <div>
          <FormControl fullWidth>
            <AppSelect<number>
              label="Menu Items"
              testId="deplete-recipe-select"
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
              <div 
                key={recipe.id} 
                className="flex items-center gap-3 mt-2"
                data-testid={`deplete-row-${recipe.id}`}
              >
                <span className="w-40 text-sm">{recipe.name}</span>

                <AppInput
                  type="number"
                  label="Qty"
                  fullWidth={false}
                  size="small"
                  min={1}
                  placeholder="Qty"
                  testId={`deplete-qty-${recipe.id}`}
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
          intent="danger"
          data-testid="deplete-submit"
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
          data-testid="deplete-csv-input"
          hidden
          onChange={handleCsvUpload}
        />

        <AppButton
          intent="secondary"
          data-testid="deplete-upload-csv"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload CSV
        </AppButton>

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
        <div 
          className="border border-green-600 bg-green-50/10 p-3 rounded text-sm space-y-2"
          data-testid="csv-matched-list"
        >
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
              intent="ghost"
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
              intent="ghost"
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
