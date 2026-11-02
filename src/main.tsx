import { StrictMode, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "@/app/providers";
import { AppRouter } from "@/app/router";
import { SplashScreen } from "@/components/layout/splash-screen";
import "@/styles/index.css";

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
