import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initFwHarness } from "./fireweave/fw-harness";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

(async () => {
  await initFwHarness();
  createRoot(document.getElementById("root")!).render(<App />);
})();
