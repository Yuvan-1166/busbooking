/** Skeleton placeholder shown while analytics are loading. */
export default function AnalyticsSkeleton({ isAdmin = false }) {
  const cardCount = isAdmin ? 8 : 6;
  const showSecondChart = isAdmin;

  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div
            key={index}
            className="card flex h-28 animate-pulse flex-col justify-between p-4"
          >
            <div className="h-3 w-20 rounded bg-neutral-200" />
            <div className="h-7 w-24 rounded bg-neutral-200" />
            <div className="h-3 w-28 rounded bg-neutral-200" />
          </div>
        ))}
      </div>

      <div
        className={`grid gap-6 ${showSecondChart ? "lg:grid-cols-5" : ""}`}
      >
        <div
          className={`card animate-pulse ${showSecondChart ? "lg:col-span-3" : ""}`}
          style={{ height: 260 }}
        />
        {showSecondChart && (
          <div className="card animate-pulse lg:col-span-2" style={{ height: 260 }} />
        )}
      </div>

      <div className="card h-72 animate-pulse" />

      <div
        className={`grid gap-6 ${
          isAdmin ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        <div className="card h-64 animate-pulse" />
        <div className="card h-64 animate-pulse" />
        {isAdmin && <div className="card h-64 animate-pulse" />}
      </div>
    </div>
  );
}