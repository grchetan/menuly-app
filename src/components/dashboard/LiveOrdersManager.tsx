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
  User,
  Bell,
  BellRing,
  ExternalLink,
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

interface LiveOrdersManagerProps {
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
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

function playChimeSound() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Tone 1: Energetic Bell Chime (880 Hz / A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: Crisp Accent Bell (1318.5 Hz / E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1318.51, now + 0.12);
    gain2.gain.setValueAtTime(0.45, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

let activeAudioElement: HTMLAudioElement | null = null;

/**
 * Loud, studio-grade Hindi voice announcement (Google Assistant Neural Studio Voice).
 * Automatically streams high-bitrate MP3 via /api/voice/tts, with fallback to Web Speech API.
 */
export async function speakVoiceAnnouncement(hindiText: string, englishFallback?: string) {
  if (typeof window === "undefined") return;

  // 1. Try Google Assistant Neural Studio Audio (Real MP3 - Crisp, Loud & Powerful)
  try {
    if (activeAudioElement) {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    }

    const ttsUrl = `/api/voice/tts?text=${encodeURIComponent(hindiText)}`;
    const audio = new Audio(ttsUrl);
    activeAudioElement = audio;
    audio.volume = 1.0;

    await audio.play();
    return;
  } catch {
    // If audio element failed (e.g. offline), fall back to SpeechSynthesis
  }

  // 2. Fallback to Web Speech API with Devanagari Hindi or English
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(
      (v) => v.lang.startsWith("hi") || v.name.toLowerCase().includes("hindi")
    );

    const utterance = new SpeechSynthesisUtterance(
      hindiVoice ? hindiText : (englishFallback || hindiText)
    );
    utterance.volume = 1.0;
    utterance.rate = 0.9;
    utterance.pitch = 1.05;

    if (hindiVoice) {
      utterance.voice = hindiVoice;
      utterance.lang = hindiVoice.lang;
    } else {
      utterance.lang = "en-IN";
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis fallback failed:", err);
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
  const [serviceCalls, setServiceCalls] = useState<ServiceCallItem[]>([]);
  const [resolvingCallId, setResolvingCallId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<StoredOrder | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<StoredOrder | null>(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState("Customer Left / Changed Mind");
  const [customCancelReason, setCustomCancelReason] = useState("");

  const prevPendingIdsRef = useRef<Set<string>>(new Set());
  const prevServiceCallIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDoneRef = useRef(false);

  // Tracks already announced order and service call IDs across session so they speak ONLY ONCE and NEVER repeat
  const announcedIdsRef = useRef<Set<string>>(new Set<string>());
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem("menuly_announced_voice_ids");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => announcedIdsRef.current.add(id));
        }
      }
    } catch {}
  }, []);

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

        // Service bell / Waiter calls detection & voice alert
        if (Array.isArray(data.serviceCalls)) {
          const fetchedCalls: ServiceCallItem[] = data.serviceCalls;
          setServiceCalls(fetchedCalls);

          // On first load: seed all existing calls into announcedIds so they NEVER speak (prevents old orders from shouting)
          if (!initialFetchDoneRef.current) {
            fetchedCalls.forEach((c) => announcedIdsRef.current.add(c.id));
          } else if (soundEnabled) {
            // Find truly new calls that:
            // a) Have NEVER been announced before in this session
            // b) Were created in the last 90 seconds (not old/beeta hua calls)
            const now = Date.now();
            const newCalls = fetchedCalls.filter((c) => {
              if (announcedIdsRef.current.has(c.id)) return false;
              const callAgeMs = now - new Date(c.createdAt).getTime();
              if (callAgeMs > 90 * 1000) {
                // Older than 90s: mark announced silently without speaking
                announcedIdsRef.current.add(c.id);
                return false;
              }
              return true;
            });

            if (newCalls.length > 0) {
              const firstCall = newCalls[0];
              if (firstCall) {
                // Mark announced immediately so it NEVER repeats
                newCalls.forEach((c) => announcedIdsRef.current.add(c.id));
                try {
                  sessionStorage.setItem(
                    "menuly_announced_voice_ids",
                    JSON.stringify(Array.from(announcedIdsRef.current).slice(-200))
                  );
                } catch {}

                playChimeSound();
                let reasonHindi = "वेटर को बुलाया गया है";
                let reasonEn = "Waiter requested";
                if (firstCall.reason === "water") {
                  reasonHindi = "पानी मंगाया गया है";
                  reasonEn = "Drinking water requested";
                } else if (firstCall.reason === "bill") {
                  reasonHindi = "बिल मंगाया गया है";
                  reasonEn = "Bill requested";
                } else if (firstCall.reason === "cutlery") {
                  reasonHindi = "कटलरी मंगाई गई है";
                  reasonEn = "Cutlery requested";
                }

                const speechHindi = `सावधान! टेबल नंबर ${firstCall.tableNumber} पर ${reasonHindi}!`;
                const speechEnglish = `Attention! Table ${firstCall.tableNumber}: ${reasonEn}!`;
                setTimeout(() => speakVoiceAnnouncement(speechHindi, speechEnglish), 350);

                toast.warning(`🛎️ Table #${firstCall.tableNumber}: ${firstCall.reason.toUpperCase()} requested!`, {
                  duration: 8000,
                });
              }
            }
          }
          prevServiceCallIdsRef.current = new Set(fetchedCalls.map((c) => c.id));
        }

