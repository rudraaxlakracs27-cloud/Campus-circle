import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { getInitials } from "@/lib/store";
import type { User } from "@/lib/types";

type SiteHeaderProps = {
  currentUser: User | null;
};

export function SiteHeader({ currentUser }: SiteHeaderProps) {
  return (
    <div className="nav">
      <div className="brand-lockup">
        <Link className="brand-mark" href="/">
          CC
        </Link>
        <div>
          <strong>Campus Circles</strong>
          <div className="muted">Instagram for university events</div>
        </div>
      </div>

      <div className="header-actions">
        <Link className="ghost-link" href="/">
          Feed
        </Link>
        <Link className="ghost-link" href="/create-post">
          Create
        </Link>
        <Link className="ghost-link" href="/profile">
          Profile
        </Link>
        {currentUser ? (
          <Link className="ghost-link" href="/saved">
            Saved
          </Link>
        ) : null}
        {currentUser ? (
          <Link className="ghost-link" href="/notifications">
            Notifications
          </Link>
        ) : null}
        {currentUser?.role.toLowerCase().includes("admin") ? (
          <Link className="ghost-link" href="/admin/reports">
            Moderation
          </Link>
        ) : null}

        {currentUser ? (
          <>
            <div className="session-badge">
              <span className="mini-avatar">{getInitials(currentUser.fullName)}</span>
              <div>
                <strong>{currentUser.fullName}</strong>
                <div className="muted">{currentUser.username}</div>
              </div>
            </div>
            <form action={signOutAction}>
              <button className="secondary-btn" type="submit">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link className="primary-btn" href="/sign-in">
            Sign in
          </Link>
        )}
      </div>
    </div>
  );
}
