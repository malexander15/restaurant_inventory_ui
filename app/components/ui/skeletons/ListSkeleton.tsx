// app/components/ui/skeletons/ListSkeleton.tsx
"use client";

import { Skeleton } from "@mui/material";

type ListSkeletonProps = {
  rows?: number;
  height?: number;
};

export default function ListSkeleton({
  rows = 5,
  height = 72,
}: ListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rounded"
          height={height}
          sx={{
            bgcolor: "#1f1f1f",
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
