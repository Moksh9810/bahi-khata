export function EmptyDashboard() {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">
        <span className="material-symbols-outlined" style={{ fontSize: '64px' }}>
          inbox
        </span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
        No Holdings Yet
      </h3>
      <p className="text-on-surface-variant max-w-sm mx-auto mb-6">
        Add your first investment to get started tracking your portfolio growth.
      </p>
      <button className="px-6 py-3 rounded-lg bg-primary text-on-primary font-label-sm hover:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all">
        Add First Holding
      </button>
    </div>
  );
}

export function EmptyPortfolio({ type }) {
  const assetType = {
    stocks: 'Stock',
    mf: 'Mutual Fund',
    bonds: 'Bond',
    crypto: 'Cryptocurrency',
    gold: 'Gold',
    properties: 'Property',
    fds: 'Fixed Deposit',
    loans: 'Loan'
  }[type] || 'Holding';

  return (
    <div className="text-center py-16 bg-surface-container rounded-xl">
      <div className="text-5xl mb-4">
        <span className="material-symbols-outlined" style={{ fontSize: '64px' }}>
          add_circle_outline
        </span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
        No {assetType}s Yet
      </h3>
      <p className="text-on-surface-variant max-w-sm mx-auto mb-6">
        Start tracking your {assetType.toLowerCase()} investments by adding your first holding.
      </p>
      <button className="px-6 py-3 rounded-lg bg-primary text-on-primary font-label-sm hover:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all">
        Add {assetType}
      </button>
    </div>
  );
}

export function EmptySearch() {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">
        <span className="material-symbols-outlined" style={{ fontSize: '64px' }}>
          search
        </span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
        No Results Found
      </h3>
      <p className="text-on-surface-variant max-w-sm mx-auto">
        Try adjusting your search criteria or filters.
      </p>
    </div>
  );
}

export function EmptyData() {
  return (
    <div className="text-center py-12 bg-surface-container rounded-xl p-8">
      <div className="text-5xl mb-4">
        <span className="material-symbols-outlined" style={{ fontSize: '64px' }}>
          data_usage
        </span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
        No Data Available
      </h3>
      <p className="text-on-surface-variant max-w-sm mx-auto">
        Check back later when more data is available.
      </p>
    </div>
  );
}

export function EmptyNotifications() {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">
        <span className="material-symbols-outlined" style={{ fontSize: '64px' }}>
          notifications_none
        </span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
        All Caught Up
      </h3>
      <p className="text-on-surface-variant max-w-sm mx-auto">
        You're all set! No new notifications at the moment.
      </p>
    </div>
  );
}
