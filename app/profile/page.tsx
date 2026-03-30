import Link from "next/link";
import { redirect } from "next/navigation";
import { deletePostAction } from "@/app/actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SiteHeader } from "@/components/site-header";
import { ToastTrigger } from "@/components/toast-trigger";
import { getSessionUser } from "@/lib/session";
import {
  formatDisplayDate,
  formatVisibilityLabel,
  getInitials,
  getUserFeedSummary
} from "@/lib/store";

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ updated?: string; deleted?: string; error?: string }>;
}) {
  const currentUser = await getSessionUser();
  const params = await searchParams;

  if (!currentUser) {
    redirect("/sign-in?redirectTo=/profile");
  }

  const profile = await getUserFeedSummary(currentUser.id);

  if (!profile || !profile.university) {
    redirect("/");
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <SiteHeader currentUser={currentUser} />
        <div className="author-row">
          <div className="author-meta">
            <div className="avatar">{getInitials(profile.user.fullName)}</div>
            <div>
              <h1 style={{ margin: 0, fontSize: "clamp(2.2rem, 4vw, 3.8rem)" }}>
                {profile.user.fullName}
              </h1>
              <p className="muted" style={{ margin: "10px 0 0" }}>
                {profile.user.role} at {profile.university.name}
              </p>
            </div>
          </div>
          <div className="action-row">
            <span className="pill">{profile.user.username}</span>
            <Link className="secondary-btn" href="/profile/edit">
              Edit profile
            </Link>
          </div>
        </div>

        <div className="content-grid" style={{ marginTop: 28 }}>
          <section className="feed-column">
            {params.updated ? (
              <ToastTrigger
                body="Your public profile now reflects the latest identity and organizer details."
                title="Profile updated"
              />
            ) : null}
            {params.deleted ? (
              <ToastTrigger
                body="That event has been removed from your profile and the shared feed."
                title="Post deleted"
              />
            ) : null}
            {params.error === "rate-limited" ? (
              <FeedbackBanner
                body="Please wait a little before trying that again."
                title="You’re moving quickly"
                tone="warning"
              />
            ) : null}
            <article className="section-card">
              <div className="section-header">
                <div>
                  <h2>About this student account</h2>
                  <p className="muted">This profile is now driven by the signed-in student session.</p>
                </div>
              </div>
              <p className="post-copy">{profile.user.bio}</p>
              <div className="tag-row">
                {profile.user.interests.map((interest) => (
                  <span className="tag" key={interest}>
                    {interest}
                  </span>
                ))}
              </div>
            </article>

            <article className="section-card">
              <div className="section-header">
                <div>
                  <h2>Profile activity</h2>
                  <p className="muted">Metrics that make creators and organizers visible.</p>
                </div>
              </div>
              <div className="stat-grid">
                {profile.metrics.map((metric) => (
                  <article className="stat-card" key={metric.label}>
                    <span className="stat-label">{metric.label}</span>
                    <span className="stat-value">{metric.value}</span>
                    <div className="muted">{metric.detail}</div>
                  </article>
                ))}
              </div>
            </article>

            <article className="section-card">
              <div className="section-header">
                <div>
                  <h2>Posts from this account</h2>
                  <p className="muted">Every event published by the signed-in student appears here.</p>
                </div>
              </div>
              <div className="list">
                {profile.posts.length > 0 ? (
                  profile.posts.map((post) => (
                    <div className="list-item" key={post.id}>
                      <div className="mini-avatar">{post.category.slice(0, 1)}</div>
                      <div className="list-content">
                        <strong>{post.title}</strong>
                        <div className="muted">
                          {formatDisplayDate(post.eventDate)} at {post.location}
                        </div>
                        <div className="tag-row" style={{ marginTop: 10 }}>
                          <span className="tag">{post.category}</span>
                          <span className="tag">{formatVisibilityLabel(post.visibility)}</span>
                        </div>
                        <div className="action-row" style={{ marginTop: 12 }}>
                          <Link className="ghost-link" href={`/events/${post.id}`}>
                            View
                          </Link>
                          <Link className="ghost-link" href={`/events/${post.id}/edit`}>
                            Edit
                          </Link>
                          <form action={deletePostAction}>
                            <input name="postId" type="hidden" value={post.id} />
                            <input name="redirectTo" type="hidden" value="/profile" />
                            <button className="danger-btn" type="submit">
                              Delete
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <article className="empty-state compact">
                    <strong>No events posted yet</strong>
                    <p>Your profile is ready. Publish your first campus event to start building momentum.</p>
                    <div className="action-row">
                      <Link className="primary-btn" href="/create-post">
                        Create your first event
                      </Link>
                    </div>
                  </article>
                )}
              </div>
            </article>

            <article className="section-card">
              <div className="section-header">
                <div>
                  <h2>Saved events</h2>
                  <p className="muted">Bookmarks you can revisit before registration closes.</p>
                </div>
                <Link className="secondary-btn" href="/saved">
                  Open saved feed
                </Link>
              </div>
              <div className="list">
                {profile.savedPosts.length > 0 ? (
                  profile.savedPosts.map((post) => (
                    <div className="list-item" key={post.id}>
                      <div className="mini-avatar">{post.category.slice(0, 1)}</div>
                      <div className="list-content">
                        <strong>{post.title}</strong>
                        <div className="muted">
                          {post.author.fullName} · {post.university.name}
                        </div>
                        <div className="muted">
                          {formatDisplayDate(post.eventDate)} at {post.location}
                        </div>
                        <div className="tag-row" style={{ marginTop: 10 }}>
                          <span className="tag">{post.category}</span>
                          <span className="tag">
                            {post.viewerFollowsAuthor ? "Following organizer" : "Organizer not followed"}
                          </span>
                        </div>
                        <div className="action-row" style={{ marginTop: 12 }}>
                          <Link className="ghost-link" href={`/events/${post.id}`}>
                            View event
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <article className="empty-state compact">
                    <strong>No saved events yet</strong>
                    <p>Save events from the feed or detail page to build your own shortlist.</p>
                    <div className="action-row">
                      <Link className="primary-btn" href="/">
                        Explore the feed
                      </Link>
                    </div>
                  </article>
                )}
              </div>
            </article>
          </section>

          <aside className="sidebar-column">
            <section className="panel">
              <div className="section-header">
                <div>
                  <h3>Verification details</h3>
                  <p className="muted">Trust is important in a student network.</p>
                </div>
              </div>
              <div className="list">
                <div className="list-item">
                  <div className="mini-avatar">V</div>
                  <div>
                    <strong>University verified</strong>
                    <div className="muted">
                      Account tied to {profile.university.domain} and marked as a valid student identity.
                    </div>
                  </div>
                </div>
                <div className="list-item">
                  <div className="mini-avatar">C</div>
                  <div>
                    <strong>Club affiliation</strong>
                    <div className="muted">{profile.user.affiliation}</div>
                  </div>
                </div>
                <div className="list-item">
                  <div className="mini-avatar">P</div>
                  <div>
                    <strong>Publishing privileges</strong>
                    <div className="muted">
                      Signed-in students can create event posts with cover images, links, and visibility controls.
                    </div>
                  </div>
                </div>
                <div className="list-item">
                  <div className="mini-avatar">L</div>
                  <div>
                    <strong>Latest event</strong>
                    <div>
                      <div className="muted">
                        {profile.posts[0]
                          ? `${formatDisplayDate(profile.posts[0].eventDate)} in ${profile.posts[0].location}`
                          : "No live events yet"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
