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
    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
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

  return memoryOrders.get(orderId) || null;
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

export async function updateOrderStatus(params: {
  orderId: string;
  restaurantId: string;
  status?: OrderStatus | undefined;
  paymentStatus?: PaymentStatus | undefined;
}): Promise<{ success: boolean; status: number; error?: string; order?: StoredOrder }> {
  const { orderId, restaurantId, status, paymentStatus } = params;

  let existing = await getOrderById(orderId);
  if (!existing || existing.restaurantId !== restaurantId) {
    return { success: false, status: 404, error: "Order not found." };
  }

  const newStatus = status || existing.status;
  const newPaymentStatus = paymentStatus || existing.paymentStatus;
  const updatedAt = new Date().toISOString();

  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(status ? { status: newStatus } : {}),
        ...(paymentStatus ? { paymentStatus: newPaymentStatus } : {}),
      },
    });

    existing = {
      ...existing,
      status: updated.status as OrderStatus,
      paymentStatus: updated.paymentStatus as PaymentStatus,
      updatedAt: updated.updatedAt.toISOString(),
    };
  } catch (err) {
    console.warn("[Orders] Database status update failed, updated in memory:", err);
    existing.status = newStatus;
    existing.paymentStatus = newPaymentStatus;
    existing.updatedAt = updatedAt;
  }

  memoryOrders.set(orderId, existing);

  return {
    success: true,
    status: 200,
    order: existing,
  };
}

export async function getRestaurantOrderStats(restaurantId: string): Promise<{
  activeOrdersCount: number;
  todayOrdersCount: number;
  todaySales: number;
  pendingCount: number;
  preparingCount: number;
  servedCount: number;
  completedCount: number;
  tablesActiveCount: number;
}> {
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
    }
  }

  for (const o of todayOrders) {
    if (o.status !== "CANCELLED") {
      todaySales += o.grandTotal;
    }
  }

  return {
    activeOrdersCount: pendingCount + preparingCount + servedCount,
    todayOrdersCount: todayOrders.length,
    todaySales,
    pendingCount,
    preparingCount,
    servedCount,
    completedCount,
    tablesActiveCount: activeTables.size,
  };
}
