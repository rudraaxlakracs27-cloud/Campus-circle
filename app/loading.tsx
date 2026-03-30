function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton-block ${className}`.trim()} />;
}

export default function Loading() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="nav">
          <div className="brand-lockup">
            <SkeletonBlock className="skeleton-avatar" />
            <div className="stack">
              <SkeletonBlock className="skeleton-line short" />
              <SkeletonBlock className="skeleton-line medium" />
            </div>
          </div>
          <div className="header-actions">
            <SkeletonBlock className="skeleton-pill" />
            <SkeletonBlock className="skeleton-pill" />
            <SkeletonBlock className="skeleton-pill" />
          </div>
        </div>

        <div className="content-grid">
          <section className="feed-column">
            <article className="composer">
              <SkeletonBlock className="skeleton-line medium" />
              <SkeletonBlock className="skeleton-line long" />
              <SkeletonBlock className="skeleton-line long" />
              <div className="action-row">
                <SkeletonBlock className="skeleton-pill wide" />
                <SkeletonBlock className="skeleton-pill wide" />
              </div>
            </article>

            <article className="post-card">
              <SkeletonBlock className="skeleton-cover" />
              <div className="post-body">
                <SkeletonBlock className="skeleton-line medium" />
                <SkeletonBlock className="skeleton-line long" />
                <SkeletonBlock className="skeleton-line long" />
                <SkeletonBlock className="skeleton-line short" />
              </div>
            </article>
          </section>

          <aside className="sidebar-column">
            <section className="panel">
              <SkeletonBlock className="skeleton-line medium" />
              <SkeletonBlock className="skeleton-line long" />
              <SkeletonBlock className="skeleton-line long" />
              <SkeletonBlock className="skeleton-line medium" />
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
