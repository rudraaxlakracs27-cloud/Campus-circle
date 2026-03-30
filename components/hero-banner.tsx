import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import type { HomeStat, User } from "@/lib/types";

type HeroBannerProps = {
  stats: HomeStat[];
  currentUser: User | null;
};

export function HeroBanner({ stats, currentUser }: HeroBannerProps) {
  return (
    <section className="hero">
      <SiteHeader currentUser={currentUser} />

      <div className="hero-grid">
        <div>
          <span className="eyebrow">Built for students, clubs, and campus culture</span>
          <h1>Discover every college event before it happens.</h1>
          <p className="hero-copy">
            Students can create profiles, post upcoming events from their universities,
            upload media-rich announcements, and interact with other campuses through
            likes, comments, saves, RSVPs, and shares.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" href="/create-post">
              Create an event post
            </Link>
            <Link className="secondary-btn" href={currentUser ? "/profile" : "/sign-in"}>
              {currentUser ? "View your profile" : "Try a student account"}
            </Link>
          </div>
          <div className="stat-grid">
            {stats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <span className="stat-label">{stat.label}</span>
                <span className="stat-value">{stat.value}</span>
                <div className="muted">{stat.detail}</div>
              </article>
            ))}
          </div>
        </div>

        <div className="preview-stack">
          <article className="preview-card primary">
            <span className="preview-pill">Tonight at 7:30 PM</span>
            <h3>Battle of the Bands at IIT Delhi</h3>
            <p>Live student performances, food stalls, and creator booths.</p>
          </article>
          <article className="preview-card secondary">
            <span className="preview-pill">Working MVP</span>
            <h4>Students can now sign in, create a post, and see it appear in the feed.</h4>
            <p>Next we can add real media uploads, comments, notifications, and moderation.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
