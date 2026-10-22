import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
  FileText,
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

function QrSkeleton() {
  return (
    <AppShell title="QR Studio & Print Templates">
      <div className="space-y-6 animate-pulse max-w-6xl mx-auto py-6">
        <div className="h-32 rounded-2xl border border-border/70 bg-card p-5 space-y-3">
          <div className="h-5 w-48 rounded bg-muted animate-pulse" />
          <div className="h-10 rounded-xl bg-muted/60 animate-pulse" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="h-96 rounded-2xl border border-border/70 bg-card p-6" />
          <div className="h-96 rounded-2xl border border-border/70 bg-card p-6" />
        </div>
      </div>
    </AppShell>
  );
}

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
  pendingComponent: QrSkeleton,
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

// Pure client-side 1-page PDF generator (standard PDF 1.4, exact ISO page size, 0 external dependencies)
function createSinglePageImagePdf(
  jpegBytes: Uint8Array,
  pageWidthPt: number, // A4: 595.28, A5: 419.53
  pageHeightPt: number, // A4: 841.89, A5: 595.28
  imgWidthPx: number,
  imgHeightPx: number
): Blob {
  const parts: BlobPart[] = [];
  const offsets: number[] = [0];
  let currentOffset = 0;

  const enc = new TextEncoder();

  const pushString = (str: string) => {
    const bytes = enc.encode(str);
    currentOffset += bytes.length;
    parts.push(bytes as unknown as BlobPart);
  };

  const pushBinary = (bytes: Uint8Array) => {
    currentOffset += bytes.length;
    parts.push(bytes as unknown as BlobPart);
  };

  // Header & binary indicator comment
  pushString("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  // 1 0 obj: Catalog
  offsets.push(currentOffset);
  pushString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // 2 0 obj: Pages
  offsets.push(currentOffset);
  pushString("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  // 3 0 obj: Page
  offsets.push(currentOffset);
  pushString(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt.toFixed(2)} ${pageHeightPt.toFixed(2)}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // 4 0 obj: Image XObject (native baseline JPEG)
  offsets.push(currentOffset);
  pushString(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidthPx} /Height ${imgHeightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBinary(jpegBytes);
  pushString("\nendstream\nendobj\n");

  // 5 0 obj: Content stream (scale image to fill exact page dimensions)
  const contentStream = `q\n${pageWidthPt.toFixed(2)} 0 0 ${pageHeightPt.toFixed(2)} 0 0 cm\n/Im1 Do\nQ\n`;
  offsets.push(currentOffset);
  pushString(
    `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
  );

  // Cross-reference table
  const xrefOffset = currentOffset;
  pushString("xref\n0 6\n0000000000 65535 f \n");
  for (let i = 1; i <= 5; i++) {
    const offStr = String(offsets[i]).padStart(10, "0");
    pushString(`${offStr} 00000 n \n`);
  }

  // Trailer
  pushString(
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  return new Blob(parts, { type: "application/pdf" });
}

function QrPage() {
  const { data, isLoading } = useQuery(myMenuQuery);
  const qc = useQueryClient();
  const r = data?.restaurant;

  const [fg, setFg] = useState("#1a1f1c");
  const [bg, setBg] = useState("#ffffff");
  const [corner, setCorner] = useState<Corner>("rounded");
  const [showLogo, setShowLogo] = useState(true);
  const [pngSize, setPngSize] = useState<512 | 1024 | 2048>(1024);
  const [copied, setCopied] = useState(false);
  const [templateTab, setTemplateTab] = useState<"A5" | "A4">("A5");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (r) {
      if (r.qr_fg) setFg(r.qr_fg);
      if (r.qr_bg) setBg(r.qr_bg);
      if (r.qr_corner && (r.qr_corner as Corner) in corners) {
        setCorner(r.qr_corner as Corner);
      }
    }
  }, [r]);

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
    if (!r?.id) return;
    getRestaurantTables(r.id).then((t) => {
      if (alive) {
        setTables(t);
        setLoadingTables(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [r?.id]);

  const box = useRef<HTMLDivElement>(null);
  const qr = useRef<QRCodeStylingType | null>(null);

  const url = typeof window !== "undefined" && r?.slug ? `${window.location.origin}/menu/${r.slug}` : "";
  const name = slugify(r?.name || "") || "menu";

  const options = useMemo<Options>(
    () => ({
      width: 320,
      height: 320,
      type: "canvas",
      data: url || "https://menuly.app",
      margin: 8,
      ...(showLogo && r?.logo_url && !r?.id?.startsWith("demo-") ? { image: r.logo_url } : {}),
      qrOptions: { errorCorrectionLevel: "H" },
      imageOptions: { crossOrigin: "anonymous", margin: 6, imageSize: 0.3, hideBackgroundDots: true },
      dotsOptions: { color: fg, type: corners[corner].dots },
      cornersSquareOptions: { color: fg, type: corners[corner].sq },
      cornersDotOptions: { color: fg, type: corners[corner].dot },
      backgroundOptions: { color: bg },
    }),
    [url, r?.id, r?.logo_url, showLogo, fg, bg, corner]
  );

  useEffect(() => {
    let alive = true;
    if (!r) return;
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
  }, [options, r]);

  if (isLoading || !r) {
    return <QrSkeleton />;
  }

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

  // Safe canvas rounded rect helper
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ) => {
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
  };

  // Clean print helper using an iframe sized for layout (completely strips about:blank & browser headers)
  const printCleanHtml = (htmlContent: string) => {
    if (typeof window === "undefined") return;

    // Temporarily clear host document title so Chromium cannot print host title in header
    const originalHostTitle = document.title;
    document.title = "";

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      // Mobile browsers handle popup/new window print much more reliably than hidden iframes
      const w = window.open("", "_blank");
      if (w) {
        w.document.open();
        w.document.write(htmlContent);
        w.document.close();
        setTimeout(() => {
          w.focus();
          w.print();
          document.title = originalHostTitle;
        }, 500);
        return;
      }
    }

    const frameId = "menuly-clean-print-frame";
    const existing = document.getElementById(frameId);
    if (existing) existing.remove();

    const iframe = document.createElement("iframe");
    iframe.id = frameId;
    // Must have real viewport dimensions (not 1px/hidden) so Chromium evaluates @page rules properly
    iframe.setAttribute(
      "style",
      "position:fixed;top:0;left:0;width:100vw;height:100vh;border:none;z-index:-999999;opacity:0.001;pointer-events:none;"
    );
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      // Fallback: window.open if iframe is blocked
      const w = window.open("", "_blank");
      if (w) {
        w.document.open();
        w.document.write(htmlContent);
        w.document.close();
        setTimeout(() => {
          w.focus();
          w.print();
          document.title = originalHostTitle;
        }, 400);
      } else {
        document.title = originalHostTitle;
        toast.error("Please allow pop-ups to open the print dialog");
      }
      return;
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Allow Google Fonts, SVG styles, and base64 QR images to settle before triggering print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Iframe print error, falling back to window.open", e);
        const w = window.open("", "_blank");
        if (w) {
          w.document.open();
          w.document.write(htmlContent);
          w.document.close();
          setTimeout(() => {
            w.focus();
            w.print();
          }, 400);
        }
      } finally {
        setTimeout(() => {
          document.title = originalHostTitle;
        }, 3000);
      }
    }, 450);
  };

  // Generate high-resolution 300 DPI Canvas for A5 or A4 Printable Card
  const generateCardCanvas = async (format: "A5" | "A4"): Promise<HTMLCanvasElement> => {
    const isA4 = format === "A4";
    // Standard 300 DPI dimensions:
    // A5: 1748 x 2480 px (148 x 210 mm)
    // A4: 2480 x 3508 px (210 x 297 mm)
    const width = isA4 ? 2480 : 1748;
    const height = isA4 ? 3508 : 2480;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to initialize canvas context");

    // Crisp pure white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Outer dashed cut guide for print shops or acrylic stands
    const margin = isA4 ? 120 : 90;
    const cardW = width - margin * 2;
    const cardH = height - margin * 2;
    ctx.save();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 12]);
    drawRoundedRect(ctx, margin, margin, cardW, cardH, 44);
    ctx.stroke();
    ctx.restore();

    // Bottom cut guide note
    ctx.font = `600 ${isA4 ? "24px" : "19px"} -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `✂ Cut along the dashed line for ${format} acrylic table stand or wall mount`,
      width / 2,
      height - (isA4 ? 55 : 42)
    );

    const contentCenterX = width / 2;
    let currentY = margin + (isA4 ? 110 : 80);

    // Top badge: "CONTACTLESS DINING MENU"
    const badgeW = isA4 ? 680 : 520;
    const badgeH = isA4 ? 64 : 50;
    ctx.save();
    ctx.fillStyle = "#ecfdf5";
    drawRoundedRect(ctx, contentCenterX - badgeW / 2, currentY, badgeW, badgeH, badgeH / 2);
    ctx.fill();
    ctx.strokeStyle = "#a7f3d0";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#047857";
    ctx.font = `bold ${isA4 ? "26px" : "20px"} -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦ CONTACTLESS DINING MENU ✦", contentCenterX, currentY + badgeH / 2);
    ctx.restore();

    currentY += badgeH + (isA4 ? 60 : 45);

    // Restaurant Logo or Initials Monogram
    const logoSize = isA4 ? 220 : 160;
    let logoDrawn = false;
    if (r.logo_url) {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Logo load error"));
          img.src = r.logo_url!;
          setTimeout(() => reject(new Error("Timeout")), 2500);
        });
        ctx.save();
        drawRoundedRect(ctx, contentCenterX - logoSize / 2, currentY, logoSize, logoSize, 36);
        ctx.clip();
        ctx.drawImage(img, contentCenterX - logoSize / 2, currentY, logoSize, logoSize);
        ctx.restore();
        logoDrawn = true;
      } catch {
        logoDrawn = false;
      }
    }

    if (!logoDrawn) {
      ctx.save();
      ctx.fillStyle = fg;
      drawRoundedRect(ctx, contentCenterX - logoSize / 2, currentY, logoSize, logoSize, 36);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(logoSize * 0.44)}px 'Fraunces', Georgia, serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(r.name.slice(0, 2).toUpperCase(), contentCenterX, currentY + logoSize / 2);
      ctx.restore();
    }

    currentY += logoSize + (isA4 ? 65 : 45);

    // Restaurant Name
    ctx.fillStyle = fg;
    ctx.font = `bold ${isA4 ? "78px" : "58px"} 'Fraunces', Georgia, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(r.name, contentCenterX, currentY);

    currentY += isA4 ? 50 : 38;

    // Subtitle
    ctx.fillStyle = "#64748b";
    ctx.font = `bold ${isA4 ? "30px" : "22px"} -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText("SCAN TO VIEW MENU & PRICES", contentCenterX, currentY);

    currentY += isA4 ? 65 : 45;

    // QR Code Box
    const qrSize = isA4 ? 1100 : 820;
    const framePad = isA4 ? 46 : 34;
    const qrFrameW = qrSize + framePad * 2;
    const qrFrameH = qrSize + framePad * 2;
    const qrFrameX = contentCenterX - qrFrameW / 2;
    const qrFrameY = currentY;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = bg;
    drawRoundedRect(ctx, qrFrameX, qrFrameY, qrFrameW, qrFrameH, 40);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, qrFrameX, qrFrameY, qrFrameW, qrFrameH, 40);
    ctx.stroke();

    // Render high-res QR code
    const { default: QRCodeStyling } = await import("qr-code-styling");
    const qrBlob = (await new QRCodeStyling({
      ...options,
      width: qrSize,
      height: qrSize,
    }).getRawData("png")) as Blob;

    const qrImg = new Image();
    const qrObjectUrl = URL.createObjectURL(qrBlob);
    await new Promise<void>((resolve) => {
      qrImg.onload = () => resolve();
      qrImg.src = qrObjectUrl;
    });

    ctx.drawImage(qrImg, qrFrameX + framePad, qrFrameY + framePad, qrSize, qrSize);
    URL.revokeObjectURL(qrObjectUrl);

    currentY += qrFrameH + (isA4 ? 75 : 55);

    // Scan Instructions
    ctx.fillStyle = fg;
    ctx.font = `bold ${isA4 ? "52px" : "40px"} -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Point your phone camera to scan", contentCenterX, currentY);

    currentY += isA4 ? 44 : 34;
    ctx.fillStyle = "#64748b";
    ctx.font = `500 ${isA4 ? "30px" : "22px"} -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText("No app download required • Instant mobile dining", contentCenterX, currentY);

    if (r.hours || r.address) {
      currentY += isA4 ? 42 : 32;
      ctx.fillStyle = "#475569";
      ctx.font = `600 ${isA4 ? "28px" : "20px"} -apple-system, BlinkMacSystemFont, sans-serif`;
      const meta = [r.hours, r.address].filter(Boolean).join("  •  ");
      ctx.fillText(meta, contentCenterX, currentY);
    }

    currentY += isA4 ? 50 : 38;
    ctx.fillStyle = "#94a3b8";
    ctx.font = `500 ${isA4 ? "24px" : "18px"} monospace`;
    ctx.fillText(url, contentCenterX, currentY);

    return canvas;
  };

  // High-Res Printable Sheet Exporter (300 DPI PNG)
  const downloadPrintableCard = async (format: "A5" | "A4") => {
    try {
      toast.info(`Preparing HD ${format} Printable Sheet (300 DPI)...`);
      const canvas = await generateCardCanvas(format);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${name}-${format}-printable-menu-card.png`;
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success(`Downloaded ${format} HD Printable Sheet (300 DPI)`);
      }, "image/png");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Failed to generate printable card: " + msg);
    }
  };

  // Clean 1-Page PDF Exporter (Zero browser headers, timestamps, or URLs)
  const downloadCleanPdf = async (format: "A5" | "A4") => {
    try {
      toast.info(`Generating Clean 1-Page ${format} PDF...`);
      const isA4 = format === "A4";
      const canvas = await generateCardCanvas(format);

      const jpegBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95)
      );
      if (!jpegBlob) throw new Error("Could not encode printable sheet");

      const arrayBuf = await jpegBlob.arrayBuffer();
      const jpegBytes = new Uint8Array(arrayBuf);

      const pdfBlob = createSinglePageImagePdf(
        jpegBytes,
        isA4 ? 595.28 : 419.53,
        isA4 ? 841.89 : 595.28,
        canvas.width,
        canvas.height
      );

      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `${name}-${format}-wall-poster-clean.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`Downloaded Clean 1-Page ${format} PDF (No timestamps/URLs)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Failed to generate clean PDF: " + msg);
    }
  };

  // Generate high-resolution 300 DPI Canvas for Table Stand Card (A5)
  const generateTableStandCanvas = async (tbl: RestaurantTable): Promise<HTMLCanvasElement> => {
    const width = 1748;
    const height = 2480;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to initialize canvas context");

    // Pure white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Cut guide line
    const margin = 90;
    const cardW = width - margin * 2;
    const cardH = height - margin * 2;
    ctx.save();
    ctx.strokeStyle = "#0f5132";
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 12]);
    drawRoundedRect(ctx, margin, margin, cardW, cardH, 44);
    ctx.stroke();
    ctx.restore();

    ctx.font = "600 20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✂ Cut along the line for A5 acrylic stand or tent card", width / 2, height - 42);

    const contentCenterX = width / 2;
    let currentY = margin + 80;

    // Top Contactless Badge
    const badgeW = 620;
    const badgeH = 50;
    ctx.save();
    ctx.fillStyle = "#ecfdf5";
    drawRoundedRect(ctx, contentCenterX - badgeW / 2, currentY, badgeW, badgeH, badgeH / 2);
    ctx.fill();
    ctx.strokeStyle = "#a7f3d0";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#047857";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦ CONTACTLESS DINING • SCAN TO ORDER ✦", contentCenterX, currentY + badgeH / 2);
    ctx.restore();

    currentY += badgeH + 40;

    // Restaurant Name
    ctx.fillStyle = fg;
    ctx.font = "bold 58px 'Fraunces', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(r.name, contentCenterX, currentY);

    if (r.address) {
      currentY += 36;
      ctx.fillStyle = "#64748b";
      ctx.font = "500 22px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(r.address, contentCenterX, currentY);
    }

    currentY += 50;

    // Big Bold Table Banner
    const bannerW = 860;
    const bannerH = 140;
    ctx.save();
    ctx.fillStyle = "#1a1f1c";
    ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    drawRoundedRect(ctx, contentCenterX - bannerW / 2, currentY, bannerW, bannerH, 28);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 68px 'Fraunces', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`TABLE #${tbl.table_number}`, contentCenterX, currentY + (tbl.label ? 50 : 70));

    if (tbl.label) {
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(tbl.label.toUpperCase(), contentCenterX, currentY + 104);
    }

    currentY += bannerH + 50;

    // QR Code Frame
    const qrSize = 800;
    const framePad = 32;
    const qrFrameW = qrSize + framePad * 2;
    const qrFrameH = qrSize + framePad * 2;
    const qrFrameX = contentCenterX - qrFrameW / 2;
    const qrFrameY = currentY;

    ctx.save();
    ctx.fillStyle = bg;
    ctx.shadowColor = "rgba(0,0,0,0.06)";
    ctx.shadowBlur = 20;
    drawRoundedRect(ctx, qrFrameX, qrFrameY, qrFrameW, qrFrameH, 36);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, qrFrameX, qrFrameY, qrFrameW, qrFrameH, 36);
    ctx.stroke();

    const tableUrl = `${url}?table=${encodeURIComponent(tbl.table_number)}`;
    const { default: QRCodeStyling } = await import("qr-code-styling");
    const qrBlob = (await new QRCodeStyling({
      ...options,
      data: tableUrl,
      width: qrSize,
      height: qrSize,
    }).getRawData("png")) as Blob;

    const qrImg = new Image();
    const qrObjectUrl = URL.createObjectURL(qrBlob);
    await new Promise<void>((resolve) => {
      qrImg.onload = () => resolve();
      qrImg.src = qrObjectUrl;
    });

    ctx.drawImage(qrImg, qrFrameX + framePad, qrFrameY + framePad, qrSize, qrSize);
    URL.revokeObjectURL(qrObjectUrl);

    currentY += qrFrameH + 55;

    // Scan Call to Action
    ctx.fillStyle = fg;
    ctx.font = "bold 40px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Scan to View Menu & Order from Table #${tbl.table_number}`, contentCenterX, currentY);

    currentY += 36;
    ctx.fillStyle = "#64748b";
    ctx.font = "500 22px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("No app download needed • Instant contactless dining", contentCenterX, currentY);

    currentY += 40;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 18px monospace";
    ctx.fillText(tableUrl, contentCenterX, currentY);

    return canvas;
  };

  // High-Res Table Stand Exporter (300 DPI PNG)
  const downloadTableStandCard = async (tbl: RestaurantTable) => {
    try {
      toast.info(`Preparing HD Stand Card for Table #${tbl.table_number}...`);
      const canvas = await generateTableStandCanvas(tbl);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${name}-table-${tbl.table_number}-stand-A5.png`;
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success(`Downloaded HD Stand Card for Table #${tbl.table_number}`);
      }, "image/png");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Failed to download table stand: " + msg);
    }
  };

  // Clean 1-Page PDF Exporter for Table Stand
  const downloadTableStandPdf = async (tbl: RestaurantTable) => {
    try {
      toast.info(`Generating Clean 1-Page PDF for Table #${tbl.table_number}...`);
      const canvas = await generateTableStandCanvas(tbl);

      const jpegBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95)
      );
      if (!jpegBlob) throw new Error("Could not encode table stand");

      const arrayBuf = await jpegBlob.arrayBuffer();
      const jpegBytes = new Uint8Array(arrayBuf);

      const pdfBlob = createSinglePageImagePdf(
        jpegBytes,
        419.53, // A5 width in pt
        595.28, // A5 height in pt
        canvas.width,
        canvas.height
      );

      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `${name}-table-${tbl.table_number}-stand-A5-clean.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(`Downloaded Table #${tbl.table_number} Clean 1-Page PDF`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Failed to generate table stand PDF: " + msg);
    }
  };

  // Direct clean print with A5 / A4 formatted template
  const printTemplate = async (format: "A5" | "A4") => {
    toast.info(`Preparing clean print sheet for ${format}...`);
    const { default: QRCodeStyling } = await import("qr-code-styling");
    const isA4 = format === "A4";

    const blob = (await new QRCodeStyling({
      ...options,
      width: isA4 ? 1400 : 900,
      height: isA4 ? 1400 : 900,
    }).getRawData("png")) as Blob;

    const dataUrl = await new Promise<string>((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.readAsDataURL(blob);
    });

    const esc = (s: string) =>
      s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;800;900&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${isA4 ? "A4 portrait" : "A5 portrait"};
      margin: 0mm !important;
    }
    @page :first { margin: 0mm !important; }
    @page :left { margin: 0mm !important; }
    @page :right { margin: 0mm !important; }

    *, *::before, *::after {
      box-sizing: border-box !important;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: #ffffff !important;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1f1c;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      overflow: hidden !important;
    }

    .page-wrap {
      width: 100%;
      height: 100%;
      max-height: ${isA4 ? "297mm" : "210mm"};
      display: flex;
      align-items: center;
      justify-content: center;
      padding: ${isA4 ? "5mm 6mm" : "4mm 5mm"};
      background: #ffffff;
      box-sizing: border-box;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      overflow: hidden !important;
    }

    .sheet {
      width: ${isA4 ? "174mm" : "128mm"};
      max-height: ${isA4 ? "248mm" : "182mm"};
      height: auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      border: ${isA4 ? "2.5px solid #0f5132" : "2px dashed #0f5132"} !important;
      border-radius: 7mm;
      padding: ${isA4 ? "7mm 8mm" : "5mm 6mm"};
      background: #ffffff !important;
      position: relative;
      margin: 0 auto !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      overflow: hidden !important;
    }

    .header-box {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .top-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #ecfdf5 !important;
      color: #047857 !important;
      padding: ${isA4 ? "4px 16px" : "3px 12px"};
      border-radius: 999px;
      font-size: ${isA4 ? "9pt" : "7.5pt"};
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      border: 1.5px solid #a7f3d0 !important;
      margin: 0 auto ${isA4 ? "3.5mm" : "2.5mm"} auto;
    }

    .logo-container {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto ${isA4 ? "3mm" : "2mm"} auto;
    }

    .logo-img {
      width: ${isA4 ? "28mm" : "22mm"};
      height: ${isA4 ? "28mm" : "22mm"};
      border-radius: 6mm;
      object-fit: cover;
      display: block !important;
      margin: 0 auto !important;
      box-shadow: 0 4px 14px rgba(0,0,0,0.12);
    }

    .logo-placeholder {
      width: ${isA4 ? "28mm" : "22mm"};
      height: ${isA4 ? "28mm" : "22mm"};
      border-radius: 6mm;
      background: ${fg} !important;
      color: #ffffff !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-family: 'Fraunces', Georgia, serif;
      font-weight: 800;
      font-size: ${isA4 ? "17pt" : "13pt"};
      margin: 0 auto !important;
      box-shadow: 0 4px 14px rgba(0,0,0,0.12);
    }

    h1.rest-name {
      font-family: 'Fraunces', Georgia, serif;
      font-size: ${isA4 ? "26pt" : "19pt"};
      font-weight: 800;
      color: ${fg} !important;
      line-height: 1.15;
      margin: 0 0 1mm 0;
      width: 100%;
      text-align: center;
    }

    .prompt {
      font-size: ${isA4 ? "10pt" : "8pt"};
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #64748b !important;
      margin: 0 auto;
      text-align: center;
    }

    .qr-box {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: ${isA4 ? "3mm 0" : "2mm 0"};
    }

    .qr-frame {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: ${isA4 ? "4mm" : "3mm"};
      background: ${bg} !important;
      border-radius: 6mm;
      border: 2px solid #e2e8f0 !important;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
      margin: 0 auto ${isA4 ? "3mm" : "2mm"} auto;
    }

    .qr-img {
      width: ${isA4 ? "90mm" : "68mm"};
      height: ${isA4 ? "90mm" : "68mm"};
      display: block;
      margin: 0 auto;
    }

    .scan-msg {
      font-size: ${isA4 ? "13pt" : "10.5pt"};
      font-weight: 800;
      color: ${fg} !important;
      margin: 0 auto 1mm auto;
      text-align: center;
    }

    .subtext {
      font-size: ${isA4 ? "8.5pt" : "7pt"};
      font-weight: 600;
      color: #64748b !important;
      max-width: 95%;
      line-height: 1.4;
      margin: 0 auto;
      text-align: center;
    }

    .meta-details {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5mm;
      margin-top: 1.5mm;
    }

    .meta-line {
      font-size: ${isA4 ? "8pt" : "6.5pt"};
      font-weight: 700;
      color: #475569 !important;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .footer-box {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 2mm;
      margin-top: 2mm;
    }

    .footer-url {
      font-size: ${isA4 ? "7.5pt" : "6pt"};
      font-family: monospace;
      color: #94a3b8 !important;
      margin-bottom: 1mm;
    }

    .cut-guide {
      font-size: ${isA4 ? "6.5pt" : "5.5pt"};
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    @media print {
      @page {
        size: ${isA4 ? "A4 portrait" : "A5 portrait"};
        margin: 0mm !important;
      }
      html, body {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        overflow: hidden !important;
      }
      .page-wrap {
        padding: ${isA4 ? "5mm 6mm" : "4mm 5mm"} !important;
        height: 100% !important;
        max-height: ${isA4 ? "297mm" : "210mm"} !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .sheet {
        box-shadow: none !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
        overflow: hidden !important;
      }
    }
  </style>
</head>
<body>
  <div class="page-wrap">
    <div class="sheet">
      <div class="header-box">
        <div class="top-badge">✦ Contactless Dining Menu ✦</div>
        <div class="logo-container">
          ${
            r.logo_url
              ? `<img class="logo-img" src="${esc(r.logo_url)}" alt="${esc(r.name)}" />`
              : `<div class="logo-placeholder">${esc(r.name.slice(0, 2).toUpperCase())}</div>`
          }
        </div>
        <h1 class="rest-name">${esc(r.name)}</h1>
        <div class="prompt">Scan to View Menu & Prices</div>
      </div>

      <div class="qr-box">
        <div class="qr-frame">
          <img class="qr-img" src="${dataUrl}" alt="QR Code" />
        </div>
        <div class="scan-msg">Point your phone camera to scan</div>
        <div class="subtext">
          No app download required • Instant mobile dining menu
        </div>
        ${
          r.hours || r.address
            ? `
        <div class="meta-details">
          ${r.hours ? `<div class="meta-line">🕒 ${esc(r.hours)}</div>` : ""}
          ${r.address ? `<div class="meta-line">📍 ${esc(r.address)}</div>` : ""}
        </div>`
            : ""
        }
      </div>

      <div class="footer-box">
        <div class="footer-url">${esc(url)}</div>
        <div class="cut-guide">✂ Cut along the line for ${format} display stand</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    printCleanHtml(html);
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
    toast.info(`Preparing clean print stand for Table #${tbl.table_number}...`);
    const tableDataUrl = await generateTableQrDataUrl(tbl.table_number);
    const tableUrl = `${url}?table=${encodeURIComponent(tbl.table_number)}`;
    const esc = (s: string) =>
      s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;800;900&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A5 portrait;
      margin: 0mm !important;
    }
    @page :first { margin: 0mm !important; }
    @page :left { margin: 0mm !important; }
    @page :right { margin: 0mm !important; }

    *, *::before, *::after {
      box-sizing: border-box !important;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: #ffffff !important;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1f1c;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      overflow: hidden !important;
    }

    .page-wrap {
      width: 100%;
      height: 100%;
      max-height: 210mm;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4mm 5mm;
      background: #ffffff;
      box-sizing: border-box;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      overflow: hidden !important;
    }

    .sheet {
      width: 128mm;
      max-height: 182mm;
      height: auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      border: 2px dashed #0f5132 !important;
      border-radius: 7mm;
      padding: 5mm 6mm;
      background: #ffffff !important;
      position: relative;
      margin: 0 auto !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      overflow: hidden !important;
    }

    .header-box {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #ecfdf5 !important;
      color: #047857 !important;
      padding: 3px 12px;
      border-radius: 999px;
      font-size: 7.5pt;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border: 1.5px solid #a7f3d0 !important;
      margin: 0 auto 2mm auto;
    }

    .rest-name {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 18pt;
      font-weight: 800;
      color: ${fg} !important;
      margin: 0 auto 0.8mm auto;
      text-align: center;
      width: 100%;
    }

    .table-banner {
      background: #1a1f1c !important;
      color: #ffffff !important;
      padding: 3.5mm 10mm;
      border-radius: 5mm;
      margin: 1.5mm auto;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      width: 85%;
      text-align: center;
    }

    .table-num {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 24pt;
      font-weight: 800;
      line-height: 1;
      letter-spacing: 0.02em;
      color: #ffffff !important;
    }

    .table-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #cbd5e1 !important;
      margin-top: 2px;
    }

    .qr-box {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 1.5mm auto;
    }

    .qr-frame {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 3mm;
      background: ${bg} !important;
      border-radius: 6mm;
      border: 2px solid #e2e8f0 !important;
      box-shadow: 0 8px 20px rgba(0,0,0,0.06);
      margin: 0 auto 1.5mm auto;
    }

    .qr-img {
      width: 65mm;
      height: 65mm;
      display: block;
      margin: 0 auto;
    }

    .instructions {
      font-size: 10pt;
      font-weight: 800;
      color: #1a1f1c !important;
      margin: 0 auto 0.8mm auto;
      text-align: center;
    }

    .subtext {
      font-size: 7pt;
      font-weight: 600;
      color: #64748b !important;
      margin: 0 auto;
      text-align: center;
    }

    .footer-box {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 1.5mm;
      margin-top: 1.5mm;
    }

    .footer-url {
      font-size: 6pt;
      font-family: monospace;
      color: #94a3b8 !important;
      margin-bottom: 0.8mm;
    }

    .cut-guide {
      font-size: 5.5pt;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    @media print {
      @page {
        size: A5 portrait;
        margin: 0mm !important;
      }
      html, body {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        overflow: hidden !important;
      }
      .page-wrap {
        padding: 4mm 5mm !important;
        height: 100% !important;
        max-height: 210mm !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .sheet {
        box-shadow: none !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
        overflow: hidden !important;
      }
    }
  </style>
</head>
<body>
  <div class="page-wrap">
    <div class="sheet">
      <div class="header-box">
        <div class="badge">✦ Contactless Dining • Scan to Order ✦</div>
        <div class="rest-name">${esc(r.name)}</div>
        ${r.address ? `<div style="font-size:7.5pt;color:#64748b;margin-top:0.5mm;">📍 ${esc(r.address)}</div>` : ""}
      </div>

      <div class="table-banner">
        <div class="table-num">TABLE #${esc(tbl.table_number)}</div>
        ${tbl.label ? `<div class="table-label">${esc(tbl.label)}</div>` : ""}
      </div>

      <div class="qr-box">
        <div class="qr-frame">
          <img class="qr-img" src="${tableDataUrl}" alt="Table ${esc(tbl.table_number)} QR" />
        </div>
        <div class="instructions">Scan to View Menu & Order from Table #${esc(tbl.table_number)}</div>
        <div class="subtext">No app download needed • Instant mobile view</div>
      </div>

      <div class="footer-box">
        <div class="footer-url">${esc(tableUrl)}</div>
        <div class="cut-guide">✂ Cut along dashed line for A5 table tent or acrylic stand</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    printCleanHtml(html);
  };

  const printAllTableStands = async () => {
    if (tables.length === 0) {
      toast.error("No tables found. Please add tables first.");
      return;
    }
    toast.info(`Preparing clean print sheets for ${tables.length} tables...`);
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
        <div class="page-wrap page-break">
          <div class="sheet">
            <div class="header-box">
              <div class="badge">✦ Contactless Dining • Scan to Order ✦</div>
              <div class="rest-name">${esc(r.name)}</div>
              ${r.address ? `<div style="font-size:7.5pt;color:#64748b;margin-top:0.5mm;">📍 ${esc(r.address)}</div>` : ""}
            </div>

            <div class="table-banner">
              <div class="table-num">TABLE #${esc(tbl.table_number)}</div>
              ${tbl.label ? `<div class="table-label">${esc(tbl.label)}</div>` : ""}
            </div>

            <div class="qr-box">
              <div class="qr-frame">
                <img class="qr-img" src="${dataUrl}" alt="Table ${esc(tbl.table_number)}" />
              </div>
              <div class="instructions">Scan to View Menu & Order from Table #${esc(tbl.table_number)}</div>
              <div class="subtext">No app download needed • Instant mobile view</div>
            </div>

            <div class="footer-box">
              <div class="footer-url">${esc(tableUrl)}</div>
              <div class="cut-guide">✂ Cut along dashed line for A5 table tent or acrylic stand</div>
            </div>
          </div>
        </div>
        `;
      })
    );

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;800;900&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A5 portrait;
      margin: 0mm !important;
    }
    @page :first { margin: 0mm !important; }
    @page :left { margin: 0mm !important; }
    @page :right { margin: 0mm !important; }

    *, *::before, *::after {
      box-sizing: border-box !important;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1f1c;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    .page-wrap {
      width: 100%;
      height: 100%;
      max-height: 210mm;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4mm 5mm;
      background: #ffffff;
      box-sizing: border-box;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      overflow: hidden !important;
    }

    .page-break {
      page-break-after: always !important;
      break-after: page !important;
    }

    .page-break:last-child {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    .sheet {
      width: 128mm;
      max-height: 182mm;
      height: auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      border: 2px dashed #0f5132 !important;
      border-radius: 7mm;
      padding: 5mm 6mm;
      background: #ffffff !important;
      position: relative;
      margin: 0 auto !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: avoid !important;
      break-after: avoid !important;
      overflow: hidden !important;
    }

    .header-box {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: #ecfdf5 !important;
      color: #047857 !important;
      padding: 3px 12px;
      border-radius: 999px;
      font-size: 7.5pt;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border: 1.5px solid #a7f3d0 !important;
      margin: 0 auto 2mm auto;
    }

    .rest-name {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 18pt;
      font-weight: 800;
      color: ${fg} !important;
      margin: 0 auto 0.8mm auto;
      text-align: center;
      width: 100%;
    }

    .table-banner {
      background: #1a1f1c !important;
      color: #ffffff !important;
      padding: 3.5mm 10mm;
      border-radius: 5mm;
      margin: 1.5mm auto;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      width: 85%;
      text-align: center;
    }

    .table-num {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 24pt;
      font-weight: 800;
      line-height: 1;
      letter-spacing: 0.02em;
      color: #ffffff !important;
    }

    .table-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #cbd5e1 !important;
      margin-top: 2px;
    }

    .qr-box {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 1.5mm auto;
    }

    .qr-frame {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 3mm;
      background: ${bg} !important;
      border-radius: 6mm;
      border: 2px solid #e2e8f0 !important;
      box-shadow: 0 8px 20px rgba(0,0,0,0.06);
      margin: 0 auto 1.5mm auto;
    }

    .qr-img {
      width: 65mm;
      height: 65mm;
      display: block;
      margin: 0 auto;
    }

    .instructions {
      font-size: 10pt;
      font-weight: 800;
      color: #1a1f1c !important;
      margin: 0 auto 0.8mm auto;
      text-align: center;
    }

    .subtext {
      font-size: 7pt;
      font-weight: 600;
      color: #64748b !important;
      margin: 0 auto;
      text-align: center;
    }

    .footer-box {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-top: 1px solid #f1f5f9;
      padding-top: 1.5mm;
      margin-top: 1.5mm;
    }

    .footer-url {
      font-size: 6pt;
      font-family: monospace;
      color: #94a3b8 !important;
      margin-bottom: 0.8mm;
    }

    .cut-guide {
      font-size: 5.5pt;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    @media print {
      @page {
        size: A5 portrait;
        margin: 0mm !important;
      }
      html, body {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        overflow: hidden !important;
      }
      .page-wrap {
        padding: 4mm 5mm !important;
        height: 100% !important;
        max-height: 210mm !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .sheet {
        box-shadow: none !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        overflow: hidden !important;
      }
    }
  </style>
</head>
<body>
  ${cardsHtml.join("")}
</body>
</html>`;

    printCleanHtml(html);
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-border/80 bg-card p-2 sm:p-3 shadow-soft min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewTab("master")}
            className={cn(
              "flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition-all",
              viewTab === "master"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <QrIcon className="size-4 shrink-0" /> Master Brand QR
          </button>
          <button
            type="button"
            onClick={() => setViewTab("tables")}
            className={cn(
              "flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition-all",
              viewTab === "tables"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Layers className="size-4 shrink-0" /> Multi-Table QRs
            <span
              className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px] font-extrabold",
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
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-w-0">
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
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => downloadTableStandPdf(tbl)}
                          title="Download Clean 1-Page PDF"
                          className="flex-1 gap-1 text-xs font-semibold shadow-soft h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <FileText className="size-3.5 text-amber-300" /> PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printTableStand(tbl)}
                          title="Print Stand (A5)"
                          className="gap-1 text-xs font-semibold px-2.5 h-8 border-border hover:bg-secondary"
                        >
                          <Printer className="size-3.5" /> Print
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadTableStandCard(tbl)}
                          title="Download 300 DPI HD Stand Card (PNG)"
                          className="gap-1 text-xs font-semibold px-2 h-8 border-primary/30 text-primary hover:bg-primary/5"
                        >
                          <Download className="size-3.5" /> HD
                        </Button>
                      </div>
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
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1.1fr_0.9fr] min-w-0">
        {/* Left Column: Customizer & Template Previews */}
        <div className="min-w-0 space-y-6">
          {/* Customizer Panel */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-soft min-w-0">
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
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-soft min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold">Print Ready Templates</h2>
                <p className="text-xs text-muted-foreground">Instant A5 table cards & A4 entrance posters.</p>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1 text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTemplateTab("A5")}
                  className={cn(
                    "rounded-md px-2.5 sm:px-3 py-1 font-semibold transition-all text-xs",
                    templateTab === "A5" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Table Card (A5)
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateTab("A4")}
                  className={cn(
                    "rounded-md px-2.5 sm:px-3 py-1 font-semibold transition-all text-xs",
                    templateTab === "A4" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Wall Poster (A4)
                </button>
              </div>
            </div>

            {/* Template Card Visual Preview */}
            <div className="mt-5 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-3 sm:p-5 text-center min-w-0">
              <div
                className="mx-auto w-full max-w-[270px] sm:max-w-xs rounded-2xl border border-border bg-white p-4 sm:p-6 shadow-lift text-center"
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
                    <img src={qrDataUrl} alt="QR Code" className="size-32 sm:size-36 object-contain" />
                  ) : (
                    <div className="size-32 sm:size-36 grid place-items-center text-xs text-muted-foreground">Generating...</div>
                  )}
                </div>

                <p className="text-xs font-bold" style={{ color: fg }}>
                  {templateTab === "A5" ? "Place on Dining Table" : "Display at Counter & Entrance"}
                </p>
                {r.address && <p className="mt-1 text-[10px] text-muted-foreground">{r.address}</p>}
              </div>

              <div className="mt-5 space-y-3 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 w-full">
                  <Button
                    onClick={() => downloadCleanPdf(templateTab)}
                    className="gap-2 shadow-soft font-semibold text-xs sm:text-sm h-10 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <FileText className="size-4 shrink-0 text-amber-300" /> Download Clean PDF (1-Page)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => printTemplate(templateTab)}
                    className="gap-2 font-semibold text-xs sm:text-sm h-10 border-border hover:bg-secondary"
                  >
                    <Printer className="size-4 shrink-0 text-muted-foreground" /> Print Clean Sheet
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadPrintableCard(templateTab)}
                    className="gap-2 text-xs sm:text-sm h-10 border-border hover:bg-secondary font-semibold"
                  >
                    <Download className="size-4 shrink-0 text-muted-foreground" /> HD Image (300 DPI)
                  </Button>
                </div>

                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-left text-xs text-muted-foreground flex items-start gap-2.5">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-semibold text-foreground">1-Page Clean Print & PDF Guarantee</p>
                    <div className="text-[11px] space-y-1 text-foreground/85 pl-1">
                      <div>• <strong>Download Clean PDF (1-Page)</strong>: Single-click me exact 1-page PDF download hogi bina kisi browser timestamp, date, URL ya page number ke!</div>
                      <div>• <strong>Mobile & Desktop Print</strong>: Single-page strict constraints apply kiye gaye hain taaki mobile print me 2nd page kabhi na aaye.</div>
                      <div>• Agar browser print dialog use karein to settings me <em>Headers & Footers</em> off aur <em>Background Graphics</em> on rakhein.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live QR Code & Download Sizes */}
        <div className="min-w-0 space-y-6">
          {/* Live Code Box */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-soft min-w-0">
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live QR Preview</h2>
              <span className="flex items-center gap-1.5 text-xs font-bold text-veg">
                <span className="size-2 rounded-full bg-veg animate-pulse" /> Live & Ready
              </span>
            </div>

            {/* Canvas Box */}
            <div
              className="mt-5 flex min-h-[250px] sm:min-h-[340px] items-center justify-center rounded-2xl border border-border/80 p-3 sm:p-6 shadow-inner min-w-0 overflow-hidden"
              style={{ backgroundColor: bg }}
            >
              <div
                ref={box}
                className="w-full max-w-[250px] sm:max-w-[320px] mx-auto overflow-hidden rounded-xl flex items-center justify-center [&>canvas]:!w-full [&>canvas]:!h-auto [&>canvas]:!max-w-full [&>canvas]:aspect-square [&>canvas]:block"
              />
            </div>

            {/* Menu Link Row */}
            <div className="mt-5 rounded-xl border border-border/70 bg-muted/40 p-2 sm:p-2.5 ps-3 sm:ps-3.5 flex items-center gap-2 min-w-0">
              <span className="flex-1 min-w-0 truncate text-[11px] sm:text-xs font-medium font-mono text-muted-foreground" title={url}>
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
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {PNG_SIZES.map((s) => {
                  const active = pngSize === s.px;
                  return (
                    <button
                      key={s.px}
                      type="button"
                      onClick={() => setPngSize(s.px)}
                      className={cn(
                        "flex flex-col items-start rounded-xl border p-2 sm:p-2.5 text-left transition-all min-w-0",
                        active
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                          : "border-border hover:bg-secondary text-foreground"
                      )}
                    >
                      <span className="text-[11px] sm:text-xs font-bold truncate w-full">{s.label}</span>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">{s.px} px</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button onClick={() => downloadPng(pngSize)} className="w-full gap-1.5 sm:gap-2 shadow-soft font-semibold text-xs sm:text-sm h-10">
                  <Download className="size-4 shrink-0" /> Download PNG ({pngSize}px)
                </Button>
                <Button variant="outline" onClick={downloadSvg} className="w-full gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm h-10">
                  <Download className="size-4 shrink-0" /> Download Vector SVG
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
