
export const dynamic = "force-dynamic";
"use client";


import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SigninPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [loading, setLoading] = useState(false);

  // Field errors
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [globalMsg, setGlobalMsg] = useState<string>("");

  const sp = useSearchParams();
  const next = sp.get("next") || "/jap";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setEmailError("");
    setPasswordError("");
    setGlobalMsg("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));

    setLoading(false);

    if (res.ok && data?.ok) {
      // Full reload: SSR header picks cookie and shows Sign out
      window.location.href = next;
      return;
    }

    // Failure handling based on flags
    const emailExists: boolean = Boolean(data?.emailExists);
    const passwordValid: boolean = Boolean(data?.passwordValid);

    if (!emailExists) {
      // Email incorrect
      setEmailError("Email is incorrect.");
      // We can’t verify the password without a user; show both options
      setPasswordError("Password may also be incorrect.");
      setGlobalMsg("Both email and password seem incorrect. You can recover below.");
      return;
    }

    // Email exists; if password invalid
    if (!passwordValid) {
      setPasswordError("Password is incorrect.");
      setGlobalMsg("Enter correct credentials.");
      return;
    }

    // Fallback
    setGlobalMsg(data?.error ?? "Sign in failed");
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-4 text-xl font-semibold">Sign in</h2>

      <form onSubmit={onSubmit} className="card grid gap-3" noValidate>
        <div>
          <input
            className={`input ${emailError ? "border-red-500 focus:ring-red-600" : ""}`}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
            required
            aria-invalid={Boolean(emailError) || undefined}
            aria-describedby={emailError ? "email-error" : undefined}
          />
          {emailError && (
            <p id="email-error" className="mt-1 text-sm text-red-600">{emailError}</p>
          )}
        </div>

        <div>
          <input
            className={`input ${passwordError ? "border-red-500 focus:ring-red-600" : ""}`}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
            required
            aria-invalid={Boolean(passwordError) || undefined}
            aria-describedby={passwordError ? "password-error" : undefined}
          />
          {passwordError && (
            <p id="password-error" className="mt-1 text-sm text-red-600">{passwordError}</p>
          )}
        </div>

        <button className="btn" disabled={loading}>
          {loading ? "Please wait..." : "Sign in"}
        </button>
      </form>

      {globalMsg && (
        <p className="mt-3 text-sm font-medium text-red-600" aria-live="polite">
          {globalMsg}
        </p>
      )}

      {/* Contextual “forgot” helpers */}
      <div className="mt-3 text-sm text-neutral-700">
        {/* If both wrong (email not found => we show both) */}
        {emailError && passwordError ? (
          <p>
            <a className="underline" href="/forgot">Forgot email or password?</a>
          </p>
        ) : emailError ? (
          <p>
            Can’t remember your email? <a className="underline" href="/forgot">Recover email</a>
          </p>
        ) : passwordError ? (
          <p>
            Forgot your password? <a className="underline" href="/forgot">Reset password</a>
          </p>
        ) : (
          <p>
            <a className="underline" href="/forgot">Forgot email or password?</a>
          </p>
        )}
      </div>
    </div>
  );
}
