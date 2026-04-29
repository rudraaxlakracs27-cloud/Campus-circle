export default function SavedPostsLoading() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="section-card">
          <div className="skeleton-line" style={{ width: "22%" }} />
          <div className="skeleton-line short" style={{ width: "46%", marginTop: 14 }} />
        </div>
        <section className="feed-column">
          <div className="skeleton-card">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
          <div className="skeleton-card">
            <div className="skeleton-cover" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
            <div className="skeleton-line short" style={{ width: "35%" }} />
          </div>
        </section>
      </section>
    </main>
  );
}
