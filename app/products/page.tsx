type Product = {
  id: number
  name: string
  unit: string
  stock_quantity: string
  unit_cost: string
}

export default async function ProductsPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/products`,
    { cache: "no-store" }
  )

  if (!res.ok) {
    throw new Error("Failed to fetch products")
  }

  const products: Product[] = await res.json()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="border rounded p-4 flex justify-between items-center"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  {product.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {product.stock_quantity} {product.unit}
                </p>
              </div>

              <div className="text-sm text-gray-700">
                ${product.unit_cost}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}