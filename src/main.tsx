import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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

createRoot(document.getElementById("root")!).render(<App />);
