import { launchChecklist } from "@/data/marketing-data";
import type { University, User } from "@/lib/types";

type SidePanelProps = {
  universities: University[];
  currentUser: User | null;
};

export function SidePanel({ universities, currentUser }: SidePanelProps) {
  return (
    <aside className="sidebar-column">
      <section className="panel">
        <div className="section-header">
          <div>
            <h3>Core MVP Features</h3>
            <p className="muted">What the first version should support.</p>
          </div>
        </div>
        <div className="list">
          {launchChecklist.map((item) => (
            <div className="list-item" key={item.title}>
              <div className="mini-avatar">{item.icon}</div>
              <div>
                <strong>{item.title}</strong>
                <div className="muted">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="spotlight-card">
        <h3>How it grows beyond one campus</h3>
        <p className="muted">
          Every post carries a university identity, so students can browse their own
          college first and still discover festivals, hackathons, sports meets, and
          club nights at other universities.
        </p>
        <div className="stack">
          <span className="tag">University tags</span>
          <span className="tag">Cross-campus explore</span>
          <span className="tag">Event reminders</span>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h3>Feed ranking signals</h3>
            <p className="muted">The homepage is no longer a flat reverse-chronological list.</p>
          </div>
        </div>
        <div className="list">
          <div className="list-item">
            <div className="mini-avatar">1</div>
            <div>
              <strong>Campus relevance</strong>
              <div className="muted">Events from your university and your interests are pushed upward.</div>
            </div>
          </div>
          <div className="list-item">
            <div className="mini-avatar">2</div>
            <div>
              <strong>Social signals</strong>
              <div className="muted">Following, saves, likes, RSVP state, and engagement all influence ranking.</div>
            </div>
          </div>
          <div className="list-item">
            <div className="mini-avatar">3</div>
            <div>
              <strong>Event timing</strong>
              <div className="muted">Sooner upcoming events win over stale posts when the scores are close.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h3>Session status</h3>
            <p className="muted">Posting is protected behind student sign-in.</p>
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
            <h3>Universities in the demo</h3>
            <p className="muted">Examples of how the network effect starts.</p>
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
