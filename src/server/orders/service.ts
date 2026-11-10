import { prisma } from "../db";
import { sanitizeText, sanitizePhone } from "../security/sanitize";

export type OrderStatus = "PENDING" | "PREPARING" | "SERVED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID_AT_COUNTER" | "PAID_ONLINE";

export interface OrderItemPayload {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isVeg?: boolean;
}

export interface CreateOrderParams {
  restaurantId?: string | undefined;
  slug?: string | undefined;
  tableNumber: string;
  customerName?: string | undefined;
  customerPhone?: string | undefined;
  notes?: string | undefined;
  items: OrderItemPayload[];
}

export interface StoredOrder {
  id: string;
  orderNumber: string;
  restaurantId: string;
  tableNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  cancelReason?: string | null | undefined;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
    isVeg: boolean;
  }>;
  totalItems: number;
  subtotal: number;
  tax: number;
  grandTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

// In-Memory Fallback Cache for resilient offline/local/high-throughput operations
const memoryOrders = new Map<string, StoredOrder>();

function extractCancelReason(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const match = notes.match(/\[Cancelled:\s*([^\]]+)\]/i);
  return match && match[1] ? match[1].trim() : null;
}

function generateOrderNumber(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `#MN-${randomSuffix}`;
}

export async function createOrder(params: CreateOrderParams): Promise<{
  success: boolean;
  status: number;
  error?: string;
  order?: StoredOrder;
}> {
  const { tableNumber, items, customerName, customerPhone, notes } = params;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return { success: false, status: 400, error: "Cannot place an empty order. Please select at least one dish." };
  }

  const cleanTable = (tableNumber || "Dine-In").trim().slice(0, 30);
  const cleanName = customerName ? sanitizeText(customerName, 80) : null;
  const cleanPhone = customerPhone ? sanitizePhone(customerPhone) : null;
  const cleanNotes = notes ? sanitizeText(notes, 300) : null;

  // Resolve restaurant by ID or slug
  let restaurant: { id: string; name: string; slug: string; isActive: boolean; phone?: string | null; whatsapp?: string | null } | null = null;
  try {
    if (params.restaurantId) {
      restaurant = await prisma.restaurant.findUnique({
        where: { id: params.restaurantId },
        select: { id: true, name: true, slug: true, isActive: true, phone: true, whatsapp: true },
      });
    } else if (params.slug) {
      restaurant = await prisma.restaurant.findUnique({
        where: { slug: params.slug },
        select: { id: true, name: true, slug: true, isActive: true, phone: true, whatsapp: true },
      });
    }
  } catch (err) {
    console.warn("[Orders] Database restaurant lookup failed, checking memory fallback:", err);
  }

  if (!restaurant && params.restaurantId) {
    restaurant = {
      id: params.restaurantId,
      name: "Restaurant",
      slug: params.slug || "restaurant",
      isActive: true,
    };
  }

  if (!restaurant) {
    return { success: false, status: 404, error: "Restaurant not found." };
  }

  // Calculate item totals safely
  let subtotal = 0;
  let totalItems = 0;
  const sanitizedItems = items.map((it) => {
    const qty = Math.max(1, Math.min(50, Math.floor(Number(it.quantity) || 1)));
    const price = Math.max(0, Number(it.price) || 0);
    const itemTotal = price * qty;
    subtotal += itemTotal;
    totalItems += qty;
    return {
      id: String(it.id || Math.random()),
      name: sanitizeText(it.name || "Dish", 100),
      price,
      quantity: qty,
      total: itemTotal,
      isVeg: it.isVeg !== false,
    };
  });

  const grandTotal = subtotal; // Taxes included by default
  const orderNumber = generateOrderNumber();
  const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const orderRecord: StoredOrder = {
    id: orderId,
    orderNumber,
    restaurantId: restaurant.id,
    tableNumber: cleanTable,
    customerName: cleanName,
    customerPhone: cleanPhone,
    notes: cleanNotes,
    items: sanitizedItems,
    totalItems,
    subtotal,
    tax: 0,
    grandTotal,
    status: "PENDING",
    paymentStatus: "UNPAID",
    paymentMethod: "COUNTER",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Attempt database persistence
  try {
    const saved = await prisma.order.create({
      data: {
        id: orderId,
        orderNumber,
        restaurantId: restaurant.id,
        tableNumber: cleanTable,
        customerName: cleanName,
        customerPhone: cleanPhone,
        notes: cleanNotes,
        items: sanitizedItems as any,
        totalItems,
        subtotal,
        tax: 0,
        grandTotal,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod: "COUNTER",
      },
    });

    orderRecord.id = saved.id;
    orderRecord.orderNumber = saved.orderNumber;
    orderRecord.createdAt = saved.createdAt.toISOString();
    orderRecord.updatedAt = saved.updatedAt.toISOString();
  } catch (dbErr) {
    console.warn("[Orders] Database save failed, cached in memory resilience layer:", dbErr);
  }

  // Always keep in memory cache for sub-millisecond retrieval & real-time polling
  memoryOrders.set(orderRecord.id, orderRecord);

  return {
    success: true,
    status: 201,
    order: orderRecord,
  };
}

