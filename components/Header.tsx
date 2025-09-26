"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

type Props = { initialLoggedIn?: boolean };

export default function Header({ initialLoggedIn = false }: Props) {
  const [loggedIn, setLoggedIn] = useState<boolean>(initialLoggedIn);
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setLoggedIn(false);
    window.location.href = "/";
  }

  const onSignin = pathname === "/signin";
  const onSignup = pathname === "/signup";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="font-semibold">राम नाम जप 🙏</Link>

        <nav className="flex items-center gap-2">
          {loggedIn ? (
            <>
              <Link href="/jap" className="btn-outline">Open Jap</Link>
              <button onClick={handleLogout} className="btn">Sign out</button>
            </>
          ) : (
            <>
              {!onSignin && <Link href="/signin" className="btn-outline">Sign in</Link>}
              {!onSignup && <Link href="/signup" className="btn">Sign up</Link>}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
