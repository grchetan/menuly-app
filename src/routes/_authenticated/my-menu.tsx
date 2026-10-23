import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Trash2,
  Eye,
  Upload,
  X,
  Copy,
  Search,
  CheckCheck,
  Sparkles,
  QrCode,
  ArrowRight,
  CheckCircle2,
  UtensilsCrossed,
  ChefHat,
  Smartphone,
  ExternalLink,
  FolderEdit,
  AlertTriangle,
  FolderPlus,
  Flame,
  Coffee,
  Store,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MenuView } from "@/components/MenuView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  myMenuQuery,
  uploadImage,
  STARTER_PRESETS,
  applyPresetHelper,
  addCategoryHelper,
  renameCategoryHelper,
  deleteCategoryHelper,
  addDishHelper,
  updateDishHelper,
  deleteDishHelper,
  type Category,
  type MenuItem,
  type FullMenu,
} from "@/lib/restaurant";
import { formatPrice } from "@/lib/config";
import { cn } from "@/lib/utils";

function MyMenuSkeleton() {
  return (
    <AppShell title="Easy Menu Setup">
      <div className="space-y-6 max-w-6xl mx-auto py-6">
        {/* Animated Loading Header Banner */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 sm:h-6 w-48 sm:w-60 rounded-xl bg-muted animate-pulse" />
            <div className="h-3.5 w-64 sm:w-80 rounded-lg bg-muted/60 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="size-4 animate-spin text-primary" />
            <span className="text-xs font-bold text-muted-foreground hidden sm:inline">Loading Menu Studio...</span>
          </div>
        </div>

        {/* Quick Add Skeleton Bar */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
          <div className="h-4 w-36 rounded bg-muted animate-pulse" />
          <div className="h-11 rounded-xl bg-muted/50 animate-pulse" />
        </div>

        {/* Main Grid Skeleton */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_300px] min-w-0">
          <div className="min-w-0 space-y-4">
            <div className="h-11 rounded-xl bg-muted/60 animate-pulse" />
            <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
              <div className="h-5 w-40 rounded bg-muted animate-pulse" />
              <div className="h-20 rounded-xl bg-muted/40 animate-pulse" />
              <div className="h-20 rounded-xl bg-muted/40 animate-pulse" />
              <div className="h-20 rounded-xl bg-muted/40 animate-pulse" />
            </div>
          </div>
          <div className="hidden lg:flex h-[560px] rounded-[2.8rem] border-8 border-foreground/10 bg-card/60 p-4 animate-pulse flex-col justify-between">
            <div className="h-6 w-32 mx-auto rounded-full bg-muted/60" />
            <div className="space-y-3 text-center">
              <div className="size-16 mx-auto rounded-2xl bg-muted/60" />
              <div className="h-4 w-40 mx-auto rounded bg-muted/60" />
            </div>
            <div className="h-10 rounded-xl bg-muted/60" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/_authenticated/my-menu")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Easy Menu Setup — Menuly" },
      { name: "description", content: "Create and manage your digital restaurant QR menu." },
    ],
  }),
  pendingComponent: MyMenuSkeleton,
  component: MyMenu,
});

type Draft = {
  id?: string;
  category_id: string;
  name: string;
  description: string;
  price: string;
  image_url: string | null;
  is_veg: boolean;
  available: boolean;
};

