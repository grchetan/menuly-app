import React, { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnnouncementMarqueeProps {
  text?: string;
  enabled?: boolean;
  className?: string;
}

export function AnnouncementMarquee({
  text = "",
  enabled = true,
  className,
}: AnnouncementMarqueeProps) {
  const trimmed = text.trim();

  // If disabled or empty, do not render
  if (!enabled || !trimmed) {
    return null;
  }

  // Parse items split by common delimiters if present, or treat as a single repeating statement
  const items = useMemo(() => {
    let tokens = [trimmed];
    if (trimmed.includes("💥")) {
      tokens = trimmed.split("💥").map((t) => t.trim()).filter(Boolean);
    } else if (trimmed.includes("•")) {
      tokens = trimmed.split("•").map((t) => t.trim()).filter(Boolean);
    } else if (trimmed.includes("|")) {
      tokens = trimmed.split("|").map((t) => t.trim()).filter(Boolean);
    }

    // Ensure we have at least 4 items so short messages fill wide displays
    let repeated = [...tokens];
    while (repeated.length < 6) {
      repeated = [...repeated, ...tokens];
    }
    return repeated;
  }, [trimmed]);

  return (
    <div
      role="region"
      aria-label="Platform Announcement"
      className={cn(
        "relative w-full overflow-hidden bg-neutral-950 text-neutral-100 border-b border-white/10 select-none z-40 transition-all",
        "h-8 sm:h-9 flex items-center",
        className
      )}
    >
      {/* Left/right subtle fade overlays for edge elegance */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-neutral-950 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-neutral-950 to-transparent z-10" />

      {/* Scrolling Track (2 identical blocks for 100% seamless translateX(-50%) infinite scroll) */}
      <div
        className="marquee-track flex shrink-0 items-center whitespace-nowrap cursor-default"
        title="Hover to pause announcement"
      >
        {/* First Half */}
        <div className="flex shrink-0 items-center gap-6 sm:gap-10 px-4">
          {items.map((item, idx) => (
            <span
              key={`item-1-${idx}`}
              className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-semibold tracking-wide text-zinc-100"
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-amber-400/20 text-amber-400">
                <Sparkles className="size-2.5 sm:size-3 fill-amber-400 text-amber-400" />
              </span>
              <span>{item}</span>
            </span>
          ))}
        </div>

        {/* Second Half (Duplicate for seamless loop) */}
        <div
          aria-hidden="true"
          className="flex shrink-0 items-center gap-6 sm:gap-10 px-4"
        >
          {items.map((item, idx) => (
            <span
              key={`item-2-${idx}`}
              className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-semibold tracking-wide text-zinc-100"
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-amber-400/20 text-amber-400">
                <Sparkles className="size-2.5 sm:size-3 fill-amber-400 text-amber-400" />
              </span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
