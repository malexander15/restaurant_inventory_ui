"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b bg-black">
      <div className="max-w-6xl mx-auto px-6 py-4 flex gap-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight hover:opacity-80 transition"
        >
          iStock
        </Link>
        {/* Products */}
        <div className="relative group">
          <span className="font-semibold cursor-pointer">
            Products
          </span>

          <div className="absolute left-0 top-full h-2 w-full" />

          <div
            className="
              absolute left-0 mt-2 w-44
              border rounded bg-black shadow-sm
              opacity-0 invisible
              group-hover:opacity-100 group-hover:visible
              transition
            "
          >
            <Link
              href="/products"
              className="block px-4 py-2 hover:bg-gray-100/10"
            >
              View Products
            </Link>
            <Link
              href="/products/new"
              className="block px-4 py-2 hover:bg-gray-100/10"
            >
              New Product
            </Link>
          </div>
        </div>

        {/* Recipes */}
        <div className="relative group">
          <span className="font-semibold cursor-pointer">
            Recipes
          </span>

          <div className="absolute left-0 top-full h-2 w-full" />

          <div
            className="
              absolute left-0 mt-2 w-44
              border rounded bg-black shadow-sm
              opacity-0 invisible
              group-hover:opacity-100 group-hover:visible
              transition
            "
          >
            <Link
              href="/recipes"
              className="block px-4 py-2 hover:bg-gray-100/10"
            >
              View Recipes
            </Link>
            <Link
              href="/recipes/new"
              className="block px-4 py-2 hover:bg-gray-100/10"
            >
              New Recipe
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
