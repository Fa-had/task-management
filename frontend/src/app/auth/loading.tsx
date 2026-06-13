import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md shadow-glass space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-10 w-10 rounded-full mx-auto" />
          <Skeleton className="h-7 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
