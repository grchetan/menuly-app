import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Printer,
  Save,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ShieldCheck,
  Utensils,
  DoorOpen,
  QrCode as QrIcon,
  Info,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Smartphone,
  Eye,
} from "lucide-react";
import type QRCodeStylingType from "qr-code-styling";
import type { Options } from "qr-code-styling";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { myMenuQuery } from "@/lib/restaurant";
import { slugify } from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  getRestaurantTables,
  saveRestaurantTable,
  deleteRestaurantTable,
  bulkGenerateTables,
  type RestaurantTable,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/qr")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "QR Studio & Print Templates — Menuly" },
      { name: "description", content: "Customize, download high-res PNG & SVG, and print professional table stands and wall posters for your restaurant." },
      { property: "og:title", content: "QR Studio & Print Templates — Menuly" },
      { property: "og:description", content: "Customize and print your digital menu QR code." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myMenuQuery),
  component: QrPage,
});

const corners = {
  square: { dots: "square", sq: "square", dot: "square" },
  rounded: { dots: "rounded", sq: "extra-rounded", dot: "dot" },
  dots: { dots: "dots", sq: "dot", dot: "dot" },
} as const;
type Corner = keyof typeof corners;

const presets = [
  { name: "Ink Black", color: "#1a1f1c" },
  { name: "Forest Green", color: "#2e7d52" },
  { name: "Burnt Orange", color: "#c2410c" },
  { name: "Royal Navy", color: "#1e3a5f" },
  { name: "Warm Coffee", color: "#7a3b12" },
];

const bgPresets = [
  { name: "Pure White", color: "#ffffff" },
  { name: "Warm Cream", color: "#fbf6ec" },
  { name: "Soft Sage", color: "#eef5ef" },
];

const PNG_SIZES = [
  { px: 512, label: "Small", hint: "WhatsApp & Socials" },
  { px: 1024, label: "Medium", hint: "Table Tent Cards" },
  { px: 2048, label: "HD Print", hint: "A4 / A3 Posters" },
] as const;

const placementTips = [
  {
    icon: Utensils,
    title: "Table stands (A5)",
    text: "Place stands right beside the napkin or cutlery tray. Guests scan as soon as they sit down.",
  },
  {
    icon: DoorOpen,
    title: "Entrance & Counter (A4)",
    text: "A poster at the entrance lets guests browse while waiting for a table or ordering takeout.",
  },
  {
    icon: QrIcon,
    title: "Always active & dynamic",
    text: "Your QR code always points to your live digital menu. Update prices or items anytime without reprinting.",
  },
];

