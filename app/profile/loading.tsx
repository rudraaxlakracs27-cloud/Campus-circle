function ProfileSkeletonCard() {
  return (
    <article className="section-card">
      <div className="stack">
        <div className="skeleton-block skeleton-line medium" />
        <div className="skeleton-block skeleton-line long" />
        <div className="skeleton-block skeleton-line long" />
      </div>
    </article>
  );
}

export default function ProfileLoading() {
  return (
    <main className="page-shell">
      <section className="hero">
        <section className="feed-column">
          <article className="section-card">
            <div className="author-row">
              <div className="author-meta">
                <div className="skeleton-block skeleton-avatar" />
                <div className="stack">
                  <div className="skeleton-block skeleton-line medium" />
                  <div className="skeleton-block skeleton-line short" />
                </div>
              </div>
              <div className="skeleton-block skeleton-pill wide" />
            </div>
          </article>
          <ProfileSkeletonCard />
          <ProfileSkeletonCard />
        </section>
      </section>
    </main>
  );
}
