"use client";

import { useEffect, useState } from "react";

type FeedbackBannerProps = {
  tone?: "success" | "warning";
  title: string;
  body?: string;
  transient?: boolean;
  durationMs?: number;
};

export function FeedbackBanner({
  tone = "success",
  title,
  body,
  transient = false,
  durationMs = 4200
}: FeedbackBannerProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!transient) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, durationMs);

    return () => window.clearTimeout(timeout);
  }, [durationMs, transient]);

  if (!visible) {
    return null;
  }

  return (
    <article className={`feedback-banner ${tone === "warning" ? "warning" : "success"}`}>
      <div className="feedback-banner-head">
        <strong>{title}</strong>
        <button
          aria-label="Dismiss message"
          className="feedback-dismiss"
          onClick={() => setVisible(false)}
          type="button"
        >
          x
        </button>
      </div>
      {body ? <p>{body}</p> : null}
    </article>
  );
}
