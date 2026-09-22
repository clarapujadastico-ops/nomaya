import { createRoot } from "react-dom/client";
import "./index.css";

// A blank screen with zero feedback is undebuggable from a bug report alone.
// This catches anything an ErrorBoundary can't (errors during App's own
// module import/evaluation, before React ever mounts) and shows it directly
// in the page instead of leaving a silent white screen.
function showFatalError(detail: string) {
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `<div style="min-height:100dvh;padding:24px;padding-top:max(24px,env(safe-area-inset-top));background:#1a1a2e;color:#fff;font-family:-apple-system,sans-serif;overflow-y:auto;">
    <p style="font-size:20px;font-weight:600;margin-bottom:12px;">Failed to load</p>
    <p style="font-size:14px;opacity:0.8;margin-bottom:16px;">Please screenshot this and send it to the team.</p>
    <pre style="font-size:12px;white-space:pre-wrap;word-break:break-word;background:rgba(255,255,255,0.1);padding:12px;border-radius:8px;">${detail.replace(/</g, "&lt;")}</pre>
  </div>`;
}
window.addEventListener("error", (e) => console.error("[window.onerror]", e.error ?? e.message));
window.addEventListener("unhandledrejection", (e) => console.error("[unhandledrejection]", e.reason));

// ── iOS WKWebView keyboard zoom fix ───────────────────────────────────────────
// iOS auto-zooms when an input is focused, and the viewport doesn't always
// reset when the keyboard dismisses. Toggling the viewport meta forces a reset.
(function iosKeyboardZoomFix() {
  const VIEWPORT = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  function resetViewport() {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) return;
    meta.setAttribute('content', VIEWPORT + ', ');
    requestAnimationFrame(() => meta.setAttribute('content', VIEWPORT));
    window.scrollTo(0, 0);
  }
  document.addEventListener('focusout', () => setTimeout(resetViewport, 80), true);
})();

// Dynamic import so a throw during App.tsx's own module evaluation (or
// anything it imports) lands in this .catch too — a plain top-level
// `import App from "./App"` would fail before this file's try/catch could
// ever run, which is exactly the kind of failure that produces a silent
// blank screen with nothing in the visible UI to explain it.
import("./App.tsx")
  .then(({ default: App }) => {
    createRoot(document.getElementById("root")!).render(<App />);
  })
  .catch((err) => {
    console.error("[bootstrap]", err);
    showFatalError(err instanceof Error ? `${err.name}: ${err.message}\n\n${err.stack}` : String(err));
  });
