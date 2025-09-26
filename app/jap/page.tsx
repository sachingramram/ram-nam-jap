// app/jap/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CountBar from "@/components/CountBar";
import Confetti from "@/components/Confetti";
import { formatNumber } from "@/lib/number";

const GOAL = 10_000_000; // 1 crore
const SAVE_INTERVAL_MS = 500;

type ProgressPayload = { mantra: string; count: number } | null;

/** Split into letter tokens (handles Latin + Devanagari) */
function tokenizeLettersLower(s: string): string[] {
  return (s.match(/\p{L}+/gu) ?? []).map((t) => t.toLowerCase());
}

/** Canonicalize so “राम” ~ “ram/raam/rama/श्रीराम” → "ram" */
function canonToken(raw: string): string {
  let s = raw.normalize("NFKD").toLowerCase();
  s = s.replace(/\p{M}+/gu, ""); // strip combining marks

  // If Devanagari present, map common forms to "ram"
  if (/[\u0900-\u097F]/.test(s)) {
    if (s.includes("श्रीराम")) return "ram";
    if (s.includes("राम")) return "ram";
    // fallback: keep letters only
    s = s.replace(/[^a-z\u0900-\u097F]/g, "");
  }

  // Latin side: keep letters
  let latin = s.replace(/[^a-z]/g, "");
  // collapse long vowels: raam -> ram
  latin = latin.replace(/aa/g, "a");
  // drop trailing 'a': rama -> ram
  latin = latin.replace(/a+$/g, "");
  return latin;
}

/** Web Speech ctor (Chrome/Edge). */
function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & typeof globalThis & {
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type PermissionNameMicrophone = "microphone";
interface NavigatorWithPermissions {
  permissions?: { query: (p: { name: PermissionNameMicrophone }) => Promise<PermissionStatus> };
}

/** Ask for mic, then query Permissions API if available. */
async function ensureMicPermission(): Promise<"granted" | "denied" | "prompt"> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    /* user might deny; we’ll still query below */
  }
  try {
    const q = await (navigator as unknown as NavigatorWithPermissions).permissions?.query({
      name: "microphone",
    });
    return q?.state ?? "prompt";
  } catch {
    return "prompt";
  }
}

