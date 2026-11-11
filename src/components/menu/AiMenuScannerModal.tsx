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

export interface ScannedMenuItem {
  name: string;
  description?: string | null;
  price: number;
  isVeg: boolean;
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

      // Mark all items and categories selected by default
      const initializedCategories: ScannedCategory[] = result.categories.map((c: any) => ({
        ...c,
        selected: true,
        items: (c.items || []).map((it: any) => ({
          ...it,
          selected: true,
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
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h3 className="font-serif font-black text-lg text-foreground">
                  AI Smart Menu Scanner
                </h3>
                <p className="text-[11px] text-muted-foreground font-normal">
                  Upload any physical menu photo or pamphlet to create a digital menu instantly.
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

            {/* Dropzone Card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFileSelect(f);
              }}
              className="border-2 border-dashed border-orange-500/40 hover:border-orange-500 bg-orange-500/5 hover:bg-orange-500/10 rounded-3xl p-8 text-center space-y-3 cursor-pointer transition-all duration-200 group"
            >
              <div className="size-14 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="size-7" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-foreground">
                  Click to Upload Menu Photo or Drag &amp; Drop
                </p>
                <p className="text-xs text-muted-foreground">
                  Works with laminated menu cards, pamphlets, printed sheets, or rate boards
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                Supports JPG, PNG, WebP (up to 20MB)
              </p>
            </div>

            {/* Camera Option Button */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 rounded-2xl h-11 text-xs font-bold gap-2 border-border/80"
              >
                <Camera className="size-4 text-primary" /> Take Photo with Phone Camera
              </Button>
            </div>

            {/* Helpful Tips Box */}
            <div className="rounded-2xl bg-secondary/40 p-3.5 border border-border/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <HelpCircle className="size-3.5 text-primary" />
                <span>Tips for 100% Accurate AI Scanning:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-0.5">
                <li>Make sure dish names and price numbers are clearly visible in good lighting.</li>
                <li>Avoid strong glare, dark shadows, or angled perspectives.</li>
                <li>You can review, edit prices, or remove any dish before saving.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: SCANNING IN PROGRESS                                  */}
        {/* ------------------------------------------------------------- */}
        {step === "scanning" && (
          <div className="p-10 text-center space-y-6">
            <div className="relative size-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
              <div className="absolute inset-2 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                <Sparkles className="size-7 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-base text-foreground">
                Digitizing Menu with Gemini Vision AI
              </h4>
              <p className="text-xs text-muted-foreground font-medium animate-pulse">
                {scanStatus}
              </p>
            </div>

            <div className="max-w-xs mx-auto p-3 rounded-2xl bg-secondary/50 border border-border/60 text-[11px] text-muted-foreground">
              ⚡ Powered by Google Gemini 2026 Multimodal Engine. Reading food categories, prices &amp; descriptions...
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
                  className="rounded-xl font-bold text-xs gap-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-soft flex-1 sm:flex-initial"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" /> Saving to Live Menu...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" /> Import {totalSelectedDishes} Dishes to Digital Menu
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
