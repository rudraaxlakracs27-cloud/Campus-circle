import Link from "next/link";
import { redirect } from "next/navigation";
import { updateProfileAction } from "@/app/actions";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/session";
import { getUserFeedSummary } from "@/lib/store";

export default async function EditProfilePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const currentUser = await getSessionUser();
  const params = await searchParams;

  if (!currentUser) {
    redirect("/sign-in?redirectTo=/profile/edit");
  }

  const profile = await getUserFeedSummary(currentUser.id);

  if (!profile) {
    redirect("/profile");
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <SiteHeader currentUser={currentUser} />
        <section className="feed-column">
          <article className="composer">
            <div className="section-header">
              <div>
                <h2>Edit profile</h2>
                <p className="muted">Update the identity students see across your posts and comments.</p>
              </div>
            </div>
            <form action={updateProfileAction} className="form-grid">
              <label className="field">
                <span>Full name</span>
                <input defaultValue={profile.user.fullName} name="fullName" required />
              </label>
              <label className="field">
                <span>Username</span>
                <input defaultValue={profile.user.username.replace(/^@/, "")} name="username" required />
              </label>
              <label className="field field-full">
                <span>Bio</span>
                <textarea defaultValue={profile.user.bio} name="bio" required rows={5} />
              </label>
              <label className="field">
                <span>Affiliation</span>
                <input defaultValue={profile.user.affiliation} name="affiliation" required />
              </label>
              <label className="field">
                <span>Interests</span>
                <input
                  defaultValue={profile.user.interests.join(", ")}
                  name="interests"
                  placeholder="Campus events, Design, Music"
                  required
                />
              </label>
              {params.error === "missing-fields" ? (
                <p className="form-error field-full">Please complete every profile field before saving.</p>
              ) : null}
              {params.error === "invalid-name" ? (
                <p className="form-error field-full">Use your real name with letters and spaces only.</p>
              ) : null}
              {params.error === "invalid-username" ? (
                <p className="form-error field-full">Username should be 3-24 characters using letters, numbers, dots, or underscores.</p>
              ) : null}
              {params.error === "invalid-bio" ? (
                <p className="form-error field-full">Bio should be between 20 and 320 characters.</p>
              ) : null}
              {params.error === "invalid-affiliation" ? (
                <p className="form-error field-full">Affiliation should be between 2 and 80 characters.</p>
              ) : null}
              {params.error === "invalid-interests" ? (
                <p className="form-error field-full">Add between 1 and 8 interests separated by commas.</p>
              ) : null}
              {params.error === "username-taken" ? (
                <p className="form-error field-full">That username is already taken.</p>
              ) : null}
              {params.error === "rate-limited" ? (
                <p className="form-error field-full">Too many profile updates. Please wait and try again.</p>
              ) : null}
              <div className="action-row field-full">
                <button className="primary-btn" type="submit">
                  Save profile
                </button>
                <Link className="secondary-btn" href="/profile">
                  Back to profile
                </Link>
              </div>
            </form>
          </article>
        </section>
      </section>
    </main>
  );
}
