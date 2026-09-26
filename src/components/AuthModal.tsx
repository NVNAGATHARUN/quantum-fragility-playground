import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Atom, X } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { useDialogFocus } from "../hooks/useDialogFocus";

export function AuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal, login, signup } =
    useAuth();
  const [mode, setMode] = useState(authModalMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(isAuthModalOpen, ref, closeAuthModal);
  useEffect(() => {
    setMode(authModalMode);
    setError("");
  }, [authModalMode, isAuthModalOpen]);
  if (!isAuthModalOpen) return null;
  return (
    <div className="ql-modal-backdrop" onClick={closeAuthModal}>
      <div
        ref={ref}
        className="ql-auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="ql-auth-close ql-icon-button"
          aria-label="Close sign in"
          onClick={closeAuthModal}
        >
          <X size={19} />
        </button>
        <span className="ql-auth-mark">
          <Atom size={28} />
        </span>
        <p className="ql-eyebrow">YOUR QUANTUM JOURNEY</p>
        <h2 id="auth-title">
          {mode === "login"
            ? "Welcome back, explorer."
            : "Make room for discovery."}
        </h2>
        <p>Save your progress. Keep your curiosity going.</p>
        <div className="ql-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign in
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Create an account
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              if (mode === "login") await login(email, password);
              else await signup(email, password, name, "student");
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Could not connect. Please try again.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {mode === "signup" && (
            <label>
              Your name
              <input
                autoComplete="name"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we call you?"
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </label>
          {error && (
            <p className="ql-notice error" role="alert">
              {error}
            </p>
          )}
          <button
            className="ql-button ql-button-primary"
            disabled={busy}
            type="submit"
          >
            {busy
              ? "Connecting…"
              : mode === "login"
                ? "Continue your journey"
                : "Create your account"}
            <ArrowRight size={16} />
          </button>
        </form>
        <small>
          You can explore lessons and the circuit studio without an account.
        </small>
      </div>
    </div>
  );
}
