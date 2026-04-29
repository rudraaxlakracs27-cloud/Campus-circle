import Link from "next/link";
import { signInAction } from "@/app/actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SiteHeader } from "@/components/site-header";
import { ToastTrigger } from "@/components/toast-trigger";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="page-shell">
      <section className="hero">
        <SiteHeader />
        <section className="feed-column">
          <article className="section-card">
            <span className="eyebrow">Supabase Auth sign in</span>
            <h1 style={{ maxWidth: "11ch" }}>Sign in with your student account.</h1>
            <p className="hero-copy">
              Campus Circles now uses Supabase Auth for email and password sign-in while keeping
              your student profile and posts in the app database.
            </p>
            {params.message === "check-email" ? (
              <ToastTrigger
                body="Check your inbox to confirm your email, then come back and sign in."
                title="Confirm your email"
              />
            ) : null}
            {params.message === "password-reset-sent" ? (
              <ToastTrigger
                body="A password reset link has been sent to your email."
                title="Reset email sent"
              />
            ) : null}
            {params.message === "password-reset-success" ? (
              <ToastTrigger
                body="Your password has been updated. You can sign in now."
                title="Password updated"
              />
            ) : null}
            {params.error === "rate-limited" ? (
              <FeedbackBanner
                body="Too many sign-in attempts were made from this session. Please wait a few minutes."
                title="Slow down for a moment"
                tone="warning"
              />
            ) : null}
            <form action={signInAction} className="auth-form">
              <input name="redirectTo" type="hidden" value={params.redirectTo ?? "/"} />
              <label className="field">
                <span>Email</span>
                <input name="email" placeholder="student@college.edu" required type="email" />
              </label>
              <label className="field">
                <span>Password</span>
                <input name="password" placeholder="Enter your password" required type="password" />
              </label>
              {params.error === "invalid-credentials" ? (
                <p className="form-error">Incorrect email or password.</p>
              ) : null}
              {params.error === "auth-callback" ? (
                <p className="form-error">That auth link was invalid or expired. Please try again.</p>
              ) : null}
              <div className="action-row">
                <button className="primary-btn" type="submit">
                  Sign in
                </button>
                <Link className="secondary-btn" href="/sign-up">
                  Create account
                </Link>
              </div>
              <Link className="ghost-link" href="/forgot-password">
                Forgot password?
              </Link>
            </form>
          </article>
        </section>
      </section>
    </main>
  );
}
