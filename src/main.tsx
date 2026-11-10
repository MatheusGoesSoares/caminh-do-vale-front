import { StrictMode, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "@/app/providers";
import { AppRouter } from "@/app/router";
import { SplashScreen } from "@/components/layout/splash-screen";
import "@/styles/index.css";
import { registerSW } from "virtual:pwa-register";

// The app stays open for hours (dashboards, installed PWA); without this a new deploy only shows up
// after closing every tab. With registerType "autoUpdate" the page reloads once the new version is ready.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (registration) setInterval(() => void registration.update(), 60_000);
  },
});

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinished = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onFinished={handleSplashFinished} />}
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
