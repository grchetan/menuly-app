import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/menu/")({
  loader: () => {
    // Redirect to home if accessed directly without a restaurant slug
    throw redirect({ to: "/" });
  },
  component: () => null,
});
