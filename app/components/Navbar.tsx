"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import CalculateIcon from "@mui/icons-material/Calculate";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null

  async function handleLogout() {
    document.cookie = "token=; Max-Age=0; path=/"
    router.push("/login")
  }

  return (
    <nav className="border-b bg-black">
      <div className="max-w-1xl mx-auto px-6 py-4 flex items-center gap-8">
        {/* Logo */}
        <Link href="/" className="hover:opacity-80 transition">
          <Image
            src="/iStockLogo.png"
            alt="iStock"
            width={80}
            height={80}
            className="h-6 w-auto"
            priority
          />
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
            <Link
              href="/products/replenish"
              className="block px-4 py-2 hover:bg-gray-100/10"
            >
              Replenish
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
            <Link
              href="/recipes/deplete"
              className="block px-4 py-2 hover:bg-gray-100/10"
            >
              Deplete Recipes
            </Link>
          </div>
        </div>

        {/* Pricing Calculator */}
        <div className="h-5 w-px bg-gray-700 mx-2" />
        <Tooltip title="Calculate Menu Pricing Cost" arrow>
          <Link
            href="/pricing-calculator"
            className="flex items-center justify-center text-gray-300 hover:text-white transition"
          >
            <CalculateIcon fontSize="medium" />
          </Link>
        </Tooltip>

        {/* Spacer pushes logout right */}
        <div className="flex-1" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-sm hover:text-red-300 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}