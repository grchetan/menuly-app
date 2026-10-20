import { createServerFn } from "@tanstack/react-start";
import { getPublicRestaurantMenu } from "../server/restaurant/service";
import type { FullMenu } from "./restaurant";

export const getPublicMenu = createServerFn({ method: "GET" })
  .validator((slug: string) => {
    if (typeof slug !== "string" || slug.length > 80) throw new Error("Invalid slug");
    return slug.toLowerCase().trim();
  })
  .handler(async ({ data: slug }): Promise<FullMenu | null> => {
    try {
      const menu = await getPublicRestaurantMenu(slug);
      if (!menu) return null;
      return {
        restaurant: menu.restaurant as unknown as FullMenu["restaurant"],
        categories: menu.categories as unknown as FullMenu["categories"],
        items: menu.items as unknown as FullMenu["items"],
      };
    } catch (err) {
      console.error("[getPublicMenu Error]", err);
      return null;
    }
  });