function MyMenu() {
  const { data, isLoading } = useQuery(myMenuQuery);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: myMenuQuery.queryKey });

  // Quick Add State (Single line entry with optional description)
  const [quickName, setQuickName] = useState("");
  const [quickPrice, setQuickPrice] = useState("");
  const [quickDesc, setQuickDesc] = useState("");
  const [quickCatId, setQuickCatId] = useState(data?.categories?.[0]?.id || "");
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Category and Item states
  const [newCat, setNewCat] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [preview, setPreview] = useState(false);
  const [q, setQ] = useState("");
  const [activeCatTab, setActiveCatTab] = useState<string>("all");
  const [filter, setFilter] = useState<"all" | "soldout">("all");
  const [showPresets, setShowPresets] = useState(Boolean(data?.items?.length === 0));

  // Custom Dialog States (No Native Browser prompt/confirm)
  const [renamingCat, setRenamingCat] = useState<Category | null>(null);
  const [renameCatValue, setRenameCatValue] = useState("");
  const [isRenamingCat, setIsRenamingCat] = useState(false);

  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  const [deletingDish, setDeletingDish] = useState<MenuItem | null>(null);
  const [isDeletingDish, setIsDeletingDish] = useState(false);

  const [isAddingCat, setIsAddingCat] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [duplicatingItemId, setDuplicatingItemId] = useState<string | null>(null);

  const [confirmingPreset, setConfirmingPreset] = useState<string | null>(null);
  const [applyingPresetId, setApplyingPresetId] = useState<string | null>(null);
  const [dishPhotoSummary, setDishPhotoSummary] = useState<string | null>(null);

  useEffect(() => {
    if (data?.items && data.items.length === 0) {
      setShowPresets(true);
    }
  }, [data?.items?.length]);

  useEffect(() => {
    if (data && data.categories.length > 0 && !quickCatId) {
      const firstCat = data.categories[0];
      if (firstCat) {
        setQuickCatId(firstCat.id);
      }
    }
  }, [data?.categories, quickCatId]);

  if (isLoading) {
    return <MyMenuSkeleton />;
  }

  if (!data || !data.restaurant) {
    return (
      <AppShell title="My Menu">
        <div className="rounded-2xl border bg-card p-12 text-center space-y-4">
          <p className="text-muted-foreground text-sm">No restaurant menu found.</p>
          <Button asChild size="sm">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const rid = data.restaurant.id;

  const soldOut = data.items.filter((i) => !i.available).length;

  const match = (i: MenuItem) =>
    i.name.toLowerCase().includes(q.toLowerCase()) &&
    (filter === "all" || (filter === "soldout" && !i.available)) &&
    (activeCatTab === "all" || i.category_id === activeCatTab);

  // Quick Add inline handler
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      toast.error("Please enter a dish name");
      return;
    }
    const priceNum = Number(quickPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price in ₹");
      return;
    }

    setIsQuickAdding(true);
    try {
      let targetCatId = quickCatId;
      let createdCat: Category | null = null;

      // If user typed a new category name in the inline field, auto-create it first!
      if (newCat.trim()) {
        const cat = await addCategoryHelper(rid, newCat.trim());
        targetCatId = cat.id;
        createdCat = cat;
        setNewCat("");
        setShowAddCat(false);
        setQuickCatId(cat.id);
      } else if (!targetCatId || targetCatId === "__NEW__" || !data.categories.some((c) => c.id === targetCatId)) {
        const firstCat = data.categories[0];
        if (firstCat) {
          targetCatId = firstCat.id;
        } else {
          const cat = await addCategoryHelper(rid, "Main Dishes");
          targetCatId = cat.id;
          createdCat = cat;
          setQuickCatId(cat.id);
        }
      }

      const newItem = await addDishHelper({
        restaurant_id: rid,
        category_id: targetCatId,
        name: quickName.trim(),
        price: priceNum,
        description: quickDesc.trim() || "",
        image_url: null,
      });

      // Optimistic cache update for instantaneous 0ms feedback!
      qc.setQueryData(myMenuQuery.queryKey, (old: typeof data | undefined) => {
        if (!old) return old;
        return {
          ...old,
          categories: createdCat && !old.categories.some((c) => c.id === createdCat!.id)
            ? [...old.categories, createdCat]
            : old.categories,
          items: [...old.items.filter((i) => i.id !== newItem.id), newItem],
        };
      });

      toast.success(`Added "${quickName.trim()}" (₹${priceNum})`);
      setQuickName("");
      setQuickPrice("");
      setQuickDesc("");
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsQuickAdding(false);
    }
  };

  // 1-Click Starter Preset Apply (Saved directly to live PostgreSQL database)
  const handleApplyPreset = async (presetId: string) => {
    if (data.items.length > 0) {
      setConfirmingPreset(presetId);
      return;
    }
    setApplyingPresetId(presetId);
    try {
      await applyPresetHelper(presetId);
      toast.success("Starter menu pack loaded! You can now adjust names and prices.");
      setShowPresets(false);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setApplyingPresetId(null);
    }
  };

  const confirmApplyPreset = async () => {
    if (!confirmingPreset) return;
    setApplyingPresetId(confirmingPreset);
    try {
      await applyPresetHelper(confirmingPreset);
      toast.success("Starter menu pack loaded! You can now adjust names and prices.");
      setShowPresets(false);
      setConfirmingPreset(null);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setApplyingPresetId(null);
    }
  };

  // Add Category
  const handleAddCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim() || isAddingCat) return;
    setIsAddingCat(true);
    try {
      const added = await addCategoryHelper(rid, newCat.trim());
      setNewCat("");
      setShowAddCat(false);
      if (!quickCatId) setQuickCatId(added.id);
      toast.success(`Category "${newCat.trim()}" created`);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsAddingCat(false);
    }
  };

  // Rename Category (Modal Handlers)
  const startRenameCat = (c: Category) => {
    setRenamingCat(c);
    setRenameCatValue(c.name);
  };

  const handleSaveRenameCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingCat || !renameCatValue.trim() || isRenamingCat) return;
    const targetId = renamingCat.id;
    const newName = renameCatValue.trim();
    setIsRenamingCat(true);

    // Optimistic in-memory update for 0ms delay
    qc.setQueryData(myMenuQuery.queryKey, (old: FullMenu | undefined) => {
      if (!old) return old;
      return {
        ...old,
        categories: old.categories.map((c) => (c.id === targetId ? { ...c, name: newName } : c)),
      };
    });

    try {
      await renameCategoryHelper(targetId, newName);
      toast.success(`Category renamed to "${newName}"`);
      setRenamingCat(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsRenamingCat(false);
      refresh();
    }
  };

  // Delete Category (Modal Handlers)
  const startDeleteCat = (c: Category) => {
    setDeletingCat(c);
  };

  const confirmDeleteCat = async () => {
    if (!deletingCat || isDeletingCat) return;
    const targetId = deletingCat.id;
    const targetName = deletingCat.name;
    setIsDeletingCat(true);

    // Optimistic instant UI update: remove category and its items from memory immediately
    qc.setQueryData(myMenuQuery.queryKey, (old: FullMenu | undefined) => {
      if (!old) return old;
      return {
        ...old,
        categories: old.categories.filter((c) => c.id !== targetId),
        items: old.items.filter((item) => item.category_id !== targetId),
      };
    });

    // Close modal right away so user sees instant result
    setDeletingCat(null);
    toast.success(`Category "${targetName}" deleted`);

    try {
      await deleteCategoryHelper(targetId);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsDeletingCat(false);
      refresh();
    }
  };

  const toggleAvail = async (i: MenuItem) => {
    if (togglingItemId === i.id) return;
    const newAvailable = !i.available;
    setTogglingItemId(i.id);

    // Optimistic instant toggle in memory
    qc.setQueryData(myMenuQuery.queryKey, (old: FullMenu | undefined) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((item) =>
          item.id === i.id ? { ...item, available: newAvailable } : item
        ),
      };
    });

    toast.success(
      newAvailable ? `"${i.name}" marked In Stock` : `"${i.name}" marked Sold Out`
    );

    try {
      await updateDishHelper(i.id, { available: newAvailable });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setTogglingItemId(null);
      refresh();
    }
  };

  // Delete Dish (Modal Handlers)
  const startDeleteItem = (i: MenuItem) => {
    setDeletingDish(i);
  };

  const confirmDeleteDish = async () => {
    if (!deletingDish || isDeletingDish) return;
    const targetId = deletingDish.id;
    const targetName = deletingDish.name;
    setIsDeletingDish(true);

    // Optimistic instant UI update: remove item from memory immediately
    qc.setQueryData(myMenuQuery.queryKey, (old: FullMenu | undefined) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.filter((item) => item.id !== targetId),
      };
    });

    // Close modal right away so user sees instant result
    setDeletingDish(null);
    toast.success(`"${targetName}" removed`);

    try {
      await deleteDishHelper(targetId);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsDeletingDish(false);
      refresh();
    }
  };

  const handleDuplicateItem = async (i: MenuItem) => {
    if (duplicatingItemId === i.id) return;
    setDuplicatingItemId(i.id);
    try {
      await addDishHelper({
        restaurant_id: rid,
        category_id: i.category_id,
        name: `${i.name} (Copy)`,
        price: i.price,
        description: i.description ?? "",
        image_url: i.image_url,
      });
      toast.success(`Duplicated "${i.name}"`);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDuplicatingItemId(null);
    }
  };

  const openNew = (category_id: string) => {
    setDishPhotoSummary(null);
    setDraft({
      category_id,
      name: "",
      description: "",
      price: "",
      image_url: null,
      is_veg: true,
      available: true,
    });
  };

  const openEdit = (i: MenuItem) => {
    setDishPhotoSummary(null);
    setDraft({
      id: i.id,
      category_id: i.category_id,
      name: i.name,
      description: i.description ?? "",
      price: String(i.price),
      image_url: i.image_url,
      is_veg: i.is_veg,
      available: i.available,
    });
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || isSavingItem) return;
    const price = Number(draft.price);
    if (!draft.name.trim() || isNaN(price) || price < 0) {
      toast.error("Enter a dish name and a valid price");
      return;
    }

    setIsSavingItem(true);
    try {
      if (draft.id) {
        await updateDishHelper(draft.id, {
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          price,
          category_id: draft.category_id,
          image_url: draft.image_url,
          available: draft.available,
          is_veg: draft.is_veg,
        });
        toast.success("Dish updated");
      } else {
        await addDishHelper({
          restaurant_id: rid,
          category_id: draft.category_id,
          name: draft.name.trim(),
          description: draft.description.trim() || undefined,
          price,
          image_url: draft.image_url,
        });
        toast.success("Dish added");
      }
      setDraft(null);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSavingItem(false);
    }
  };

  return (
    <AppShell
      title="Easy Menu Studio"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
            className="gap-1.5 text-xs font-semibold"
          >
            <Sparkles className="size-3.5 text-accent" />
            1-Click Menus
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden gap-1.5 text-xs font-semibold"
            onClick={() => setPreview(true)}
          >
            <Smartphone className="size-3.5" /> Mobile View
          </Button>
          <Button asChild size="sm" className="gap-1.5 text-xs font-semibold">
            <Link to="/qr">
              <QrCode className="size-3.5" /> Print QR
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Slim Minimalist 3-Step Setup Bar */}
        <div className="rounded-xl border border-border/70 bg-card p-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-veg text-[10px] font-bold text-white">✓</span>
              <span className="font-bold text-foreground">Restaurant:</span>
              <span className="text-muted-foreground truncate">{data.restaurant.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
              <span className="font-bold text-foreground">Dishes:</span>
              <span className="text-muted-foreground">{data.items.length} dishes live</span>
            </div>
            <Link to="/qr" className="flex items-center gap-1.5 font-bold text-primary hover:underline self-start sm:self-auto">
              <QrCode className="size-3.5" /> Step 3: Print Table QR →
            </Link>
          </div>
        </div>

        {/* 1-Click Starter Menu Presets (Modern Executive Cuisine Packs) */}
        {showPresets && (
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md p-5 sm:p-6 shadow-lift animate-rise">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-accent/20 flex items-center justify-center text-accent-foreground">
                    <Sparkles className="size-4" />
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">1-Click Starter Menu Packs</h3>
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                    Instant Setup
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a curated cuisine to instantly populate your categories and dishes. You can customize prices and items anytime.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground self-start sm:self-auto cursor-pointer"
                onClick={() => setShowPresets(false)}
              >
                Dismiss Pack
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {STARTER_PRESETS.map((p) => {
                const isLoadingThis = applyingPresetId === p.id;
                const isAnyLoading = Boolean(applyingPresetId);

                return (
                  <div
                    key={p.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-background/80 p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-soft"
                  >
                    <div>
                      {/* Top Header: Culinary Icon & Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={cn(
                            "size-10 rounded-xl flex items-center justify-center shadow-xs border transition-transform duration-200 group-hover:scale-105",
                            p.id === "dhaba" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
                            p.id === "cafe" && "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
                            p.id === "south_indian" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                            p.id === "street_food" && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                          )}
                        >
                          {p.id === "dhaba" && <Flame className="size-5" />}
                          {p.id === "cafe" && <Coffee className="size-5" />}
                          {p.id === "south_indian" && <UtensilsCrossed className="size-5" />}
                          {p.id === "street_food" && <Store className="size-5" />}
                        </div>
                        <span className="rounded-full bg-secondary/80 border border-border/60 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground tracking-wide">
                          {p.badge}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h4 className="mt-3 font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {p.title}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {p.description}
                      </p>

                      {/* Sample Dishes Badges */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {p.items.slice(0, 3).map((it, idx) => (
                          <span
                            key={idx}
                            className="inline-block rounded-md bg-secondary/70 px-2 py-0.5 text-[10px] font-semibold text-foreground/80 truncate max-w-[120px]"
                          >
                            {it.name}
                          </span>
                        ))}
                        {p.items.length > 3 && (
                          <span className="inline-block rounded-md bg-secondary/40 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            +{p.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      size="sm"
                      disabled={isAnyLoading}
                      className="mt-4 w-full text-xs font-bold h-9 rounded-xl gap-1.5 shadow-xs transition-all cursor-pointer"
                      onClick={() => handleApplyPreset(p.id)}
                    >
                      {isLoadingThis ? (
                        <>
                          <RefreshCw className="size-3.5 animate-spin" /> Loading Pack...
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5 text-accent" /> Load Menu Pack
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CLEAN INLINE QUICK-ADD DISH BAR (Spacious, Modern & Fully Responsive) */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
              <span className="text-accent font-bold">⚡</span> Quick Add Dish
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Type dish name and price, then press Enter
            </span>
          </div>

          <form onSubmit={handleQuickAdd} className="space-y-2.5 sm:space-y-3 min-w-0">
            {/* Row 1: Dish Name, Price, and Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_120px_minmax(0,1.5fr)] gap-2.5 sm:gap-3 min-w-0">
              <Input
                placeholder="Dish Name (e.g. Masala Dosa, Paneer Tikka, Chai)"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="bg-background text-sm font-medium h-11 px-4 rounded-xl border-border"
                required
              />
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground select-none">₹</span>
                <Input
                  type="number"
                  min="1"
                  placeholder="Price"
                  value={quickPrice}
                  onChange={(e) => setQuickPrice(e.target.value)}
                  className="pl-7 bg-background font-bold text-sm h-11 rounded-xl border-border"
                  required
                />
              </div>
              <select
                value={quickCatId || (data.categories[0]?.id ?? "__NEW__")}
                onChange={(e) => {
                  if (e.target.value === "__NEW__") {
                    setShowAddCat(true);
                    setQuickCatId("__NEW__");
                  } else {
                    setShowAddCat(false);
                    setQuickCatId(e.target.value);
                  }
                }}
                className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-xs sm:text-sm font-semibold truncate cursor-pointer"
              >
                {data.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="__NEW__">+ Add New Category...</option>
              </select>
            </div>

            {/* Row 2: Optional Description & Add Dish Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <Input
                placeholder="Description (optional) e.g. Steaming hot aromatic spiced tea brewed with ginger & cardamom"
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
                className="bg-background text-xs sm:text-sm font-normal h-11 px-4 rounded-xl border-border flex-1 w-full"
              />
              <Button
                type="submit"
                disabled={isQuickAdding || !quickName.trim()}
                className="w-full sm:w-auto font-bold text-xs sm:text-sm h-11 px-6 rounded-xl gap-1.5 shadow-xs shrink-0 whitespace-nowrap bg-primary text-primary-foreground cursor-pointer"
              >
                {isQuickAdding ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" /> Add Dish
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Inline Add Category Form if triggered */}
          {showAddCat && (
            <form onSubmit={handleAddCat} className="mt-4 flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-border/60 animate-rise">
              <Input
                placeholder="New Category Name (e.g. Desserts, Beverages)"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="bg-background text-sm h-11 px-4 rounded-xl border-border flex-1"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isAddingCat || !newCat.trim()}
                  className="font-bold text-xs sm:text-sm h-11 px-5 rounded-xl gap-1.5 cursor-pointer"
                >
                  {isAddingCat ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Category"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddCat(false)} className="h-11 px-4 rounded-xl text-xs font-semibold cursor-pointer">
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Main Grid: Menu Management + Live Customer Phone Preview */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_300px] min-w-0 pb-28 lg:pb-8">
          {/* Left Column: Categories & Dishes */}
          <div className="min-w-0 space-y-4">
            {/* Search Input Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  className="pl-10 h-11 bg-card rounded-xl text-sm border-border"
                  placeholder="Search dishes by name…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <span className="text-xs font-semibold text-muted-foreground px-1 self-end sm:self-center">
                Showing {data.items.filter(match).length} of {data.items.length} dishes
              </span>
            </div>

            {/* DEDICATED HORIZONTAL CATEGORY TABS (Clean, Responsive, No Awkward Stacking) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
              <button
                onClick={() => setActiveCatTab("all")}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer",
                  activeCatTab === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border/80 text-foreground hover:bg-secondary"
                )}
              >
                All ({data.items.length})
              </button>
              {data.categories.map((c) => {
                const count = data.items.filter((i) => i.category_id === c.id).length;
                const isActive = activeCatTab === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCatTab(c.id)}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-card border border-border/80 text-foreground hover:bg-secondary"
                    )}
                  >
                    {c.name} ({count})
                  </button>
                );
              })}
              <button
                onClick={() => setShowAddCat(true)}
                className="shrink-0 whitespace-nowrap rounded-xl border border-dashed border-primary/50 bg-primary/5 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                + Add Category
              </button>
            </div>

            {/* Empty State */}
            {data.categories.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                <ChefHat className="mx-auto size-10 text-muted-foreground opacity-50" />
                <h3 className="mt-2 text-base font-bold">Your Menu is Empty</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                  Pick a 1-click starter template below to populate your menu in 1 second!
                </p>
                <Button size="sm" className="mt-3 font-bold text-xs" onClick={() => setShowPresets(true)}>
                  <Sparkles className="size-3.5 mr-1.5" /> Pick Starter Menu
                </Button>
              </div>
            )}

            {/* Category Sections */}
            {data.categories
              .filter((c) => activeCatTab === "all" || c.id === activeCatTab)
              .map((c) => {
                const categoryItems = data.items.filter((i) => i.category_id === c.id && match(i));
                return (
                  <section key={c.id} className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
                    {/* Category Header with Clean Padding & Responsive Layout */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/60 bg-muted/20 px-3.5 sm:px-5 py-3">
                      {/* Left: Category Title & Item Count Badge */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm sm:text-base font-bold text-foreground truncate">
                          {c.name}
                        </span>
                        <span className="shrink-0 rounded-full bg-secondary/80 border border-border/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {data.items.filter((i) => i.category_id === c.id).length} items
                        </span>
                      </div>

                      {/* Right: Category Operations & Add Dish */}
                      <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-1.5 sm:pt-0 border-t border-border/30 sm:border-t-0">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Rename Category"
                            className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1"
                            onClick={() => startRenameCat(c)}
                          >
                            <Pencil className="size-3" />
                            <span className="text-[11px] sm:hidden">Rename</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete Category"
                            className="h-7 px-2 text-xs font-semibold text-destructive hover:bg-destructive/10 gap-1"
                            onClick={() => startDeleteCat(c)}
                          >
                            <Trash2 className="size-3" />
                            <span className="text-[11px] sm:hidden">Delete</span>
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs font-semibold gap-1 px-2.5 bg-background shadow-xs hover:bg-secondary"
                          onClick={() => openNew(c.id)}
                        >
                          <Plus className="size-3" /> Add Dish
                        </Button>
                      </div>
                    </div>

                    {/* Dish Items List with Clean Responsive Margins */}
                    {categoryItems.length === 0 ? (
                      <div className="p-5 text-center text-xs text-muted-foreground">
                        No dishes in this category. Click "+ Add Dish" or use Quick Add above.
                      </div>
                    ) : (
                      <ul className="divide-y divide-border/60">
                        {categoryItems.map((i) => (
                          <li
                            key={i.id}
                            className={cn(
                              "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 transition-colors hover:bg-muted/10",
                              !i.available && "opacity-60 bg-muted/20"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Thumbnail */}
                              {i.image_url ? (
                                <img
                                  src={i.image_url}
                                  alt={i.name}
                                  className="size-14 rounded-xl object-cover flex-none border border-border/50 shadow-xs"
                                />
                              ) : (
                                <div className="size-14 rounded-xl bg-secondary flex-none flex items-center justify-center text-lg border border-border/40">
                                  🍲
                                </div>
                              )}

                              {/* Details */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm sm:text-base text-foreground truncate">{i.name}</span>
                                </div>
                                {i.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {i.description}
                                  </p>
                                )}
                                <p className="text-xs sm:text-sm font-extrabold text-primary mt-1">
                                  {formatPrice(i.price)}
                                  {!i.available && (
                                    <span className="ml-2 text-xs font-bold text-destructive">
                                      · Sold Out
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Clean Action Cluster (Guaranteed No Stacking or Wrapping) */}
                            <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-1.5 sm:pt-0 border-t sm:border-0 border-border/40 shrink-0">
                              {/* Human-Crafted Tactile Kitchen Availability Switch (No generic AI dots!) */}
                              <button
                                type="button"
                                disabled={togglingItemId === i.id}
                                onClick={() => toggleAvail(i)}
                                title={i.available ? "Click to mark as Sold Out" : "Click to mark as In Stock"}
                                className={cn(
                                  "group shrink-0 whitespace-nowrap inline-flex items-center gap-2 rounded-xl px-2.5 py-1 text-xs font-bold transition-all border select-none shadow-2xs cursor-pointer",
                                  i.available
                                    ? "bg-veg/10 border-veg/30 text-veg hover:bg-veg/15"
                                    : "bg-muted/70 border-border text-muted-foreground hover:bg-muted",
                                  togglingItemId === i.id && "opacity-70 pointer-events-none"
                                )}
                              >
                                {/* Micro Physical Slider */}
                                <span
                                  aria-hidden
                                  className={cn(
                                    "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out p-0.5",
                                    i.available ? "bg-veg" : "bg-muted-foreground/30"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "pointer-events-none inline-block size-3 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out",
                                      i.available ? "translate-x-3" : "translate-x-0"
                                    )}
                                  />
                                </span>
                                <span className="text-[11px] font-extrabold tracking-tight">
                                  {togglingItemId === i.id ? (
                                    <span className="flex items-center gap-1">
                                      <RefreshCw className="size-2.5 animate-spin" /> Saving
                                    </span>
                                  ) : i.available ? (
                                    "In Stock"
                                  ) : (
                                    "Sold Out"
                                  )}
                                </span>
                              </button>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={duplicatingItemId === i.id}
                                  className="size-7 sm:size-8 rounded-lg cursor-pointer"
                                  title="Duplicate"
                                  onClick={() => handleDuplicateItem(i)}
                                >
                                  {duplicatingItemId === i.id ? (
                                    <RefreshCw className="size-3.5 animate-spin" />
                                  ) : (
                                    <Copy className="size-3.5" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 sm:size-8 rounded-lg"
                                  title="Edit Details"
                                  onClick={() => openEdit(i)}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 sm:size-8 rounded-lg text-destructive hover:bg-destructive/10"
                                  title="Delete Dish"
                                  onClick={() => startDeleteItem(i)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}

            {/* Bottom Menu Help & Live Preview Card */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Smartphone className="size-3.5 text-primary" /> Live Customer Experience
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Test and preview how your live digital menu appears on customer phones when scanned.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setPreview(true)}
                  className="flex-1 sm:flex-none h-9 text-xs font-bold gap-1.5 shadow-soft"
                >
                  <Smartphone className="size-3.5 text-accent" /> Preview Live Menu
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-9 text-xs font-semibold gap-1.5 bg-card"
                >
                  <a href={`/menu/${data.restaurant.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" /> Full Tab
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Live Customer Phone Preview */}
          <div className="hidden lg:block min-w-0">
            <div className="sticky top-20 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Smartphone className="size-3.5 text-primary" /> Live Customer View
                </span>
                <a
                  href={`/menu/${data.restaurant.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Full Tab <ExternalLink className="size-3" />
                </a>
              </div>

              {/* Realistic Smartphone Device Chassis */}
              <div className="relative mx-auto h-[min(600px,calc(100vh-140px))] w-full max-w-[300px] xl:max-w-[320px] rounded-[2.5rem] border-[6px] xl:border-[8px] border-foreground/90 bg-card shadow-lift flex flex-col overflow-hidden">
                {/* Top Status Bar & Dynamic Island */}
                <div className="flex-none bg-background px-4 pt-3 pb-1.5 flex items-center justify-between text-[10px] font-bold text-foreground/80 z-20 border-b border-border/40 select-none">
                  <span>9:41</span>
                  <div className="h-3.5 w-16 xl:w-20 rounded-full bg-foreground flex items-center justify-center">
                    <span className="size-1 rounded-full bg-primary/70 inline-block mr-1"></span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-mono">
                    <span>5G</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Scrollable Customer Menu Screen with Smooth, Interactive Scrolling */}
                <div
                  tabIndex={0}
                  aria-label="Scrollable live customer menu preview"
                  className="flex-1 overflow-y-auto overscroll-contain scroll-smooth [scrollbar-width:thin] focus:outline-none"
                >
                  <MenuView menu={data} compact />
                </div>

                {/* Bottom Home Indicator Bar */}
                <div className="flex-none bg-background/95 py-2 flex justify-center z-20 border-t border-border/40 select-none">
                  <div className="h-1 w-24 rounded-full bg-foreground/30" />
                </div>
              </div>

              {/* Quick Jump to QR */}
              <div className="rounded-xl border bg-card p-2.5 text-center shadow-soft">
                <Button asChild size="sm" className="w-full text-xs font-bold">
                  <Link to="/qr">
                    <QrCode className="size-3.5 mr-1.5" /> Download Printable QR Codes →
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Live View Dialog */}
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[92vh] max-w-sm sm:max-w-md overflow-hidden p-0 rounded-3xl border-4 border-foreground/90">
          <div className="p-3.5 border-b flex items-center justify-between bg-card pr-12">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Smartphone className="size-3.5 text-primary" /> Customer Mobile Preview
            </span>
          </div>
          <div className="max-h-[calc(90vh-60px)] overflow-y-auto overscroll-contain scroll-smooth [scrollbar-width:thin] pb-6">
            <MenuView menu={data} compact />
          </div>
        </DialogContent>
      </Dialog>

      {/* Detailed Edit Dish Dialog - Spacious, Fully Responsive & Modern */}
      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="sm:max-w-xl p-6 sm:p-7 rounded-2xl max-h-[92vh] overflow-y-auto no-scrollbar">
          <DialogHeader className="border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <UtensilsCrossed className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold font-display text-foreground">
                  {draft?.id ? "Edit Dish Details" : "Add New Dish"}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set dish name, price, category, photo and inventory status
                </p>
              </div>
            </div>
          </DialogHeader>

          {draft && (
            <form onSubmit={saveItem} className="space-y-5 pt-3">
              {/* Dish Name */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Dish Name *
                  </Label>
                  <span className="text-[11px] font-semibold text-muted-foreground">Dish Details</span>
                </div>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Mysore Special Masala Dosa"
                  className="h-11 px-4 text-sm font-semibold rounded-xl border-border bg-card/60 focus:bg-card focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              {/* Short Description */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Short Description (Ingredients / Taste)
                </Label>
                <Textarea
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="e.g. Crispy golden crepe smeared with spicy red garlic chutney and spiced potato bhaji."
                  className="p-3.5 text-sm rounded-xl border-border bg-card/60 focus:bg-card focus:ring-2 focus:ring-primary/20 leading-relaxed resize-none"
                />
                <p className="text-[11px] text-muted-foreground">
                  Diners love short appetising descriptions mentioning signature flavors or prep style.
                </p>
              </div>

              {/* Price & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Price (₹) *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-muted-foreground select-none">
                      ₹
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                      placeholder="140"
                      className="pl-8 h-11 text-sm font-bold rounded-xl border-border bg-card/60 focus:bg-card focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Category
                  </Label>
                  <select
                    className="h-11 w-full rounded-xl border border-border bg-card/60 px-3.5 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/20 focus:bg-card cursor-pointer"
                    value={draft.category_id}
                    onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                  >
                    {data.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dish Photo - Modern Uploader Card with Compression */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Dish Photo
                </Label>
                <div className="rounded-xl border border-border/70 bg-background/50 p-3.5 flex flex-col sm:flex-row sm:items-center gap-3.5">
                  <div className="relative shrink-0">
                    {draft.image_url ? (
                      <img
                        src={draft.image_url}
                        alt="Dish preview"
                        className="size-20 rounded-xl object-cover border border-border/80 shadow-xs"
                      />
                    ) : (
                      <div className="size-20 rounded-xl bg-secondary/80 flex items-center justify-center text-3xl border border-border/60">
                        🍲
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                              const res = await uploadImage(f, "dish");
                              setDraft((d) => d && { ...d, image_url: res.url });
                              setDishPhotoSummary(res.summary);
                              toast.success(`Photo compressed & saved! (${res.summary})`);
                            } catch (err) {
                              toast.error((err as Error).message);
                            }
                          }}
                        />
                        <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 text-xs font-semibold hover:bg-secondary transition-colors shadow-xs">
                          <Upload className="size-3.5 text-primary" />
                          {draft.image_url ? "Change Photo" : "Upload Photo"}
                        </span>
                      </label>
                      {draft.image_url && (
                        <button
                          type="button"
                          onClick={() => {
                            setDraft({ ...draft, image_url: null });
                            setDishPhotoSummary(null);
                          }}
                          className="text-xs text-destructive hover:underline px-2 py-1 font-medium"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span>Auto-compressed to WebP (~30KB) for instant loading & offline backup</span>
                      {dishPhotoSummary && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-veg/10 px-2 py-0.5 font-bold text-veg">
                          ⚡ {dishPhotoSummary}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* In-Stock Switch Row */}
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 p-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">Available for Orders</p>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        draft.available ? "bg-veg/15 text-veg" : "bg-destructive/15 text-destructive"
                      )}
                    >
                      {draft.available ? "In Stock" : "Sold Out"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Switch off when kitchen runs out of this dish temporarily
                  </p>
                </div>
                <Switch
                  checked={draft.available}
                  onCheckedChange={(v) => setDraft({ ...draft, available: v })}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSavingItem}
                  onClick={() => setDraft(null)}
                  className="h-11 px-5 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingItem}
                  className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm cursor-pointer"
                >
                  {isSavingItem ? (
                    <>
                      <RefreshCw className="size-4 animate-spin mr-1.5" /> Saving Dish...
                    </>
                  ) : (
                    "Save Dish"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* CUSTOM RENAME CATEGORY MODAL (Replaces browser prompt) */}
      <Dialog open={!!renamingCat} onOpenChange={(open) => !open && !isRenamingCat && setRenamingCat(null)}>
        <DialogContent className="sm:max-w-md p-6 sm:p-7 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <FolderEdit className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold font-display text-foreground">Rename Category</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update category name across your digital menu
                </p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSaveRenameCat} className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Category Title *
              </Label>
              <Input
                value={renameCatValue}
                onChange={(e) => setRenameCatValue(e.target.value)}
                className="h-11 px-4 text-sm font-semibold rounded-xl border-border bg-card/60 focus:bg-card focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. South Indian Specials, Desserts"
                autoFocus
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isRenamingCat}
                onClick={() => setRenamingCat(null)}
                className="h-11 px-5 rounded-xl font-medium cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isRenamingCat || !renameCatValue.trim()}
                className="h-11 px-6 rounded-xl font-bold bg-primary text-primary-foreground shadow-xs cursor-pointer"
              >
                {isRenamingCat ? (
                  <>
                    <RefreshCw className="size-4 animate-spin mr-1.5" /> Saving...
                  </>
                ) : (
                  "Save Name"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CUSTOM DELETE CATEGORY CONFIRMATION MODAL (Replaces browser confirm) */}
      <Dialog open={!!deletingCat} onOpenChange={(open) => !open && !isDeletingCat && setDeletingCat(null)}>
        <DialogContent className="sm:max-w-md p-6 sm:p-7 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold font-display text-foreground">Delete Category?</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Removing this category will delete all items inside it
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-foreground">
              Are you sure you want to delete <span className="font-bold underline decoration-destructive/50">"{deletingCat?.name}"</span>?
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              All dishes listed under this category will also be removed from your customer menu immediately.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingCat}
              onClick={() => setDeletingCat(null)}
              className="h-11 px-5 rounded-xl font-medium cursor-pointer"
            >
              Keep Category
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingCat}
              onClick={confirmDeleteCat}
              className="h-11 px-5 rounded-xl font-bold shadow-xs cursor-pointer"
            >
              {isDeletingCat ? (
                <>
                  <RefreshCw className="size-4 animate-spin mr-1.5" /> Deleting...
                </>
              ) : (
                "Delete Category"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CUSTOM DELETE DISH CONFIRMATION MODAL (Replaces browser confirm) */}
      <Dialog open={!!deletingDish} onOpenChange={(open) => !open && !isDeletingDish && setDeletingDish(null)}>
        <DialogContent className="sm:max-w-md p-6 sm:p-7 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold font-display text-foreground">Remove Dish?</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Delete this item from your live menu
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-foreground">
              Are you sure you want to remove <span className="font-bold">"{deletingDish?.name}"</span>?
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              You can always re-add this dish anytime or mark it temporarily Sold Out instead.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingDish}
              onClick={() => setDeletingDish(null)}
              className="h-11 px-5 rounded-xl font-medium cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingDish}
              onClick={confirmDeleteDish}
              className="h-11 px-5 rounded-xl font-bold shadow-xs cursor-pointer"
            >
              {isDeletingDish ? (
                <>
                  <RefreshCw className="size-4 animate-spin mr-1.5" /> Removing...
                </>
              ) : (
                "Remove Dish"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CUSTOM STARTER PACK CONFIRMATION MODAL (Replaces browser confirm) */}
      <Dialog open={!!confirmingPreset} onOpenChange={(open) => !open && setConfirmingPreset(null)}>
        <DialogContent className="sm:max-w-md p-6 sm:p-7 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold font-display text-foreground">Load Starter Menu?</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Populate your menu with pre-built dishes
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-foreground">
              This will load a complete curated starter pack into your menu. Existing dishes will be replaced.
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              You can still rename, edit prices, add photos, or add custom dishes anytime.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmingPreset(null)}
              className="h-11 px-5 rounded-xl font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!!applyingPresetId}
              onClick={confirmApplyPreset}
              className="h-11 px-5 rounded-xl font-bold bg-primary text-primary-foreground shadow-xs gap-2"
            >
              {applyingPresetId ? (
                <>
                  <RefreshCw className="size-4 animate-spin" /> Loading Pack...
                </>
              ) : (
                "Load Starter Pack"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
