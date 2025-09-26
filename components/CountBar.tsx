// components/CountBar.tsx
import React from "react";
import { formatNumber } from "@/lib/number";

type Props = {
  count: number;
  goal: number;
};

export default function CountBar({ count, goal }: Props) {
  const pct = Math.min(100, Math.floor((count / goal) * 100));
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-neutral-600">
        <span>Progress</span>
        <span>{pct}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full bg-neutral-900 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-neutral-700">
        {formatNumber(count)} / {formatNumber(goal)}
      </p>
    </div>
  );
}
