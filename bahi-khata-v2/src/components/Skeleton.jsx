import './Skeleton.css';

export function SkeletonCard() {
  return (
    <div className="bg-surface-container rounded-xl p-6 space-y-4">
      <div className="skeleton skeleton-text h-6 w-3/4"></div>
      <div className="skeleton skeleton-text h-10 w-1/2"></div>
      <div className="skeleton skeleton-text h-4 w-full"></div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-surface-container rounded-xl p-6 h-80">
      <div className="skeleton skeleton-text h-6 w-1/3 mb-6"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton skeleton-bar h-12 w-full"></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Charts */}
      <div>
        <div className="skeleton skeleton-text h-8 w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <SkeletonChart key={i} />
          ))}
        </div>
      </div>

      {/* Full width chart */}
      <SkeletonChart />
    </div>
  );
}

export function SkeletonAnalytics() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="skeleton skeleton-text h-8 w-1/3 mb-2"></div>
        <div className="skeleton skeleton-text h-4 w-1/2"></div>
      </div>

      {/* Time period selector */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton skeleton-bar h-10 w-24"></div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <SkeletonChart key={i} />
        ))}
      </div>

      {/* Analytics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonPortfolio() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="skeleton skeleton-text h-8 w-1/4"></div>
        <div className="skeleton skeleton-text h-4 w-1/3"></div>
      </div>

      {/* Table skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface-container rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <div className="skeleton skeleton-text h-5 w-1/4"></div>
              <div className="skeleton skeleton-text h-5 w-1/4"></div>
            </div>
            <div className="flex justify-between">
              <div className="skeleton skeleton-text h-4 w-1/3"></div>
              <div className="skeleton skeleton-text h-4 w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface-container rounded-lg p-4">
          <div className="skeleton skeleton-text h-5 w-1/3 mb-2"></div>
          <div className="skeleton skeleton-text h-4 w-1/2"></div>
        </div>
      ))}
    </div>
  );
}
