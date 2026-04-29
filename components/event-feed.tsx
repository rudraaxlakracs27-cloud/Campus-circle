import Image from "next/image";
import Link from "next/link";
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
  const activeFilterCount = [
    filters.q,
    filters.university,
    filters.category,
    filters.dateFrom,
    filters.dateTo,
    filters.datePreset
  ].filter(Boolean).length;

  return (
    <section className="feed-column">
      <article className="composer feed-lead">
        <div className="section-header">
          <div>
            <h2>Student Event Feed</h2>
            <p className="muted feed-lead-copy">
              A dark, card-first discovery surface inspired by your mockup, while keeping live campus post data underneath.
            </p>
          </div>
          <div className="feed-inline-stats">
            <span className="pill">{posts.length} events</span>
            <span className="pill">{activeFilterCount > 0 ? `${activeFilterCount} filters on` : "Explore mode"}</span>
            {currentUser ? <span className="pill">{currentUser.universityId}</span> : null}
          </div>
        </div>
        <div className="action-row">
          <Link
            className="primary-btn"
            href={currentUser ? "/create-post" : "/sign-in?redirectTo=/create-post"}
          >
            {currentUser ? "Create new event" : "Sign in to post"}
          </Link>
          <Link className="secondary-btn" href={currentUser ? "/profile" : "/sign-up"}>
            {currentUser ? "View profile" : "Create account"}
          </Link>
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
            <article className="post-card discovery-post" key={post.id}>
              <div className="post-media-shell">
                <div className="post-media-head">
                  <div className="post-media-title">
                    <h3>
                      {post.university.name} - {post.title}
                    </h3>
                    <span className="post-media-subtitle">{formatDisplayDate(post.eventDate)}</span>
                  </div>
                  <span className="event-chip">{post.university.name}</span>
                </div>
                <Image
                  className="post-cover"
                  src={getRenderableCoverImage(post.coverImage)}
                  alt={post.title}
                  width={1200}
                  height={700}
                  sizes="(max-width: 720px) 100vw, (max-width: 1180px) 92vw, 960px"
                  priority={post.id === "post-1"}
                />
              </div>

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

                <div className="event-row">
                  <div className="event-meta">
                    <span className="event-chip">{post.location}</span>
                    <span className="event-chip">{post.category}</span>
                  </div>
                  <div className="metric">
                    {formatCompactNumber(post.goingCount)} going · {formatCompactNumber(post.maybeCount)} maybe
                  </div>
                </div>

                <div className="discovery-actions">
                  <Link className="reaction-btn" href={`/events/${post.id}`}>
                    View details
                  </Link>
                  {post.rsvpLink ? (
                    <a className="primary-btn" href={post.rsvpLink} rel="noreferrer" target="_blank">
                      RSVP
                    </a>
                  ) : null}
                </div>

                <p className="post-copy">{post.description}</p>

                {currentUser ? (
                  <>
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
                    <div className="engagement-row">
                      <div className="meta-row">
                        <span className="metric">{formatCompactNumber(post.likeCount)} likes</span>
                        <span className="metric">{formatCompactNumber(post.commentCount)} comments</span>
                        <span className="metric">{formatCompactNumber(post.interestedCount)} interested</span>
                      </div>
                      <div className="meta-row">
                        <Link className="secondary-btn" href={`/events/${post.id}`}>
                          Open discussion
                        </Link>
                      </div>
                    </div>
                  </>
                ) : null}

                {!currentUser ? (
                  <div className="engagement-row">
                    <div className="meta-row">
                      <span className="metric">{formatCompactNumber(post.likeCount)} likes</span>
                      <span className="metric">{formatCompactNumber(post.commentCount)} comments</span>
                      <span className="metric">{formatCompactNumber(post.interestedCount)} interested</span>
                    </div>
                    <div className="meta-row">
                      <span className="tag">{formatVisibilityLabel(post.visibility)}</span>
                    </div>
                  </div>
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
