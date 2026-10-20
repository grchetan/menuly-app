import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
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
  applyStarterPreset,
  addCategoryHelper,
  renameCategoryHelper,
  deleteCategoryHelper,
  addDishHelper,
  updateDishHelper,
  deleteDishHelper,
  type Category,
  type MenuItem,
} from "@/lib/restaurant";
import { formatPrice } from "@/lib/config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/my-menu")({
  head: () => ({
    meta: [
      { title: "Easy Menu Setup — Menuly" },
      { name: "description", content: "Create and manage your digital restaurant QR menu." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myMenuQuery),
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
  const { data } = useSuspenseQuery(myMenuQuery);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: myMenuQuery.queryKey });
  const rid = data.restaurant.id;

  // Quick Add State (Single line entry)
  const [quickName, setQuickName] = useState("");
  const [quickPrice, setQuickPrice] = useState("");
  const [quickCatId, setQuickCatId] = useState(data.categories[0]?.id || "");
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Category and Item states
  const [newCat, setNewCat] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [preview, setPreview] = useState(false);
  const [q, setQ] = useState("");
  const [activeCatTab, setActiveCatTab] = useState<string>("all");
  const [filter, setFilter] = useState<"all" | "soldout">("all");
  const [showPresets, setShowPresets] = useState(data.items.length === 0);

  // Custom Dialog States (No Native Browser prompt/confirm)
  const [renamingCat, setRenamingCat] = useState<Category | null>(null);
  const [renameCatValue, setRenameCatValue] = useState("");
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [deletingDish, setDeletingDish] = useState<MenuItem | null>(null);
  const [confirmingPreset, setConfirmingPreset] = useState<string | null>(null);
  const [dishPhotoSummary, setDishPhotoSummary] = useState<string | null>(null);

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

    let targetCatId = quickCatId;
    if (!targetCatId) {
      const firstCat = data.categories[0];
      if (firstCat) {
        targetCatId = firstCat.id;
      } else {
        const cat = await addCategoryHelper(rid, "Main Dishes");
        targetCatId = cat.id;
      }
    }

    setIsQuickAdding(true);
    try {
      await addDishHelper({
        restaurant_id: rid,
        category_id: targetCatId,
        name: quickName.trim(),
        price: priceNum,
        description: "",
        image_url: null,
      });
      toast.success(`Added "${quickName.trim()}" (₹${priceNum})`);
      setQuickName("");
      setQuickPrice("");
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsQuickAdding(false);
    }
  };

  // 1-Click Starter Preset Apply
  const handleApplyPreset = (presetId: string) => {
    if (data.items.length > 0) {
      setConfirmingPreset(presetId);
      return;
    }
    applyStarterPreset(presetId);
    toast.success("Starter menu loaded! You can now adjust names and prices.");
    setShowPresets(false);
    refresh();
  };

  const confirmApplyPreset = () => {
    if (!confirmingPreset) return;
    applyStarterPreset(confirmingPreset);
    toast.success("Starter menu loaded! You can now adjust names and prices.");
    setShowPresets(false);
    setConfirmingPreset(null);
    refresh();
  };

  // Add Category
  const handleAddCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    try {
      const added = await addCategoryHelper(rid, newCat.trim());
      setNewCat("");
      setShowAddCat(false);
      if (!quickCatId) setQuickCatId(added.id);
      toast.success(`Category "${newCat.trim()}" created`);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // Rename Category (Modal Handlers)
  const startRenameCat = (c: Category) => {
    setRenamingCat(c);
    setRenameCatValue(c.name);
  };

  const handleSaveRenameCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingCat || !renameCatValue.trim()) return;
    try {
      await renameCategoryHelper(renamingCat.id, renameCatValue.trim());
      toast.success(`Category renamed to "${renameCatValue.trim()}"`);
      setRenamingCat(null);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // Delete Category (Modal Handlers)
  const startDeleteCat = (c: Category) => {
    setDeletingCat(c);
  };

  const confirmDeleteCat = async () => {
    if (!deletingCat) return;
    try {
      await deleteCategoryHelper(deletingCat.id);
      toast.success(`Category "${deletingCat.name}" deleted`);
      setDeletingCat(null);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const toggleAvail = async (i: MenuItem) => {
    try {
      await updateDishHelper(i.id, { available: !i.available });
      toast.success(
        i.available ? `"${i.name}" marked Sold Out` : `"${i.name}" marked In Stock`
      );
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // Delete Dish (Modal Handlers)
  const startDeleteItem = (i: MenuItem) => {
    setDeletingDish(i);
  };

  const confirmDeleteDish = async () => {
    if (!deletingDish) return;
    try {
      await deleteDishHelper(deletingDish.id);
      toast.success(`"${deletingDish.name}" removed`);
      setDeletingDish(null);
      refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDuplicateItem = async (i: MenuItem) => {
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
    if (!draft) return;
    const price = Number(draft.price);
    if (!draft.name.trim() || isNaN(price) || price < 0) {
      toast.error("Enter a dish name and a valid price");
      return;
    }

    try {
      if (draft.id) {
        await updateDishHelper(draft.id, {
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          price,
          category_id: draft.category_id,
          image_url: draft.image_url,
          available: draft.available,
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

        {/* 1-Click Starter Menu Presets (Collapse/Expand) */}
        {showPresets && (
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs animate-rise">
            <div className="mb-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-accent" />
                  <h3 className="text-sm font-bold text-foreground">1-Click Starter Menus</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pick a cuisine to populate categories and authentic dishes instantly.
                </p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowPresets(false)}>
                Dismiss
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {STARTER_PRESETS.map((p) => (
                <div
                  key={p.id}
                  className="group flex flex-col justify-between rounded-xl border border-border/70 bg-background p-3.5 transition-all hover:border-primary/50"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{p.icon}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.2 text-[9px] font-bold text-muted-foreground">
                        {p.badge}
                      </span>
                    </div>
                    <h4 className="mt-1.5 text-xs font-bold text-foreground">{p.title}</h4>
                    <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{p.description}</p>
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 w-full text-xs font-semibold h-7"
                    onClick={() => handleApplyPreset(p.id)}
                  >
                    Load Menu
                  </Button>
                </div>
              ))}
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

          <form onSubmit={handleQuickAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.8fr_120px_1.4fr_auto] gap-3">
            <Input
              placeholder="Dish Name (e.g. Masala Dosa, Paneer Tikka)"
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
              value={quickCatId}
              onChange={(e) => {
                if (e.target.value === "__NEW__") {
                  setShowAddCat(true);
                } else {
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
            <Button type="submit" disabled={isQuickAdding} className="font-bold text-xs sm:text-sm h-11 px-5 rounded-xl gap-1.5 shadow-xs shrink-0 whitespace-nowrap bg-primary text-primary-foreground">
              <Plus className="size-4" /> Add Dish
            </Button>
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
                <Button type="submit" className="font-bold text-xs sm:text-sm h-11 px-5 rounded-xl">
                  Create Category
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddCat(false)} className="h-11 px-4 rounded-xl text-xs font-semibold">
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Main Grid: Menu Management + Live Customer Phone Preview */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left Column: Categories & Dishes */}
          <div className="space-y-4">
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
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setActiveCatTab("all")}
                className={cn(
                  "shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs",
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
                      "shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-xs",
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
                className="shrink-0 rounded-xl border border-dashed border-primary/50 bg-primary/5 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors"
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
                    {/* Category Header with Clean Padding */}
                    <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 sm:px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-foreground">{c.name}</span>
                        <span className="rounded-full bg-secondary px-2 py-0.2 text-[10px] font-bold text-muted-foreground">
                          {data.items.filter((i) => i.category_id === c.id).length} items
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Rename"
                          className="size-7 sm:size-8"
                          onClick={() => startRenameCat(c)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete Category"
                          className="size-7 sm:size-8 text-destructive hover:bg-destructive/10"
                          onClick={() => startDeleteCat(c)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs font-semibold gap-1 px-2.5"
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
                                  <span className="rounded-full bg-primary/10 px-2 py-0.2 text-[9px] font-bold text-primary">
                                    Menu Item
                                  </span>
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
                                onClick={() => toggleAvail(i)}
                                title={i.available ? "Click to mark as Sold Out" : "Click to mark as In Stock"}
                                className={cn(
                                  "group shrink-0 whitespace-nowrap inline-flex items-center gap-2 rounded-xl px-2.5 py-1 text-xs font-bold transition-all border select-none shadow-2xs",
                                  i.available
                                    ? "bg-veg/10 border-veg/30 text-veg hover:bg-veg/15"
                                    : "bg-muted/70 border-border text-muted-foreground hover:bg-muted"
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
                                  {i.available ? "In Stock" : "Sold Out"}
                                </span>
                              </button>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 sm:size-8 rounded-lg"
                                  title="Duplicate"
                                  onClick={() => handleDuplicateItem(i)}
                                >
                                  <Copy className="size-3.5" />
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
          </div>

          {/* Right Column: Sticky Live Customer Phone Preview */}
          <div className="hidden lg:block">
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
              <div className="relative mx-auto h-[min(580px,calc(100vh-150px))] w-full max-w-[310px] rounded-[2.8rem] border-[8px] border-foreground/90 bg-card shadow-lift flex flex-col overflow-hidden">
                {/* Top Status Bar & Dynamic Island */}
                <div className="flex-none bg-background px-5 pt-3 pb-1 flex items-center justify-between text-[10px] font-bold text-foreground/80 z-20 border-b border-border/40 select-none">
                  <span>9:41</span>
                  <div className="h-3.5 w-20 rounded-full bg-foreground flex items-center justify-center">
                    <span className="size-1 rounded-full bg-primary/70 inline-block mr-1"></span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-mono">
                    <span>5G</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Scrollable Customer Menu Screen */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  <MenuView menu={data} compact />
                </div>

                {/* Bottom Home Indicator Bar */}
                <div className="flex-none bg-background/95 py-1.5 flex justify-center z-20 border-t border-border/40 select-none">
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

        {/* Mobile Floating Preview Button */}
        <div className="fixed bottom-5 right-5 z-40 lg:hidden">
          <Button
            onClick={() => setPreview(true)}
            className="rounded-full shadow-lift gap-2 font-bold px-4 py-2.5 h-12 text-sm bg-foreground text-background border-2 border-primary/40 hover:bg-foreground/90"
          >
            <Smartphone className="size-4 text-accent" />
            <span>Preview Live Menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Live View Dialog */}
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[92vh] max-w-sm sm:max-w-md overflow-hidden p-0 rounded-3xl border-4 border-foreground/90">
          <div className="p-3 border-b flex items-center justify-between bg-card">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Smartphone className="size-3.5 text-primary" /> Customer Mobile Preview
            </span>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setPreview(false)}>
              Close
            </Button>
          </div>
          <div className="max-h-[calc(90vh-60px)] overflow-y-auto no-scrollbar pb-6">
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
                  onClick={() => setDraft(null)}
                  className="h-11 px-5 rounded-xl font-semibold"
                >
                  Cancel
                </Button>
                <Button type="submit" className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                  Save Dish
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* CUSTOM RENAME CATEGORY MODAL (Replaces browser prompt) */}
      <Dialog open={!!renamingCat} onOpenChange={(open) => !open && setRenamingCat(null)}>
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
                onClick={() => setRenamingCat(null)}
                className="h-11 px-5 rounded-xl font-medium"
              >
                Cancel
              </Button>
              <Button type="submit" className="h-11 px-6 rounded-xl font-bold bg-primary text-primary-foreground shadow-xs">
                Save Name
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CUSTOM DELETE CATEGORY CONFIRMATION MODAL (Replaces browser confirm) */}
      <Dialog open={!!deletingCat} onOpenChange={(open) => !open && setDeletingCat(null)}>
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
              onClick={() => setDeletingCat(null)}
              className="h-11 px-5 rounded-xl font-medium"
            >
              Keep Category
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteCat}
              className="h-11 px-5 rounded-xl font-bold shadow-xs"
            >
              Delete Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CUSTOM DELETE DISH CONFIRMATION MODAL (Replaces browser confirm) */}
      <Dialog open={!!deletingDish} onOpenChange={(open) => !open && setDeletingDish(null)}>
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
              onClick={() => setDeletingDish(null)}
              className="h-11 px-5 rounded-xl font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteDish}
              className="h-11 px-5 rounded-xl font-bold shadow-xs"
            >
              Remove Dish
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
              This will load a complete curated starter pack into your menu. Current demo dishes will be replaced.
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
              onClick={confirmApplyPreset}
              className="h-11 px-5 rounded-xl font-bold bg-primary text-primary-foreground shadow-xs"
            >
              Load Starter Pack
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
