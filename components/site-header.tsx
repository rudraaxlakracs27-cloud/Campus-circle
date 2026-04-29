"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { getInitials } from "@/lib/store";
import type { User } from "@/lib/types";

type SiteHeaderProps = {
  currentUser: User | null;
};

export function SiteHeader({ currentUser }: SiteHeaderProps) {
  const pathname = usePathname();
  const navItems = [
    { href: "/", label: "Feed", icon: "F", match: (value: string) => value === "/" || value.startsWith("/events") },
    { href: "/create-post", label: "Create", icon: "+", match: (value: string) => value.startsWith("/create-post") },
    { href: "/profile", label: "Profile", icon: "P", match: (value: string) => value.startsWith("/profile") },
    { href: "/saved", label: "Saved", icon: "S", match: (value: string) => value.startsWith("/saved") },
    { href: "/notifications", label: "Notifications", icon: "N", match: (value: string) => value.startsWith("/notifications") }
  ];

  const topbarItems = navItems.filter((item) => currentUser || (item.href !== "/saved" && item.href !== "/notifications"));
  const isAdmin = Boolean(currentUser?.role.toLowerCase().includes("admin"));

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-inner">
          <div className="brand-lockup">
            <Link className="brand-mark" href="/">
              C
            </Link>
            <div className="brand-copy">
              <strong>Campus Circles</strong>
              <div className="muted">Student event network</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) =>
              !currentUser && (item.href === "/saved" || item.href === "/notifications") ? null : (
                <Link
                  className={`sidebar-link ${item.match(pathname) ? "active" : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            )}
            {isAdmin ? (
              <Link
                className={`sidebar-link ${pathname.startsWith("/admin/reports") ? "active" : ""}`}
                href="/admin/reports"
              >
                <span className="sidebar-icon">M</span>
                <span>Moderation</span>
              </Link>
            ) : null}
            <a className="sidebar-link settings-link" href="#settings">
              <span className="sidebar-icon">*</span>
              <span>Settings</span>
            </a>
          </nav>
        </div>
      </aside>

      <div className="app-topbar">
        <div className="topbar-panel">
          {topbarItems.map((item) => (
            <Link
              className={`toolbar-link ${item.match(pathname) ? "active" : ""}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link
              className={`toolbar-link ${pathname.startsWith("/admin/reports") ? "active" : ""}`}
              href="/admin/reports"
            >
              Moderation
            </Link>
          ) : null}
        </div>

        <div className="topbar-panel toolbar-user">
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
                <button className="toolbar-button" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className="toolbar-link" href="/sign-up">
                Create account
              </Link>
              <Link className="primary-btn" href="/sign-in">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
