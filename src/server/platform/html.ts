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
      --bg: #FAF7F2;
      --card-bg: #FFFFFF;
      --card-border: #EFE8DE;
      --text: #1C2826;
      --text-muted: #6B7280;
      --primary: #1E4738;
      --primary-hover: #16372B;
      --veg: #16A34A;
      --veg-bg: rgba(22, 163, 74, 0.06);
      --veg-border: rgba(22, 163, 74, 0.28);
      --amber: #D97706;
      --amber-bg: rgba(217, 119, 6, 0.08);
      --amber-border: rgba(217, 119, 6, 0.25);
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      background-image:
        radial-gradient(1200px 500px at 85% -10%, rgba(217, 119, 6, 0.12), transparent 60%),
        radial-gradient(900px 500px at -10% 110%, rgba(30, 71, 56, 0.10), transparent 60%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.5rem 1rem;
      position: relative;
      overflow-x: hidden;
    }
    #ambient-canvas {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      opacity: 0.85;
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--text);
      font-family: 'Fraunces', Georgia, serif;
      font-size: 1.45rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .brand-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: var(--primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(30, 71, 56, 0.25);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--card-bg);
      color: #B45309;
      border: 1px solid var(--amber-border);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #D97706;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.35; transform: scale(0.85); }
    }
    main {
      width: 100%;
      max-width: 620px;
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
      box-shadow: 0 20px 45px -15px rgba(30, 71, 56, 0.12), 0 0 1px rgba(0,0,0,0.08);
      backdrop-filter: blur(10px);
    }
    .icon-box {
      width: 68px;
      height: 68px;
      border-radius: 1.25rem;
      background: rgba(30, 71, 56, 0.08);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
      box-shadow: 0 0 0 8px rgba(30, 71, 56, 0.03);
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary);
      background: rgba(30, 71, 56, 0.06);
      border: 1px solid rgba(30, 71, 56, 0.15);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 0.75rem;
    }
    h1 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 2.1rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 0.75rem;
      color: var(--text);
    }
    p.lead {
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
    .qr-banner {
      background: var(--veg-bg);
      border: 1.5px solid var(--veg-border);
      border-radius: 1.25rem;
      padding: 1.25rem;
      text-align: left;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(22, 163, 74, 0.04);
    }
    .qr-icon {
      width: 42px;
      height: 42px;
      border-radius: 0.85rem;
      background: rgba(22, 163, 74, 0.12);
      color: var(--veg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .qr-title {
      font-size: 0.82rem;
      font-weight: 800;
      color: #15803D;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin-bottom: 0.25rem;
    }
    .qr-desc {
      font-size: 0.82rem;
      line-height: 1.55;
      color: #374151;
    }
    .qr-desc strong {
      color: var(--text);
    }
    .status-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      text-align: left;
    }
    .status-card {
      border: 1px solid var(--card-border);
      background: #FDFBF7;
      padding: 0.75rem 1rem;
      border-radius: 1rem;
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .status-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text);
    }
    .status-val {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--veg);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
      margin-bottom: 1rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.35rem;
      border-radius: 0.85rem;
      font-size: 0.875rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }
    .btn-primary {
      background: var(--primary);
      color: #FFFFFF;
      box-shadow: 0 4px 12px rgba(30, 71, 56, 0.2);
    }
    .btn-primary:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }
    .btn-wa {
      background: #FFFFFF;
      color: var(--veg);
      border-color: rgba(22, 163, 74, 0.4);
    }
    .btn-wa:hover {
      background: rgba(22, 163, 74, 0.08);
      transform: translateY(-1px);
    }
    .btn-outline {
      background: #FFFFFF;
      color: var(--text-muted);
      border-color: #D1D5DB;
    }
    .btn-outline:hover {
      color: var(--text);
      background: #F9FAFB;
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
      color: var(--primary);
      text-decoration: none;
      font-weight: 700;
    }
    footer a:hover {
      text-decoration: underline;
    }
    @media (max-width: 640px) {
      .card { padding: 1.75rem 1.25rem; }
      h1 { font-size: 1.75rem; }
      .status-grid { grid-template-columns: 1fr; }
      .actions { flex-direction: column; }
      .btn { width: 100%; }
      header { flex-direction: column; gap: 0.75rem; text-align: center; }
      footer { flex-direction: column; text-align: center; }
    }
  </style>
