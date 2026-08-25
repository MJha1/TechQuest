import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import { initAnalytics } from "@/lib/analytics";
import "./index.css";

// Product analytics (PostHog). No-op unless VITE_POSTHOG_KEY is configured.
initAnalytics();

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
