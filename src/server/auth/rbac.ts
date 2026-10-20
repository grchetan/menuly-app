export type UserRole = "SUPER_ADMIN" | "RESTAURANT_OWNER" | "STAFF";

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN" as const,
  RESTAURANT_OWNER: "RESTAURANT_OWNER" as const,
  STAFF: "STAFF" as const,
};

/**
 * Validates if the given user role satisfies one of the required roles.
 */
export function hasRole(userRole: string, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole as UserRole);
}

/**
 * Validates if a user can access/modify a specific restaurant resource.
 * - SUPER_ADMIN can manage any restaurant.
 * - RESTAURANT_OWNER can only manage their own restaurant.
 */
export function canManageRestaurant(
  userRole: UserRole,
  userId: string,
  restaurantOwnerId?: string | null
): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  if (userRole === "RESTAURANT_OWNER" && restaurantOwnerId === userId) return true;
  return false;
}

/**
 * Enforce role assignment safety:
 * NEVER allow public signup or unprivileged updates to assign SUPER_ADMIN.
 */
export function sanitizePublicRole(requestedRole?: string): UserRole {
  // Public signups are ALWAYS RESTAURANT_OWNER. Any other requested role is strictly ignored.
  return "RESTAURANT_OWNER";
}
