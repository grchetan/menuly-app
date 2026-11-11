import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../server/db";
import {
  createOrder,
  getOrderById,
  getRestaurantOrders,
  updateOrderStatus,
  getRestaurantOrderStats,
} from "../server/orders/service";

describe("Table-Wise Dine-In Order Engine & POS Suite", () => {
  let restaurantId: string;
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    // Pick an existing restaurant or create a minimal one for testing
    let r = await prisma.restaurant.findFirst({ select: { id: true, slug: true } });
    if (!r) {
      r = await prisma.restaurant.create({
        data: {
          name: "Vitest Test Bistro",
          slug: "vitest-test-bistro-" + Date.now(),
        },
        select: { id: true, slug: true },
      });
    }
    restaurantId = r.id;
  });

  afterAll(async () => {
    if (createdOrderIds.length > 0) {
      await prisma.order.deleteMany({
        where: { id: { in: createdOrderIds } },
      }).catch(() => {});
    }
  });

  it("fails when placing an empty order", async () => {
    const res = await createOrder({
      restaurantId,
      tableNumber: "5",
      items: [],
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/empty order/i);
  });

  it("successfully creates a table dine-in order and generates receipt number", async () => {
    const res = await createOrder({
      restaurantId,
      tableNumber: "Table 4",
      customerName: "Aman Sharma",
      customerPhone: "9876543210",
      notes: "Extra spicy, no garlic",
      items: [
        { id: "dish-1", name: "Paneer Butter Masala", price: 280, quantity: 2 },
        { id: "dish-2", name: "Butter Naan", price: 40, quantity: 4 },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.order).toBeDefined();
    const order = res.order!;
    createdOrderIds.push(order.id);

    expect(order.orderNumber).toMatch(/^#MN-\d{4}$/);
    expect(order.tableNumber).toBe("Table 4");
    expect(order.customerName).toBe("Aman Sharma");
    expect(order.totalItems).toBe(6);
    expect(order.grandTotal).toBe(280 * 2 + 40 * 4); // 560 + 160 = 720
    expect(order.status).toBe("PENDING");
  });

  it("fetches orders filtered by restaurant and table number", async () => {
    // Add another order on Table 7
    const res = await createOrder({
      restaurantId,
      tableNumber: "Table 7",
      items: [{ id: "dish-3", name: "Veg Biryani", price: 220, quantity: 1 }],
    });
    if (res.order) createdOrderIds.push(res.order.id);

    const allOrders = await getRestaurantOrders({ restaurantId });
    expect(allOrders.length).toBeGreaterThanOrEqual(2);

    const table4Orders = await getRestaurantOrders({
      restaurantId,
      tableNumber: "Table 4",
    });
    expect(table4Orders.every((o) => o.tableNumber === "Table 4")).toBe(true);
  });

  it("updates order workflow status (PENDING -> PREPARING -> SERVED -> COMPLETED)", async () => {
    const created = await createOrder({
      restaurantId,
      tableNumber: "Table 2",
      items: [{ id: "dish-4", name: "Cold Coffee", price: 120, quantity: 1 }],
    });

    expect(created.order).toBeDefined();
    const orderId = created.order!.id;
    createdOrderIds.push(orderId);

    // Transition to PREPARING
    const prepRes = await updateOrderStatus({
      orderId,
      restaurantId,
      status: "PREPARING",
    });
    expect(prepRes.success).toBe(true);
    expect(prepRes.order?.status).toBe("PREPARING");

    // Transition to SERVED
    const servedRes = await updateOrderStatus({
      orderId,
      restaurantId,
      status: "SERVED",
    });
    expect(servedRes.success).toBe(true);
    expect(servedRes.order?.status).toBe("SERVED");

    // Transition to COMPLETED with payment
    const compRes = await updateOrderStatus({
      orderId,
      restaurantId,
      status: "COMPLETED",
      paymentStatus: "PAID_AT_COUNTER",
    });
    expect(compRes.success).toBe(true);
    expect(compRes.order?.status).toBe("COMPLETED");
    expect(compRes.order?.paymentStatus).toBe("PAID_AT_COUNTER");
  }, 20000);

  it("supports order cancellation with specific reason and lookup by orderNumber", async () => {
    const created = await createOrder({
      restaurantId,
      tableNumber: "Table 9",
      customerName: "Pooja Verma",
      customerPhone: "9179878521",
      items: [{ id: "dish-5", name: "Masala Dosa", price: 150, quantity: 1 }],
    });

    expect(created.order).toBeDefined();
    const orderNumber = created.order!.orderNumber;
    createdOrderIds.push(created.order!.id);

    // Cancel using orderNumber instead of id
    const cancelRes = await updateOrderStatus({
      orderId: orderNumber,
      restaurantId,
      status: "CANCELLED",
      cancelReason: "Item out of stock",
    });

    expect(cancelRes.success).toBe(true);
    expect(cancelRes.order?.status).toBe("CANCELLED");
    expect(cancelRes.order?.cancelReason).toBe("Item out of stock");

    // Fetch stats and verify breakdown and recentCancelled
    const stats = await getRestaurantOrderStats(restaurantId);
    expect(stats.cancelledCount).toBeGreaterThanOrEqual(1);
    expect(stats.recentCancelled.some((c) => c.orderNumber === orderNumber)).toBe(true);
    expect(stats.dailyBreakdown.length).toBe(7);
  });

  it("calculates live restaurant order stats accurately", async () => {
    const stats = await getRestaurantOrderStats(restaurantId);
    expect(stats).toBeDefined();
    expect(typeof stats.activeOrdersCount).toBe("number");
    expect(typeof stats.tablesActiveCount).toBe("number");
    expect(typeof stats.todaySales).toBe("number");
    expect(stats.todayOrdersCount).toBeGreaterThanOrEqual(3);
  });
});
