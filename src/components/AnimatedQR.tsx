import { cn } from "@/lib/utils";

// Decorative QR with a scanning beam. Deterministic pattern so SSR and client match.
const N = 21;
const finder = (x: number, y: number) =>
  (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
const cells: { x: number; y: number; d: number }[] = [];
for (let y = 0; y < N; y++)
  for (let x = 0; x < N; x++) {
    if (finder(x, y)) continue;
    if ((x * 7 + y * 13 + x * y) % 3 === 0) cells.push({ x, y, d: ((x + y) % 10) * 0.18 });
  }

export function AnimatedQR({ className }: { className?: string }) {
  return (
    <div className={cn("relative aspect-square overflow-hidden rounded-2xl bg-card p-3 shadow-lift", className)}>
      <svg viewBox={`0 0 ${N} ${N}`} className="size-full text-primary" aria-hidden>
        {([[0, 0], [N - 7, 0], [0, N - 7]] as const).map(([x, y]) => (
          <g key={`${x}-${y}`} fill="currentColor">
            <path d={`M${x} ${y}h7v7h-7z M${x + 1} ${y + 1}v5h5v-5z`} fillRule="evenodd" />
            <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.6} />
          </g>
        ))}
        {cells.map((c) => (
          <rect key={`${c.x}-${c.y}`} x={c.x + 0.1} y={c.y + 0.1} width={0.8} height={0.8} rx={0.25}
            fill="currentColor" className="animate-qr-pop" style={{ animationDelay: `${c.d}s` }} />
        ))}
      </svg>
      <span className="bg-scanline animate-scan absolute inset-x-3 h-0.5 rounded-full" />
    </div>
  );
}
