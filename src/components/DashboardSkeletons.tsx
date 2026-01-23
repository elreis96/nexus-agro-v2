import { Skeleton } from "@/components/ui/skeleton";

export function ExecutiveCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="space-y-2 mt-2">
        <Skeleton className="h-8 w-[120px]" />
        <Skeleton className="h-4 w-[80px]" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ title }: { title?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm h-full">
      {title && <Skeleton className="h-6 w-[200px] mb-4" />}
      <div className="flex items-center justify-center h-[300px]">
        <div className="w-full space-y-4">
          <div className="flex items-end justify-between h-[250px] gap-2 px-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton
                key={i}
                className="w-full"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between px-4">
            <Skeleton className="h-4 w-[50px]" />
            <Skeleton className="h-4 w-[50px]" />
            <Skeleton className="h-4 w-[50px]" />
            <Skeleton className="h-4 w-[50px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Executive Cards */}
      <section>
        <Skeleton className="h-8 w-[150px] mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ExecutiveCardSkeleton />
          <ExecutiveCardSkeleton />
          <ExecutiveCardSkeleton />
          <ExecutiveCardSkeleton />
        </div>
      </section>

      {/* Market Alerts */}
      <section>
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 h-24 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </section>

      {/* Climate Thesis */}
      <section>
        <ChartSkeleton title="Tese Climática" />
      </section>

      {/* Risk Analysis */}
      <section>
        <Skeleton className="h-8 w-[180px] mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </section>

      {/* Correlation */}
      <section>
        <ChartSkeleton title="Correlação" />
      </section>
    </div>
  );
}
