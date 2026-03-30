import { redirect } from "next/navigation";
import { FeedbackBanner } from "@/components/feedback-banner";
import { SiteHeader } from "@/components/site-header";
import { postCreationSteps } from "@/data/marketing-data";
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
        <span className="eyebrow">Post an event like a creator, not like a spreadsheet</span>
        <h1 style={{ maxWidth: "10ch" }}>Create event posts with media, links, and campus context.</h1>
        <p className="hero-copy">
          You are signed in as {currentUser.fullName}. Publish as a student organizer for{" "}
          {university?.name}, add a media cover, and send the post straight into the live feed.
        </p>

        <section className="content-grid" style={{ marginTop: 28 }}>
          <div className="feed-column">
            <article className="composer">
              <div className="section-header">
                <div>
                  <h2>Event composer</h2>
                  <p className="muted">This form now writes a real post into the Prisma-backed database.</p>
                </div>
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
                className="form-grid"
                encType="multipart/form-data"
                method="post"
              >
                <label className="field">
                  <span>Event title</span>
                  <input name="title" placeholder="Spring Fest Opening Night" required />
                </label>
                <label className="field">
                  <span>Category</span>
                  <input name="category" placeholder="Music Fest" required />
                </label>
                <label className="field">
                  <span>Event date</span>
                  <input name="eventDate" required type="date" />
                </label>
                <label className="field">
                  <span>Venue</span>
                  <input name="location" placeholder="Main Auditorium" required />
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
                <label className="field">
                  <span>Visibility</span>
                  <select defaultValue="PUBLIC" name="visibility">
                    <option value="PUBLIC">Public campus post</option>
                    <option value="VERIFIED_ONLY">Verified students only</option>
                    <option value="CAMPUS_ONLY">Same university only</option>
                  </select>
                </label>
                <label className="field field-full">
                  <span>Upload a poster or cover image</span>
                  <input accept="image/*" name="coverUpload" type="file" />
                  <small className="field-hint">
                    Upload JPG, PNG, GIF, or WebP up to 5 MB. The image is saved locally for this MVP.
                  </small>
                </label>
                <label className="field field-full">
                  <span>Or use an external cover image URL</span>
                  <input
                    name="coverImage"
                    placeholder="https://images.unsplash.com/..."
                    type="url"
                  />
                </label>
                <label className="field field-full">
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
                  <button className="primary-btn" type="submit">
                    Publish to feed
                  </button>
                </div>
              </form>
            </article>
          </div>

          <aside className="sidebar-column">
            <section className="panel">
              <div className="section-header">
                <div>
                  <h3>Creation flow</h3>
                  <p className="muted">A simple publishing sequence for the MVP.</p>
                </div>
              </div>
              <div className="list">
                {postCreationSteps.map((step) => (
                  <div className="list-item" key={step.title}>
                    <div className="mini-avatar">{step.step}</div>
                    <div>
                      <strong>{step.title}</strong>
                      <div className="muted">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="section-header">
                <div>
                  <h3>Current publishing identity</h3>
                  <p className="muted">Every post is automatically connected to the signed-in student.</p>
                </div>
              </div>
              <div className="list-item">
                <div className="mini-avatar">{currentUser.fullName.slice(0, 1)}</div>
                <div>
                  <strong>{currentUser.fullName}</strong>
                  <div className="muted">
                    {currentUser.role} at {university?.name}
                  </div>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="section-header">
                <div>
                  <h3>Media upload status</h3>
                  <p className="muted">This phase adds real Supabase Storage uploads to the MVP.</p>
                </div>
              </div>
              <div className="list">
                <div className="list-item">
                  <div className="mini-avatar">1</div>
                  <div>
                    <strong>Upload from your device</strong>
                    <div className="muted">Event posters and hero images can now be selected directly in the form.</div>
                  </div>
                </div>
                <div className="list-item">
                  <div className="mini-avatar">2</div>
                  <div>
                    <strong>Stored in Supabase Storage</strong>
                    <div className="muted">Files are uploaded to your Supabase bucket so the feed can render them across environments.</div>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
