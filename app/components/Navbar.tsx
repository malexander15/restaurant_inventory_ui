"use client";

import Link from "next/link";
import Image from "next/image";
import CalculateIcon from "@mui/icons-material/Calculate";
import SettingsIcon from "@mui/icons-material/Settings";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import { useRestaurant } from "@/app/lib/useRestaurant"

export default function Navbar() {
  const router = useRouter();
  const { restaurant } = useRestaurant();

  function handleLogout() {
    document.cookie = "token=; Max-Age=0; path=/";
    router.push("/login");
  }

  return (
    <nav className="border-b bg-black">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center">
        {/* ================= LEFT ================= */}
        <div className="flex items-center gap-8">
          {/* Home */}
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
            <span 
              className="font-semibold cursor-pointer"
              data-testid="nav-products"
            >
              Products
            </span>

            <div className="absolute left-0 top-full h-2 w-full" />

            <div className="absolute left-0 mt-2 w-44 border rounded bg-black shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
              <Link href="/products" className="block px-4 py-2 hover:bg-gray-100/10">
                View Products
              </Link>
              <Link href="/products/new" className="block px-4 py-2 hover:bg-gray-100/10">
                New Product
              </Link>
              <Link 
                href="/products/replenish" 
                className="block px-4 py-2 hover:bg-gray-100/10"
                data-testid="nav-replenish"
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

            <div className="absolute left-0 mt-2 w-44 border rounded bg-black shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
              <Link href="/recipes" className="block px-4 py-2 hover:bg-gray-100/10">
                View Recipes
              </Link>
              <Link href="/recipes/new" className="block px-4 py-2 hover:bg-gray-100/10">
                New Recipe
              </Link>
              <Link href="/recipes/deplete" className="block px-4 py-2 hover:bg-gray-100/10">
                Deplete Recipes
              </Link>
            </div>
          </div>
        </div>

        {/* ================= CENTER ================= */}
        <div className="flex-1 flex justify-center items-center">
          {restaurant?.logo_url ? (
            <Image
              width={260}
              height={64}
              src={restaurant.logo_url}
              alt={restaurant.name}
            />
          ) : (
            <span className="text-sm text-gray-400">
              {restaurant?.name}
            </span>
          )}
        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-6">
          {/* Calculator */}
          <Tooltip title="Pricing Calculator" arrow>
            <Link
              href="/pricing-calculator"
              className="text-gray-300 hover:text-white transition"
            >
              <CalculateIcon />
            </Link>
          </Tooltip>

          {/* Settings */}
          <Tooltip title="Account Settings" arrow>
            <Link
              href="/settings"
              className="text-gray-300 hover:text-white transition"
            >
              <SettingsIcon />
            </Link>
          </Tooltip>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-700" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-sm hover:text-red-300 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
