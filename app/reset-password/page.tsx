import Link from "next/link";
import { updatePasswordAction } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";

export default async function ResetPasswordPage({
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
              <span className="eyebrow">Choose a new password</span>
              <h1 style={{ maxWidth: "10ch" }}>Set a fresh password.</h1>
              <p className="hero-copy">
                After using your reset link, choose a new password for your Campus Circles account.
              </p>
              <form action={updatePasswordAction} className="auth-form">
                <label className="field">
                  <span>New password</span>
                  <input name="password" placeholder="At least 8 characters" required type="password" />
                </label>
                {params.error === "missing-password" ? (
                  <p className="form-error">Enter a new password before submitting.</p>
                ) : null}
                {params.error === "weak-password" ? (
                  <p className="form-error">Choose a password with at least 8 characters.</p>
                ) : null}
                {params.error === "update-failed" ? (
                  <p className="form-error">We could not update your password. Open the reset link again.</p>
                ) : null}
                <div className="action-row">
                  <button className="primary-btn" type="submit">
                    Update password
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
