// app/admin/materials/[id]/loading.tsx
export default function Loading() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="w-full max-w-2xl mx-auto">
          <div className="space-y-6 animate-pulse">
            <div className="h-8 w-1/3 bg-muted rounded" />
            <div className="h-4 w-2/3 bg-muted rounded" />
            <div className="space-y-4">
              <div className="h-40 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