</head>
<body>
  <!-- Ambient Interactive Canvas Animation Layer -->
  <canvas id="ambient-canvas"></canvas>

  <header>
    <a href="/" class="brand">
      <div class="brand-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      </div>
      <span>Menuly</span>
    </a>
    <div class="badge">
      <span class="dot"></span>
      Scheduled Maintenance
    </div>
  </header>

  <main>
    <div class="card">
      <div class="icon-box">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      </div>

      <div class="pill">
        <span>⚡ Platform Infrastructure Upgrades</span>
      </div>

      <h1>We're Upgrading Menuly</h1>
      <p class="lead">
        Our core platform is undergoing scheduled performance enhancements and database optimization.
        Public website pages and account dashboards will be back online shortly.
      </p>

      <!-- RESTAURANT DINER QR UNINTERRUPTED ASSURANCE -->
      <div class="qr-banner">
        <div class="qr-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </div>
        <div>
          <div class="qr-title">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#16A34A;"></span>
            Active Restaurant QR Menus Are 100% Live
          </div>
          <div class="qr-desc">
            Are you seated at a cafe or restaurant? <strong>Diners scanning table QR codes have 24/7 uninterrupted access</strong> to food menus, categories, and prices. Our digital menu engine remains fully online.
          </div>
        </div>
      </div>

      <div class="status-grid">
        <div class="status-card">
          <div style="color:#16A34A;font-size:1.1rem;">&#x2713;</div>
          <div>
            <div class="status-label">Digital QR Engine</div>
            <div class="status-val">Operational & Live</div>
          </div>
        </div>
        <div class="status-card">
          <div style="color:#D97706;font-size:1.1rem;">&#x2699;</div>
          <div>
            <div class="status-label">Platform Core</div>
            <div class="status-val" style="color:#D97706;">Upgrades in Progress</div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button onclick="window.location.reload()" class="btn btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          Check Again / Refresh
        </button>
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-wa">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          WhatsApp Helpline
        </a>
        <a href="mailto:${email}" class="btn btn-outline">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          Email Support
        </a>
      </div>

      <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.75rem;">
        We appreciate your patience while we make Menuly even better!
      </p>
    </div>
  </main>

  <footer>
    <div>&copy; ${new Date().getFullYear()} Menuly. Digital QR menus for restaurants.</div>
    <div>Platform administrator? <a href="/admin">Open Admin Console &rarr;</a></div>
  </footer>

  <!-- Interactive HTML5 Canvas Animation Script -->
  <script>
    (function() {
      var canvas = document.getElementById('ambient-canvas');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      if (!ctx) return;

      var width = canvas.width = window.innerWidth;
      var height = canvas.height = window.innerHeight;

      window.addEventListener('resize', function() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      });

      var count = Math.min(Math.floor((width * height) / 22000), 55);
      var particles = [];
      var colors = [
        'rgba(30, 71, 56, ',
        'rgba(217, 119, 6, ',
        'rgba(245, 158, 11, '
      ];

      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 2.5 + 1.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.4 + 0.15,
          pulse: Math.random() * 0.02 + 0.005
        });
      }

      var mouse = { x: -1000, y: -1000, radius: 120 };
      window.addEventListener('mousemove', function(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      });
      window.addEventListener('mouseleave', function() {
        mouse.x = -1000;
        mouse.y = -1000;
      });

      var tick = 0;
      function animate() {
        tick++;
        ctx.clearRect(0, 0, width, height);

        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;

          var dx = p.x - mouse.x;
          var dy = p.y - mouse.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            var force = (mouse.radius - dist) / mouse.radius;
            var angle = Math.atan2(dy, dx);
            p.x += Math.cos(angle) * force * 1.5;
            p.y += Math.sin(angle) * force * 1.5;
          }

          var curAlpha = p.alpha + Math.sin(tick * p.pulse) * 0.1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color + Math.max(0.05, Math.min(curAlpha, 0.6)) + ')';
          ctx.fill();

          for (var j = i + 1; j < particles.length; j++) {
            var p2 = particles[j];
            var cdx = p.x - p2.x;
            var cdy = p.y - p2.y;
            var cdist = Math.sqrt(cdx * cdx + cdy * cdy);
            if (cdist < 110) {
              var lineAlpha = (1 - cdist / 110) * 0.12;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = 'rgba(180, 140, 90, ' + lineAlpha + ')';
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
        requestAnimationFrame(animate);
      }
      animate();
    })();
  </script>
</body>
</html>`;
}
