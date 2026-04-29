import { redirect } from "next/navigation";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/session";
import { getUniversities } from "@/lib/store";

export default async function CreatePostPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const currentUser = await getSessionUser();
  const params = await searchParams;

  if (!currentUser) {
    redirect("/sign-in?redirectTo=/create-post");
  }

  const universities = await getUniversities();
  const university = universities.find((item) => item.id === currentUser.universityId);

  return (
    <main className="page-shell">
      <section className="hero">
        <SiteHeader currentUser={currentUser} />
        <div className="create-shell">
          <div>
            <span className="eyebrow">Creator workspace</span>
            <h1 style={{ maxWidth: "12ch", margin: "12px 0 10px" }}>Create New Event Post</h1>
            <p className="hero-copy">
              You are publishing as {currentUser.fullName} for {university?.name}. This flow now mirrors your dark glass event-composer reference while keeping the real submission pipeline.
            </p>
          </div>

          {params.error === "rate-limited" ? (
            <FeedbackBanner
              body="Too many publishing attempts were made from this session. Please wait a little and try again."
              title="Slow down for a moment"
              tone="warning"
            />
          ) : null}

          <form
            action="/create-post/submit"
            className="create-card"
            encType="multipart/form-data"
            method="post"
          >
            <section className="upload-stage">
              <div className="upload-dropzone">
                <div>
                  <div className="poster-preview">
                    <span>^</span>
                  </div>
                  <p>
                    Drag and drop your event poster or upload from your device. You can also{" "}
                    <label htmlFor="coverUpload">browse</label> and keep an external image URL as a fallback.
                  </p>
                  <input accept="image/*" id="coverUpload" name="coverUpload" type="file" />
                  <p className="muted" style={{ marginTop: 14 }}>
                    JPG, PNG, GIF, or WebP up to 5 MB. Files are uploaded to Supabase Storage.
                  </p>
                </div>
              </div>
            </section>

            <section className="create-form-panel">
              <div className="section-header">
                <div>
                  <h2>Event details</h2>
                  <p className="muted">Shape the title, timing, venue, media, and caption.</p>
                </div>
              </div>

              <div className="create-form-grid">
                <label className="field">
                  <span>Event title</span>
                  <input name="title" placeholder="Event title to here" required />
                </label>
                <label className="field">
                  <span>Category</span>
                  <select defaultValue="Music" name="category">
                    <option>Music</option>
                    <option>Tech</option>
                    <option>Sports</option>
                    <option>Academic</option>
                    <option>Social</option>
                  </select>
                </label>
                <div className="inline-dual">
                  <label className="field">
                    <span>Event date</span>
                    <input name="eventDate" required type="date" />
                  </label>
                  <label className="field">
                    <span>Media type</span>
                    <select defaultValue="Poster + RSVP" name="mediaType">
                      <option>Poster + RSVP</option>
                      <option>Video + Poster</option>
                      <option>Carousel + Registration Link</option>
                      <option>Photo Reel + Brochure</option>
                    </select>
                  </label>
                </div>
                <label className="field">
                  <span>Venue</span>
                  <input name="location" placeholder="Enter venue" required />
                </label>
                <label className="field">
                  <span>Visibility</span>
                  <select defaultValue="PUBLIC" name="visibility">
                    <option value="PUBLIC">Public campus post</option>
                    <option value="VERIFIED_ONLY">Verified students only</option>
                    <option value="CAMPUS_ONLY">Same university only</option>
                  </select>
                </label>
                <label className="field">
                  <span>External cover image URL</span>
                  <input
                    name="coverImage"
                    placeholder="https://images.unsplash.com/..."
                    type="url"
                  />
                </label>
                <label className="field">
                  <span>RSVP or ticket link</span>
                  <input name="rsvpLink" placeholder="https://example.com/register" type="url" />
                </label>
                <label className="field field-full">
                  <span>Description</span>
                  <textarea
                    name="description"
                    placeholder="Tell students what the event is, who it is for, and why they should join."
                    required
                    rows={6}
                  />
                </label>

                {params.error === "missing-fields" ? (
                  <p className="form-error">Please fill in all required event fields before publishing.</p>
                ) : null}
                {params.error === "invalid-title" ? (
                  <p className="form-error">Title should be between 6 and 100 characters.</p>
                ) : null}
                {params.error === "invalid-description" ? (
                  <p className="form-error">Description should be between 24 and 2000 characters.</p>
                ) : null}
                {params.error === "invalid-category" ? (
                  <p className="form-error">Category should be between 3 and 40 characters.</p>
                ) : null}
                {params.error === "invalid-location" ? (
                  <p className="form-error">Venue should be between 3 and 120 characters.</p>
                ) : null}
                {params.error === "invalid-media-type" ? (
                  <p className="form-error">Media type should be between 3 and 60 characters.</p>
                ) : null}
                {params.error === "invalid-event-date" ? (
                  <p className="form-error">Choose a valid event date.</p>
                ) : null}
                {params.error === "invalid-visibility" ? (
                  <p className="form-error">Choose a valid visibility option.</p>
                ) : null}
                {params.error === "invalid-rsvp-link" ? (
                  <p className="form-error">RSVP link must start with http:// or https://</p>
                ) : null}
                {params.error === "invalid-image-type" ? (
                  <p className="form-error">Only image uploads are supported right now.</p>
                ) : null}
                {params.error === "image-too-large" ? (
                  <p className="form-error">Uploaded image is too large. Keep it under 5 MB.</p>
                ) : null}
                {params.error === "storage-upload-failed" ? (
                  <p className="form-error">
                    We could not upload that image to Supabase Storage. Check your bucket and policies.
                  </p>
                ) : null}
                {params.error === "invalid-image-url" ? (
                  <p className="form-error">
                    External cover image must be a direct image URL from a supported host.
                  </p>
                ) : null}

                <div className="action-row">
                  <button className="primary-btn glow-submit" type="submit">
                    Publish
                  </button>
                  <a className="ghost-link" href="/">
                    Cancel
                  </a>
                </div>
              </div>
            </section>
          </form>
        </div>
      </section>
    </main>
  );
}