export async function getOrderById(orderId: string): Promise<StoredOrder | null> {
  if (!orderId) return null;

  try {
    const dbOrder = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
    });
    if (dbOrder) {
      return {
        id: dbOrder.id,
        orderNumber: dbOrder.orderNumber,
        restaurantId: dbOrder.restaurantId,
        tableNumber: dbOrder.tableNumber,
        customerName: dbOrder.customerName,
        customerPhone: dbOrder.customerPhone,
        notes: dbOrder.notes,
        cancelReason: extractCancelReason(dbOrder.notes),
        items: Array.isArray(dbOrder.items) ? (dbOrder.items as any) : [],
        totalItems: dbOrder.totalItems,
        subtotal: Number(dbOrder.subtotal),
        tax: Number(dbOrder.tax),
        grandTotal: Number(dbOrder.grandTotal),
        status: dbOrder.status as OrderStatus,
        paymentStatus: dbOrder.paymentStatus as PaymentStatus,
        paymentMethod: dbOrder.paymentMethod,
        createdAt: dbOrder.createdAt.toISOString(),
        updatedAt: dbOrder.updatedAt.toISOString(),
      };
    }
  } catch (err) {
    console.warn("[Orders] Database lookup failed, falling back to memory:", err);
  }

  let mem = memoryOrders.get(orderId);
  if (!mem) {
    for (const o of memoryOrders.values()) {
      if (o.orderNumber === orderId) {
        mem = o;
        break;
      }
    }
  }
  return mem || null;
}

export async function getRestaurantOrders(params: {
  restaurantId: string;
  status?: string | undefined;
  tableNumber?: string | undefined;
  limit?: number | undefined;
}): Promise<StoredOrder[]> {
  const { restaurantId, status, tableNumber, limit = 100 } = params;

  try {
    const where: any = { restaurantId };
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (tableNumber && tableNumber !== "ALL") {
      where.tableNumber = tableNumber;
    }

    const dbOrders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });

    if (dbOrders.length > 0) {
      return dbOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        restaurantId: o.restaurantId,
        tableNumber: o.tableNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        notes: o.notes,
        cancelReason: extractCancelReason(o.notes),
        items: Array.isArray(o.items) ? (o.items as any) : [],
        totalItems: o.totalItems,
        subtotal: Number(o.subtotal),
        tax: Number(o.tax),
        grandTotal: Number(o.grandTotal),
        status: o.status as OrderStatus,
        paymentStatus: o.paymentStatus as PaymentStatus,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      }));
    }
  } catch (err) {
    console.warn("[Orders] Database list failed, falling back to memory:", err);
  }

  // Memory fallback
  const list = Array.from(memoryOrders.values())
    .filter((o) => o.restaurantId === restaurantId)
    .filter((o) => (!status || status === "ALL" ? true : o.status === status))
    .filter((o) => (!tableNumber || tableNumber === "ALL" ? true : o.tableNumber === tableNumber))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return list;
}

export interface UpdateOrderStatusParams {
  orderId: string;
  restaurantId?: string | undefined;
  status?: OrderStatus | undefined;
  paymentStatus?: PaymentStatus | undefined;
  cancelReason?: string | undefined;
}

