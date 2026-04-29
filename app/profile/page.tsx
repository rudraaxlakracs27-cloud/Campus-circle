import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { deletePostAction } from "@/app/actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SiteHeader } from "@/components/site-header";
import { ToastTrigger } from "@/components/toast-trigger";
import { getRenderableCoverImage } from "@/lib/media";
import { getSessionUser } from "@/lib/session";
import {
  formatDisplayDate,
  formatVisibilityLabel,
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
        <div className="profile-overview">
          <div className="profile-hero">
            <div className="profile-name">
              <span className="eyebrow">Profile</span>
              <h1>{profile.user.fullName}</h1>
              <p className="hero-copy">
                {profile.user.role} at {profile.university.name}
              </p>
              <div className="action-row">
                <span className="pill">{profile.user.username}</span>
                <Link className="secondary-btn" href="/profile/edit">
                  Edit profile
                </Link>
              </div>
            </div>

            <div className="profile-metrics">
              <article className="stat-orb">
                <div className="stat-orb-content">
                  <span className="muted">Followers</span>
                  <strong>{profile.metrics[0]?.value ?? "0"}</strong>
                </div>
              </article>
              <article className="stat-orb">
                <div className="stat-orb-content">
                  <span className="muted">Following</span>
                  <strong>{profile.metrics[1]?.value ?? "0"}</strong>
                </div>
              </article>
              <article className="stat-orb active">
                <div className="stat-orb-content">
                  <span className="muted">Events Posted</span>
                  <strong>{profile.metrics[2]?.value ?? "0"}</strong>
                </div>
              </article>
            </div>
          </div>

          <div className="profile-main-grid">
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

            <article className="glass-feature">
              <h2 style={{ marginTop: 0 }}>About this student account</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                This profile is now driven by the signed-in student session.
              </p>
              <p className="post-copy">{profile.user.bio}</p>
              <div className="tag-row">
                {profile.user.interests.map((interest) => (
                  <span className="tag" key={interest}>
                    {interest}
                  </span>
                ))}
              </div>
            </article>

            <article>
              <div className="section-header">
                <div>
                  <h2>Activity</h2>
                  <p className="muted">Quick-glance stats in the warmer glow style from your mockup.</p>
                </div>
              </div>
              <div className="metric-strip">
                {profile.metrics.slice(3).map((metric) => (
                  <article className="metric-box" key={metric.label}>
                    <span className="muted">{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </article>
                ))}
              </div>
            </article>

            <article className="section-card">
              <div className="section-header">
                <div>
                  <h2>Posts from this account</h2>
                  <p className="muted">Event cards reshaped into a visual grid while keeping your live data.</p>
                </div>
              </div>
              <div className="profile-post-grid">
                {profile.posts.length > 0 ? (
                  profile.posts.map((post) => (
                    <article className="profile-post-card" key={post.id}>
                      <Image
                        alt={post.title}
                        height={420}
                        src={getRenderableCoverImage(post.coverImage)}
                        width={680}
                      />
                      <div className="profile-post-card-body">
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
                    </article>
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
              <section>
              <div className="section-header">
                <div>
                  <h3>Verification Details</h3>
                  <p className="muted">Trust and publishing signals styled like the reference screen.</p>
                </div>
              </div>
              <div className="verification-list">
                <article className="verification-item">
                  <div className="verification-icon">V</div>
                  <div>
                    <strong>University verified</strong>
                    <div className="muted">
                      Account tied to {profile.university.domain} and marked as a valid student identity.
                    </div>
                  </div>
                  <div className="verification-check">O</div>
                </article>
                <article className="verification-item neutral">
                  <div className="verification-icon">C</div>
                  <div>
                    <strong>Club affiliation</strong>
                    <div className="muted">{profile.user.affiliation}</div>
                  </div>
                  <div />
                </article>
                <article className="verification-item neutral">
                  <div className="verification-icon">P</div>
                  <div>
                    <strong>Publishing privileges</strong>
                    <div className="muted">
                      Signed-in students can create event posts with cover images, links, and visibility controls.
                    </div>
                  </div>
                  <div />
                </article>
                <article className="verification-item">
                  <div className="verification-icon">L</div>
                  <div>
                    <strong>Latest event</strong>
                    <div className="muted">
                      {profile.posts[0]
                        ? `${formatDisplayDate(profile.posts[0].eventDate)}`
                        : "No live events yet"}
                    </div>
                  </div>
                  <div className="verification-check">O</div>
                </article>
              </div>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
