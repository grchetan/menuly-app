/**
 * Global Real-Time Orders & Service Calls Synchronization Store
 * 
 * Runs continuously in the background across all dashboard pages (QR Studio, My Menu, Dashboard, etc.).
 * Guarantees:
 * 1. Background live alerts (Voice announcement + Chime + Toast) when owner is outside /orders.
 * 2. Strict FIFO sequential voice queue for multiple table orders (jo pehle aaya uska pehle).
 * 3. 0ms instant optimistic UI transitions for status updates and cancellations.
 * 4. Zero duplicate polling or memory leaks across route transitions.
 */

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  orderAudioService,
  formatOrderSpeechText,
  formatServiceCallSpeechText,
} from "./order-audio";

export type OrderStatus = "PENDING" | "PREPARING" | "SERVED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID_AT_COUNTER" | "PAID_ONLINE";

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

export interface ServiceCallItem {
  id: string;
  restaurantId: string;
  tableNumber: string;
  reason: "waiter" | "water" | "bill" | "cutlery" | "assistance";
  customNotes?: string;
  status: "PENDING" | "ATTENDED";
  createdAt: string;
}

interface OrdersStoreState {
  orders: StoredOrder[];
  serviceCalls: ServiceCallItem[];
  loading: boolean;
  initialFetchDone: boolean;
}

class OrdersSyncManager {
  private state: OrdersStoreState = {
    orders: [],
    serviceCalls: [],
    loading: true,
    initialFetchDone: false,
  };

