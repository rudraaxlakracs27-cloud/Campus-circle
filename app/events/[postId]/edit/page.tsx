import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/session";
import { getOwnedPostById } from "@/lib/store";

export default async function EditPostPage({
  params,
  searchParams
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const currentUser = await getSessionUser();
  const { postId } = await params;
  const query = await searchParams;

  if (!currentUser) {
    redirect(`/sign-in?redirectTo=/events/${postId}/edit`);
  }

  const post = await getOwnedPostById(postId, currentUser.id);

  if (!post) {
    redirect(`/events/${postId}`);
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <SiteHeader currentUser={currentUser} />
        <div className="content-grid">
          <section className="feed-column">
            <article className="composer">
              <div className="section-header">
                <div>
                  <h2>Edit event post</h2>
                  <p className="muted">Update the event details your campus sees in the feed.</p>
                </div>
              </div>
              <form
                action={`/events/${post.id}/edit/submit`}
                className="form-grid"
                encType="multipart/form-data"
                method="post"
              >
                <label className="field">
                  <span>Event title</span>
                  <input defaultValue={post.title} name="title" required />
                </label>
                <label className="field">
                  <span>Category</span>
                  <input defaultValue={post.category} name="category" required />
                </label>
                <label className="field">
                  <span>Event date</span>
                  <input defaultValue={post.eventDate.slice(0, 10)} name="eventDate" required type="date" />
                </label>
                <label className="field">
                  <span>Venue</span>
                  <input defaultValue={post.location} name="location" required />
                </label>
                <label className="field">
                  <span>Media type</span>
                  <input defaultValue={post.mediaType} name="mediaType" required />
                </label>
                <label className="field">
                  <span>Visibility</span>
                  <select defaultValue={post.visibility} name="visibility">
                    <option value="PUBLIC">Public campus post</option>
                    <option value="VERIFIED_ONLY">Verified students only</option>
                    <option value="CAMPUS_ONLY">Same university only</option>
                  </select>
                </label>
                <label className="field field-full">
                  <span>Upload a new poster or cover image</span>
                  <input accept="image/*" name="coverUpload" type="file" />
                </label>
                <label className="field field-full">
                  <span>Or replace with an external cover image URL</span>
                  <input defaultValue={post.coverImage} name="coverImage" type="url" />
                </label>
                <label className="field field-full">
                  <span>RSVP or ticket link</span>
                  <input defaultValue={post.rsvpLink ?? ""} name="rsvpLink" type="url" />
                </label>
                <label className="field field-full">
                  <span>Description</span>
                  <textarea defaultValue={post.description} name="description" required rows={6} />
                </label>
                {query.error === "missing-fields" ? (
                  <p className="form-error field-full">Please complete every required field before saving.</p>
                ) : null}
                {query.error === "invalid-title" ? (
                  <p className="form-error field-full">Title should be between 6 and 100 characters.</p>
                ) : null}
                {query.error === "invalid-description" ? (
                  <p className="form-error field-full">Description should be between 24 and 2000 characters.</p>
                ) : null}
                {query.error === "invalid-category" ? (
                  <p className="form-error field-full">Category should be between 3 and 40 characters.</p>
                ) : null}
                {query.error === "invalid-location" ? (
                  <p className="form-error field-full">Venue should be between 3 and 120 characters.</p>
                ) : null}
                {query.error === "invalid-media-type" ? (
                  <p className="form-error field-full">Media type should be between 3 and 60 characters.</p>
                ) : null}
                {query.error === "invalid-event-date" ? (
                  <p className="form-error field-full">Choose a valid event date.</p>
                ) : null}
                {query.error === "invalid-visibility" ? (
                  <p className="form-error field-full">Choose a valid visibility option.</p>
                ) : null}
                {query.error === "invalid-rsvp-link" ? (
                  <p className="form-error field-full">RSVP link must start with http:// or https://</p>
                ) : null}
                {query.error === "invalid-image-type" ? (
                  <p className="form-error field-full">Only image uploads are supported right now.</p>
                ) : null}
                {query.error === "image-too-large" ? (
                  <p className="form-error field-full">Uploaded image is too large. Keep it under 5 MB.</p>
                ) : null}
                {query.error === "storage-upload-failed" ? (
                  <p className="form-error field-full">The image upload failed in Supabase Storage.</p>
                ) : null}
                {query.error === "invalid-image-url" ? (
                  <p className="form-error field-full">External cover image must be a direct image URL.</p>
                ) : null}
                {query.error === "rate-limited" ? (
                  <p className="form-error field-full">Too many edit attempts. Please wait a little and try again.</p>
                ) : null}
                <div className="action-row field-full">
                  <button className="primary-btn" type="submit">
                    Save changes
                  </button>
                  <Link className="secondary-btn" href={`/events/${post.id}`}>
                    Back to event
                  </Link>
                </div>
              </form>
            </article>
          </section>

          <aside className="sidebar-column">
            <section className="panel">
              <div className="section-header">
                <div>
                  <h3>Editing tips</h3>
                  <p className="muted">Keep the public-facing version of the event clean and current.</p>
                </div>
              </div>
              <div className="list">
                <div className="list-item">
                  <div className="mini-avatar">1</div>
                  <div>
                    <strong>Refresh the event cover</strong>
                    <div className="muted">A cleaner poster usually improves clicks from the feed.</div>
                  </div>
                </div>
                <div className="list-item">
                  <div className="mini-avatar">2</div>
                  <div>
                    <strong>Keep date and venue accurate</strong>
                    <div className="muted">Students rely on these details more than any other field.</div>
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
