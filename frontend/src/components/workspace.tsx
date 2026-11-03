"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Layers3, LayoutGrid, LogOut, ArrowUpRight } from "lucide-react";
import { api, useLogoutMutation, useMeQuery } from "@/store/api";
export default function Workspace({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error, refetch } = useMeQuery();
  const [logout, state] = useLogoutMutation();
  const router = useRouter();
  const dispatch = useDispatch();
  const unauthorized = error && "status" in error && error.status === 401;
  useEffect(() => {
    if (unauthorized) router.replace("/login");
  }, [unauthorized, router]);
  if (isLoading || unauthorized)
    return <div className="loading">Opening your workspace…</div>;
  if (!user)
    return (
      <div className="loading">
        <p>We couldn’t reach your workspace.</p>
        <button onClick={refetch}>Try again</button>
      </div>
    );
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Link href="/projects" className="brand">
          <Layers3 /> forma<span className="brand-dot">.</span>
        </Link>
        <p className="nav-caption">WORKSPACE</p>
        <Link className="nav-link" href="/projects">
          <LayoutGrid size={18} />
          My projects
          <ArrowUpRight size={15} />
        </Link>
        <div className="sidebar-note">
          <span>ONE STEP AT A TIME</span>
          <p>
            Good work starts
            <br />
            with a clear plan.
          </p>
          <div className="note-line" />
        </div>
        <div className="account">
          <div className="avatar">{user.email.charAt(0).toUpperCase()}</div>
          <div>
            <strong>Personal workspace</strong>
            <small title={user.email}>{user.email}</small>
          </div>
          <button
            aria-label="Log out"
            className="icon-button"
            disabled={state.isLoading}
            onClick={async () => {
              try {
                await logout().unwrap();
                dispatch(api.util.resetApiState());
                router.replace("/login");
              } catch {
                window.alert("Logout failed. Please try again.");
              }
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span>
            Personal workspace <span className="slash">/</span>{" "}
            <strong>Projects</strong>
          </span>
          <span className="private-label">
            <span />
            Private workspace
          </span>
        </header>
        <main className="content">{children}</main>
        <footer>
          A little more organized. A little closer to done.
          <span>FORMA / MINI PROJECT MANAGER</span>
        </footer>
      </div>
    </div>
  );
}
