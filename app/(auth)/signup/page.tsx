"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      // redirect to signin and hide Sign up button automatically (Header hides it on /signin)
      router.push("/signin");
    } else {
      setMsg(data?.error ?? "Failed");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-4 text-xl font-semibold">Create account</h2>
      <form onSubmit={onSubmit} className="card grid gap-3">
        <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn" disabled={loading}>{loading ? "Please wait..." : "Sign up"}</button>
      </form>
      {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
    </div>
  );
}
