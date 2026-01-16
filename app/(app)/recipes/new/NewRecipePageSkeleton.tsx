"use client";

import { Skeleton } from "@mui/material";
import InputSkeleton from "@/app/components/ui/skeletons/InputSkeleton";
import ListSkeleton from "@/app/components/ui/skeletons/ListSkeleton";

export default function NewRecipePageSkeleton() {
  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton
          variant="text"
          width={220}
          height={36}
          sx={{ bgcolor: "#1f1f1f" }}
        />
        <Skeleton
          variant="text"
          width={320}
          height={20}
          sx={{ bgcolor: "#1f1f1f" }}
        />
      </div>

      {/* Form */}
      <div className="border rounded p-6 space-y-4">
        {/* Recipe name */}
        <InputSkeleton />

        {/* Recipe type checkbox block */}
        <div className="space-y-2">
          <Skeleton
            variant="text"
            width={120}
            height={18}
            sx={{ bgcolor: "#1f1f1f" }}
          />
          <Skeleton
            variant="rectangular"
            height={48}
            sx={{ bgcolor: "#1f1f1f", borderRadius: 1 }}
          />
        </div>

        {/* Ingredient select */}
        <InputSkeleton />

        {/* Ingredient quantity rows */}
        <ListSkeleton rows={3} />

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Skeleton
            variant="rectangular"
            width={90}
            height={36}
            sx={{ bgcolor: "#1f1f1f", borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            width={140}
            height={36}
            sx={{ bgcolor: "#1f1f1f", borderRadius: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
