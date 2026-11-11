/**
 * In-Memory High-Speed Service Bell & Waiter Call Store for Restaurants
 * 
 * Provides sub-millisecond alerting for customer waiter calls, water requests, and bill requests
 * without adding heavy database locks or polling delays.
 */

export type ServiceCallReason = "waiter" | "water" | "bill" | "cutlery" | "assistance";

export interface ServiceCall {
  id: string;
  restaurantId: string;
  tableNumber: string;
  reason: ServiceCallReason;
  customNotes?: string | undefined;
  status: "PENDING" | "ATTENDED";
  createdAt: string;
  attendedAt?: string | undefined;
}

// In-memory registry of active service calls keyed by restaurant ID
const serviceCallsRegistry = new Map<string, ServiceCall[]>();
// Set of call IDs permanently resolved/attended across recent requests
const resolvedCallIds = new Set<string>();

/**
 * Creates a new waiter / service call for a restaurant table.
 */
export function requestServiceCall(params: {
  restaurantId: string;
  tableNumber: string;
  reason?: ServiceCallReason;
  customNotes?: string;
}): { success: boolean; call: ServiceCall; isDuplicate?: boolean } {
  const restaurantId = params.restaurantId;
  const tableNumber = String(params.tableNumber || "1").trim();
  const reason = params.reason || "waiter";
  const now = new Date();

  const calls = serviceCallsRegistry.get(restaurantId) || [];

  // Check if identical pending call already exists from the same table in last 60 seconds (anti-spam)
  const existingPending = calls.find(
    (c) =>
      c.tableNumber.toLowerCase() === tableNumber.toLowerCase() &&
      c.status === "PENDING" &&
      !resolvedCallIds.has(c.id) &&
      c.reason === reason &&
      Date.now() - new Date(c.createdAt).getTime() < 60 * 1000
  );

  if (existingPending) {
    return { success: true, call: existingPending, isDuplicate: true };
  }

  const newCall: ServiceCall = {
    id: `CALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    restaurantId,
    tableNumber,
    reason,
    customNotes: params.customNotes?.trim() || undefined,
    status: "PENDING",
    createdAt: now.toISOString(),
  };

  // Keep only calls from last 2 hours
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const freshCalls = calls.filter((c) => new Date(c.createdAt).getTime() > twoHoursAgo);
  freshCalls.unshift(newCall);

  serviceCallsRegistry.set(restaurantId, freshCalls);

  return { success: true, call: newCall, isDuplicate: false };
}

/**
 * Gets all pending service calls for a restaurant.
 */
export function getPendingServiceCalls(restaurantId: string): ServiceCall[] {
  const calls = serviceCallsRegistry.get(restaurantId) || [];
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  return calls.filter(
    (c) =>
      c.status === "PENDING" &&
      !resolvedCallIds.has(c.id) &&
      new Date(c.createdAt).getTime() > twoHoursAgo
  );
}

/**
 * Marks a service call as ATTENDED.
 */
export function resolveServiceCall(restaurantId: string, callId: string): boolean {
  resolvedCallIds.add(callId);
  const calls = serviceCallsRegistry.get(restaurantId);
  if (!calls) return true;

  const target = calls.find((c) => c.id === callId);
  if (target) {
    target.status = "ATTENDED";
    target.attendedAt = new Date().toISOString();
  }

  return true;
}
