import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import type { HomeStat, User } from "@/lib/types";

type HeroBannerProps = {
  stats: HomeStat[];
  currentUser?: User | null;
};

export function HeroBanner({ stats, currentUser }: HeroBannerProps) {
  return (
    <section className="hero hero-banner">
      <SiteHeader currentUser={currentUser} />
      <div className="hero-banner-row">
        <div>
          <span className="eyebrow">Cross-campus discovery for students and clubs</span>
          <h1>Discovery Feed</h1>
          <p className="hero-copy">
            Find the strongest events on campus, publish your own, and track what students are reacting
            to across universities.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn" href="/create-post">
              Create new event
            </Link>
            <Link className="secondary-btn" href={currentUser ? "/profile" : "/sign-in"}>
              {currentUser ? "Open profile" : "Sign in to personalize"}
            </Link>
          </div>
        </div>
        <div className="hero-stats">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.label}>
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
              <div className="muted">{stat.detail}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
