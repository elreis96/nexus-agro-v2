import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/serviceWorker";
import { performanceAnalytics } from "./lib/performance";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Registrar Service Worker em produção
registerServiceWorker();

// Inicializar analytics de performance
if (import.meta.env.DEV) {
  // Log resumo de performance em desenvolvimento
  window.addEventListener('load', () => {
    setTimeout(() => {
      const summary = performanceAnalytics.getSummary();
      console.log('📊 Performance Summary:', summary);
    }, 2000);
  });
}
