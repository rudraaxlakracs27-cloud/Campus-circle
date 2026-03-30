export default function EventLoading() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="detail-grid">
          <article className="post-card">
            <div className="skeleton-block skeleton-cover" />
            <div className="post-body">
              <div className="stack">
                <div className="skeleton-block skeleton-line medium" />
                <div className="skeleton-block skeleton-line long" />
                <div className="skeleton-block skeleton-line long" />
                <div className="skeleton-block skeleton-line short" />
              </div>
            </div>
          </article>
          <aside className="sidebar-column">
            <section className="panel">
              <div className="stack">
                <div className="skeleton-block skeleton-line medium" />
                <div className="skeleton-block skeleton-line long" />
                <div className="skeleton-block skeleton-line long" />
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
