import { EventFeed } from "@/components/event-feed";
import { FeedbackBanner } from "@/components/feedback-banner";
import { HeroBanner } from "@/components/hero-banner";
import { SidePanel } from "@/components/side-panel";
import { ToastTrigger } from "@/components/toast-trigger";
import { getSessionUser } from "@/lib/session";
import { getFeedCategories, getFeedPosts, getHomeStats, getUniversities } from "@/lib/store";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{
    q?: string;
    university?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    datePreset?: "upcoming" | "weekend" | "month";
    created?: string;
    error?: string;
  }>;
}) {
  const currentUser = await getSessionUser();
  const params = await searchParams;
  const filters = {
    q: params.q?.trim() || undefined,
    university: params.university?.trim() || undefined,
    category: params.category?.trim() || undefined,
    dateFrom: params.dateFrom?.trim() || undefined,
    dateTo: params.dateTo?.trim() || undefined,
    datePreset: params.datePreset?.trim() as "upcoming" | "weekend" | "month" | undefined
  };

  const [universities, categories, posts, stats] = await Promise.all([
    getUniversities(),
    getFeedCategories(),
    getFeedPosts(currentUser?.id, filters),
    getHomeStats()
  ]);

  return (
    <main className="page-shell">
      <HeroBanner currentUser={currentUser} stats={stats} />
      {params.created ? (
        <ToastTrigger
          body="Your event has been published and added to the shared campus feed."
          title="Event posted"
        />
      ) : null}
      {params.error === "rate-limited" ? (
        <FeedbackBanner
          body="Please wait a little before trying that action again."
          title="You’re moving quickly"
          tone="warning"
        />
      ) : null}
      <section className="content-grid">
        <EventFeed
          categories={categories}
          currentUser={currentUser}
          filters={filters}
          posts={posts}
          universities={universities}
        />
        <SidePanel currentUser={currentUser} universities={universities} />
      </section>
    </main>
  );
}
