import Link from "next/link";
import { redirect } from "next/navigation";
import { reviewReportAction } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/session";
import { formatDisplayDate, getModerationReports, getInitials } from "@/lib/store";

export default async function AdminReportsPage() {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/sign-in?redirectTo=/admin/reports");
  }

  if (!currentUser.role.toLowerCase().includes("admin")) {
    redirect("/");
  }

  const reports = await getModerationReports();

  return (
    <main className="page-shell">
      <section className="hero">
        <SiteHeader currentUser={currentUser} />
        <section className="feed-column">
          <article className="section-card">
            <div className="section-header">
              <div>
                <h2>Moderation reports</h2>
                <p className="muted">Review posts flagged by students across the network.</p>
              </div>
              <span className="pill">{reports.length} reports</span>
            </div>

            <div className="list">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <article className="auth-card" key={report.id}>
                    <div className="author-row">
                      <div>
                        <strong>{report.reason}</strong>
                        <div className="muted">
                          Reported on {formatDisplayDate(report.createdAt)} by {report.reporter.fullName}
                        </div>
                      </div>
                      <span className="tag">{report.status}</span>
                    </div>
                    <div className="list-item">
                      <div className="mini-avatar">{getInitials(report.post.author.fullName)}</div>
                      <div className="list-content">
                        <strong>{report.post.title}</strong>
                        <div className="muted">
                          by {report.post.author.fullName} at {report.post.university.name}
                        </div>
                        <p className="post-copy" style={{ marginTop: 10 }}>
                          {report.details || "No extra notes were added with this report."}
                        </p>
                        <div className="action-row">
                          <Link className="ghost-link" href={`/events/${report.post.id}`}>
                            Open post
                          </Link>
                          {report.status === "OPEN" ? (
                            <>
                              <form action={reviewReportAction}>
                                <input name="reportId" type="hidden" value={report.id} />
                                <input name="status" type="hidden" value="REVIEWED" />
                                <button className="secondary-btn" type="submit">
                                  Mark reviewed
                                </button>
                              </form>
                              <form action={reviewReportAction}>
                                <input name="reportId" type="hidden" value={report.id} />
                                <input name="status" type="hidden" value="DISMISSED" />
                                <button className="danger-btn" type="submit">
                                  Dismiss
                                </button>
                              </form>
                            </>
                          ) : null}
                        </div>
                        {report.reviewer ? (
                          <p className="muted" style={{ margin: "8px 0 0" }}>
                            Reviewed by {report.reviewer.fullName}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted">No reports yet. The moderation queue is clear.</p>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
