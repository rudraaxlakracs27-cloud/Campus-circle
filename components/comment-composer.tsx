"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createCommentInlineAction } from "@/app/actions";
import { useToast } from "@/components/toast-provider";

type CommentComposerProps = {
  postId: string;
  placeholder: string;
  helper: string;
  submitLabel?: string;
  parentId?: string;
  rows?: number;
};

function getInlineErrorMessage(error?: string) {
  if (error === "rate-limited") {
    return "You’re moving quickly. Try another comment in a moment.";
  }

  if (error === "auth") {
    return "Please sign in again to comment.";
  }

  if (error === "invalid") {
    return "Write a comment before sending it.";
  }

  return "Your comment did not send. Please try again.";
}

export function CommentComposer({
  postId,
  placeholder,
  helper,
  submitLabel = "Comment",
  parentId,
  rows = 3
}: CommentComposerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [body, setBody] = useState("");
  const [isPending, setIsPending] = useState(false);

  function submitComment() {
    setIsPending(true);

    startTransition(async () => {
      const result = await createCommentInlineAction({
        postId,
        body,
        parentId
      });

      if (!result.ok) {
        showToast({
          title: "Comment not sent",
          body: getInlineErrorMessage(result.error),
          tone: "warning"
        });
        setIsPending(false);
        return;
      }

      setBody("");
      showToast({
        title: parentId ? "Reply posted" : "Comment posted",
        body: parentId
          ? "Your reply is now part of the thread."
          : "Your comment is now visible in the discussion."
      });
      router.refresh();
      setIsPending(false);
    });
  }

  return (
    <div className="comment-form">
      <textarea
        name="body"
        onChange={(event) => setBody(event.target.value)}
        placeholder={placeholder}
        required
        rows={rows}
        value={body}
      />
      <div className="comment-actions">
        <span className="muted">{helper}</span>
        <button className="primary-btn" disabled={isPending || !body.trim()} onClick={submitComment} type="button">
          {isPending ? "Sending..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
