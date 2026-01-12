// app/components/ui/skeletons/InputSkeleton.tsx
"use client";

import { Skeleton } from "@mui/material";

type InputSkeletonProps = {
  height?: number;
  width?: number;
};

export default function InputSkeleton({
  height = 40,
  width = 256,
}: InputSkeletonProps) {
  return (
    <Skeleton
      variant="rounded"
      height={height}
      width={width}
      sx={{
        bgcolor: "#1f1f1f",
        borderRadius: 1,
      }}
    />
  );
}
