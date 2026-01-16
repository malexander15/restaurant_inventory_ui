"use client";

import { Skeleton } from "@mui/material";
import InputSkeleton from "@/app/components/ui/skeletons/InputSkeleton";
import ListSkeleton from "@/app/components/ui/skeletons/ListSkeleton";

export default function ReplenishPageSkeleton() {
  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      {/* Page title */}
      <Skeleton
        variant="text"
        width={260}
        height={36}
        sx={{ bgcolor: "#1f1f1f" }}
      />

      {/* Form container */}
      <div className="border rounded p-4 space-y-4">
        {/* Product select */}
        <InputSkeleton />

        {/* Quantity inputs (simulate a few rows) */}
        <ListSkeleton rows={3} />

        {/* Submit button */}
        <Skeleton
          variant="rectangular"
          height={40}
          sx={{ bgcolor: "#1f1f1f", borderRadius: 1 }}
        />
      </div>
    </div>
  );
}