export default function JapPage() {
  // Visible mantra defaults to Hindi
  const [mantra, setMantra] = useState<string>("राम");
  const [count, setCount] = useState<number>(0);

  // Mic/debug state
  const [listening, setListening] = useState<boolean>(false);
  const [micStatus, setMicStatus] = useState<string>("Idle");
  const [micError, setMicError] = useState<string>("");
  const [lastHeard, setLastHeard] = useState<string>("");

  // Milestones
  const [milestoneTrigger, setMilestoneTrigger] = useState<number>(0);

  // Client-only support check to avoid hydration mismatch
  const [mounted, setMounted] = useState<boolean>(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState<boolean | null>(null);

  // Derived
  const targetCanon = useMemo(() => canonToken(mantra.trim()), [mantra]);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const blockedRef = useRef<boolean>(false);
  const lastSavedRef = useRef<number>(Date.now());
  const visibilityBoundRef = useRef<boolean>(false);

  // Determine support on mount (client-only)
  useEffect(() => {
    setMounted(true);
    setHasSpeechSupport(getSpeechRecognitionCtor() !== null);
  }, []);

  // Load initial progress
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/progress", { method: "GET", cache: "no-store", credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as ProgressPayload;
        if (alive && data) {
          setMantra(data.mantra);
          setCount(data.count);
        }
      } catch {
        /* noop */
      }
    })();
    return () => { alive = false; };
  }, []);

  // Periodic save
  useEffect(() => {
    const t = window.setInterval(() => { void saveProgress(); }, SAVE_INTERVAL_MS);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mantra, count]);

  async function saveProgress(): Promise<void> {
    const now = Date.now();
    if (now - lastSavedRef.current < 5_000) return;
    lastSavedRef.current = now;
    try {
      await fetch("/api/progress", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ mantra, count })
      });
    } catch { /* transient errors ignored */ }
  }

  // Counting
  function addCount(n: number): void {
    // Immediate visual update
    setCount((prev) => {
      const next = Math.min(GOAL, prev + n);
      const prevLakh = Math.floor(prev / 100_000);
      const nextLakh = Math.floor(next / 100_000);
      if (nextLakh > prevLakh && next > 0) setMilestoneTrigger((v) => v + 1);
      return next;
    });
  }
  function handleTap(): void { addCount(1); }

  // Mic helpers
  function clearRestartTimer(): void {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }
  function scheduleRestart(delayMs = 250): void {
    clearRestartTimer();
    restartTimerRef.current = window.setTimeout(() => {
      if (!blockedRef.current) {
        try {
          recognitionRef.current?.start();
          setMicStatus("Restarting…");
        } catch { /* double start */ }
      }
    }, delayMs);
  }

  async function startListening(): Promise<void> {
    blockedRef.current = false;
    setMicError("");
    setLastHeard("");

    if (!window.isSecureContext) {
      setMicError("Mic needs HTTPS (or localhost).");
      alert("Microphone requires HTTPS (or localhost).");
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setMicError("Speech recognition not supported on this browser.");
      alert("Speech recognition isn’t supported on this browser. Use Tap to count.");
      return;
    }

    const perm = await ensureMicPermission();
    if (perm === "denied") {
      setMicError("Microphone permission denied in browser settings.");
      alert("Microphone permission is denied. Please allow mic access.");
      return;
    }

    if (!recognitionRef.current) {
      const r = new Ctor();
      r.lang = "hi-IN";           // Hindi preferred
      r.continuous = true;
      r.interimResults = false;
      // Try multiple alternatives (helps with short utterances)
      try { (r as unknown as { maxAlternatives?: number }).maxAlternatives = 5; } catch { /* optional */ }

      // Use addEventListener to avoid missing properties in shims
      r.addEventListener("start", () => { setMicStatus("Listening"); setListening(true); });

      r.onresult = (e: SpeechRecognitionEvent) => {
        let hitsTotal = 0;

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];

          // Track a representative transcript for debug
          const topAlt = res[0];
          const topText = (topAlt?.transcript ?? "").trim();
          if (topText) setLastHeard(topText);

          // Compute the MAX matches across alternatives for this result (avoid double counting)
          let bestHitsForResult = 0;
          for (let j = 0; j < res.length; j++) {
            const alt = res[j];
            const phrase = (alt?.transcript ?? "").trim();
            if (!phrase) continue;

            const tokens = tokenizeLettersLower(phrase);
            if (tokens.length === 0) continue;

            let localHits = 0;
            for (const t of tokens) {
              if (canonToken(t) === targetCanon) localHits++;
            }
            if (localHits > bestHitsForResult) bestHitsForResult = localHits;
          }

          hitsTotal += bestHitsForResult;
        }

        if (hitsTotal > 0) {
          // ✅ IMMEDIATE UI UPDATE
          addCount(hitsTotal);
        }
      };

      r.onerror = (_ev: SpeechRecognitionErrorEvent) => {
        setMicStatus("Error");
        setMicError("recognition error");
        if (!blockedRef.current) scheduleRestart(500);
      };

      r.onend = () => {
        setMicStatus("Ended");
        if (!blockedRef.current) scheduleRestart(200);
      };

      // Pause when tab hidden; resume when visible
      if (!visibilityBoundRef.current) {
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            try { r.stop(); } catch {}
          } else if (!blockedRef.current) {
            scheduleRestart(200);
          }
        });
        visibilityBoundRef.current = true;
      }

      recognitionRef.current = r;
    }

    try {
      recognitionRef.current.start();
      setMicStatus("Starting…");
      setListening(true);
    } catch {
      setMicStatus("Retrying…");
      scheduleRestart(250);
    }
  }

  function stopListening(): void {
    blockedRef.current = true;
    clearRestartTimer();
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
    setMicStatus("Stopped");
    void saveProgress();
  }

  return (
    <section className="grid gap-6">
      <Confetti trigger={milestoneTrigger} />

      <div className="card grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Jap Counter</h2>
            <p className="text-sm text-neutral-600">Tap</p>
          </div>
           
        </div>

        <label className="text-sm font-medium">Mantra</label>
        <input
          className="input"
          value={mantra}
          onChange={(e) => setMantra(e.target.value)}
          placeholder='e.g., "राम" or "Ram"'
        />

        <CountBar count={count} goal={GOAL} />

    
<div className="fixed inset-0 flex items-end justify-center pb-16">
  <button
    style={{
      fontSize: "3rem",
      padding: "2rem 5rem",
      borderRadius: "2rem",
      fontWeight: "bold",
    }}
    className="btn"
    onClick={handleTap}
  >
    Tap +1
  </button>
</div>


        <p className="text-sm text-neutral-700">
          Current Mantra: <b>{mantra}</b> • Total: <b>{formatNumber(count)}</b> • Goal: <b>{formatNumber(GOAL)}</b>
        </p>

        {/* Live mic debug (client-only to avoid hydration mismatch) */}
        <div className="text-xs text-neutral-600">
          <div>Status: <b>{micStatus}</b>{micError ? ` — ${micError}` : ""}</div>
          {lastHeard && <div>Last heard: “{lastHeard}”</div>}
          {mounted && hasSpeechSupport === false && (
            <div className="text-red-600">Speech recognition not supported here. Use Chrome/Edge or Tap.</div>
          )}
        </div>

        {/* Fallback message also client-only */}
        {mounted && hasSpeechSupport === false && (
          <p className="text-sm text-neutral-600">
            Speech recognition isn’t supported on this browser. Use the Tap buttons to count.
          </p>
        )}
      </div>
    </section>
  );
}