        // Sound chime & Natural voice detection for newly arrived pending orders
        const currentPendingIds = new Set(
          fetchedOrders.filter((o) => o.status === "PENDING").map((o) => o.id)
        );

        // On first load: seed all existing pending orders into announcedIds so they NEVER speak
        if (!initialFetchDoneRef.current) {
          fetchedOrders
            .filter((o) => o.status === "PENDING")
            .forEach((o) => announcedIdsRef.current.add(o.id));
        } else if (soundEnabled) {
          // Find truly new orders that:
          // a) Have NEVER been announced before in this session
          // b) Were created in the last 90 seconds (not old/beeta hua orders)
          const now = Date.now();
          const newOrders = fetchedOrders.filter((o) => {
            if (o.status !== "PENDING") return false;
            if (announcedIdsRef.current.has(o.id)) return false;
            const orderAgeMs = now - new Date(o.createdAt).getTime();
            if (orderAgeMs > 90 * 1000) {
              // Older than 90s: mark announced silently without speaking
              announcedIdsRef.current.add(o.id);
              return false;
            }
            return true;
          });

          if (newOrders.length > 0) {
            const first = newOrders[0];
            if (first) {
              // Mark announced immediately so it NEVER repeats
              newOrders.forEach((o) => announcedIdsRef.current.add(o.id));
              try {
                sessionStorage.setItem(
                  "menuly_announced_voice_ids",
                  JSON.stringify(Array.from(announcedIdsRef.current).slice(-200))
                );
              } catch {}

              playChimeSound();
              const dishCount = first.totalItems || first.items.reduce((sum, it) => sum + it.quantity, 0) || 1;
              const speechHindi = `टेबल नंबर ${first.tableNumber} से ${dishCount} डिश का नया आर्डर आया है!`;
              const speechEnglish = `New order from Table ${first.tableNumber}! ${dishCount} dishes received.`;
              setTimeout(() => speakVoiceAnnouncement(speechHindi, speechEnglish), 350);

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

  // Handle Mark Service Call as Attended
  const handleResolveServiceCall = async (callId: string) => {
    setResolvingCallId(callId);
    try {
      const res = await fetch("/api/restaurant/service-calls/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ callId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setServiceCalls((prev) => prev.filter((c) => c.id !== callId));
        toast.success("✅ Table service marked as attended!");
      }
    } catch {
      toast.error("Failed to update service status");
    } finally {
      setResolvingCallId(null);
    }
  };

  // Initial load + periodic polling every 8 seconds
  useEffect(() => {
    fetchOrders(false);
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Update Status handler
  const handleUpdateStatus = async (orderId: string, status: OrderStatus, cancelReason?: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/restaurant/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ orderId, status, cancelReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update order");
      }
      toast.success(
        status === "CANCELLED"
          ? `Order cancelled (${cancelReason || "Cancelled"})`
          : `Order marked as ${status.toLowerCase()}`
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId || o.orderNumber === orderId
            ? { ...o, status, cancelReason: cancelReason || o.cancelReason, updatedAt: new Date().toISOString() }
            : o
        )
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
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
          {/* Sound & Natural Voice Alert Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSoundEnabled((prev) => !prev);
              toast.info(soundEnabled ? "Voice & audio alerts disabled" : "Voice & audio alerts enabled");
            }}
            className={cn("h-8 text-xs font-bold gap-1.5", soundEnabled && "border-primary/40 bg-primary/10 text-primary shadow-xs")}
            title="Toggle Hindi/Hinglish speech and chime alerts"
          >
            {soundEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5 text-muted-foreground" />}
            <span className="hidden sm:inline">{soundEnabled ? "Voice On" : "Voice Off"}</span>
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
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LIVE TABLE SERVICE BELL / WAITER CALLS BANNER                */}
      {/* ------------------------------------------------------------- */}
      {serviceCalls.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-card p-3.5 sm:p-4 space-y-3 shadow-md animate-rise">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2.5 bg-amber-500"></span>
              </span>
              <span className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <BellRing className="size-4 text-amber-600 animate-bounce" />
                Active Table Service Calls ({serviceCalls.length})
              </span>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">
              Requires immediate table assistance
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {serviceCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-amber-500/30 shadow-xs gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-foreground">
                      Table #{call.tableNumber}
                    </span>
                    <span className="rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                      {call.reason === "water"
                        ? "💧 Water"
                        : call.reason === "bill"
                        ? "🧾 Bill"
                        : call.reason === "cutlery"
                        ? "🥄 Cutlery"
                        : "🙋‍♂️ Waiter"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {timeAgo(call.createdAt)} {call.customNotes ? `• "${call.customNotes}"` : ""}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleResolveServiceCall(call.id)}
                  disabled={resolvingCallId === call.id}
                  className="h-8 px-3 rounded-lg text-xs font-bold gap-1 bg-amber-500 hover:bg-amber-600 text-white shadow-xs shrink-0 cursor-pointer"
                >
                  <Check className="size-3.5" />
                  <span>Attended</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <div className="pt-1">
              <a
                href={`/menu/${restaurantSlug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3.5 py-2 border border-border bg-card hover:bg-secondary text-foreground transition-all shadow-xs"
              >
                <ExternalLink className="size-3.5 text-primary" /> Open Customer Menu
              </a>
            </div>
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
                    <div className="rounded-xl bg-secondary/50 p-2.5 text-xs space-y-1.5">
                      {order.customerName && (
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="font-bold text-foreground flex items-center gap-1.5 truncate">
                            <User className="size-3 text-orange-500 shrink-0" />
                            <span>{order.customerName}</span>
                          </p>
                          {order.customerPhone && (
                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-secondary hover:bg-secondary/80 text-[10px] font-mono text-foreground font-semibold"
                                title="Call diner"
                              >
                                <Phone className="size-2.5 text-emerald-600" />
                                {order.customerPhone}
                              </a>
                              <a
                                href={whatsappLink(order.customerPhone, `Hi ${order.customerName}! Your order ${order.orderNumber} from Table #${order.tableNumber} is being prepared at ${restaurantName}.`)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                title="WhatsApp diner"
                              >
                                <MessageCircle className="size-3" />
                              </a>
                            </div>
                          )}
                        </div>
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

                    {/* Cancel button if pending or preparing */}
                    {(isPending || isPreparing) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => {
                          setCancellingOrder(order);
                          setSelectedCancelReason("Customer Left / Changed Mind");
                          setCustomCancelReason("");
                        }}
                        className="h-9 px-2.5 rounded-xl text-destructive hover:bg-destructive/10"
                        title="Cancel / Reject Order"
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
                      {o.cancelReason && (
                        <p className="text-[10px] text-destructive/80 font-medium truncate max-w-[140px] mt-0.5" title={o.cancelReason}>
                          {o.cancelReason}
                        </p>
                      )}
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

      {/* ------------------------------------------------------------- */}
      {/* 7. CANCEL ORDER MODAL WITH REASON SELECTION                   */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={Boolean(cancellingOrder)} onOpenChange={(open) => !open && setCancellingOrder(null)}>
        <DialogContent className="sm:max-w-md p-5 rounded-3xl border-border bg-card space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-destructive">
              <AlertCircle className="size-5 text-destructive" />
              Cancel Order {cancellingOrder?.orderNumber} (Table #{cancellingOrder?.tableNumber})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <p className="text-muted-foreground">
              Please choose a reason for cancelling this order so it reflects in your Order Analytics and Daily Reports.
            </p>

            <div className="space-y-1.5">
              {[
                "Customer Left / Changed Mind",
                "Item Out of Stock",
                "Kitchen Overcapacity / Delay",
                "Mistake / Duplicate Order",
                "Other Reason",
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedCancelReason(reason)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between",
                    selectedCancelReason === reason
                      ? "border-destructive bg-destructive/10 text-destructive font-bold"
                      : "border-border/70 hover:bg-secondary/60 text-foreground"
                  )}
                >
                  <span>{reason}</span>
                  {selectedCancelReason === reason && <Check className="size-3.5 text-destructive" />}
                </button>
              ))}
            </div>

            {selectedCancelReason === "Other Reason" && (
              <div className="pt-1">
                <Input
                  type="text"
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  placeholder="Type specific reason..."
                  className="h-9 text-xs rounded-xl bg-card border-border"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCancellingOrder(null)}
              className="rounded-xl text-xs"
            >
              Back
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={Boolean(updatingId)}
              onClick={async () => {
                if (!cancellingOrder) return;
                const reason =
                  selectedCancelReason === "Other Reason"
                    ? customCancelReason.trim() || "Other"
                    : selectedCancelReason;
                await handleUpdateStatus(cancellingOrder.id, "CANCELLED", reason);
                setCancellingOrder(null);
              }}
              className="rounded-xl text-xs font-bold gap-1"
            >
              Confirm Cancellation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
