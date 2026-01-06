"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSelect } from '@/app/components/ui/AppSelect';
import AppInput from '@/app/components/ui/AppInput';
type ProductForm = {
  name: string;
  barcode: string;
  unit: string;
  stock_quantity: string;
  unit_cost: string;
}

// New Product Page Component
export default function NewProductPage() {
  const router = useRouter();
  const unitOptions = [
    { value: "oz", label: "Ounces (oz)" },
    { value: "pcs", label: "Pieces (pcs)" },
  ];
  const [form, setForm] = useState<ProductForm>({
    name: '',
    barcode: '',
    unit: 'oz',
    stock_quantity: '',
    unit_cost: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Handle input changes either from text inputs or select dropdowns
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({
        // Spread the existing form data to retain unchanged values
      ...form,
        // Update the specific field in the form
      [e.target.name]: e.target.value
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    // Prevent the default form submission behavior reloading the page
    e.preventDefault();
    // Clear previous errors and set loading state
    setErrors([]);
    // Set loading state to true while submitting the form
    setLoading(true);
    
    // Send a POST request to create a new product
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          product: {
            // Spread the existing form data to include all fields
            ...form,
            // Convert numeric fields to numbers
            stock_quantity: Number(form.stock_quantity),
            unit_cost: Number(form.unit_cost)
          }
        })
      }
    )

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setErrors(data.errors || ["Something went wrong"])
      return
    }
    router.push('/products/?created=1');
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">New Product</h1>

      {errors.length > 0 && (
        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
          <ul className="list-disc list-inside">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <AppInput
            label="Name"
            name="name"
            value={form.name}
            onChange={(val) => setForm({ ...form, name: val })}
            required
          />
        </div>

        <div>
          <AppInput
            label="Barcode"
            name="barcode"
            value={form.barcode}
            onChange={(val) => setForm({ ...form, barcode: val })}
          />
        </div>

        <div>
          <AppSelect
            label='Unit'
            options={unitOptions}
            value={form.unit}
            onChange={(val) => 
              setForm({ ...form, unit: val as "oz" | "pcs"})
            }
          />
        </div>

        <div>
          <AppInput
            label="Stock Quantity"
            name="stock_quantity"
            type="number"
            value={form.stock_quantity}
            onChange={(val) => setForm({ ...form, stock_quantity: val })}
            required
          />
        </div>

        <div>
          <AppInput
            label="Unit Cost"
            name="unit_cost"
            type="number"
            step={0.01}
            value={form.unit_cost}
            onChange={(val) => setForm({ ...form, unit_cost: val })}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Create Product"}
        </button>
      </form>
    </div>
  )
}