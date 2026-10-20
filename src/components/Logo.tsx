import { QrCode } from "lucide-react";
import { APP_NAME } from "@/lib/config";

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <QrCode className="size-4" />
      </span>
      {!small && <span className="font-display text-xl font-semibold">{APP_NAME}</span>}
    </span>
  );
}
