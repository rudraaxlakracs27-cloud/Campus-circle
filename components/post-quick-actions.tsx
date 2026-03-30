"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  toggleFollowUserInlineAction,
  togglePostInteractionInlineAction,
  togglePostRsvpInlineAction,
  toggleSavedPostInlineAction
} from "@/app/actions";
import { useToast } from "@/components/toast-provider";
import type { RsvpStatus } from "@/lib/types";

type PostQuickActionsProps = {
  postId: string;
  authorId: string;
  currentUserId: string;
  likeCount: number;
  interestedCount: number;
  goingCount: number;
  maybeCount: number;
  viewerHasLiked: boolean;
  viewerIsInterested: boolean;
  viewerHasSaved: boolean;
  viewerFollowsAuthor: boolean;
  viewerRsvpStatus?: RsvpStatus;
  rsvpLink?: string;
};

function getInlineErrorMessage(error?: string) {
  if (error === "rate-limited") {
    return "You’re moving quickly. Try again in a moment.";
  }

  if (error === "auth") {
    return "Please sign in again to continue.";
  }

  return "That action did not go through. Please try again.";
}

export function PostQuickActions({
  postId,
  authorId,
  currentUserId,
  likeCount,
  interestedCount,
  goingCount,
  maybeCount,
  viewerHasLiked,
  viewerIsInterested,
  viewerHasSaved,
  viewerFollowsAuthor,
  viewerRsvpStatus,
  rsvpLink
}: PostQuickActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [liked, setLiked] = useState(viewerHasLiked);
  const [interested, setInterested] = useState(viewerIsInterested);
  const [saved, setSaved] = useState(viewerHasSaved);
  const [following, setFollowing] = useState(viewerFollowsAuthor);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus | undefined>(viewerRsvpStatus);
  const [counts, setCounts] = useState({
    likeCount,
    interestedCount,
    goingCount,
    maybeCount
  });
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  function runAction(key: string, optimisticUpdate: () => void, rollback: () => void, action: () => Promise<{ ok: boolean; error?: string }>) {
    optimisticUpdate();
    setPendingKey(key);

    startTransition(async () => {
      const result = await action();

      if (!result.ok) {
        rollback();
        showToast({
          title: "Action not completed",
          body: getInlineErrorMessage(result.error),
          tone: "warning"
        });
        setPendingKey(null);
        return;
      }

      showToast({
        title: "Updated",
        body: "Your event interaction was saved."
      });
      router.refresh();
      setPendingKey(null);
    });
  }

  return (
    <div className="stack">
      <div className="mini-metric-row">
        <span className="mini-metric-pill">{counts.likeCount} likes</span>
        <span className="mini-metric-pill">{counts.interestedCount} interested</span>
        <span className="mini-metric-pill">{counts.goingCount} going</span>
        <span className="mini-metric-pill">{counts.maybeCount} maybe</span>
      </div>
      <div className="interaction-bar">
        <button
          className={liked ? "reaction-btn active" : "reaction-btn"}
          disabled={pendingKey !== null}
          onClick={() =>
            runAction(
              "like",
              () => {
                setLiked((value) => !value);
                setCounts((current) => ({
                  ...current,
                  likeCount: current.likeCount + (liked ? -1 : 1)
                }));
              },
              () => {
                setLiked(viewerHasLiked);
                setCounts((current) => ({
                  ...current,
                  likeCount
                }));
              },
              () => togglePostInteractionInlineAction({ postId, type: "LIKE" })
            )
          }
          type="button"
        >
          {liked ? "Liked" : "Like"}
        </button>
        <button
          className={interested ? "reaction-btn active" : "reaction-btn"}
          disabled={pendingKey !== null}
          onClick={() =>
            runAction(
              "interest",
              () => {
                setInterested((value) => !value);
                setCounts((current) => ({
                  ...current,
                  interestedCount: current.interestedCount + (interested ? -1 : 1)
                }));
              },
              () => {
                setInterested(viewerIsInterested);
                setCounts((current) => ({
                  ...current,
                  interestedCount
                }));
              },
              () => togglePostInteractionInlineAction({ postId, type: "INTEREST" })
            )
          }
          type="button"
        >
          {interested ? "Interested" : "Mark interested"}
        </button>
        <button
          className={rsvpStatus === "GOING" ? "reaction-btn active" : "reaction-btn"}
          disabled={pendingKey !== null}
          onClick={() =>
            runAction(
              "rsvp-going",
              () => {
                setRsvpStatus((value) => {
                  const nextValue = value === "GOING" ? undefined : "GOING";
                  setCounts((current) => {
                    let nextGoing = current.goingCount;
                    let nextMaybe = current.maybeCount;

                    if (value === "GOING") {
                      nextGoing -= 1;
                    } else if (value === "MAYBE") {
                      nextMaybe -= 1;
                    }

                    if (nextValue === "GOING") {
                      nextGoing += 1;
                    }

                    return {
                      ...current,
                      goingCount: nextGoing,
                      maybeCount: nextMaybe
                    };
                  });
                  return nextValue;
                });
              },
              () => {
                setRsvpStatus(viewerRsvpStatus);
                setCounts((current) => ({
                  ...current,
                  goingCount,
                  maybeCount
                }));
              },
              () => togglePostRsvpInlineAction({ postId, status: "GOING" })
            )
          }
          type="button"
        >
          {rsvpStatus === "GOING" ? "Going" : "RSVP going"}
        </button>
        <button
          className={rsvpStatus === "MAYBE" ? "reaction-btn active" : "reaction-btn"}
          disabled={pendingKey !== null}
          onClick={() =>
            runAction(
              "rsvp-maybe",
              () => {
                setRsvpStatus((value) => {
                  const nextValue = value === "MAYBE" ? undefined : "MAYBE";
                  setCounts((current) => {
                    let nextGoing = current.goingCount;
                    let nextMaybe = current.maybeCount;

                    if (value === "GOING") {
                      nextGoing -= 1;
                    } else if (value === "MAYBE") {
                      nextMaybe -= 1;
                    }

                    if (nextValue === "MAYBE") {
                      nextMaybe += 1;
                    }

                    return {
                      ...current,
                      goingCount: nextGoing,
                      maybeCount: nextMaybe
                    };
                  });
                  return nextValue;
                });
              },
              () => {
                setRsvpStatus(viewerRsvpStatus);
                setCounts((current) => ({
                  ...current,
                  goingCount,
                  maybeCount
                }));
              },
              () => togglePostRsvpInlineAction({ postId, status: "MAYBE" })
            )
          }
          type="button"
        >
          {rsvpStatus === "MAYBE" ? "Maybe" : "RSVP maybe"}
        </button>
        <button
          className={saved ? "reaction-btn active" : "reaction-btn"}
          disabled={pendingKey !== null}
          onClick={() =>
            runAction(
              "save",
              () => setSaved((value) => !value),
              () => setSaved(viewerHasSaved),
              () => toggleSavedPostInlineAction({ postId })
            )
          }
          type="button"
        >
          {saved ? "Saved" : "Save"}
        </button>
        {currentUserId !== authorId ? (
          <button
            className={following ? "reaction-btn active" : "reaction-btn"}
            disabled={pendingKey !== null}
            onClick={() =>
              runAction(
                "follow",
                () => setFollowing((value) => !value),
                () => setFollowing(viewerFollowsAuthor),
                () => toggleFollowUserInlineAction({ followingId: authorId })
              )
            }
            type="button"
          >
            {following ? "Following" : "Follow organizer"}
          </button>
        ) : null}
        {rsvpLink ? (
          <a className="reaction-btn" href={rsvpLink} rel="noreferrer" target="_blank">
            Open RSVP
          </a>
        ) : null}
      </div>
    </div>
  );
}
