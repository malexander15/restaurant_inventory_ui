"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import CalculateIcon from "@mui/icons-material/Calculate";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import { useRestaurant } from "@/app/lib/useRestaurant"

export default function Navbar() {
  const router = useRouter();
  const { restaurant } = useRestaurant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    document.cookie = "token=; Max-Age=0; path=/";
    router.push("/login");
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <nav className="border-b bg-black">
      <div className="mx-auto px-4 md:px-6 min-h-20 py-3">
        <div className="flex items-center gap-4">
          {/* ================= LEFT ================= */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="text-gray-300 hover:text-white transition"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>

        {/* ================= CENTER ================= */}
        <div className="flex-1 flex justify-center items-center min-w-0">
          {restaurant?.logo_url ? (
            <Image
              width={260}
              height={64}
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="max-h-10 w-auto"
            />
          ) : (
            <span className="text-sm text-gray-400 truncate max-w-[140px] md:max-w-none">
              {restaurant?.name}
            </span>
          )}
        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex items-center">
          {/* Logout */}
          <Tooltip title="Logout" arrow>
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-red-300 transition"
              aria-label="Logout"
            >
              <LogoutIcon />
            </button>
          </Tooltip>
        </div>
        </div>

        {mobileMenuOpen && (
          <div className="mt-3 border rounded border-gray-800 bg-black/95">
            <details className="border-b border-gray-800">
              <summary className="px-4 py-3 cursor-pointer font-semibold">Products</summary>
              <div className="pb-2">
                <Link href="/products" onClick={closeMobileMenu} className="block px-6 py-2 hover:bg-gray-100/10">
                  View Products
                </Link>
                <Link href="/products/new" onClick={closeMobileMenu} className="block px-6 py-2 hover:bg-gray-100/10">
                  New Product
                </Link>
                <Link href="/products/replenish" onClick={closeMobileMenu} className="block px-6 py-2 hover:bg-gray-100/10" data-testid="nav-replenish">
                  Replenish
                </Link>
              </div>
            </details>

            <details className="border-b border-gray-800">
              <summary className="px-4 py-3 cursor-pointer font-semibold">Recipes</summary>
              <div className="pb-2">
                <Link href="/recipes" onClick={closeMobileMenu} className="block px-6 py-2 hover:bg-gray-100/10">
                  View Recipes
                </Link>
                <Link href="/recipes/new" onClick={closeMobileMenu} className="block px-6 py-2 hover:bg-gray-100/10">
                  New Recipe
                </Link>
                <Link href="/recipes/deplete" onClick={closeMobileMenu} className="block px-6 py-2 hover:bg-gray-100/10">
                  Deplete Recipes
                </Link>
              </div>
            </details>

            <Link
              href="/pricing-calculator"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 hover:bg-gray-100/10"
            >
              <CalculateIcon fontSize="small" />
              Pricing Calculator
            </Link>

            <Link
              href="/settings"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100/10"
            >
              <SettingsIcon fontSize="small" />
              Account Settings
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
