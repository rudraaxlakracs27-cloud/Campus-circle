export default function CreatePostLoading() {
  return (
    <main className="page-shell">
      <section className="hero">
        <section className="feed-column">
          <article className="composer">
            <div className="stack">
              <div className="skeleton-block skeleton-line medium" />
              <div className="skeleton-block skeleton-line long" />
            </div>
            <div className="form-grid" style={{ marginTop: 24 }}>
              <div className="skeleton-block skeleton-line medium" />
              <div className="skeleton-block skeleton-line medium" />
              <div className="skeleton-block skeleton-line medium" />
              <div className="skeleton-block skeleton-line medium" />
              <div className="skeleton-block skeleton-cover" style={{ height: 180, borderRadius: 20 }} />
              <div className="skeleton-block skeleton-cover" style={{ height: 180, borderRadius: 20 }} />
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
