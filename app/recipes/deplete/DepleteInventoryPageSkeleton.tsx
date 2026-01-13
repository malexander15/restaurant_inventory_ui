"use client";

import { Skeleton } from "@mui/material";
import InputSkeleton from "@/app/components/ui/skeletons/InputSkeleton";
import ListSkeleton from "@/app/components/ui/skeletons/ListSkeleton";

export default function DepleteInventoryPageSkeleton() {
  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      {/* Header */}
      <Skeleton
        variant="text"
        width={260}
        height={36}
        sx={{ bgcolor: "#1f1f1f" }}
      />

      {/* Main form */}
      <div className="border rounded p-4 space-y-4">
        {/* Menu item select */}
        <InputSkeleton />

        {/* Quantity rows */}
        <ListSkeleton rows={3} />

        {/* Deplete button */}
        <Skeleton
          variant="rectangular"
          height={40}
          sx={{ bgcolor: "#1f1f1f", borderRadius: 1 }}
        />
      </div>

      {/* CSV upload */}
      <div className="border rounded p-3 space-y-3">
        <Skeleton
          variant="text"
          width={200}
          height={20}
          sx={{ bgcolor: "#1f1f1f" }}
        />

        <Skeleton
          variant="rectangular"
          height={36}
          sx={{ bgcolor: "#1f1f1f", borderRadius: 1 }}
        />
      </div>

      {/* Placeholder result blocks */}
      <div className="space-y-3">
        <Skeleton
          variant="rectangular"
          height={80}
          sx={{ bgcolor: "#1f1f1f", borderRadius: 1 }}
        />
        <Skeleton
          variant="rectangular"
          height={80}
          sx={{ bgcolor: "#1f1f1f", borderRadius: 1 }}
        />
      </div>
    </div>
  );
}
