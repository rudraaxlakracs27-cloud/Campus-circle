export default function SignInLoading() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="content-grid">
          <section className="feed-column">
            <article className="section-card">
              <div className="stack">
                <div className="skeleton-block skeleton-line short" />
                <div className="skeleton-block skeleton-line medium" />
                <div className="skeleton-block skeleton-line long" />
              </div>
              <div className="auth-form">
                <div className="skeleton-block skeleton-line long" />
                <div className="skeleton-block skeleton-line long" />
                <div className="action-row">
                  <div className="skeleton-block skeleton-pill wide" />
                  <div className="skeleton-block skeleton-pill wide" />
                </div>
              </div>
            </article>
          </section>
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
