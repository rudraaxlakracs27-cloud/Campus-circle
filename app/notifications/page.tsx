import Link from "next/link";
import { redirect } from "next/navigation";
import { markNotificationsReadAction } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { ToastTrigger } from "@/components/toast-trigger";
import { getSessionUser } from "@/lib/session";
import {
  formatDisplayDate,
  getInitials,
  getNotificationsForUser,
  getUnreadNotificationsCount
} from "@/lib/store";

export default async function NotificationsPage({
  searchParams
}: {
  searchParams: Promise<{ read?: string }>;
}) {
  const currentUser = await getSessionUser();
  const params = await searchParams;

  if (!currentUser) {
    redirect("/sign-in?redirectTo=/notifications");
  }

  const [notifications, unreadCount] = await Promise.all([
    getNotificationsForUser(currentUser.id),
    getUnreadNotificationsCount(currentUser.id)
  ]);

  return (
    <main className="page-shell">
      <section className="hero">
        <SiteHeader currentUser={currentUser} />
        <div className="content-grid">
          <section className="feed-column">
            {params.read ? (
              <ToastTrigger
                title="Notifications cleared"
                body="All current notifications are now marked as read."
              />
            ) : null}
            <article className="section-card">
              <div className="section-header">
                <div>
                  <h2>Notifications</h2>
                  <p className="muted">Track likes, comments, and moderation activity around your events.</p>
                </div>
                <div className="action-row">
                  <span className="pill">{unreadCount} unread</span>
                  {unreadCount > 0 ? (
                    <form action={markNotificationsReadAction}>
                      <button className="secondary-btn" type="submit">
                        Mark all read
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>

              <div className="list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <article
                      className={`auth-card notification-card ${notification.isRead ? "read" : "unread"}`}
                      key={notification.id}
                    >
                      <div className="list-item">
                        <div className="mini-avatar">
                          {notification.actor ? getInitials(notification.actor.fullName) : "CC"}
                        </div>
                        <div className="list-content">
                          <div className="author-row">
                            <div>
                              <strong>{notification.title}</strong>
                              <div className="muted">{formatDisplayDate(notification.createdAt)}</div>
                            </div>
                            {!notification.isRead ? <span className="pill">New</span> : null}
                          </div>
                          <p className="post-copy" style={{ marginTop: 10 }}>
                            {notification.body}
                          </p>
                          {notification.post ? (
                            <div className="action-row">
                              <Link className="ghost-link" href={`/events/${notification.post.id}`}>
                                Open event
                              </Link>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <article className="empty-state">
                    <span className="eyebrow">All quiet</span>
                    <h3>No notifications yet</h3>
                    <p>
                      Once students react to your events or moderators review reported content,
                      updates will show up here.
                    </p>
                  </article>
                )}
              </div>
            </article>
          </section>

          <aside className="sidebar-column">
            <section className="panel">
              <div className="section-header">
                <div>
                  <h3>What shows up here</h3>
                  <p className="muted">This is the first step toward a fuller notification system.</p>
                </div>
              </div>
              <div className="list">
                <div className="list-item">
                  <div className="mini-avatar">1</div>
                  <div>
                    <strong>Likes and interest</strong>
                    <div className="muted">See when students react to an event you posted.</div>
                  </div>
                </div>
                <div className="list-item">
                  <div className="mini-avatar">2</div>
                  <div>
                    <strong>New comments</strong>
                    <div className="muted">Know when someone asks a question on one of your events.</div>
                  </div>
                </div>
                <div className="list-item">
                  <div className="mini-avatar">3</div>
                  <div>
                    <strong>Followers and moderation</strong>
                    <div className="muted">Track new followers and admin alerts when posts are reported.</div>
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
