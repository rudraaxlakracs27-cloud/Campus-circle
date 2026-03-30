export default function NotificationsLoading() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="content-grid">
          <section className="feed-column">
            <article className="section-card">
              <div className="stack">
                <div className="skeleton-block skeleton-line medium" />
                <div className="skeleton-block skeleton-line long" />
                <div className="skeleton-block skeleton-line long" />
              </div>
            </article>
            <article className="auth-card">
              <div className="list-item">
                <div className="skeleton-block skeleton-avatar" />
                <div className="list-content">
                  <div className="skeleton-block skeleton-line medium" />
                  <div className="skeleton-block skeleton-line long" />
                </div>
              </div>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
