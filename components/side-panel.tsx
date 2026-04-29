import type { FeedPost, University, User } from "@/lib/types";

type SidePanelProps = {
  universities: University[];
  currentUser: User | null;
  posts: FeedPost[];
};

export function SidePanel({ universities, currentUser, posts }: SidePanelProps) {
  const trendingPosts = posts.slice(0, 3);
  const suggestedClubs = universities.slice(0, 3).map((university, index) => ({
    name: [
      "Photography Club",
      "Debate Society",
      "Hiking Club"
    ][index] ?? `${university.name} Club`,
    university: university.name
  }));

  return (
    <aside className="sidebar-column">
      <section className="panel">
        <div className="section-header">
          <div>
            <h3>Trending Events</h3>
            <p className="muted">A fast glance at what is pulling attention right now.</p>
          </div>
        </div>
        <div className="feed-side-list">
          {trendingPosts.map((post) => (
            <article className="feed-side-item" key={post.id}>
              <img alt={post.title} className="feed-side-thumb" src={post.coverImage} />
              <div>
                <strong>{post.title}</strong>
                <div className="muted">
                  {post.university.name} · {new Date(post.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h3>Suggested Clubs</h3>
            <p className="muted">Communities that match the campus-exploration vibe in your mockup.</p>
          </div>
        </div>
        <div className="feed-side-list">
          {suggestedClubs.map((club, index) => (
            <article className="feed-side-item" key={club.name}>
              <div className="mini-avatar">{["P", "D", "H"][index] ?? "C"}</div>
              <div>
                <strong>{club.name}</strong>
                <div className="muted">{club.university}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h3>Session status</h3>
            <p className="muted">A quick state check for the signed-in creator flow.</p>
          </div>
        </div>
        <div className="list-item">
          <div className="mini-avatar">{currentUser ? "ON" : "OFF"}</div>
          <div>
            <strong>{currentUser ? currentUser.fullName : "No student signed in"}</strong>
            <div className="muted">
              {currentUser
                ? "You can publish posts and access your profile."
                : "Use the demo sign-in page to test the authenticated flow."}
            </div>
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-header">
          <div>
            <h3>Universities in the network</h3>
            <p className="muted">The multi-campus layer behind feed discovery.</p>
          </div>
        </div>
        <div className="campus-list">
          {universities.map((campus) => (
            <div className="campus-row" key={campus.name}>
              <div>
                <strong className="campus-name">{campus.name}</strong>
                <div className="muted">{campus.summary}</div>
              </div>
              <span className="campus-badge">{campus.city}</span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
