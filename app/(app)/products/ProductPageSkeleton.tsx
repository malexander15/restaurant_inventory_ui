import { Skeleton } from "@mui/material";
import InputSkeleton from "@/app/components/ui/skeletons/InputSkeleton";
import ListSkeleton from "@/app/components/ui/skeletons/ListSkeleton";

export default function ProductPageSkeleton() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <Skeleton
        variant="text"
        width={180}
        height={36}
        sx={{ bgcolor: "#1f1f1f" }}
      />

      {/* Search */}
      <div className="flex justify-end">
        <div className="w-64">
          <InputSkeleton />
        </div>
      </div>

      {/* List */}
      <ListSkeleton rows={6} />
    </div>
  );
}
