"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import AppAlert from "@/app/components/ui/AppAlert";
import AppButton from "@/app/components/ui/AppButton";
import AppInput from "@/app/components/ui/AppInput";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { apiFetch } from "@/app/lib/api";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

type Ingredient = {
  id: number;
  name: string;
  unit: string;
};

type IngredientForm = {
  name: string;
  unit: string;
};

type AlertState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
};

const emptyForm = (): IngredientForm => ({
  name: "",
  unit: "",
});

export default function IngredientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "success",
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<IngredientForm>(emptyForm());
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null);
  const [editForm, setEditForm] = useState<IngredientForm>(emptyForm());
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("created") === "1") {
      setAlert({
        open: true,
        severity: "success",
        message: "Ingredient created successfully!",
      });
    }

    if (searchParams.get("updated") === "1") {
      setAlert({
        open: true,
        severity: "success",
        message: "Ingredient updated successfully!",
      });
    }

    if (searchParams.get("deleted") === "1") {
      setAlert({
        open: true,
        severity: "success",
        message: "Ingredient deleted successfully!",
      });
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadIngredients(query: string) {
      try {
        const trimmed = query.trim();
        const suffix = trimmed
          ? `?search=${encodeURIComponent(trimmed)}`
          : "";
        const data = await apiFetch<Ingredient[]>(`/ingredients${suffix}`, {
          cache: "no-store",
        });

        if (!cancelled) {
          setIngredients(
            data.slice().sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      } catch {
        if (!cancelled) {
          setAlert({
            open: true,
            severity: "error",
            message: "Failed to load ingredients",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    setLoading(true);

    const timeoutId = window.setTimeout(() => {
      loadIngredients(search);
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [refreshKey, search]);

  function resetCreateDialog() {
    setCreateOpen(false);
    setCreateForm(emptyForm());
    setCreateSubmitting(false);
  }

  function resetEditDialog() {
    setEditTarget(null);
    setEditForm(emptyForm());
    setEditSubmitting(false);
  }

  function openEditDialog(ingredient: Ingredient) {
    setEditTarget(ingredient);
    setEditForm({
      name: ingredient.name,
      unit: ingredient.unit,
    });
  }

  function validateForm(form: IngredientForm) {
    if (!form.name.trim()) {
      setAlert({
        open: true,
        severity: "error",
        message: "Ingredient name is required",
      });
      return false;
    }

    if (!form.unit.trim()) {
      setAlert({
        open: true,
        severity: "error",
        message: "Ingredient unit is required",
      });
      return false;
    }

    return true;
  }

  async function handleCreate() {
    if (!validateForm(createForm)) return;

    try {
      setCreateSubmitting(true);

      await apiFetch("/ingredients", {
        method: "POST",
        body: JSON.stringify({
          ingredient: {
            name: createForm.name.trim(),
            unit: createForm.unit.trim(),
          },
        }),
      });

      resetCreateDialog();
      setRefreshKey((prev) => prev + 1);
      router.replace("/ingredients?created=1", { scroll: false });
    } catch (err) {
      setCreateSubmitting(false);
      setAlert({
        open: true,
        severity: "error",
        message:
          err instanceof Error ? err.message : "Failed to create ingredient",
      });
    }
  }

  async function handleEditSave() {
    if (!editTarget || !validateForm(editForm)) return;

    try {
      setEditSubmitting(true);

      const updated = await apiFetch<Ingredient>(`/ingredients/${editTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ingredient: {
            name: editForm.name.trim(),
            unit: editForm.unit.trim(),
          },
        }),
      });

      setIngredients((prev) =>
        prev
          .map((ingredient) =>
            ingredient.id === updated.id ? updated : ingredient
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      resetEditDialog();
      router.replace("/ingredients?updated=1", { scroll: false });
    } catch (err) {
      setEditSubmitting(false);
      setAlert({
        open: true,
        severity: "error",
        message:
          err instanceof Error ? err.message : "Failed to update ingredient",
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      setDeleteSubmitting(true);

      await apiFetch(`/ingredients/${deleteTarget.id}`, {
        method: "DELETE",
      });

      setIngredients((prev) =>
        prev.filter((ingredient) => ingredient.id !== deleteTarget.id)
      );
      setDeleteTarget(null);
      setDeleteSubmitting(false);
      router.replace("/ingredients?deleted=1", { scroll: false });
    } catch (err) {
      setDeleteSubmitting(false);
      setAlert({
        open: true,
        severity: "error",
        message:
          err instanceof Error ? err.message : "Failed to delete ingredient",
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <AppAlert
        open={alert.open}
        severity={alert.severity}
        message={alert.message}
        onClose={() => {
          setAlert((prev) => ({ ...prev, open: false }));
          router.replace("/ingredients", { scroll: false });
        }}
      />

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1
            className="text-3xl font-bold whitespace-nowrap"
            data-testid="ingredients-page-title"
          >
            Ingredients
          </h1>

          <div className="w-full md:w-80">
            <AppInput
              label=""
              placeholder="Search ingredients..."
              value={search}
              onChange={setSearch}
              size="small"
              testId="ingredient-search"
            />
          </div>
        </div>

        <AppButton
          intent="secondary"
          onClick={() => setCreateOpen(true)}
          data-testid="new-ingredient"
        >
          + New Ingredient
        </AppButton>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading ingredients...</p>
      ) : ingredients.length === 0 ? (
        <div className="border rounded p-6 text-sm text-gray-400">
          No ingredients found.
        </div>
      ) : (
        <div className="space-y-4" data-testid="ingredients-list">
          {ingredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="border rounded p-4 flex items-center justify-between gap-4"
              data-testid={`ingredient-row-${ingredient.id}`}
            >
              <div>
                <h2 className="text-lg font-semibold">{ingredient.name}</h2>
                <p className="text-sm text-white/70">
                  Unit: {ingredient.unit}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <EditIcon
                  className="cursor-pointer text-blue-400 hover:text-blue-300"
                  sx={{ fontSize: ".95rem" }}
                  data-testid={`edit-ingredient-${ingredient.id}`}
                  onClick={() => openEditDialog(ingredient)}
                />
                <HighlightOffIcon
                  className="cursor-pointer text-red-500 hover:text-red-400"
                  sx={{ fontSize: ".95rem" }}
                  data-testid={`delete-ingredient-${ingredient.id}`}
                  onClick={() => setDeleteTarget(ingredient)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={createOpen}
        onClose={resetCreateDialog}
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
        <DialogTitle>Add Ingredient</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <AppInput
            label="Ingredient Name"
            value={createForm.name}
            onChange={(value) =>
              setCreateForm((prev) => ({ ...prev, name: value }))
            }
            testId="ingredient-name"
            placeholder="e.g. Mozzarella"
          />
          <AppInput
            label="Unit"
            value={createForm.unit}
            onChange={(value) =>
              setCreateForm((prev) => ({ ...prev, unit: value }))
            }
            testId="ingredient-unit"
            placeholder="e.g. oz, pcs, lb"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #333" }}>
          <AppButton intent="ghost" onClick={resetCreateDialog}>
            Cancel
          </AppButton>
          <AppButton onClick={handleCreate} disabled={createSubmitting}>
            {createSubmitting ? "Saving..." : "Create Ingredient"}
          </AppButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onClose={resetEditDialog}
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
        <DialogTitle>Edit Ingredient</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <AppInput
            label="Ingredient Name"
            value={editForm.name}
            onChange={(value) =>
              setEditForm((prev) => ({ ...prev, name: value }))
            }
            testId="edit-ingredient-name"
          />
          <AppInput
            label="Unit"
            value={editForm.unit}
            onChange={(value) =>
              setEditForm((prev) => ({ ...prev, unit: value }))
            }
            testId="edit-ingredient-unit"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #333" }}>
          <AppButton intent="ghost" onClick={resetEditDialog}>
            Cancel
          </AppButton>
          <AppButton onClick={handleEditSave} disabled={editSubmitting}>
            {editSubmitting ? "Saving..." : "Save Changes"}
          </AppButton>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Ingredient"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText={deleteSubmitting ? "Deleting..." : "Delete"}
        onCancel={() => {
          if (!deleteSubmitting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
