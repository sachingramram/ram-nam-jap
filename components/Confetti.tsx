// components/Confetti.tsx
"use client";

import { useEffect, useState } from "react";

export default function Confetti({ trigger }: { trigger: number }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (trigger > 0) {
      setActive(true);
      const t = setTimeout(() => setActive(false), 2000);
      return () => clearTimeout(t);
    }
  }, [trigger]);

  if (!active) return null;

  // simple emoji burst
  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
      <div className="animate-ping text-7xl">🎉</div>
      <div className="absolute top-10 left-10 animate-bounce text-4xl">🙏</div>
      <div className="absolute bottom-10 right-10 animate-bounce text-4xl delay-100">🎊</div>
      <div className="absolute top-1/2 left-1/4 animate-bounce text-5xl delay-200">🌟</div>
    </div>
  );
}
