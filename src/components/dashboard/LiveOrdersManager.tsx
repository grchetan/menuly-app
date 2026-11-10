import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Printer,
  ChevronRight,
  Filter,
  Search,
  Check,
  X,
  Phone,
  MessageCircle,
  FileText,
  CookingPot,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice, whatsappLink } from "@/lib/config";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { printReceipt } from "@/lib/receipt-printer";

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

interface LiveOrdersManagerProps {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
}

function playChimeSound() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

function timeAgo(dateStr: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 45) return "Just now";
  if (diffSec < 90) return "1 min ago";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function LiveOrdersManager({
  restaurantId,
  restaurantSlug,
  restaurantName,
}: LiveOrdersManagerProps) {
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<StoredOrder | null>(null);

  const prevPendingIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDoneRef = useRef(false);

  const getAuthHeader = () => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("menuly_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch("/api/restaurant/orders", {
        headers: getAuthHeader(),
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.orders)) {
        const fetchedOrders: StoredOrder[] = data.orders;
        setOrders(fetchedOrders);

        // Sound chime detection for newly arrived pending orders
        const currentPendingIds = new Set(
          fetchedOrders.filter((o) => o.status === "PENDING").map((o) => o.id)
        );

        if (initialFetchDoneRef.current && soundEnabled) {
          const newOrders = fetchedOrders.filter(
            (o) => o.status === "PENDING" && !prevPendingIdsRef.current.has(o.id)
          );
          if (newOrders.length > 0) {
            playChimeSound();
            const first = newOrders[0];
            if (first) {
              toast.success(`🔔 New Order ${first.orderNumber} from Table #${first.tableNumber}!`, {
                duration: 6000,
              });
            }
          }
        }

        prevPendingIdsRef.current = currentPendingIds;
        initialFetchDoneRef.current = true;
      }
    } catch (err) {
      if (!isSilent) console.warn("Failed fetching live restaurant orders:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [soundEnabled]);

  // Initial load + periodic polling every 8 seconds
  useEffect(() => {
    fetchOrders(false);
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Update Status handler
  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/restaurant/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update order");
      }
      toast.success(`Order marked as ${status.toLowerCase()}`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Simulate sample order for quick testing
  const handleSimulateOrder = async () => {
    try {
      const tablesList = ["1", "2", "3", "4", "5", "Outdoor-A"];
      const randomTable = tablesList[Math.floor(Math.random() * tablesList.length)];
      const res = await fetch("/api/orders/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          slug: restaurantSlug,
          tableNumber: randomTable,
          customerName: "Demo Diner",
          customerPhone: "+91 9179878521",
          notes: "Extra napkins, keep it spicy!",
          items: [
            { id: "sample-1", name: "Paneer Tikka Masala", price: 280, quantity: 1, isVeg: true },
            { id: "sample-2", name: "Butter Garlic Naan", price: 60, quantity: 3, isVeg: true },
            { id: "sample-3", name: "Fresh Mint Chaas", price: 50, quantity: 2, isVeg: true },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Demo order ${data.order.orderNumber} placed for Table #${randomTable}!`);
        fetchOrders(false);
      }
    } catch {
      toast.error("Failed to simulate order");
    }
  };

  // Unique table list for filter dropdown
  const availableTables = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.tableNumber) set.add(o.tableNumber);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [orders]);

  // Filtered lists
  const liveOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === "PENDING" || o.status === "PREPARING" || o.status === "SERVED")
      .filter((o) => (selectedTable === "ALL" ? true : o.tableNumber === selectedTable))
      .filter((o) => (statusFilter === "ALL" ? true : o.status === statusFilter))
      .filter((o) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          o.tableNumber.toLowerCase().includes(q) ||
          o.items.some((it) => it.name.toLowerCase().includes(q))
        );
      });
  }, [orders, selectedTable, statusFilter, searchQuery]);

  const historyOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === "COMPLETED" || o.status === "CANCELLED")
      .filter((o) => (selectedTable === "ALL" ? true : o.tableNumber === selectedTable))
      .filter((o) => (statusFilter === "ALL" ? true : o.status === statusFilter))
      .filter((o) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          o.tableNumber.toLowerCase().includes(q)
        );
      });
  }, [orders, selectedTable, statusFilter, searchQuery]);

  // Counts
  const pendingCount = useMemo(() => orders.filter((o) => o.status === "PENDING").length, [orders]);
  const preparingCount = useMemo(() => orders.filter((o) => o.status === "PREPARING").length, [orders]);
  const servedCount = useMemo(() => orders.filter((o) => o.status === "SERVED").length, [orders]);
  const completedCount = useMemo(() => orders.filter((o) => o.status === "COMPLETED").length, [orders]);
  const todayTotalRevenue = useMemo(() => {
    const todayStr = new Date().toDateString();
    return orders
      .filter((o) => o.status !== "CANCELLED" && new Date(o.createdAt).toDateString() === todayStr)
      .reduce((sum, o) => sum + o.grandTotal, 0);
  }, [orders]);

  const handlePrintReceipt = (order: StoredOrder) => {
    printReceipt(order, {
      name: restaurantName || "Restaurant",
    });
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs">
      {/* ------------------------------------------------------------- */}
      {/* 1. SECTION HEADER WITH LIVE METRICS & AUDIO TOGGLE           */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-display text-lg sm:text-xl font-black text-foreground">
              Live Table Orders & Kitchen POS
            </h2>
            <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-bold">
              Table-Wise Live
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time contactless orders placed by diners seated at your QR tables
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sound Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSoundEnabled((prev) => !prev);
              toast.info(soundEnabled ? "Audio chimes disabled" : "Audio chimes enabled");
            }}
            className={cn("h-8 text-xs font-semibold gap-1.5", soundEnabled && "border-primary/40 bg-primary/5 text-primary")}
            title="Toggle new order sound alerts"
          >
            {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5 text-muted-foreground" />}
            <span className="hidden sm:inline">{soundEnabled ? "Chime On" : "Chime Off"}</span>
          </Button>

          {/* Refresh Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(false)}
            disabled={loading}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin text-primary")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Simulate Demo Order (for testing) */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSimulateOrder}
            className="h-8 text-xs font-bold gap-1"
          >
            <Sparkles className="size-3.5 text-amber-500" />
            <span>Test Order</span>
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SUMMARY COUNTERS                                           */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
            New Pending
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {pendingCount}
          </span>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
            In Kitchen
          </span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {preparingCount}
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
            Served
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {servedCount}
          </span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Today Sales
          </span>
          <span className="text-xl sm:text-2xl font-black text-foreground mt-1 block truncate">
            {formatPrice(todayTotalRevenue)}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. TABS: LIVE KITCHEN vs ORDER HISTORY                         */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("live");
              setStatusFilter("ALL");
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all",
              activeTab === "live"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            Live Kitchen ({liveOrders.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              setStatusFilter("ALL");
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all",
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            Order History ({historyOrders.length})
          </button>
        </div>

        {/* Live Indicator */}
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Clock className="size-3" /> Auto-syncs every 8s
        </span>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. FILTERS ROW (TABLE SELECTION & SEARCH)                     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Table Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedTable("ALL")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-colors",
              selectedTable === "ALL"
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            All Tables
          </button>
          {availableTables.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTable(t)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-colors",
                selectedTable === t
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              Table #{t}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative sm:w-56 shrink-0">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, table, dish..."
            className="h-8 pl-8 text-xs rounded-xl bg-card border-border/80"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-2 text-[10px] text-muted-foreground hover:text-foreground font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. ORDERS LIST (CARDS)                                        */}
      {/* ------------------------------------------------------------- */}
      {loading && orders.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
          <RefreshCw className="size-6 animate-spin mx-auto text-primary" />
          <p>Connecting to kitchen live stream...</p>
        </div>
      ) : activeTab === "live" ? (
        liveOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 sm:p-12 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
              <CookingPot className="size-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">No Active Dine-In Orders</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-0.5">
                When diners scan table QR codes and place orders, they will appear here in real-time with sound chime alerts.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateOrder}
              className="gap-1.5 text-xs font-bold rounded-xl"
            >
              <Sparkles className="size-3 text-amber-500" /> Send Test Order to Table
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {liveOrders.map((order) => {
              const isUpdating = updatingId === order.id;
              const isPending = order.status === "PENDING";
              const isPreparing = order.status === "PREPARING";
              const isServed = order.status === "SERVED";

              return (
                <div
                  key={order.id}
                  className={cn(
                    "rounded-2xl border p-4 space-y-3 transition-all bg-card shadow-xs",
                    isPending
                      ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30"
                      : isPreparing
                      ? "border-blue-500/40 bg-blue-500/5"
                      : "border-emerald-500/40 bg-emerald-500/5"
                  )}
                >
                  {/* Order Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-base text-foreground">
                          Table #{order.tableNumber}
                        </span>
                        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                          {order.orderNumber}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="size-3" /> {timeAgo(order.createdAt)}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                        isPending && "bg-amber-500 text-white animate-pulse",
                        isPreparing && "bg-blue-600 text-white",
                        isServed && "bg-emerald-600 text-white"
                      )}
                    >
                      {isPending ? "New Order" : isPreparing ? "Preparing" : "Served"}
                    </span>
                  </div>

                  {/* Customer Information & Cooking Notes */}
                  {(order.customerName || order.customerPhone || order.notes) && (
                    <div className="rounded-xl bg-secondary/50 p-2.5 text-xs space-y-1">
                      {order.customerName && (
                        <p className="font-semibold text-foreground truncate">
                          Diner: {order.customerName}
                          {order.customerPhone && (
                            <span className="text-muted-foreground font-normal ml-1">
                              ({order.customerPhone})
                            </span>
                          )}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                          Note: "{order.notes}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Ordered Items List */}
                  <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar divide-y divide-border/40 text-xs">
                    {order.items.map((it, idx) => (
                      <div key={it.id + idx} className="pt-1.5 first:pt-0 flex items-center justify-between">
                        <span className="font-semibold text-foreground truncate">
                          <strong className="text-primary font-black mr-1">{it.quantity}x</strong>
                          {it.name}
                        </span>
                        <span className="font-mono text-muted-foreground shrink-0 ml-2">
                          {formatPrice(it.total)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Grand Total Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs font-bold">
                    <span className="text-muted-foreground">Total ({order.totalItems} items)</span>
                    <span className="text-sm font-black text-foreground">{formatPrice(order.grandTotal)}</span>
                  </div>

                  {/* Kitchen Workflow Buttons */}
                  <div className="pt-1 flex items-center gap-1.5">
                    {isPending && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                        className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1 shadow-xs"
                      >
                        <CookingPot className="size-3.5" /> Start Cooking
                      </Button>
                    )}

                    {isPreparing && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, "SERVED")}
                        className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 shadow-xs"
                      >
                        <Check className="size-3.5" /> Mark Served
                      </Button>
                    )}

                    {isServed && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                        className="flex-1 h-9 rounded-xl bg-foreground text-background font-bold text-xs gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="size-3.5" /> Complete & Settle
                      </Button>
                    )}

                    {/* Quick Print KOT */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintReceipt(order)}
                      className="h-9 px-2.5 rounded-xl border-border/80 text-muted-foreground hover:text-foreground"
                      title="Print KOT / Order Receipt"
                    >
                      <Printer className="size-3.5" />
                    </Button>

                    {/* Cancel button if pending */}
                    {isPending && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => {
                          if (confirm(`Cancel Order ${order.orderNumber}?`)) {
                            handleUpdateStatus(order.id, "CANCELLED");
                          }
                        }}
                        className="h-9 px-2.5 rounded-xl text-destructive hover:bg-destructive/10"
                        title="Cancel Order"
                      >
                        <X className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Order History View */
        historyOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-muted-foreground text-xs space-y-1">
            <p className="font-semibold text-foreground">No order history found</p>
            <p>Completed and settled orders will be recorded here permanently.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border/60 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Table</th>
                  <th className="py-2.5 px-3">Dishes</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {historyOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                      {o.orderNumber}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      Table #{o.tableNumber}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground max-w-[200px] truncate">
                      {o.items.map((it) => `${it.quantity}x ${it.name}`).join(", ")}
                    </td>
                    <td className="py-2.5 px-3 font-black text-foreground">
                      {formatPrice(o.grandTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                          o.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingReceiptOrder(o)}
                        className="h-7 text-xs font-bold gap-1 text-primary hover:text-primary"
                      >
                        <FileText className="size-3" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. DIGITAL RECEIPT MODAL (PRINTABLE 80MM / A4)                */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={Boolean(viewingReceiptOrder)} onOpenChange={(open) => !open && setViewingReceiptOrder(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl border-border bg-card">
          {viewingReceiptOrder && (
            <div className="p-5 sm:p-6 space-y-4 print:p-0">
              {/* Receipt Header */}
              <div className="text-center space-y-1 border-b border-dashed border-border/80 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Official Order Receipt
                </span>
                <h3 className="font-serif font-black text-xl text-foreground">
                  {restaurantName}
                </h3>
                <p className="text-xs font-bold text-foreground">
                  Table #{viewingReceiptOrder.tableNumber} • Dine-In
                </p>
                <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-mono mt-1">
                  <span>{viewingReceiptOrder.orderNumber}</span>
                  <span>•</span>
                  <span>
                    {new Date(viewingReceiptOrder.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 py-1 text-xs">
                <div className="flex justify-between text-muted-foreground font-semibold border-b border-border/50 pb-1">
                  <span>Dish Item</span>
                  <span>Amount</span>
                </div>
                {viewingReceiptOrder.items.map((it, idx) => (
                  <div key={it.id + idx} className="flex justify-between items-center text-foreground">
                    <span>
                      <strong className="font-bold mr-1">{it.quantity}x</strong> {it.name}
                    </span>
                    <span className="font-mono font-semibold">{formatPrice(it.total)}</span>
                  </div>
                ))}
              </div>

              {/* Receipt Bill Breakdown */}
              <div className="border-t border-dashed border-border/80 pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({viewingReceiptOrder.totalItems} items)</span>
                  <span>{formatPrice(viewingReceiptOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxes &amp; Platform Charges</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Included</span>
                </div>
                <div className="flex justify-between items-center text-base font-black text-foreground pt-2 border-t border-border/50">
                  <span>Grand Total</span>
                  <span className="text-primary font-mono">{formatPrice(viewingReceiptOrder.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Payment Mode</span>
                  <span className="font-bold uppercase">{viewingReceiptOrder.paymentMethod}</span>
                </div>
              </div>

              {/* Receipt Footer Actions */}
              <div className="pt-2 flex items-center gap-2 print:hidden">
                <Button
                  type="button"
                  onClick={() => {
                    if (viewingReceiptOrder) {
                      printReceipt(viewingReceiptOrder, {
                        name: restaurantName || "Restaurant",
                      });
                    }
                  }}
                  className="flex-1 rounded-xl h-10 font-bold text-xs gap-1.5 bg-primary text-primary-foreground hover:brightness-105"
                >
                  <Printer className="size-3.5" /> Print Thermal Slip (80mm / PDF)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewingReceiptOrder(null)}
                  className="rounded-xl h-10 font-bold text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