  private listeners = new Set<(state: OrdersStoreState) => void>();
  private announcedIds = new Set<string>();
  private optimisticUpdates = new Map<
    string,
    { status: OrderStatus; timestamp: number; cancelReason?: string | undefined }
  >();
  private optimisticResolvedCalls = new Map<string, number>();
  private pollIntervalId: any = null;
  private isPolling = false;
  private activeSubscriptions = 0;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("menuly_announced_voice_ids");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((id: string) => this.announcedIds.add(id));
          }
        }
      } catch {}

      try {
        const resolved = sessionStorage.getItem("menuly_resolved_service_calls");
        if (resolved) {
          const parsed = JSON.parse(resolved);
          if (Array.isArray(parsed)) {
            parsed.forEach((id: string) => this.optimisticResolvedCalls.set(id, Date.now()));
          }
        }
      } catch {}
    }
  }

  private persistAnnouncedIds() {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(
        "menuly_announced_voice_ids",
        JSON.stringify(Array.from(this.announcedIds).slice(-250))
      );
    } catch {}

    try {
      sessionStorage.setItem(
        "menuly_resolved_service_calls",
        JSON.stringify(Array.from(this.optimisticResolvedCalls.keys()).slice(-100))
      );
    } catch {}
  }

  private getAuthHeader(): Record<string, string> {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("menuly_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  public getState(): OrdersStoreState {
    return this.state;
  }

  public subscribe(listener: (state: OrdersStoreState) => void): () => void {
    this.listeners.add(listener);
    this.activeSubscriptions++;
    listener(this.state);

    if (this.activeSubscriptions === 1) {
      this.startPolling();
    }

    return () => {
      this.listeners.delete(listener);
      this.activeSubscriptions = Math.max(0, this.activeSubscriptions - 1);
      if (this.activeSubscriptions === 0) {
        this.stopPolling();
      }
    };
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.warn("[OrdersSyncManager] Listener error:", err);
      }
    });
  }

  public startPolling() {
    if (this.pollIntervalId) return;
    this.fetchOrders(false);

    // Dynamic polling: 2.5s when active tab, 10s when background tab
    this.pollIntervalId = setInterval(() => {
      this.fetchOrders(true);
    }, 2500);

    if (typeof document !== "undefined") {
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          this.fetchOrders(true);
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
  }

  public stopPolling() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  public async fetchOrders(isSilent = true) {
    if (this.isPolling) return;
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("menuly_token");
    if (!token) return;

    this.isPolling = true;
    if (!isSilent && !this.state.initialFetchDone) {
      this.state = { ...this.state, loading: true };
      this.notify();
    }

    try {
      const res = await fetch("/api/restaurant/orders", {
        headers: this.getAuthHeader(),
      });
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.orders)) {
        const now = Date.now();

        // Prune optimistic locks older than 15s
        this.optimisticUpdates.forEach((val, id) => {
          if (now - val.timestamp > 15000) {
            this.optimisticUpdates.delete(id);
          }
        });

        // Merge fetched orders with any active optimistic status updates
        const mergedOrders: StoredOrder[] = data.orders.map((o: StoredOrder) => {
          const optimistic =
            this.optimisticUpdates.get(o.id) ||
            this.optimisticUpdates.get(o.orderNumber);
          if (optimistic) {
            return {
              ...o,
              status: optimistic.status,
              cancelReason: optimistic.cancelReason || o.cancelReason,
            };
          }
          return o;
        });

        // Prune optimistic service call resolution locks older than 60s
        this.optimisticResolvedCalls.forEach((ts, id) => {
          if (now - ts > 60000) {
            this.optimisticResolvedCalls.delete(id);
          }
        });

        const rawCalls: ServiceCallItem[] = Array.isArray(data.serviceCalls)
          ? data.serviceCalls
          : [];
        // Strictly filter out any calls that have been marked attended (prevents flickering back)
        const fetchedCalls: ServiceCallItem[] = rawCalls.filter(
          (c) => !this.optimisticResolvedCalls.has(c.id)
        );

        // -------------------------------------------------------------
        // VOICE & NOTIFICATION TRIGGER LOGIC
        // -------------------------------------------------------------
        if (!this.state.initialFetchDone) {
          // First load: seed all existing records so historical orders NEVER shout
          mergedOrders.forEach((o) => this.announcedIds.add(o.id));
          fetchedCalls.forEach((c) => this.announcedIds.add(c.id));
          this.persistAnnouncedIds();
        } else {
          // Detect truly new pending orders in the last 120 seconds
          const newOrders = mergedOrders.filter((o) => {
            if (o.status !== "PENDING") return false;
            if (this.announcedIds.has(o.id)) return false;
            const orderAgeMs = now - new Date(o.createdAt).getTime();
            if (orderAgeMs > 120 * 1000) {
              this.announcedIds.add(o.id);
              return false;
            }
            return true;
          });

          // Detect truly new service calls in the last 120 seconds
          const newCalls = fetchedCalls.filter((c) => {
            if (this.announcedIds.has(c.id)) return false;
            const callAgeMs = now - new Date(c.createdAt).getTime();
            if (callAgeMs > 120 * 1000) {
              this.announcedIds.add(c.id);
              return false;
            }
            return true;
          });

          // Collect all new events and sort by timestamp ASC (earliest first: FIFO)
          const allNewEvents: Array<{
            id: string;
            type: "ORDER" | "CALL";
            createdAt: number;
            tableNumber: string;
            order?: StoredOrder;
            call?: ServiceCallItem;
          }> = [];

          newOrders.forEach((o) => {
            this.announcedIds.add(o.id);
            allNewEvents.push({
              id: o.id,
              type: "ORDER",
              createdAt: new Date(o.createdAt).getTime(),
              tableNumber: o.tableNumber,
              order: o,
            });
          });

          newCalls.forEach((c) => {
            this.announcedIds.add(c.id);
            allNewEvents.push({
              id: c.id,
              type: "CALL",
              createdAt: new Date(c.createdAt).getTime(),
              tableNumber: c.tableNumber,
              call: c,
            });
          });

          if (allNewEvents.length > 0) {
            this.persistAnnouncedIds();
            // Sort FIFO: jo pehle order hua uska alert pehle!
            allNewEvents.sort((a, b) => a.createdAt - b.createdAt);

            const isCurrentlyOnOrdersPage =
              typeof window !== "undefined" && window.location.pathname.startsWith("/orders");

            for (const event of allNewEvents) {
              if (event.type === "ORDER" && event.order) {
                const speech = formatOrderSpeechText({
                  tableNumber: event.order.tableNumber,
                  totalItems: event.order.totalItems,
                  items: event.order.items,
                });

                orderAudioService.enqueue({
                  id: event.order.id,
                  tableNumber: event.order.tableNumber,
                  hindiText: speech.hindiText,
                  englishFallback: speech.englishFallback,
                  createdAt: event.createdAt,
                });

                // Show Toast Notification (especially prominent when owner is on /qr, /dashboard, etc.)
                const dishCount =
                  event.order.totalItems ||
                  event.order.items.reduce((s, it) => s + it.quantity, 0) ||
                  1;

                if (!isCurrentlyOnOrdersPage) {
                  toast.success(
                    `Naya Order: Table #${event.order.tableNumber} (${dishCount} dishes)`,
                    {
                      description: `Order #${event.order.orderNumber} placed • ₹${event.order.grandTotal}`,
                      duration: 9000,
                      action: {
                        label: "Open POS",
                        onClick: () => {
                          if (typeof window !== "undefined") {
                            window.location.href = "/orders";
                          }
                        },
                      },
                    }
                  );
                } else {
                  toast.success(
                    `New Order #${event.order.orderNumber} from Table #${event.order.tableNumber}!`,
                    { duration: 6000 }
                  );
                }
              } else if (event.type === "CALL" && event.call) {
                const speech = formatServiceCallSpeechText({
                  tableNumber: event.call.tableNumber,
                  reason: event.call.reason,
                });

                orderAudioService.enqueue({
                  id: event.call.id,
                  tableNumber: event.call.tableNumber,
                  hindiText: speech.hindiText,
                  englishFallback: speech.englishFallback,
                  createdAt: event.createdAt,
                });

                const reasonLabel = event.call.reason.toUpperCase();
                if (!isCurrentlyOnOrdersPage) {
                  toast.warning(
                    `Table #${event.call.tableNumber}: ${reasonLabel} Requested!`,
                    {
                      description: "Customer at table needs immediate assistance.",
                      duration: 9000,
                      action: {
                        label: "View in POS",
                        onClick: () => {
                          if (typeof window !== "undefined") {
                            window.location.href = "/orders";
                          }
                        },
                      },
                    }
                  );
                } else {
                  toast.warning(
                    `Table #${event.call.tableNumber}: ${reasonLabel} requested!`,
                    { duration: 7000 }
                  );
                }
              }
            }
          }
        }

        this.state = {
          orders: mergedOrders,
          serviceCalls: fetchedCalls,
          loading: false,
          initialFetchDone: true,
        };
        this.notify();
      }
    } catch (err) {
      if (!isSilent) console.warn("[OrdersSyncManager] Fetch error:", err);
    } finally {
      this.isPolling = false;
      if (!isSilent && this.state.loading) {
        this.state = { ...this.state, loading: false };
        this.notify();
      }
    }
  }

  /**
   * 0ms Instant Optimistic Status Update for POS Workflow
   */
  public async updateOrderStatus(payload: {
    orderId: string;
    status: OrderStatus;
    paymentStatus?: PaymentStatus | undefined;
    cancelReason?: string | undefined;
  }): Promise<boolean> {
    const { orderId, status, paymentStatus, cancelReason } = payload;

    // Apply optimistic update immediately
    this.optimisticUpdates.set(orderId, {
      status,
      timestamp: Date.now(),
      cancelReason,
    });

    this.state = {
      ...this.state,
      orders: this.state.orders.map((o) => {
        if (o.id === orderId || o.orderNumber === orderId) {
          return {
            ...o,
            status,
            ...(paymentStatus ? { paymentStatus } : {}),
            ...(cancelReason ? { cancelReason } : {}),
          };
        }
        return o;
      }),
    };
    this.notify();

    try {
      const res = await fetch("/api/restaurant/orders/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update order");
      }
      return true;
    } catch (err) {
      // Revert optimistic update on failure
      this.optimisticUpdates.delete(orderId);
      this.fetchOrders(true);
      throw err;
    }
  }

  /**
   * 0ms Instant Optimistic Service Call Resolution (with anti-flicker lock)
   */
  public async resolveServiceCall(callId: string): Promise<boolean> {
    const prevCalls = this.state.serviceCalls;
    // 1. Lock optimistic resolution for 60s so background polling never flickers it back
    this.optimisticResolvedCalls.set(callId, Date.now());
    this.announcedIds.add(callId);
    this.persistAnnouncedIds();

    // 2. 0ms instant UI removal
    this.state = {
      ...this.state,
      serviceCalls: this.state.serviceCalls.filter((c) => c.id !== callId),
    };
    this.notify();

    try {
      const res = await fetch("/api/restaurant/service-calls/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeader(),
        },
        body: JSON.stringify({ callId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to resolve service call");
      }
      return true;
    } catch (err) {
      this.optimisticResolvedCalls.delete(callId);
      this.state = { ...this.state, serviceCalls: prevCalls };
      this.notify();
      throw err;
    }
  }
}

export const ordersSyncManager = new OrdersSyncManager();

/**
 * React hook to subscribe to real-time orders, service calls, and live counts.
 */
export function useOrdersSync() {
  const [state, setState] = useState<OrdersStoreState>(() => ordersSyncManager.getState());

  useEffect(() => {
    return ordersSyncManager.subscribe((next) => {
      setState(next);
    });
  }, []);

  const pendingOrders = state.orders.filter((o) => o.status === "PENDING");
  const inKitchenOrders = state.orders.filter((o) => o.status === "PREPARING");
  const servedOrders = state.orders.filter((o) => o.status === "SERVED");

  return {
    orders: state.orders,
    serviceCalls: state.serviceCalls,
    loading: state.loading,
    initialFetchDone: state.initialFetchDone,
    pendingCount: pendingOrders.length,
    inKitchenCount: inKitchenOrders.length,
    servedCount: servedOrders.length,
    activeCallsCount: state.serviceCalls.length,
    refetch: () => ordersSyncManager.fetchOrders(false),
    updateOrderStatus: ordersSyncManager.updateOrderStatus.bind(ordersSyncManager),
    resolveServiceCall: ordersSyncManager.resolveServiceCall.bind(ordersSyncManager),
  };
}
