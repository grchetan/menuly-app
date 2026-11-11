import { cn } from "@/lib/utils";

interface GeminiIconProps {
  className?: string;
  size?: number;
}

/**
 * Authentic Google Gemini 4-Point Star logo with official Google AI gradient.
 */
export function GeminiIcon({ className, size = 18 }: GeminiIconProps) {
  const gradientId = "gemini-star-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <path
        d="M12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24Z"
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1E88E5" />
          <stop offset="35%" stopColor="#7E57C2" />
          <stop offset="70%" stopColor="#EC407A" />
          <stop offset="100%" stopColor="#FFA726" />
        </linearGradient>
      </defs>
    </svg>
  );
}
