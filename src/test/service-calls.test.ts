import { describe, it, expect } from "vitest";
import {
  requestServiceCall,
  getPendingServiceCalls,
  resolveServiceCall,
} from "../server/orders/service-calls";

describe("Restaurant Waiter Service Bell Engine", () => {
  const restaurantId = "rest-test-bell-" + Date.now();

  it("registers a new waiter call for Table #3", () => {
    const res = requestServiceCall({
      restaurantId,
      tableNumber: "3",
      reason: "waiter",
    });

    expect(res.success).toBe(true);
    expect(res.call.tableNumber).toBe("3");
    expect(res.call.reason).toBe("waiter");
    expect(res.call.status).toBe("PENDING");
  });

  it("prevents rapid duplicate calls from the same table", () => {
    const resDuplicate = requestServiceCall({
      restaurantId,
      tableNumber: "3",
      reason: "waiter",
    });

    expect(resDuplicate.success).toBe(true);
    expect(resDuplicate.isDuplicate).toBe(true);
  });

  it("allows different service reasons (e.g. water) from same table", () => {
    const resWater = requestServiceCall({
      restaurantId,
      tableNumber: "3",
      reason: "water",
      customNotes: "Cold water please",
    });

    expect(resWater.success).toBe(true);
    expect(resWater.call.reason).toBe("water");
    expect(resWater.call.customNotes).toBe("Cold water please");
    expect(resWater.isDuplicate).toBe(false);
  });

  it("retrieves all pending service calls for the restaurant", () => {
    const pending = getPendingServiceCalls(restaurantId);
    expect(pending.length).toBeGreaterThanOrEqual(2);
    expect(pending.some((c) => c.tableNumber === "3" && c.reason === "water")).toBe(true);
  });

  it("resolves and marks a service call as ATTENDED", () => {
    const pendingBefore = getPendingServiceCalls(restaurantId);
    const targetCall = pendingBefore[0]!;

    const ok = resolveServiceCall(restaurantId, targetCall.id);
    expect(ok).toBe(true);

    const pendingAfter = getPendingServiceCalls(restaurantId);
    expect(pendingAfter.some((c) => c.id === targetCall.id)).toBe(false);
  });
});
