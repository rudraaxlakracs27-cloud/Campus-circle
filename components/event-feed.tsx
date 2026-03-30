import Image from "next/image";
import Link from "next/link";
import { CommentComposer } from "@/components/comment-composer";
import { CommentThread } from "@/components/comment-thread";
import { PostQuickActions } from "@/components/post-quick-actions";
import { getRenderableCoverImage } from "@/lib/media";
import {
  formatCompactNumber,
  formatDisplayDate,
  formatVisibilityLabel,
  getInitials
} from "@/lib/store";
import type { FeedFilters, FeedPost, University, User } from "@/lib/types";

type EventFeedProps = {
  posts: FeedPost[];
  currentUser: User | null;
  universities: University[];
  categories: string[];
  filters: FeedFilters;
};

export function EventFeed({
  posts,
  currentUser,
  universities,
  categories,
  filters
}: EventFeedProps) {
  const getMessageCount = (post: FeedPost) =>
    post.comments.reduce((sum, comment) => sum + 1 + comment.replies.length, 0);

  return (
    <section className="feed-column">
      <article className="composer">
        <div className="section-header">
          <div>
            <h2>Student Event Feed</h2>
            <p className="muted">
              A social feed where verified students can post what is happening on campus.
            </p>
          </div>
          <span className="pill">{currentUser ? "Signed in" : "Read-only until sign in"}</span>
        </div>
        <div className="composer-box">
          <strong>{currentUser ? `Posting as ${currentUser.fullName}` : "Create a post"}</strong>
          <p className="muted">
            {currentUser
              ? "Add a title, description, event date, venue, poster image, and RSVP link to publish a real event post."
              : "Sign in with a student account to publish your own event posts to the shared campus feed."}
          </p>
          <div className="action-row">
            <Link
              className="primary-btn"
              href={currentUser ? "/create-post" : "/sign-in?redirectTo=/create-post"}
            >
              {currentUser ? "Open event composer" : "Sign in to post"}
            </Link>
            {currentUser ? (
              <Link className="secondary-btn" href="/profile">
                Go to profile
              </Link>
            ) : null}
          </div>
        </div>
      </article>

      <article className="section-card">
        <div className="section-header">
          <div>
            <h3>Discover events</h3>
            <p className="muted">
              Search across campuses and narrow the feed by university, category, or timing.
            </p>
          </div>
        </div>
        <form className="filter-form" method="get">
          <label className="field field-full">
            <span>Search</span>
            <input
              defaultValue={filters.q ?? ""}
              name="q"
              placeholder="Search by title, campus, creator, or location"
            />
          </label>
          <label className="field">
            <span>University</span>
            <select defaultValue={filters.university ?? ""} name="university">
              <option value="">All universities</option>
              {universities.map((university) => (
                <option key={university.id} value={university.id}>
                  {university.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Category</span>
            <select defaultValue={filters.category ?? ""} name="category">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>When</span>
            <select defaultValue={filters.datePreset ?? ""} name="datePreset">
              <option value="">Any time</option>
              <option value="upcoming">From today onward</option>
              <option value="weekend">This weekend</option>
              <option value="month">Next 30 days</option>
            </select>
          </label>
          <label className="field">
            <span>From date</span>
            <input defaultValue={filters.dateFrom ?? ""} name="dateFrom" type="date" />
          </label>
          <label className="field">
            <span>To date</span>
            <input defaultValue={filters.dateTo ?? ""} name="dateTo" type="date" />
          </label>
          <div className="action-row">
            <button className="primary-btn" type="submit">
              Apply filters
            </button>
            <Link className="secondary-btn" href="/">
              Clear
            </Link>
          </div>
        </form>
      </article>

      <div className="post-list">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article className="post-card" key={post.id}>
              <Image
                className="post-cover"
                src={getRenderableCoverImage(post.coverImage)}
                alt={post.title}
                width={1200}
                height={700}
                priority={post.id === "post-1"}
              />
              <div className="post-body">
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

                <h3 className="post-title">{post.title}</h3>
                <p className="post-copy">{post.description}</p>
                <div className="action-row" style={{ marginBottom: 18 }}>
                  <Link className="ghost-link" href={`/events/${post.id}`}>
                    View event details
                  </Link>
                </div>

                <div className="event-row">
                  <div className="event-meta">
                    <span className="event-chip">{formatDisplayDate(post.eventDate)}</span>
                    <span className="event-chip">{post.location}</span>
                  </div>
                  <div className="metric">
                    {formatCompactNumber(post.goingCount)} going · {formatCompactNumber(post.maybeCount)} maybe
                  </div>
                </div>

                <div className="divider" />

                <div className="engagement-row">
                  <div className="meta-row">
                    <span className="metric">{formatCompactNumber(post.likeCount)} likes</span>
                    <span className="metric">{formatCompactNumber(post.commentCount)} comments</span>
                    <span className="metric">{formatCompactNumber(post.shareCount)} shares</span>
                    <span className="metric">{formatCompactNumber(post.interestedCount)} interested</span>
                  </div>
                  <div className="meta-row">
                    <span className="tag">{post.category}</span>
                    <span className="tag">{formatVisibilityLabel(post.visibility)}</span>
                    {post.viewerRsvpStatus ? <span className="tag">RSVP {post.viewerRsvpStatus.toLowerCase()}</span> : null}
                    {post.rsvpLink ? (
                      <a className="tag" href={post.rsvpLink} rel="noreferrer" target="_blank">
                        RSVP
                      </a>
                    ) : null}
                  </div>
                </div>

                {currentUser ? (
                  <>
                    <div className="divider" />
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

                    <div className="divider" />
                    <div className="comment-section">
                      <div className="section-header" style={{ marginBottom: 0 }}>
                        <strong>Student comments</strong>
                        <span className="pill">{getMessageCount(post)} messages</span>
                      </div>
                      <div className="comment-list">
                        {post.comments.length > 0 ? (
                          <CommentThread
                            comments={post.comments}
                            compact
                            currentUserId={currentUser.id}
                            postId={post.id}
                          />
                        ) : (
                          <article className="empty-state compact">
                            <strong>No comments yet</strong>
                            <p>Start the conversation for this event and help other students decide to join.</p>
                          </article>
                        )}
                      </div>

                      <CommentComposer
                        helper="Keep it useful: timing, tickets, dress code, lineup, or questions."
                        placeholder="Ask a question, tag a friend, or hype up the event."
                        postId={post.id}
                        rows={3}
                      />
                    </div>
                  </>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <article className="empty-state">
            <span className="eyebrow">No matches yet</span>
            <h3>No events match these filters</h3>
            <p>
              Try a broader search, switch universities, widen the date window, or clear the
              filters to explore more events.
            </p>
            <div className="action-row">
              <Link className="secondary-btn" href="/">
                Clear filters
              </Link>
              <Link
                className="primary-btn"
                href={currentUser ? "/create-post" : "/sign-in?redirectTo=/create-post"}
              >
                {currentUser ? "Post an event instead" : "Sign in to post"}
              </Link>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
