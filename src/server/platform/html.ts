import type { PlatformSettingsData } from "./service";

export function renderMaintenanceHtml(settings: PlatformSettingsData): string {
  const whatsapp = settings.supportWhatsApp || "919876543210";
  const email = settings.supportEmail || "menulyofficial@gmail.com";
  const cleanDigits = whatsapp.replace(/\D/g, "");
  const waUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent("Hello Menuly Support, I have a query during platform maintenance.")}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Scheduled Maintenance &mdash; Menuly</title>
  <meta name="description" content="Menuly is currently undergoing scheduled platform upgrades and maintenance." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0c0f14;
      --card-bg: rgba(20, 24, 33, 0.95);
      --card-border: rgba(255, 255, 255, 0.08);
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #f59e0b;
      --primary-hover: #d97706;
      --emerald: #10b981;
      --emerald-bg: rgba(16, 185, 129, 0.08);
      --emerald-border: rgba(16, 185, 129, 0.25);
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.5rem 1rem;
      position: relative;
      overflow-x: hidden;
    }
    .glow-1 {
      position: absolute;
      top: 20%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 450px;
      height: 450px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%);
      pointer-events: none;
      filter: blur(40px);
    }
    .glow-2 {
      position: absolute;
      bottom: 10%;
      right: 10%;
      width: 320px;
      height: 320px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
      pointer-events: none;
      filter: blur(40px);
    }
    header {
      width: 100%;
      max-width: 720px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 10;
    }
    .brand {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 1.6rem;
      font-weight: 700;
      color: #fff;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fbbf24;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    main {
      width: 100%;
      max-width: 650px;
      margin: auto;
      position: relative;
      z-index: 10;
      padding: 1.5rem 0;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 1.75rem;
      padding: 2.5rem 2rem;
      text-align: center;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(12px);
    }
    .icon-box {
      width: 72px;
      height: 72px;
      border-radius: 1.25rem;
      background: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.04);
    }
    h1 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 2.1rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 0.75rem;
      color: #fff;
    }
    p.lead {
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--text-muted);
      margin-bottom: 1.75rem;
    }
    .qr-banner {
      background: var(--emerald-bg);
      border: 1.5px solid var(--emerald-border);
      border-radius: 1.25rem;
      padding: 1.25rem;
      text-align: left;
      margin-bottom: 1.75rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    .qr-icon {
      width: 40px;
      height: 40px;
      border-radius: 0.75rem;
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1.2rem;
    }
    .qr-title {
      font-size: 0.85rem;
      font-weight: 800;
      color: #34d399;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.25rem;
    }
    .qr-desc {
      font-size: 0.8rem;
      line-height: 1.5;
      color: #d1d5db;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
      margin-bottom: 1.25rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.4rem;
      border-radius: 0.85rem;
      font-size: 0.875rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: #f59e0b;
      color: #0c0f14;
    }
    .btn-primary:hover {
      background: #d97706;
      transform: translateY(-1px);
    }
    .btn-wa {
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.35);
    }
    .btn-wa:hover {
      background: rgba(16, 185, 129, 0.2);
      transform: translateY(-1px);
    }
    .btn-outline {
      background: rgba(255, 255, 255, 0.05);
      color: #e5e7eb;
      border-color: rgba(255, 255, 255, 0.15);
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    footer {
      width: 100%;
      max-width: 720px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.78rem;
      color: var(--text-muted);
      position: relative;
      z-index: 10;
      padding-top: 1rem;
    }
    footer a {
      color: #f59e0b;
      text-decoration: none;
      font-weight: 600;
    }
    footer a:hover {
      text-decoration: underline;
    }
    @media (max-width: 640px) {
      .card { padding: 1.75rem 1.25rem; }
      h1 { font-size: 1.75rem; }
      .actions { flex-direction: column; }
      .btn { width: 100%; }
      header { flex-direction: column; gap: 0.75rem; text-align: center; }
      footer { flex-direction: column; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>

  <header>
    <a href="/" class="brand">Menuly</a>
    <div class="badge">
      <span class="dot"></span>
      Scheduled Platform Maintenance
    </div>
  </header>

  <main>
    <div class="card">
      <div class="icon-box">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      </div>

      <h1>We're Upgrading Menuly</h1>
      <p class="lead">
        Hamare servers par platform upgrades aur database optimization ka kaam chal raha hai.
        Public website temporary pause hai taaki hum aapke liye naye features aur fast performance laa sakein.
      </p>

      <!-- RESTAURANT DINER QR ASSURANCE -->
      <div class="qr-banner">
        <div class="qr-icon">&#x26A1;</div>
        <div>
          <div class="qr-title">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#10b981;"></span>
            Active Restaurant QR Menus Are 100% Live
          </div>
          <div class="qr-desc">
            Agar aap kisi restaurant mein table par QR code scan kar rahe hain, toh chinta mat kijiye!
            <strong>Sabhi restaurant digital menus bina kisi rukawat ke 24/7 chal rahe hain</strong> aur aap bina kisi pareshani ke menu dekh sakte hain.
          </div>
        </div>
      </div>

      <div class="actions">
        <button onclick="window.location.reload()" class="btn btn-primary">
          &#x21bb; Check Again / Refresh
        </button>
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-wa">
          &#x1F4AC; WhatsApp Helpline
        </a>
        <a href="mailto:${email}" class="btn btn-outline">
          &#x2709; Email Support
        </a>
      </div>

      <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.75rem;">
        Thank you for your patience! We will be back online shortly.
      </p>
    </div>
  </main>

  <footer>
    <div>&copy; ${new Date().getFullYear()} Menuly. Digital QR menus for restaurants.</div>
    <div>Are you an admin? <a href="/admin">Open Admin Console &rarr;</a></div>
  </footer>
</body>
</html>`;
}
