import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deletePostAction,
  reportPostAction,
} from "@/app/actions";
import { CommentComposer } from "@/components/comment-composer";
import { CommentThread } from "@/components/comment-thread";
import { FeedbackBanner } from "@/components/feedback-banner";
import { PostQuickActions } from "@/components/post-quick-actions";
import { SiteHeader } from "@/components/site-header";
import { ToastTrigger } from "@/components/toast-trigger";
import { getRenderableCoverImage } from "@/lib/media";
import { getSessionUser } from "@/lib/session";
import {
  formatCompactNumber,
  formatDisplayDate,
  formatVisibilityLabel,
  getFeedPostById,
  getInitials
} from "@/lib/store";

export default async function EventDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ reported?: string; updated?: string; error?: string }>;
}) {
  const currentUser = await getSessionUser();
  const { postId } = await params;
  const query = await searchParams;
  const post = await getFeedPostById(postId, currentUser?.id);
  const isOwner = currentUser?.id === post?.authorId;

  if (!post) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <SiteHeader currentUser={currentUser} />
        <div className="detail-grid">
          <article className="post-card detail-hero-card">
            <div className="post-media-shell detail-cover-shell">
              <div className="post-media-head detail-cover-head">
                <div className="post-media-title">
                  <h3>{post.university.name}</h3>
                  <span className="post-media-subtitle">{formatDisplayDate(post.eventDate)}</span>
                </div>
                <span className="event-chip">{post.mediaType}</span>
              </div>
              <Image
                alt={post.title}
                className="post-cover"
                height={720}
                priority
                sizes="(max-width: 720px) 100vw, (max-width: 1180px) 92vw, 980px"
                src={getRenderableCoverImage(post.coverImage)}
                width={1400}
              />
            </div>
            <div className="post-body">
              {query.updated ? (
                <ToastTrigger
                  body="Your latest edits are now visible on the event detail page and in the feed."
                  title="Event updated"
                />
              ) : null}
              {query.reported ? (
                <ToastTrigger
                  body="Thanks. Your report has been sent to the moderation queue."
                  title="Report submitted"
                />
              ) : null}
              {query.error === "rate-limited" ? (
                <FeedbackBanner
                  body="Please wait a little before trying that action again."
                  title="You’re moving quickly"
                  tone="warning"
                />
              ) : null}
              <div className="author-row">
                <div className="author-meta">
                  <div className="avatar">{getInitials(post.author.fullName)}</div>
                  <div>
                    <strong>{post.author.fullName}</strong>
                    <div className="muted">
                      {post.author.role} at {post.university.name}
                    </div>
                  </div>
                </div>
                <span className="event-chip">{post.mediaType}</span>
              </div>

              <h1 className="detail-title">{post.title}</h1>
              <p className="post-copy">{post.description}</p>

              <div className="tag-row">
                <span className="tag">{post.category}</span>
                <span className="tag">{formatVisibilityLabel(post.visibility)}</span>
                <span className="tag">{post.university.name}</span>
              </div>

              <div className="detail-summary-bar">
                <span className="mini-metric-pill">{formatCompactNumber(post.likeCount)} likes</span>
                <span className="mini-metric-pill">{formatCompactNumber(post.commentCount)} comments</span>
                <span className="mini-metric-pill">{formatCompactNumber(post.interestedCount)} interested</span>
              </div>

              <div className="divider" />

              <div className="detail-metrics">
                <div className="metric-card">
                  <span className="stat-label">Event date</span>
                  <strong>{formatDisplayDate(post.eventDate)}</strong>
                </div>
                <div className="metric-card">
                  <span className="stat-label">Venue</span>
                  <strong>{post.location}</strong>
                </div>
                <div className="metric-card">
                  <span className="stat-label">Interested</span>
                  <strong>{formatCompactNumber(post.interestedCount)}</strong>
                </div>
                <div className="metric-card">
                  <span className="stat-label">Going</span>
                  <strong>{formatCompactNumber(post.goingCount)}</strong>
                </div>
                <div className="metric-card">
                  <span className="stat-label">Maybe</span>
                  <strong>{formatCompactNumber(post.maybeCount)}</strong>
                </div>
              </div>

              <div className="divider" />

              <div className="engagement-row">
                <div className="meta-row">
                  <span className="metric">{formatCompactNumber(post.likeCount)} likes</span>
                  <span className="metric">{formatCompactNumber(post.commentCount)} comments</span>
                  <span className="metric">{formatCompactNumber(post.shareCount)} shares</span>
                </div>
                <div className="action-row">
                  <Link className="secondary-btn" href="/">
                    Back to feed
                  </Link>
                  {currentUser ? (
                    <Link className="secondary-btn" href="/saved">
                      View saved events
                    </Link>
                  ) : null}
                  {isOwner ? (
                    <Link className="secondary-btn" href={`/events/${post.id}/edit`}>
                      Edit event
                    </Link>
                  ) : null}
                  {isOwner ? (
                    <form action={deletePostAction}>
                      <input name="postId" type="hidden" value={post.id} />
                      <input name="redirectTo" type="hidden" value="/profile" />
                      <button className="danger-btn" type="submit">
                        Delete
                      </button>
                    </form>
                  ) : null}
                  {post.rsvpLink ? (
                    <a className="primary-btn" href={post.rsvpLink} rel="noreferrer" target="_blank">
                      Open RSVP
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </article>

          <aside className="sidebar-column">
            <section className="panel detail-sidebar-sticky">
              <div className="section-header">
                <div>
                  <h3>Community activity</h3>
                  <p className="muted">See how students are responding to this event.</p>
                </div>
              </div>
              {currentUser ? (
                <div className="stack">
                  <PostQuickActions
                    authorId={post.authorId}
                    currentUserId={currentUser.id}
                    goingCount={post.goingCount}
                    interestedCount={post.interestedCount}
                    likeCount={post.likeCount}
                    maybeCount={post.maybeCount}
                    postId={post.id}
                    rsvpLink={post.rsvpLink}
                    viewerFollowsAuthor={post.viewerFollowsAuthor}
                    viewerHasLiked={post.viewerHasLiked}
                    viewerHasSaved={post.viewerHasSaved}
                    viewerIsInterested={post.viewerIsInterested}
                    viewerRsvpStatus={post.viewerRsvpStatus}
                  />
                  {!isOwner ? (
                    <form action={reportPostAction} className="report-inline-form">
                      <input name="postId" type="hidden" value={post.id} />
                      <input name="redirectTo" type="hidden" value={`/events/${post.id}`} />
                      <select defaultValue="Spam or misleading" name="reason">
                        <option>Spam or misleading</option>
                        <option>Offensive content</option>
                        <option>Fake event</option>
                        <option>Harassment or abuse</option>
                      </select>
                      <input name="details" placeholder="Optional details for the admin team" />
                      <button className="danger-btn" type="submit">
                        Report post
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : (
                <p className="muted">
                  <Link href="/sign-in">Sign in</Link> to react and join the conversation.
                </p>
              )}
            </section>

            <section className="panel">
              <div className="section-header">
                <div>
                  <h3>Comments</h3>
                  <p className="muted">Questions, hype, and updates from students.</p>
                </div>
              </div>
              <div className="comment-list">
                {post.comments.length > 0 ? (
                  <CommentThread
                    comments={post.comments}
                    currentUserId={currentUser?.id}
                    postId={post.id}
                  />
                ) : (
                  <article className="empty-state compact">
                    <strong>No comments yet</strong>
                    <p>Be the first person to ask a question or help other students with event details.</p>
                  </article>
                )}
              </div>

              {currentUser ? (
                <div style={{ marginTop: 14 }}>
                  <CommentComposer
                    helper="Useful comments usually ask about timing, ticketing, venue, or what to expect."
                    placeholder="Ask about tickets, timing, dress code, or tag classmates."
                    postId={post.id}
                    rows={4}
                  />
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
