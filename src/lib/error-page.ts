export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Menuly — Something went wrong</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: #fbf9f5;
        color: #1a2e26;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        position: relative;
        overflow-x: hidden;
      }
      .bg-decor {
        position: absolute;
        width: 480px;
        height: 480px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(46, 125, 82, 0.08) 0%, rgba(251, 249, 245, 0) 70%);
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 0;
      }
      .card {
        position: relative;
        z-index: 1;
        max-width: 440px;
        width: 100%;
        background: #ffffff;
        border: 1px solid rgba(26, 46, 38, 0.1);
        border-radius: 24px;
        padding: 2.5rem 2rem;
        text-align: center;
        box-shadow: 0 10px 30px -10px rgba(26, 46, 38, 0.12), 0 20px 50px -20px rgba(46, 125, 82, 0.15);
      }
      .icon-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        border-radius: 20px;
        background: #fdf3e7;
        color: #d97706;
        margin-bottom: 1.5rem;
      }
      .icon-wrap svg {
        width: 32px;
        height: 32px;
        stroke-width: 2;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        font-weight: 700;
        color: #2e7d52;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-bottom: 0.75rem;
      }
      h1 {
        font-family: 'Fraunces', Georgia, serif;
        font-size: 1.75rem;
        font-weight: 700;
        color: #1a2e26;
        line-height: 1.25;
        margin-bottom: 0.75rem;
      }
      p {
        font-size: 0.9375rem;
        color: #5c6b64;
        line-height: 1.6;
        margin-bottom: 2rem;
      }
      .actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      @media (min-width: 480px) {
        .actions {
          flex-direction: row;
        }
      }
      .btn {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0.75rem 1.25rem;
        border-radius: 12px;
        font-size: 0.9375rem;
        font-weight: 600;
        font-family: inherit;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.15s ease-in-out;
        border: 1px solid transparent;
      }
      .btn:active {
        transform: scale(0.98);
      }
      .btn-primary {
        background: #2e7d52;
        color: #ffffff;
      }
      .btn-primary:hover {
        background: #256643;
      }
      .btn-secondary {
        background: #fbf9f5;
        color: #1a2e26;
        border-color: rgba(26, 46, 38, 0.15);
      }
      .btn-secondary:hover {
        background: #f3efe6;
      }
      .footer-text {
        margin-top: 1.5rem;
        font-size: 0.75rem;
        color: #8c9b94;
      }
    </style>
  </head>
  <body>
    <div class="bg-decor"></div>
    <main class="card">
      <div class="brand">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect width="5" height="5" x="3" y="3" rx="1"/>
          <rect width="5" height="5" x="16" y="3" rx="1"/>
          <rect width="5" height="5" x="3" y="16" rx="1"/>
          <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
          <path d="M21 21v.01"/>
          <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
          <path d="M3 12h.01"/>
          <path d="M12 3h.01"/>
          <path d="M12 16v.01"/>
          <path d="M16 12h1"/>
          <path d="M21 12v.01"/>
          <path d="M12 21v-1"/>
        </svg>
        Menuly
      </div>
      <div class="icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1>Kitchen Hiccup</h1>
      <p>Something went wrong while loading this page. Our team has been alerted. Try refreshing or head back to safety.</p>
      <div class="actions">
        <button class="btn btn-primary" onclick="location.reload()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M8 16H3v5"/>
          </svg>
          Try again
        </button>
        <a class="btn btn-secondary" href="/">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Go home
        </a>
      </div>
      <div class="footer-text">Error code 500 &bull; Menuly Digital Menus</div>
    </main>
  </body>
</html>`;
}
