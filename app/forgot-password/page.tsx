import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SiteHeader } from "@/components/site-header";

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="page-shell">
      <section className="hero">
        <SiteHeader />
        <div className="content-grid">
          <section className="feed-column">
            <article className="section-card">
              <span className="eyebrow">Password reset</span>
              <h1 style={{ maxWidth: "11ch" }}>Get a reset link by email.</h1>
              <p className="hero-copy">
                Enter the same email you used for your Campus Circles account and we will send a
                secure password reset link through Supabase Auth.
              </p>
              {params.error === "rate-limited" ? (
                <FeedbackBanner
                  body="Too many reset requests were made from this session. Please wait a few minutes."
                  title="Slow down for a moment"
                  tone="warning"
                />
              ) : null}
              <form action={requestPasswordResetAction} className="auth-form">
                <label className="field">
                  <span>Email</span>
                  <input name="email" placeholder="student@college.edu" required type="email" />
                </label>
                {params.error === "missing-email" ? (
                  <p className="form-error">Enter your email before requesting a reset.</p>
                ) : null}
                {params.error === "reset-failed" ? (
                  <p className="form-error">We could not send the reset email. Please try again.</p>
                ) : null}
                <div className="action-row">
                  <button className="primary-btn" type="submit">
                    Send reset link
                  </button>
                  <Link className="secondary-btn" href="/sign-in">
                    Back to sign in
                  </Link>
                </div>
              </form>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
