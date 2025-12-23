"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewRecipePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    is_prepped: false,
  });


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

    const payload = {
      name: form.name,
      recipe_type: form.is_prepped ? "prepped_item" : "menu_item",
    };

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/recipes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: payload }),
      }
    );

    if (!res.ok) {
      const data = await res.json();
      setErrors(data.errors || ["Something went wrong"]);
      return;
    }

    router.push("/recipes");
  }


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
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Quesadilla"
            className="
              w-full border rounded px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-gray-300
            "
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Recipe Type
          </label>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              name="is_prepped"
              checked={form.is_prepped}
              onChange={handleChange}
              className="mt-1"
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

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/recipes"
            className="text-sm text-gray-600 hover:underline"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="
              px-4 py-2 border rounded
              hover:bg-gray-100/10
              transition
            "
          >
            Create Recipe
          </button>
        </div>
      </form>
    </div>
  );
}
