"use client";

import dynamic from "next/dynamic";
import { Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ScorePanelProps } from "@/components/games/score-panel";

function ScorePanelFallback() {
  return (
    <div className="rounded-[1.6rem] border border-base-300/15 bg-white/40 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-kicker before:w-4">Leaderboard</p>
          <h3 className="display-font text-2xl font-semibold">
            Verified best runs
          </h3>
        </div>
        <Trophy className="size-6 text-secondary" />
      </div>

      <p className="mt-4 text-sm leading-7 text-base-content/78">
        Leaderboard data loads once this panel gets near view so the game board
        can finish booting first.
      </p>

      <div className="mt-5 space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-[4.7rem] animate-pulse rounded-[1.3rem] border border-base-300/15 bg-base-100/65"
          />
        ))}
      </div>
    </div>
  );
}

const DeferredScorePanel = dynamic(
  () =>
    import("@/components/games/score-panel").then(
      (module) => module.ScorePanel,
    ),
  {
    ssr: false,
    loading: () => <ScorePanelFallback />,
  },
);

export function LazyScorePanel(props: ScorePanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) {
      return;
    }

    const container = containerRef.current;

    if (!container || typeof IntersectionObserver === "undefined") {
      const rafId = window.requestAnimationFrame(() => {
        setShouldLoad(true);
      });

      return () => {
        window.cancelAnimationFrame(rafId);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "280px 0px",
      },
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [shouldLoad]);

  return (
    <div ref={containerRef}>
      {shouldLoad ? <DeferredScorePanel {...props} /> : <ScorePanelFallback />}
    </div>
  );
}