function QrPage() {
  const { data } = useSuspenseQuery(myMenuQuery);
  const qc = useQueryClient();
  const r = data.restaurant;

  const [fg, setFg] = useState(r.qr_fg || "#1a1f1c");
  const [bg, setBg] = useState(r.qr_bg || "#ffffff");
  const [corner, setCorner] = useState<Corner>(
    (r.qr_corner as Corner) in corners ? (r.qr_corner as Corner) : "rounded"
  );
  const [showLogo, setShowLogo] = useState(true);
  const [pngSize, setPngSize] = useState<512 | 1024 | 2048>(1024);
  const [copied, setCopied] = useState(false);
  const [templateTab, setTemplateTab] = useState<"A5" | "A4">("A5");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Multi-table QR state
  const [viewTab, setViewTab] = useState<"master" | "tables">("master");
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableNum, setNewTableNum] = useState("");
  const [newTableLabel, setNewTableLabel] = useState("");
  const [savingTable, setSavingTable] = useState(false);

  useEffect(() => {
    let alive = true;
    getRestaurantTables(r.id).then((t) => {
      if (alive) {
        setTables(t);
        setLoadingTables(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [r.id]);

  const box = useRef<HTMLDivElement>(null);
  const qr = useRef<QRCodeStylingType | null>(null);

  const url = typeof window !== "undefined" ? `${window.location.origin}/menu/${r.slug}` : "";
  const name = slugify(r.name) || "menu";

  const options = useMemo<Options>(
    () => ({
      width: 320,
      height: 320,
      type: "canvas",
      data: url,
      margin: 8,
      ...(showLogo && r.logo_url ? { image: r.logo_url } : {}),
      qrOptions: { errorCorrectionLevel: "H" },
      imageOptions: { crossOrigin: "anonymous", margin: 6, imageSize: 0.3, hideBackgroundDots: true },
      dotsOptions: { color: fg, type: corners[corner].dots },
      cornersSquareOptions: { color: fg, type: corners[corner].sq },
      cornersDotOptions: { color: fg, type: corners[corner].dot },
      backgroundOptions: { color: bg },
    }),
    [url, r.logo_url, showLogo, fg, bg, corner]
  );

  useEffect(() => {
    let alive = true;
    import("qr-code-styling").then(({ default: QRCodeStyling }) => {
      if (!alive || !box.current) return;
      if (!qr.current) {
        qr.current = new QRCodeStyling(options);
        box.current.innerHTML = "";
        qr.current.append(box.current);
      } else {
        qr.current.update(options);
      }
      qr.current.getRawData("png").then((blob) => {
        if (!alive || !blob) return;
        const fr = new FileReader();
        fr.onload = () => {
          if (alive) setQrDataUrl(fr.result as string);
        };
        fr.readAsDataURL(blob as Blob);
      });
    });
    return () => {
      alive = false;
    };
  }, [options]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Menu link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareLink = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${r.name} Digital Menu`,
          text: `Check out the menu of ${r.name}`,
          url,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    copyLink();
  };

  const downloadPng = (size: number) => {
    import("qr-code-styling").then(({ default: QRCodeStyling }) => {
      const hi = new QRCodeStyling({
        ...options,
        width: size,
        height: size,
        type: "canvas",
      });
      hi.download({ name: `${name}-qr-${size}px`, extension: "png" });
      toast.success(`Downloaded PNG (${size}×${size} px)`);
    });
  };

  const downloadSvg = () => {
    import("qr-code-styling").then(({ default: QRCodeStyling }) => {
      const hi = new QRCodeStyling({
        ...options,
        width: 1200,
        height: 1200,
        type: "svg",
      });
      hi.download({ name: `${name}-qr-vector`, extension: "svg" });
      toast.success("Downloaded Vector SVG (sharp at any size)");
    });
  };

  const saveStyle = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("menuly_token") : null;
      const res = await fetch("/api/restaurant/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ qrFg: fg, qrBg: bg, qrCorner: corner }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save QR style");
      toast.success("QR customization saved successfully");
      qc.invalidateQueries({ queryKey: myMenuQuery.queryKey });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    }
  };

  // Direct print window with A5 / A4 formatted template
  const printTemplate = async (format: "A5" | "A4") => {
    const { default: QRCodeStyling } = await import("qr-code-styling");
    const blob = (await new QRCodeStyling({
      ...options,
      width: format === "A4" ? 1400 : 900,
      height: format === "A4" ? 1400 : 900,
    }).getRawData("png")) as Blob;

    const dataUrl = await new Promise<string>((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.readAsDataURL(blob);
    });

    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Please allow pop-ups to open the print dialog");
      return;
    }

    const esc = (s: string) =>
      s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

    const isA4 = format === "A4";

    w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(r.name)} — QR ${format}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Manrope:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: ${format} portrait; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Manrope', -apple-system, sans-serif;
      background: #ffffff;
      color: #1a1f1c;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10mm;
    }
    .sheet {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      border: 2px dashed #e2e8f0;
      border-radius: 8mm;
      padding: ${isA4 ? "20mm 15mm" : "12mm 10mm"};
      background: #ffffff;
    }
    .logo {
      width: ${isA4 ? "28mm" : "20mm"};
      height: ${isA4 ? "28mm" : "20mm"};
      border-radius: 6mm;
      object-fit: cover;
      margin-bottom: ${isA4 ? "6mm" : "4mm"};
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    h1 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: ${isA4 ? "36pt" : "24pt"};
      font-weight: 700;
      color: ${fg};
      line-height: 1.15;
      margin-bottom: 2mm;
    }
    .prompt {
      font-size: ${isA4 ? "12pt" : "9.5pt"};
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #718096;
      margin-bottom: ${isA4 ? "8mm" : "5mm"};
    }
    .qr-frame {
      display: inline-flex;
      padding: 4mm;
      background: ${bg};
      border-radius: 6mm;
      border: 1px solid #edf2f7;
      box-shadow: 0 8px 24px rgba(0,0,0,0.06);
      margin-bottom: ${isA4 ? "8mm" : "5mm"};
    }
    .qr-img {
      width: ${isA4 ? "95mm" : "70mm"};
      height: ${isA4 ? "95mm" : "70mm"};
      display: block;
    }
    .scan-msg {
      font-size: ${isA4 ? "16pt" : "12pt"};
      font-weight: 700;
      color: ${fg};
      margin-bottom: 2mm;
    }
    .subtext {
      font-size: ${isA4 ? "10pt" : "8pt"};
      color: #718096;
      max-width: 90%;
      line-height: 1.4;
      margin-bottom: 3mm;
    }
    .footer-url {
      font-size: 8pt;
      font-family: monospace;
      color: #a0aec0;
    }
    @media print {
      body { padding: 0; }
      .sheet { border: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    ${
      r.logo_url
        ? `<img class="logo" src="${esc(r.logo_url)}" alt="${esc(r.name)}" />`
        : `<div style="width:${isA4 ? "28mm" : "20mm"};height:${isA4 ? "28mm" : "20mm"};border-radius:6mm;background:${fg};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${isA4 ? "18pt" : "13pt"};margin-bottom:${isA4 ? "6mm" : "4mm"};">${esc(r.name.slice(0, 2).toUpperCase())}</div>`
    }
    <h1>${esc(r.name)}</h1>
    <div class="prompt">Digital Dining Menu</div>
    <div class="qr-frame">
      <img class="qr-img" src="${dataUrl}" alt="QR code" />
    </div>
    <div class="scan-msg">Scan with your phone camera</div>
    <div class="subtext">
      ${r.hours ? `<span>${esc(r.hours)}</span><br>` : ""}
      ${r.address ? `<span>${esc(r.address)}</span>` : ""}
    </div>
    <div class="footer-url">${esc(url)}</div>
  </div>
  <script>
    window.onload = () => setTimeout(() => window.print(), 350);
  </script>
</body>
</html>`);
    w.document.close();
  };

  const generateTableQrDataUrl = async (tableNum: string): Promise<string> => {
    const { default: QRCodeStyling } = await import("qr-code-styling");
    const tableUrl = `${url}?table=${encodeURIComponent(tableNum)}`;
    const tableQr = new QRCodeStyling({
      ...options,
      data: tableUrl,
      width: 600,
      height: 600,
    });
    const blob = (await tableQr.getRawData("png")) as Blob;
    return new Promise<string>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.readAsDataURL(blob);
    });
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) {
      toast.error("Please enter a table number");
      return;
    }
    setSavingTable(true);
    try {
      const created = await saveRestaurantTable(r.id, newTableNum.trim(), newTableLabel.trim());
      setTables((prev) => {
        const idx = prev.findIndex((t) => t.table_number === created.table_number);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = created;
          return copy;
        }
        return [...prev, created].sort((a, b) => {
          const numA = Number(a.table_number);
          const numB = Number(b.table_number);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.table_number.localeCompare(b.table_number);
        });
      });
      toast.success(`Table #${created.table_number} added`);
      setNewTableNum("");
      setNewTableLabel("");
      setShowAddTable(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add table";
      toast.error(msg);
    } finally {
      setSavingTable(false);
    }
  };

  const handleDeleteTable = async (tbl: RestaurantTable) => {
    if (!window.confirm(`Delete Table #${tbl.table_number}? This cannot be undone.`)) return;
    try {
      await deleteRestaurantTable(r.id, tbl.id);
      setTables((prev) => prev.filter((t) => t.id !== tbl.id));
      toast.success(`Table #${tbl.table_number} removed`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove table";
      toast.error(msg);
    }
  };

  const handleBulkGenerate = async () => {
    try {
      const nums = tables.map((t) => Number(t.table_number)).filter((n) => !isNaN(n));
      const nextStart = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      const updated = await bulkGenerateTables(r.id, nextStart, 5);
      setTables(updated);
      toast.success("Generated 5 new tables!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate tables";
      toast.error(msg);
    }
  };

  const printTableStand = async (tbl: RestaurantTable) => {
    toast.info(`Preparing print stand for Table #${tbl.table_number}...`);
    const tableDataUrl = await generateTableQrDataUrl(tbl.table_number);
    const tableUrl = `${url}?table=${encodeURIComponent(tbl.table_number)}`;
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Please allow pop-ups to open the print dialog");
      return;
    }
    const esc = (s: string) =>
      s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

    w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(r.name)} — Table #${esc(tbl.table_number)} Tent Card</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: A5 portrait; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Manrope', -apple-system, sans-serif;
      background: #ffffff;
      color: #1a1f1c;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10mm;
    }
    .sheet {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      border: 3px double #0f5132;
      border-radius: 8mm;
      padding: 12mm 10mm;
      background: #ffffff;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      color: #047857;
      padding: 5px 16px;
      border-radius: 999px;
      font-size: 9pt;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border: 1px solid #a7f3d0;
      margin-bottom: 3mm;
    }
    .table-banner {
      background: #1a1f1c;
      color: #ffffff;
      padding: 6mm 16mm;
      border-radius: 6mm;
      margin: 3mm 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      width: 80%;
    }
    .table-num {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 32pt;
      font-weight: 800;
      line-height: 1;
      letter-spacing: 0.02em;
    }
    .table-label {
      font-size: 9.5pt;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      opacity: 0.85;
      margin-top: 3px;
    }
    .rest-name {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 22pt;
      font-weight: 700;
      color: ${fg};
      margin-bottom: 1mm;
    }
    .qr-frame {
      padding: 4mm;
      background: ${bg};
      border-radius: 6mm;
      border: 1px solid #e2e8f0;
      box-shadow: 0 6px 18px rgba(0,0,0,0.06);
      margin: 3mm 0;
    }
    .qr-img {
      width: 72mm;
      height: 72mm;
      display: block;
    }
    .instructions {
      font-size: 12pt;
      font-weight: 700;
      color: #1a1f1c;
      margin-top: 2mm;
    }
    .subtext {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 1mm;
    }
    .footer-url {
      font-size: 7pt;
      font-family: monospace;
      color: #94a3b8;
    }
    @media print {
      body { padding: 0; }
      .sheet { border-width: 1px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div>
      <div class="badge">Scan to View Menu • Contactless Dining</div>
      <div class="rest-name">${esc(r.name)}</div>
      ${r.address ? `<div style="font-size:8.5pt;color:#64748b;">${esc(r.address)}</div>` : ""}
    </div>

    <div class="table-banner">
      <div class="table-num">TABLE #${esc(tbl.table_number)}</div>
      ${tbl.label ? `<div class="table-label">${esc(tbl.label)}</div>` : ""}
    </div>

    <div>
      <div class="qr-frame">
        <img class="qr-img" src="${tableDataUrl}" alt="Table ${esc(tbl.table_number)} QR" />
      </div>
      <div class="instructions">Scan to View Menu & Order from Table #${esc(tbl.table_number)}</div>
      <div class="subtext">No app download needed • Instant mobile view</div>
    </div>

    <div class="footer-url">${esc(tableUrl)}</div>
  </div>
  <script>
    window.onload = () => setTimeout(() => window.print(), 350);
  </script>
</body>
</html>`);
    w.document.close();
  };

  const printAllTableStands = async () => {
    if (tables.length === 0) {
      toast.error("No tables found. Please add tables first.");
      return;
    }
    toast.info(`Preparing print sheets for ${tables.length} tables...`);
    const { default: QRCodeStyling } = await import("qr-code-styling");
    const esc = (s: string) =>
      s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

    const cardsHtml = await Promise.all(
      tables.map(async (tbl) => {
        const tableUrl = `${url}?table=${encodeURIComponent(tbl.table_number)}`;
        const tableQr = new QRCodeStyling({
          ...options,
          data: tableUrl,
          width: 600,
          height: 600,
        });
        const blob = (await tableQr.getRawData("png")) as Blob;
        const dataUrl = await new Promise<string>((resolve) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.readAsDataURL(blob);
        });

        return `
        <div class="page">
          <div class="sheet">
            <div>
              <div class="badge">Scan to View Menu • Contactless Dining</div>
              <div class="rest-name">${esc(r.name)}</div>
              ${r.address ? `<div style="font-size:8.5pt;color:#64748b;">${esc(r.address)}</div>` : ""}
            </div>

            <div class="table-banner">
              <div class="table-num">TABLE #${esc(tbl.table_number)}</div>
              ${tbl.label ? `<div class="table-label">${esc(tbl.label)}</div>` : ""}
            </div>

            <div>
              <div class="qr-frame">
                <img class="qr-img" src="${dataUrl}" alt="Table ${esc(tbl.table_number)}" />
              </div>
              <div class="instructions">Scan to View Menu & Order from Table #${esc(tbl.table_number)}</div>
              <div class="subtext">No app download needed • Instant mobile view</div>
            </div>

            <div class="footer-url">${esc(tableUrl)}</div>
          </div>
        </div>
        `;
      })
    );

    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Please allow pop-ups to open the print dialog");
      return;
    }

    w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(r.name)} — All Table Stands (${tables.length})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: A5 portrait; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Manrope', -apple-system, sans-serif;
      background: #f1f5f9;
      color: #1a1f1c;
    }
    .page {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10mm;
      page-break-after: always;
      background: #ffffff;
    }
    .sheet {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      border: 3px double #0f5132;
      border-radius: 8mm;
      padding: 12mm 10mm;
      background: #ffffff;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      color: #047857;
      padding: 5px 16px;
      border-radius: 999px;
      font-size: 9pt;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border: 1px solid #a7f3d0;
      margin-bottom: 3mm;
    }
    .table-banner {
      background: #1a1f1c;
      color: #ffffff;
      padding: 6mm 16mm;
      border-radius: 6mm;
      margin: 3mm 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      width: 80%;
    }
    .table-num {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 32pt;
      font-weight: 800;
      line-height: 1;
      letter-spacing: 0.02em;
    }
    .table-label {
      font-size: 9.5pt;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      opacity: 0.85;
      margin-top: 3px;
    }
    .rest-name {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 22pt;
      font-weight: 700;
      color: ${fg};
      margin-bottom: 1mm;
    }
    .qr-frame {
      padding: 4mm;
      background: ${bg};
      border-radius: 6mm;
      border: 1px solid #e2e8f0;
      box-shadow: 0 6px 18px rgba(0,0,0,0.06);
      margin: 3mm 0;
    }
    .qr-img {
      width: 72mm;
      height: 72mm;
      display: block;
    }
    .instructions {
      font-size: 12pt;
      font-weight: 700;
      color: #1a1f1c;
      margin-top: 2mm;
    }
    .subtext {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 1mm;
    }
    .footer-url {
      font-size: 7pt;
      font-family: monospace;
      color: #94a3b8;
    }
    @media print {
      body { background: #ffffff; }
      .page { padding: 0; }
      .sheet { border-width: 1px; }
    }
  </style>
</head>
<body>
  ${cardsHtml.join("")}
  <script>
    window.onload = () => setTimeout(() => window.print(), 500);
  </script>
</body>
</html>`);
    w.document.close();
  };

  return (
    <AppShell
      title="QR Code Studio"
      actions={
        <div className="flex items-center gap-2">
          {viewTab === "master" ? (
            <>
              <Button variant="outline" size="sm" onClick={shareLink} className="gap-1.5">
                <Share2 className="size-4" /> Share
              </Button>
              <Button size="sm" onClick={saveStyle} className="gap-1.5 shadow-soft">
                <Save className="size-4" /> Save Style
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={printAllTableStands}
                disabled={tables.length === 0}
                className="gap-1.5"
              >
                <Printer className="size-4" /> Batch Print ({tables.length})
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddTable(true)}
                className="gap-1.5 shadow-soft"
              >
                <Plus className="size-4" /> Add Table
              </Button>
            </>
          )}
        </div>
      }
    >
      {/* Mode Switcher Pill */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-3 shadow-soft">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewTab("master")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
              viewTab === "master"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <QrIcon className="size-4" /> Master Brand QR
          </button>
          <button
            type="button"
            onClick={() => setViewTab("tables")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
              viewTab === "tables"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Layers className="size-4" /> Multi-Table QRs
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                viewTab === "tables" ? "bg-white/20 text-white" : "bg-muted text-foreground"
              )}
            >
              {tables.length}
            </span>
          </button>
        </div>

        {viewTab === "tables" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkGenerate}
              className="gap-1.5 text-xs font-semibold"
            >
              <Sparkles className="size-3.5 text-amber-500" /> +5 Tables
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={printAllTableStands}
              disabled={tables.length === 0}
              className="gap-1.5 text-xs font-semibold"
            >
              <Printer className="size-3.5" /> Print All
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddTable(true)}
              className="gap-1.5 text-xs font-semibold shadow-soft"
            >
              <Plus className="size-3.5" /> Add Table
            </Button>
          </div>
        ) : (
          <p className="hidden sm:block text-xs text-muted-foreground">
            Print this QR for menus, billing counter, flyers & social media.
          </p>
        )}
      </div>

      {viewTab === "tables" ? (
        <div className="space-y-6">
          {/* Info header */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="size-5 text-primary" /> Table-Specific QR Ordering
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Each table gets its own QR tent stand. When customers scan, Menuly detects their table number and attaches it directly to their WhatsApp orders!
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-center shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Tables</p>
                <p className="text-xl font-black text-foreground">{tables.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-center shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Scans</p>
                <p className="text-xl font-black text-veg">
                  {tables.reduce((acc, t) => acc + (t.scans_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Tables Grid */}
          {tables.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <QrIcon className="mx-auto size-12 text-muted-foreground/50" />
              <h4 className="mt-3 font-display text-base font-bold">No Tables Added Yet</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Add your dining tables to generate individual QR stands for Table 1, Table 2, etc.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Button onClick={() => setShowAddTable(true)} className="gap-2">
                  <Plus className="size-4" /> Add First Table
                </Button>
                <Button variant="outline" onClick={handleBulkGenerate} className="gap-2">
                  <Sparkles className="size-4 text-amber-500" /> Auto-Generate 5 Tables
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tables.map((tbl) => {
                const tableUrl = `${url}?table=${tbl.table_number}`;
                return (
                  <div
                    key={tbl.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-soft transition-all hover:border-primary/40 hover:shadow-lift"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
                        <div>
                          <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                            Table #{tbl.table_number}
                          </span>
                          {tbl.label && (
                            <p className="mt-1 text-xs font-semibold text-muted-foreground">
                              {tbl.label}
                            </p>
                          )}
                        </div>
                        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          🔥 {tbl.scans_count || 0} scans
                        </span>
                      </div>

                      {/* Visual Table QR representation */}
                      <div className="my-4 rounded-xl border border-border/60 bg-muted/30 p-4 text-center">
                        <div
                          className="mx-auto flex size-28 items-center justify-center rounded-xl border border-border bg-white p-2 shadow-xs"
                          style={{ backgroundColor: bg }}
                        >
                          <QrIcon className="size-20" style={{ color: fg }} />
                        </div>
                        <p className="mt-2.5 text-[10px] font-mono text-muted-foreground truncate" title={tableUrl}>
                          ?table={tbl.table_number}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <Button
                        size="sm"
                        onClick={() => printTableStand(tbl)}
                        className="w-full gap-1.5 text-xs font-semibold shadow-soft"
                      >
                        <Printer className="size-3.5" /> Print Stand Card (A5)
                      </Button>
                      <div className="grid grid-cols-3 gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(tableUrl);
                            toast.success(`Copied link for Table #${tbl.table_number}`);
                          }}
                          title="Copy Table URL"
                          className="px-2 text-xs"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          title="Open Live Table Menu"
                          className="px-2 text-xs"
                        >
                          <a href={tableUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-3.5" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTable(tbl)}
                          title="Delete Table"
                          className="px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Customizer & Template Previews */}
        <div className="space-y-6">
          {/* Customizer Panel */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h2 className="font-display text-lg font-bold">Customize Styling</h2>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-veg">
                <ShieldCheck className="size-4 text-veg" /> Scans 100% reliably
              </span>
            </div>

            {/* Foreground QR Color */}
            <div className="mt-5 space-y-2.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                QR Code Color
              </Label>
              <div className="flex flex-wrap items-center gap-2.5">
                {presets.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => setFg(p.color)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                      fg === p.color
                        ? "border-primary bg-primary/10 text-primary shadow-sm ring-2 ring-primary/20"
                        : "border-border hover:bg-secondary text-foreground"
                    )}
                  >
                    <span
                      className="size-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 border border-border rounded-full px-2.5 py-1">
                  <input
                    type="color"
                    value={fg}
                    onChange={(e) => setFg(e.target.value)}
                    className="size-5 cursor-pointer rounded-full border-0 bg-transparent"
                    title="Custom Color"
                  />
                  <span className="text-xs font-mono text-muted-foreground uppercase">{fg}</span>
                </div>
              </div>
            </div>

            {/* Background Color */}
            <div className="mt-5 space-y-2.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Background Color
              </Label>
              <div className="flex flex-wrap items-center gap-2.5">
                {bgPresets.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => setBg(p.color)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                      bg === p.color
                        ? "border-primary bg-primary/10 text-primary shadow-sm ring-2 ring-primary/20"
                        : "border-border hover:bg-secondary text-foreground"
                    )}
                  >
                    <span
                      className="size-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 border border-border rounded-full px-2.5 py-1">
                  <input
                    type="color"
                    value={bg}
                    onChange={(e) => setBg(e.target.value)}
                    className="size-5 cursor-pointer rounded-full border-0 bg-transparent"
                    title="Custom Background"
                  />
                  <span className="text-xs font-mono text-muted-foreground uppercase">{bg}</span>
                </div>
              </div>
            </div>

            {/* Corner Style */}
            <div className="mt-5 space-y-2.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Corner Shapes
              </Label>
              <div className="grid grid-cols-3 gap-2.5">
                {(Object.keys(corners) as Corner[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCorner(c)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold capitalize transition-all",
                      corner === c
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                        : "border-border hover:bg-secondary text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "size-3.5 border-2 border-current",
                        c === "rounded" && "rounded-sm",
                        c === "dots" && "rounded-full"
                      )}
                    />
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Center Logo Toggle */}
            <div className="mt-6 flex items-center justify-between rounded-xl border border-border/80 bg-muted/40 p-4">
              <div>
                <p className="text-xs font-bold">Restaurant Logo in Centre</p>
                <p className="text-[11px] text-muted-foreground">
                  {r.logo_url
                    ? "Using your uploaded restaurant logo with high error-correction."
                    : "No logo uploaded yet. Upload a logo in Dashboard to display it."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogo(!showLogo)}
                disabled={!r.logo_url}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
                  showLogo && r.logo_url ? "border-primary bg-primary" : "border-border bg-muted",
                  !r.logo_url && "opacity-50 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-[18px] rounded-full bg-white shadow-sm transition-all",
                    showLogo && r.logo_url ? "left-[calc(100%-20px)]" : "left-0.5"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Print Ready Templates Panel */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h2 className="font-display text-lg font-bold">Print Ready Templates</h2>
                <p className="text-xs text-muted-foreground">Instant A5 table cards & A4 entrance posters.</p>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTemplateTab("A5")}
                  className={cn(
                    "rounded-md px-3 py-1 font-semibold transition-all",
                    templateTab === "A5" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Table Card (A5)
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateTab("A4")}
                  className={cn(
                    "rounded-md px-3 py-1 font-semibold transition-all",
                    templateTab === "A4" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Wall Poster (A4)
                </button>
              </div>
            </div>

            {/* Template Card Visual Preview */}
            <div className="mt-5 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-5 text-center">
              <div
                className="mx-auto max-w-xs rounded-2xl border border-border bg-white p-6 shadow-lift text-center"
                style={{ color: "#1a1f1c" }}
              >
                {r.logo_url ? (
                  <img
                    src={r.logo_url}
                    alt={r.name}
                    className="mx-auto size-12 rounded-xl object-cover shadow-sm mb-2"
                  />
                ) : (
                  <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm mb-2">
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <h3 className="font-display text-xl font-bold" style={{ color: fg }}>
                  {r.name}
                </h3>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Scan to View Menu
                </p>

                <div
                  className="mx-auto my-3 inline-flex p-2 rounded-xl border border-border/40 shadow-sm"
                  style={{ backgroundColor: bg }}
                >
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" className="size-36 object-contain" />
                  ) : (
                    <div className="size-36 grid place-items-center text-xs text-muted-foreground">Generating...</div>
                  )}
                </div>

                <p className="text-xs font-bold" style={{ color: fg }}>
                  {templateTab === "A5" ? "Place on Dining Table" : "Display at Counter & Entrance"}
                </p>
                {r.address && <p className="mt-1 text-[10px] text-muted-foreground">{r.address}</p>}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => printTemplate(templateTab)}
                  className="gap-2 shadow-soft font-semibold"
                >
                  <Printer className="size-4" /> Print {templateTab === "A5" ? "Table Card (A5)" : "Wall Poster (A4)"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => printTemplate(templateTab === "A5" ? "A4" : "A5")}
                  className="gap-2"
                >
                  <Printer className="size-4" /> Switch to {templateTab === "A5" ? "A4" : "A5"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live QR Code & Download Sizes */}
        <div className="space-y-6">
          {/* Live Code Box */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live QR Preview</h2>
              <span className="flex items-center gap-1.5 text-xs font-bold text-veg">
                <span className="size-2 rounded-full bg-veg animate-pulse" /> Live & Ready
              </span>
            </div>

            {/* Canvas Box */}
            <div
              className="mt-5 flex min-h-[340px] items-center justify-center rounded-2xl border border-border/80 p-6 shadow-inner"
              style={{ backgroundColor: bg }}
            >
              <div ref={box} className="overflow-hidden rounded-xl [&>canvas]:max-w-full" style={{ width: 320, maxWidth: "100%" }} />
            </div>

            {/* Menu Link Row */}
            <div className="mt-5 rounded-xl border border-border/70 bg-muted/40 p-2.5 ps-3.5 flex items-center gap-2">
              <span className="flex-1 truncate text-xs font-medium font-mono text-muted-foreground" title={url}>
                {url}
              </span>
              <button
                type="button"
                onClick={copyLink}
                title="Copy Link"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                {copied ? <Check className="size-3.5 text-veg" /> : <Copy className="size-3.5" />}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                title="Open Live Menu"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>

            {/* PNG Multi-size selector */}
            <div className="mt-6 space-y-2.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Download High-Res Formats
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {PNG_SIZES.map((s) => {
                  const active = pngSize === s.px;
                  return (
                    <button
                      key={s.px}
                      type="button"
                      onClick={() => setPngSize(s.px)}
                      className={cn(
                        "flex flex-col items-start rounded-xl border p-2.5 text-left transition-all",
                        active
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                          : "border-border hover:bg-secondary text-foreground"
                      )}
                    >
                      <span className="text-xs font-bold">{s.label}</span>
                      <span className="text-[10px] text-muted-foreground">{s.px} px</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <Button onClick={() => downloadPng(pngSize)} className="w-full gap-2 shadow-soft font-semibold">
                  <Download className="size-4" /> Download PNG ({pngSize}px)
                </Button>
                <Button variant="outline" onClick={downloadSvg} className="w-full gap-2 font-semibold">
                  <Download className="size-4" /> Download Vector SVG
                </Button>
              </div>

              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground flex items-center gap-1.5">
                <Info className="size-3.5 text-primary shrink-0" /> SVG files scale infinitely without blurriness — best for commercial print vendors.
              </p>
            </div>
          </div>

          {/* Placement Tips */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Best Placement Practices
            </h3>
            <ul className="mt-3.5 space-y-3.5">
              {placementTips.map((tip) => (
                <li key={tip.title} className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                    <tip.icon className="size-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{tip.title}</h4>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{tip.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      )}

      {/* Add Table Dialog */}
      <Dialog open={showAddTable} onOpenChange={setShowAddTable}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Add Dining Table</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTable} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="tableNum" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Table Number / Code *
              </Label>
              <Input
                id="tableNum"
                value={newTableNum}
                onChange={(e) => setNewTableNum(e.target.value)}
                placeholder="e.g. 1, 2, 14, VIP-A"
                required
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Printed on the table tent card and passed in WhatsApp order messages.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tableLabel" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Section / Placement Label (Optional)
              </Label>
              <Input
                id="tableLabel"
                value={newTableLabel}
                onChange={(e) => setNewTableLabel(e.target.value)}
                placeholder="e.g. Balcony, AC Hall, Window Side"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddTable(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingTable} className="gap-1.5 shadow-soft">
                <Plus className="size-4" /> {savingTable ? "Saving..." : "Add Table"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
