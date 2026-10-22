import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/shipping-delivery")({
  beforeLoad: () => {
    throw redirect({ to: "/shipping" });
  },
});
