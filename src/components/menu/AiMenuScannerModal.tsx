import { useState, useRef } from "react";
import {
  Sparkles,
  Upload,
  Camera,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  UtensilsCrossed,
  ArrowRight,
  HelpCircle,
  FileText,
  SlidersHorizontal,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { compressImage } from "@/lib/image-compress";
import { formatPrice } from "@/lib/config";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { myMenuQuery } from "@/lib/restaurant";
import { getSmartDishImageUrl } from "@/lib/dish-images";
import { GeminiIcon } from "@/components/icons/GeminiIcon";

export interface ScannedMenuItem {
  name: string;
  description?: string | null;
  price: number;
  isVeg: boolean;
  imageUrl?: string | null;
  selected?: boolean;
}

export interface ScannedCategory {
  name: string;
  items: ScannedMenuItem[];
  selected?: boolean;
}

interface AiMenuScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId?: string;
  restaurantName?: string;
}

export function AiMenuScannerModal({
  open,
  onOpenChange,
  restaurantId,
  restaurantName,
}: AiMenuScannerModalProps) {
  const qc = useQueryClient();

  const [step, setStep] = useState<"upload" | "scanning" | "review">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);

  // Review State
  const [detectedRestaurantName, setDetectedRestaurantName] = useState<string | null>(null);
  const [categories, setCategories] = useState<ScannedCategory[]>([]);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [editingImageItem, setEditingImageItem] = useState<{
    catIdx: number;
    itemIdx: number;
    dishName: string;
    url: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeader = () => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("menuly_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleReset = () => {
    setStep("upload");
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanStatus("");
    setCategories([]);
    setDetectedRestaurantName(null);
    setIsApplying(false);
    setEditingImageItem(null);
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File is too large. Please select an image under 20MB.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Proceed directly to AI scanning
    await startAiScan(file);
  };

  const startAiScan = async (file: File) => {
    setStep("scanning");
    setScanStatus("Optimizing photo for AI vision...");

    try {
      // 1. Client-Side compression to 1600px max
      const compressed = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
        mimeType: "image/jpeg",
      });

      setScanStatus("Gemini Vision AI analyzing menu layout...");

      // 2. Direct Base64 data URL
      const base64Data = compressed.dataUrl;

      setScanStatus("Extracting dish names, categories & prices (INR)...");

      // 3. Send to Menuly Backend AI Endpoint
      const res = await fetch("/api/restaurant/ai-menu/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: "image/jpeg",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to scan menu. Please try a clearer photo.");
      }

      const result = data.data;
      if (!result || !result.categories || result.categories.length === 0) {
        throw new Error("No readable dishes found in this photo. Please upload a clear photo of the menu card.");
      }

      // Mark all items and categories selected by default with smart culinary image
      const initializedCategories: ScannedCategory[] = result.categories.map((c: any) => ({
        ...c,
        selected: true,
        items: (c.items || []).map((it: any) => ({
          ...it,
          selected: true,
          imageUrl: it.imageUrl || getSmartDishImageUrl(it.name, c.name, it.isVeg),
        })),
      }));

      setCategories(initializedCategories);
      setDetectedRestaurantName(result.restaurantName || null);
      setStep("review");
      toast.success(`✨ Found ${result.totalDishes} dishes in ${initializedCategories.length} categories!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to scan image. Please try again.");
      setStep("upload");
    }
  };

  // Dish Editing Handlers
  const handleItemNameChange = (catIdx: number, itemIdx: number, newName: string) => {
    setCategories((prev) => {
      const copy = [...prev];
      const targetCat = copy[catIdx];
      if (!targetCat) return prev;
      const targetItem = targetCat.items[itemIdx];
      if (!targetItem) return prev;
      targetCat.items[itemIdx] = { ...targetItem, name: newName };
      return copy;
    });
  };

  const handleItemPriceChange = (catIdx: number, itemIdx: number, newPriceStr: string) => {
    const val = newPriceStr.replace(/[^0-9.]/g, "");
    const num = Math.max(0, parseFloat(val) || 0);
    setCategories((prev) => {
      const copy = [...prev];
      const targetCat = copy[catIdx];
      if (!targetCat) return prev;
      const targetItem = targetCat.items[itemIdx];
      if (!targetItem) return prev;
      targetCat.items[itemIdx] = { ...targetItem, price: num };
      return copy;
    });
  };

  const handleItemVegToggle = (catIdx: number, itemIdx: number) => {
    setCategories((prev) => {
      const copy = [...prev];
      const targetCat = copy[catIdx];
      if (!targetCat) return prev;
      const targetItem = targetCat.items[itemIdx];
      if (!targetItem) return prev;
      targetCat.items[itemIdx] = { ...targetItem, isVeg: !targetItem.isVeg };
      return copy;
    });
  };

  const handleItemSelectToggle = (catIdx: number, itemIdx: number) => {
    setCategories((prev) => {
      const copy = [...prev];
      const targetCat = copy[catIdx];
      if (!targetCat) return prev;
      const targetItem = targetCat.items[itemIdx];
      if (!targetItem) return prev;
      targetCat.items[itemIdx] = { ...targetItem, selected: !targetItem.selected };
      return copy;
    });
  };

  const handleCategorySelectToggle = (catIdx: number) => {
    setCategories((prev) => {
      const copy = [...prev];
      const targetCat = copy[catIdx];
      if (!targetCat) return prev;
      const newSelected = !targetCat.selected;
      targetCat.selected = newSelected;
      targetCat.items = targetCat.items.map((it) => ({ ...it, selected: newSelected }));
      return copy;
    });
  };

  const handleItemImageUrlChange = (catIdx: number, itemIdx: number, newUrl: string) => {
    setCategories((prev) => {
      const copy = [...prev];
      const targetCat = copy[catIdx];
      if (!targetCat) return prev;
      const targetItem = targetCat.items[itemIdx];
      if (!targetItem) return prev;
      targetCat.items[itemIdx] = { ...targetItem, imageUrl: newUrl };
      return copy;
    });
  };

  const handleDeleteItem = (catIdx: number, itemIdx: number) => {
    setCategories((prev) => {
      const copy = [...prev];
      const targetCat = copy[catIdx];
      if (!targetCat) return prev;
      targetCat.items.splice(itemIdx, 1);
      return copy.filter((c) => c.items.length > 0);
    });
  };

  const handleAddDish = (catIdx: number) => {
    setCategories((prev) => {
      const copy = [...prev];
      const targetCat = copy[catIdx];
      if (!targetCat) return prev;
      targetCat.items.push({
        name: "New Dish",
        price: 150,
        isVeg: true,
        selected: true,
        imageUrl: getSmartDishImageUrl("New Dish", targetCat.name, true),
      });
      return copy;
    });
  };

  // Total selected dishes count
  const totalSelectedDishes = categories.reduce((total, cat) => {
    return total + cat.items.filter((it) => it.selected !== false).length;
  }, 0);

  // Apply to Database
  const handleApplyToMenu = async () => {
    if (totalSelectedDishes === 0) {
      toast.error("Please select at least 1 dish to import.");
      return;
    }

    setIsApplying(true);
    try {
      // Filter out unselected items
      const payloadCategories = categories
        .map((cat) => ({
          name: cat.name,
          items: cat.items
            .filter((it) => it.selected !== false)
            .map((it) => ({
              name: it.name.trim(),
              description: it.description || null,
              price: it.price,
              isVeg: it.isVeg !== false,
              imageUrl: it.imageUrl || getSmartDishImageUrl(it.name, cat.name, it.isVeg),
            })),
        }))
        .filter((cat) => cat.items.length > 0);

      const res = await fetch("/api/restaurant/ai-menu/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          mode: importMode,
          categories: payloadCategories,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to import menu.");
      }

      toast.success(`🎉 ${totalSelectedDishes} dishes successfully saved to your live digital menu!`, {
        duration: 5000,
      });

      // Clear client caches so live menu refreshes everywhere immediately
      if (typeof window !== "undefined") {
        localStorage.removeItem("menuly_cached_full_menu");
        localStorage.removeItem("menuly_cached_full_menu_ts");
      }
      await qc.invalidateQueries({ queryKey: myMenuQuery.queryKey });
      await qc.refetchQueries({ queryKey: myMenuQuery.queryKey });

      handleReset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save dishes to menu");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !isApplying && onOpenChange(v)}>
      <DialogContent
        className={cn(
          "p-0 overflow-hidden border-border bg-card shadow-2xl transition-all duration-200",
          step === "review" ? "sm:max-w-3xl max-h-[92vh] flex flex-col" : "sm:max-w-lg"
        )}
      >
        {/* Modal Header */}
        <DialogHeader className="p-5 border-b border-border/60 pb-3 shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl border border-border/80 bg-secondary/50 shadow-2xs flex items-center justify-center shrink-0">
                <GeminiIcon size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-black text-base sm:text-lg text-foreground tracking-tight">
                    Smart Menu Digitizer
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-secondary/70 px-2 py-0.5 text-[10px] font-semibold text-foreground/80">
                    <GeminiIcon size={10} /> Gemini Vision
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-normal">
                  Convert physical menu cards, rate boards &amp; pamphlets into a live digital menu
                </p>
              </div>
            </div>

            {step === "review" && (
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold">
                {totalSelectedDishes} Dishes Ready
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: UPLOAD / CAMERA VIEW                                  */}
        {/* ------------------------------------------------------------- */}
        {step === "upload" && (
          <div className="p-6 space-y-4">
            {/* Hidden Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />

            {/* Dropzone Card (Clean, Modern, Slate/Neutral) */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFileSelect(f);
              }}
              className="border border-dashed border-border/90 hover:border-foreground/40 bg-secondary/20 hover:bg-secondary/40 rounded-2xl p-7 text-center space-y-3 cursor-pointer transition-all duration-200 group shadow-2xs"
            >
              <div className="size-12 rounded-xl bg-background border border-border/80 text-muted-foreground group-hover:text-foreground flex items-center justify-center mx-auto shadow-2xs group-hover:scale-105 transition-all">
                <Upload className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm text-foreground">
                  Click to upload menu photo or drag &amp; drop
                </p>
                <p className="text-xs text-muted-foreground">
                  Works with laminated menu cards, pamphlets, printed sheets, or rate boards
                </p>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-medium pt-1">
                <span className="px-1.5 py-0.5 rounded bg-background border border-border/60">JPG</span>
                <span className="px-1.5 py-0.5 rounded bg-background border border-border/60">PNG</span>
                <span className="px-1.5 py-0.5 rounded bg-background border border-border/60">WebP</span>
                <span>• Up to 20MB</span>
              </div>
            </div>

            {/* Camera Option Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full h-10 rounded-xl text-xs font-semibold gap-2 border-border/80 hover:bg-secondary/50 cursor-pointer"
            >
              <Camera className="size-4 text-muted-foreground" /> Take Photo with Phone Camera
            </Button>

            {/* Helpful Clean Minimal Tips Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate font-medium">Flat &amp; well-lit</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2">
                <span className="size-1.5 rounded-full bg-sky-500 shrink-0" />
                <span className="truncate font-medium">Readable prices</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2">
                <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="truncate font-medium">Editable before save</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: SCANNING IN PROGRESS (Optical Scanner with Laser Beam)*/}
        {/* ------------------------------------------------------------- */}
        {step === "scanning" && (
          <div className="p-6 sm:p-8 space-y-5">
            {/* Visual Document Scan Preview with Animated Laser Line */}
            <div className="relative mx-auto w-full max-w-sm rounded-2xl overflow-hidden border border-border/80 bg-background shadow-lift">
              {previewUrl ? (
                <div className="relative h-52 w-full overflow-hidden bg-muted">
                  <img
                    src={previewUrl}
                    alt="Menu Scan"
                    className="size-full object-cover filter brightness-95"
                  />
                  {/* Glowing Laser Scan Beam */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_14px_#38bdf8] animate-scan z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                </div>
              ) : (
                <div className="h-44 w-full flex items-center justify-center bg-secondary/30 relative overflow-hidden">
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_14px_#38bdf8] animate-scan z-10" />
                  <FileText className="size-12 text-muted-foreground/40 animate-pulse" />
                </div>
              )}

              {/* Status Header over preview */}
              <div className="p-3.5 border-t border-border/60 bg-card/95 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <RefreshCw className="size-3.5 animate-spin" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    Analyzing Document...
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/80 px-2 py-0.5 text-[10px] font-semibold text-foreground/80">
                  <GeminiIcon size={10} /> Gemini Vision
                </span>
              </div>
            </div>

            {/* Stepped Progress Checklist */}
            <div className="max-w-sm mx-auto space-y-2 text-xs">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <span className="size-5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                  <Check className="size-3 stroke-[2.5]" />
                </span>
                <span className="text-foreground font-medium">Image resolution &amp; layout mapped</span>
              </div>
              <div className="flex items-center gap-2.5 text-foreground font-medium">
                <span className="size-5 rounded-full bg-sky-500/15 text-sky-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                  <RefreshCw className="size-3 animate-spin" />
                </span>
                <span>{scanStatus || "Extracting dishes, categories &amp; prices..."}</span>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground/60">
                <span className="size-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold shrink-0">
                  3
                </span>
                <span>Building digital menu review</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: REVIEW, EDIT & IMPORT                                 */}
        {/* ------------------------------------------------------------- */}
        {step === "review" && (
          <>
            {/* Scrollable Categories & Dishes List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 max-h-[60vh] no-scrollbar">
              {/* Restaurant Header Banner if found */}
              {detectedRestaurantName && (
                <div className="rounded-2xl bg-orange-500/10 border border-orange-500/30 p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="size-4 text-orange-600" />
                    <span>
                      Detected Header: <strong className="text-foreground">{detectedRestaurantName}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Extracted from cover</span>
                </div>
              )}

              {/* Mode Selector (Append vs Replace) */}
              <div className="rounded-2xl bg-secondary/40 border border-border/70 p-3 space-y-2 text-xs">
                <span className="font-bold text-foreground block">Choose Import Mode:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode("append")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all",
                      importMode === "append"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/70 hover:bg-secondary/80 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs">Append to My Menu</span>
                      {importMode === "append" && <Check className="size-3.5 text-primary" />}
                    </div>
                    <p className="text-[10px] font-normal opacity-80">
                      Keep your existing dishes and add these new ones.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode("replace")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all",
                      importMode === "replace"
                        ? "border-destructive bg-destructive/10 text-destructive font-bold shadow-xs"
                        : "border-border/70 hover:bg-secondary/80 text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs">Replace Whole Menu</span>
                      {importMode === "replace" && <Check className="size-3.5 text-destructive" />}
                    </div>
                    <p className="text-[10px] font-normal opacity-80">
                      Wipe existing dishes and start fresh with this photo.
                    </p>
                  </button>
                </div>
              </div>

              {/* Category Cards with Dishes */}
              <div className="space-y-4">
                {categories.map((cat, catIdx) => (
                  <div
                    key={cat.name + catIdx}
                    className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs"
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={cat.selected !== false}
                          onChange={() => handleCategorySelectToggle(catIdx)}
                          className="size-4 accent-primary rounded cursor-pointer"
                        />
                        <span className="font-bold text-sm text-foreground">{cat.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          ({cat.items.length} dishes)
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddDish(catIdx)}
                        className="h-7 text-xs font-semibold gap-1 text-primary hover:text-primary"
                      >
                        <Plus className="size-3" /> Add Dish
                      </Button>
                    </div>

                    {/* Category Dishes List */}
                    <div className="space-y-2">
                      {cat.items.map((it, itemIdx) => (
                        <div
                          key={it.name + itemIdx}
                          className={cn(
                            "flex items-center justify-between gap-2 p-2 rounded-xl border transition-all text-xs",
                            it.selected !== false
                              ? "border-border/70 bg-card"
                              : "border-border/40 bg-muted/30 opacity-60"
                          )}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={it.selected !== false}
                              onChange={() => handleItemSelectToggle(catIdx, itemIdx)}
                              className="size-3.5 accent-primary rounded cursor-pointer shrink-0"
                            />

                            {/* Official FSSAI Square Veg / Non-Veg Indicator Toggle Button */}
                            <button
                              type="button"
                              onClick={() => handleItemVegToggle(catIdx, itemIdx)}
                              className={cn(
                                "size-5 rounded-xs border-2 flex items-center justify-center p-0.5 shrink-0 transition-transform active:scale-95 cursor-pointer bg-card shadow-2xs",
                                it.isVeg ? "border-emerald-600" : "border-rose-600"
                              )}
                              title={it.isVeg ? "Pure Veg (Tap to switch to Non-Veg)" : "Non-Veg (Tap to switch to Veg)"}
                            >
                              <span
                                className={cn(
                                  "size-2 rounded-full",
                                  it.isVeg ? "bg-emerald-600" : "bg-rose-600"
                                )}
                              />
                            </button>

                            {/* Dish Photo Thumbnail & Link Edit Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setEditingImageItem({
                                  catIdx,
                                  itemIdx,
                                  dishName: it.name,
                                  url: it.imageUrl || getSmartDishImageUrl(it.name, cat.name, it.isVeg),
                                })
                              }
                              className="size-8 rounded-lg overflow-hidden border border-border/80 bg-muted shrink-0 relative group cursor-pointer hover:border-primary transition-colors shadow-2xs"
                              title="Click to change dish photo or paste image link"
                            >
                              <img
                                src={it.imageUrl || getSmartDishImageUrl(it.name, cat.name, it.isVeg)}
                                alt={it.name}
                                className="size-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = getSmartDishImageUrl(it.name, cat.name, it.isVeg);
                                }}
                              />
                              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <LinkIcon className="size-3" />
                              </span>
                            </button>

                            {/* Dish Name Input */}
                            <Input
                              type="text"
                              value={it.name}
                              onChange={(e) => handleItemNameChange(catIdx, itemIdx, e.target.value)}
                              className="h-8 text-xs font-medium rounded-lg bg-secondary/30 border-border/60 flex-1 min-w-[140px]"
                            />
                          </div>

                          {/* Price Input & Delete Button */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="relative w-20">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">
                                ₹
                              </span>
                              <Input
                                type="text"
                                value={it.price}
                                onChange={(e) => handleItemPriceChange(catIdx, itemIdx, e.target.value)}
                                className="h-8 pl-5 text-xs font-mono font-bold rounded-lg bg-secondary/30 border-border/60 text-right"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(catIdx, itemIdx)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Delete dish"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-border/60 bg-secondary/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Scan Another Photo
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isApplying || totalSelectedDishes === 0}
                  onClick={handleApplyToMenu}
                  className="h-10 px-5 rounded-xl font-semibold text-xs gap-2 bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xs flex-1 sm:flex-initial cursor-pointer"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" /> Saving to Live Menu...
                    </>
                  ) : (
                    <>
                      <GeminiIcon size={14} /> Import {totalSelectedDishes} Dishes to Digital Menu
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>

    {/* DISH PHOTO LINK EDITOR DIALOG */}
    <Dialog open={Boolean(editingImageItem)} onOpenChange={(open) => !open && setEditingImageItem(null)}>
      <DialogContent className="sm:max-w-md rounded-2xl p-5 space-y-4">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <GeminiIcon size={16} />
            Dish Photo — {editingImageItem?.dishName}
          </DialogTitle>
        </DialogHeader>

        {editingImageItem && (
          <div className="space-y-3.5">
            <div className="h-40 w-full rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center relative">
              <img
                src={editingImageItem.url || getSmartDishImageUrl(editingImageItem.dishName, null, true)}
                alt={editingImageItem.dishName}
                className="size-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = getSmartDishImageUrl(editingImageItem.dishName, null, true);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <LinkIcon className="size-3 text-orange-500" /> Image Web Link (URL)
              </label>
              <Input
                value={editingImageItem.url}
                onChange={(e) => setEditingImageItem({ ...editingImageItem, url: e.target.value.trim() })}
                placeholder="https://images.unsplash.com/... or any photo link"
                className="h-9 text-xs rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">
                Paste any image URL link, or click "Reset to AI Photo" to let Menuly choose an appetizing photo.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const autoUrl = getSmartDishImageUrl(editingImageItem.dishName, null, true);
                  setEditingImageItem({ ...editingImageItem, url: autoUrl });
                  toast.success("Reset to AI food photo!");
                }}
                className="text-xs rounded-xl"
              >
                <GeminiIcon size={12} className="mr-1.5" /> Auto Food Photo
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  handleItemImageUrlChange(editingImageItem.catIdx, editingImageItem.itemIdx, editingImageItem.url);
                  setEditingImageItem(null);
                  toast.success("Dish photo updated!");
                }}
                className="flex-1 text-xs font-semibold rounded-xl bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
              >
                Save Photo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
