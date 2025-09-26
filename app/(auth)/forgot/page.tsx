"use client";

import { useEffect, useState } from "react";

type Mode = "passwordOnly" | "emailOnly" | "both";

export default function ForgotPage() {
  const [mode, setMode] = useState<Mode>("passwordOnly");

  // Shared
  const [email, setEmail] = useState<string>(""); // used in passwordOnly check
  const [emailExists, setEmailExists] = useState<boolean | null>(null);

  // passwordOnly fields
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");

  // emailOnly fields
  const [newEmail, setNewEmail] = useState<string>("");
  const [confirmNewEmail, setConfirmNewEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // both fields
  const [bothNewEmail, setBothNewEmail] = useState<string>("");
  const [bothConfirmNewEmail, setBothConfirmNewEmail] = useState<string>("");
  const [bothNewPassword, setBothNewPassword] = useState<string>("");
  const [bothConfirmNewPassword, setBothConfirmNewPassword] = useState<string>("");

  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    setMsg(""); setErr("");
    setEmailExists(null);
    // clear per-mode fields
    setNewPassword(""); setConfirmNewPassword("");
    setNewEmail(""); setConfirmNewEmail(""); setPassword("");
    setBothNewEmail(""); setBothConfirmNewEmail(""); setBothNewPassword(""); setBothConfirmNewPassword("");
  }, [mode]);

  async function checkEmail() {
    setErr(""); setMsg("");
    if (!email) { setErr("Please enter your email"); return; }
    const res = await fetch("/api/auth/check-email", { method: "POST", body: JSON.stringify({ email }) });
    const data = await res.json();
    setEmailExists(Boolean(data?.exists));
    if (!data?.exists) {
      // If user chose passwordOnly but email doesn't exist, nudge to other modes
      setErr("Email not found. If you forgot your email, choose 'Forgot email' or 'Forgot both'.");
    }
  }

  async function submitPasswordOnly(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!emailExists) { setErr("Email not verified. Click 'Check Email' first."); return; }
    if (newPassword.length < 6) { setErr("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmNewPassword) { setErr("Passwords do not match."); return; }

    const res = await fetch("/api/auth/recovery", {
      method: "POST",
      body: JSON.stringify({ mode: "passwordOnly", email, newPassword })
    });
    const data = await res.json();
    if (res.ok && data?.ok) {
      setMsg("Password updated. Please sign in with your email and new password.");
    } else {
      setErr(data?.error ?? "Failed to update password.");
    }
  }

  async function submitEmailOnly(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!newEmail || newEmail !== confirmNewEmail) { setErr("New email fields must match."); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }

    const res = await fetch("/api/auth/recovery", {
      method: "POST",
      body: JSON.stringify({ mode: "emailOnly", newEmail, password })
    });
    const data = await res.json();
    if (res.ok && data?.ok) {
      setMsg("New account created with your email. You can sign in now.");
    } else {
      setErr(data?.error ?? "Failed to create account.");
    }
  }

  async function submitBoth(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!bothNewEmail || bothNewEmail !== bothConfirmNewEmail) { setErr("New email fields must match."); return; }
    if (bothNewPassword.length < 6) { setErr("New password must be at least 6 characters."); return; }
    if (bothNewPassword !== bothConfirmNewPassword) { setErr("Passwords do not match."); return; }

    const res = await fetch("/api/auth/recovery", {
      method: "POST",
      body: JSON.stringify({ mode: "both", newEmail: bothNewEmail, newPassword: bothNewPassword })
    });
    const data = await res.json();
    if (res.ok && data?.ok) {
      setMsg("New account created. Please sign in.");
    } else {
      setErr(data?.error ?? "Failed to create account.");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-4 text-xl font-semibold">Recover account</h2>

      {/* Mode selector */}
      <div className="card grid gap-2">
        <label className="text-sm font-medium">Select an option</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setMode("passwordOnly")}
            className={`btn-outline ${mode === "passwordOnly" ? "ring-2 ring-neutral-900" : ""}`}
          >
            Forgot password
          </button>
          <button
            type="button"
            onClick={() => setMode("emailOnly")}
            className={`btn-outline ${mode === "emailOnly" ? "ring-2 ring-neutral-900" : ""}`}
          >
            Forgot email
          </button>
          <button
            type="button"
            onClick={() => setMode("both")}
            className={`btn-outline ${mode === "both" ? "ring-2 ring-neutral-900" : ""}`}
          >
            Forgot both
          </button>
        </div>
      </div>

      {/* Forms per mode */}
      {mode === "passwordOnly" && (
        <form onSubmit={submitPasswordOnly} className="card mt-4 grid gap-3">
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailExists(null); setErr(""); setMsg(""); }}
              required
            />
            <button type="button" className="btn" onClick={checkEmail}>Check Email</button>
          </div>

          {/* Autofill + lock email display when exists */}
          {emailExists && (
            <>
              <p className="text-sm text-neutral-700">Email verified: <b>{email}</b></p>
              <input
                className="input"
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <input
                className="input"
                type="password"
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
              <button className="btn">Update Password</button>
            </>
          )}
        </form>
      )}

      {mode === "emailOnly" && (
        <form onSubmit={submitEmailOnly} className="card mt-4 grid gap-3">
          <input
            className="input"
            type="email"
            placeholder="New email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="email"
            placeholder="Confirm new email"
            value={confirmNewEmail}
            onChange={(e) => setConfirmNewEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password (you remember)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn">Create / Link Account</button>
        </form>
      )}

      {mode === "both" && (
        <form onSubmit={submitBoth} className="card mt-4 grid gap-3">
          <input
            className="input"
            type="email"
            placeholder="New email"
            value={bothNewEmail}
            onChange={(e) => setBothNewEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="email"
            placeholder="Confirm new email"
            value={bothConfirmNewEmail}
            onChange={(e) => setBothConfirmNewEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="New password"
            value={bothNewPassword}
            onChange={(e) => setBothNewPassword(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Confirm new password"
            value={bothConfirmNewPassword}
            onChange={(e) => setBothConfirmNewPassword(e.target.value)}
            required
          />
          <button className="btn">Create Account</button>
        </form>
      )}

      {err && <p className="mt-3 text-sm font-medium text-red-600">{err}</p>}
      {msg && <p className="mt-3 text-sm font-medium text-green-700">{msg}</p>}
    </div>
  );
}
