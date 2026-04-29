import Link from "next/link";
import { redirect } from "next/navigation";
import { EventFeed } from "@/components/event-feed";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/session";
import {
  getFeedCategories,
  getSavedPostsForUser,
  getUniversities
} from "@/lib/store";

export default async function SavedPostsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const currentUser = await getSessionUser();
  const params = await searchParams;

  if (!currentUser) {
    redirect("/sign-in?redirectTo=/saved");
  }

  const [posts, universities, categories] = await Promise.all([
    getSavedPostsForUser(currentUser.id),
    getUniversities(),
    getFeedCategories()
  ]);

  return (
    <main className="page-shell">
      <section className="hero">
        <SiteHeader currentUser={currentUser} />
        <section className="feed-column">
          {params.error === "rate-limited" ? (
            <FeedbackBanner
              body="Please wait a little before trying that action again."
              title="You’re moving quickly"
              tone="warning"
            />
          ) : null}
          <article className="section-card">
            <div className="section-header">
              <div>
                <h2>Saved events</h2>
                <p className="muted">
                  Your shortlist of campus events to revisit, compare, and register for later.
                </p>
              </div>
              <div className="action-row">
                <span className="pill">{posts.length} saved</span>
                <Link className="secondary-btn" href="/">
                  Back to feed
                </Link>
              </div>
            </div>
          </article>
          {posts.length > 0 ? (
            <EventFeed
              categories={categories}
              currentUser={currentUser}
              filters={{}}
              posts={posts}
              universities={universities}
            />
          ) : (
            <article className="empty-state">
              <span className="eyebrow">Nothing saved yet</span>
              <h3>Your shortlist is still empty</h3>
              <p>
                Save standout events from the feed or any event detail page, and they will show
                up here for quick access later.
              </p>
              <div className="action-row">
                <Link className="primary-btn" href="/">
                  Explore the feed
                </Link>
                <Link className="secondary-btn" href="/profile">
                  Open profile
                </Link>
              </div>
            </article>
          )}
        </section>
      </section>
    </main>
  );
}
