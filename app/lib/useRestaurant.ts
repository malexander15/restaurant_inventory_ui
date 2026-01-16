"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";

export function useRestaurant() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/me")
      .then(setRestaurant)
      .finally(() => setLoading(false));
  }, []);

  return { restaurant, setRestaurant, loading };
}
