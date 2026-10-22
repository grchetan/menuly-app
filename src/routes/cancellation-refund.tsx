import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cancellation-refund")({
  beforeLoad: () => {
    throw redirect({ to: "/refund" });
  },
});
