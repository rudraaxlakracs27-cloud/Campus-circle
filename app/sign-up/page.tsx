import Link from "next/link";
import { signUpAction } from "@/app/actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/session";
import { getUniversities } from "@/lib/store";

export default async function SignUpPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string; details?: string }>;
}) {
  const [currentUser, universities, params] = await Promise.all([
    getSessionUser(),
    getUniversities(),
    searchParams
  ]);

  return (
    <main className="page-shell">
      <section className="hero">
        <SiteHeader currentUser={currentUser} />
        <section className="feed-column">
          <article className="section-card">
            <span className="eyebrow">Create your student account</span>
            <h1 style={{ maxWidth: "11ch" }}>Join the campus event network.</h1>
            <p className="hero-copy">
              Create your account with Supabase Auth to publish events, react to other campuses,
              and build your student presence on Campus Circles.
            </p>
            {params.error === "rate-limited" ? (
              <FeedbackBanner
                body="Too many signup attempts were made from this session. Please wait a few minutes."
                title="Slow down for a moment"
                tone="warning"
              />
            ) : null}
            <form action={signUpAction} className="auth-form">
              <input name="redirectTo" type="hidden" value={params.redirectTo ?? "/"} />
              <label className="field">
                <span>Full name</span>
                <input name="fullName" placeholder="Riya Sharma" required />
              </label>
              <label className="field">
                <span>Username</span>
                <input name="username" placeholder="riya.on.campus" required />
              </label>
              <label className="field">
                <span>Email</span>
                <input name="email" placeholder="riya@college.edu" required type="email" />
              </label>
              <label className="field">
                <span>Password</span>
                <input name="password" placeholder="At least 8 characters" required type="password" />
              </label>
              <label className="field field-full">
                <span>University</span>
                <select defaultValue="" name="universityId" required>
                  <option disabled value="">
                    Select your university
                  </option>
                  {universities.map((university) => (
                    <option key={university.id} value={university.id}>
                      {university.name}
                    </option>
                  ))}
                </select>
              </label>
              {params.error === "missing-fields" ? (
                <p className="form-error">Please complete every field before creating your account.</p>
              ) : null}
              {params.error === "weak-password" ? (
                <p className="form-error">Choose a password with at least 8 characters.</p>
              ) : null}
              {params.error === "invalid-name" ? (
                <p className="form-error">Use your real name with letters and spaces only.</p>
              ) : null}
              {params.error === "invalid-username" ? (
                <p className="form-error">Username should be 3-24 characters using letters, numbers, dots, or underscores.</p>
              ) : null}
              {params.error === "invalid-email" ? (
                <p className="form-error">Enter a valid email address.</p>
              ) : null}
              {params.error === "email-taken" ? (
                <p className="form-error">That email is already in use.</p>
              ) : null}
              {params.error === "auth-signup-failed" ? (
                <p className="form-error">
                  {params.details || "We could not create the auth account. Please try again."}
                </p>
              ) : null}
              <div className="action-row">
                <button className="primary-btn" type="submit">
                  Create account
                </button>
                <Link className="secondary-btn" href="/sign-in">
                  Back to sign in
                </Link>
              </div>
            </form>
          </article>
        </section>
      </section>
    </main>
  );
}
