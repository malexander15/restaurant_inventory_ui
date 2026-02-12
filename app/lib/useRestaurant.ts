"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";

export function useRestaurant() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  type Restaurant = {
    id: number;
    name: string;
    email: string;
    logo_url: string;
    created_at: string;
    updated_at: string;
  };

  useEffect(() => {
    apiFetch<Restaurant>("/me")
      .then(setRestaurant)
      .finally(() => setLoading(false));
  }, []);

  return { restaurant, setRestaurant, loading };
}
