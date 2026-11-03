"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Layers3, ArrowRight, Check } from "lucide-react";
import { errorMessage, useAuthenticateMutation } from "@/store/api";
export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [authenticate, { isLoading }] = useAuthenticateMutation();
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <main className="auth">
      <section className="auth-story">
        <div className="brand">
          <Layers3 /> forma<span> / project manager</span>
        </div>
        <div>
          <p className="eyebrow">MAKE ROOM FOR YOUR BEST WORK</p>
          <h1>
            A little structure.
            <br />A lot of progress.
          </h1>
          <p>
            Your projects, priorities, and next steps.
            <br />
            All in one calm place.
          </p>
          <div className="story-card">
            <span className="badge">IN FOCUS</span>
            <h3>Big ideas start with small steps.</h3>
            {[
              "Give your ideas a home",
              "Turn plans into clear tasks",
              "Celebrate every little win",
            ].map((x) => (
              <p key={x}>
                <Check size={16} /> {x}
              </p>
            ))}
          </div>
        </div>
        <small>Built for focus. Made for you.</small>
      </section>
      <section className="auth-panel">
        <div className="auth-form">
          <span className="eyebrow">YOUR PERSONAL WORKSPACE</span>
          <h2>
            {mode === "login" ? "Welcome back." : "Make space for progress."}
          </h2>
          <p className="muted">
            {mode === "login"
              ? "Log in and pick up where you left off."
              : "Create your account to start organizing your work."}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              const data = new FormData(e.currentTarget);
              try {
                await authenticate({
                  mode,
                  email: String(data.get("email")),
                  password: String(data.get("password")),
                }).unwrap();
                router.replace("/projects");
              } catch (err) {
                setError(errorMessage(err));
              }
            }}
          >
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                maxLength={254}
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="At least 8 characters"
                minLength={8}
                maxLength={72}
                required
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="primary wide" disabled={isLoading}>
              {isLoading
                ? "Please wait…"
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-switch">
            {mode === "login" ? "New to Forma?" : "Already have an account?"}{" "}
            <Link href={mode === "login" ? "/signup" : "/login"}>
              {mode === "login" ? "Create an account" : "Log in"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
