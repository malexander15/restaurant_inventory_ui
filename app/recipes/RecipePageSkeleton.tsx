import InputSkeleton from "@/app/components/ui/skeletons/InputSkeleton";
import ListSkeleton from "@/app/components/ui/skeletons/ListSkeleton";

export default function RecipePageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-40 h-8 rounded bg-white/10" />
        <div className="flex items-center gap-3">
          <InputSkeleton width={256} />
          <div className="w-20 h-9 rounded bg-white/10" />
        </div>
      </div>

      {/* New Recipe button */}
      <div className="w-32 h-9 rounded bg-white/10" />

      {/* Recipe list */}
      <ListSkeleton rows={6} />
    </div>
  );
}