export async function updateOrderStatus(params: UpdateOrderStatusParams): Promise<{
  success: boolean;
  status: number;
  error?: string;
  order?: StoredOrder;
}> {
  const { orderId, restaurantId, status, paymentStatus, cancelReason } = params;

  let existing = await getOrderById(orderId);
  if (!existing || (restaurantId && existing.restaurantId !== restaurantId)) {
    return { success: false, status: 404, error: "Order not found." };
  }

  const newStatus = status || existing.status;
  const newPaymentStatus = paymentStatus || existing.paymentStatus;
  const updatedAt = new Date().toISOString();

  let updatedNotes = existing.notes;
  let resolvedCancelReason = existing.cancelReason;
  if (newStatus === "CANCELLED" && cancelReason) {
    resolvedCancelReason = cancelReason.trim();
    const tag = `[Cancelled: ${resolvedCancelReason}]`;
    if (!updatedNotes) {
      updatedNotes = tag;
    } else if (!updatedNotes.includes(tag)) {
      updatedNotes = `${tag} ${updatedNotes}`;
    }
  }

  try {
    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: {
        ...(status ? { status: newStatus } : {}),
        ...(paymentStatus ? { paymentStatus: newPaymentStatus } : {}),
        ...(updatedNotes !== existing.notes ? { notes: updatedNotes } : {}),
      },
    });

    existing = {
      ...existing,
      status: updated.status as OrderStatus,
      paymentStatus: updated.paymentStatus as PaymentStatus,
      notes: updated.notes,
      cancelReason: resolvedCancelReason || extractCancelReason(updated.notes),
      updatedAt: updated.updatedAt.toISOString(),
    };
  } catch (err) {
    console.warn("[Orders] Database status update failed, updated in memory:", err);
    existing.status = newStatus;
    existing.paymentStatus = newPaymentStatus;
    existing.notes = updatedNotes;
    existing.cancelReason = resolvedCancelReason;
    existing.updatedAt = updatedAt;
  }

  memoryOrders.set(existing.id, existing);
  memoryOrders.set(existing.orderNumber, existing);

  return {
    success: true,
    status: 200,
    order: existing,
  };
}

export interface RestaurantOrderStats {
  activeOrdersCount: number;
  todayOrdersCount: number;
  todaySales: number;
  pendingCount: number;
  preparingCount: number;
  servedCount: number;
  completedCount: number;
  cancelledCount: number;
  cancelledTodayCount: number;
  tablesActiveCount: number;
  dailyBreakdown: Array<{
    day: string;
    date: string;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    revenue: number;
  }>;
  recentCancelled: Array<{
    id: string;
    orderNumber: string;
    tableNumber: string;
    customerName: string | null;
    customerPhone: string | null;
    grandTotal: number;
    cancelReason: string;
    createdAt: string;
  }>;
}

export async function getRestaurantOrderStats(restaurantId: string): Promise<RestaurantOrderStats> {
  const allOrders = await getRestaurantOrders({ restaurantId, limit: 300 });

  const todayStr = new Date().toDateString();
  const todayOrders = allOrders.filter(
    (o) => new Date(o.createdAt).toDateString() === todayStr
  );

  let todaySales = 0;
  let pendingCount = 0;
  let preparingCount = 0;
  let servedCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let cancelledTodayCount = 0;
  const activeTables = new Set<string>();

  for (const o of allOrders) {
    if (o.status === "PENDING") {
      pendingCount++;
      activeTables.add(o.tableNumber);
    } else if (o.status === "PREPARING") {
      preparingCount++;
      activeTables.add(o.tableNumber);
    } else if (o.status === "SERVED") {
      servedCount++;
      activeTables.add(o.tableNumber);
    } else if (o.status === "COMPLETED") {
      completedCount++;
    } else if (o.status === "CANCELLED") {
      cancelledCount++;
    }
  }

  for (const o of todayOrders) {
    if (o.status === "CANCELLED") {
      cancelledTodayCount++;
    } else {
      todaySales += o.grandTotal;
    }
  }

  // 7-Day Daily Breakdown
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyBreakdown: RestaurantOrderStats["dailyBreakdown"] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = dayNames[d.getDay()] || "Day";

    const dayOrders = allOrders.filter(
      (o) => o.createdAt.slice(0, 10) === dateStr
    );

    let completed = 0;
    let cancelled = 0;
    let revenue = 0;

    for (const o of dayOrders) {
      if (o.status === "COMPLETED" || o.status === "SERVED") {
        completed++;
        revenue += o.grandTotal;
      } else if (o.status === "CANCELLED") {
        cancelled++;
      }
    }

    dailyBreakdown.push({
      day: dayName,
      date: dateStr,
      totalOrders: dayOrders.length,
      completedOrders: completed,
      cancelledOrders: cancelled,
      revenue,
    });
  }

  // Last 15 cancelled orders with reason
  const recentCancelled = allOrders
    .filter((o) => o.status === "CANCELLED")
    .map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      tableNumber: o.tableNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      grandTotal: o.grandTotal,
      cancelReason: o.cancelReason || "Cancelled by restaurant / diner",
      createdAt: o.createdAt,
    }))
    .slice(0, 15);

  return {
    activeOrdersCount: pendingCount + preparingCount + servedCount,
    todayOrdersCount: todayOrders.length,
    todaySales,
    pendingCount,
    preparingCount,
    servedCount,
    completedCount,
    cancelledCount,
    cancelledTodayCount,
    tablesActiveCount: activeTables.size,
    dailyBreakdown,
    recentCancelled,
  };
}
