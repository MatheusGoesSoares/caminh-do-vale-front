import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// The browser fires this once, possibly before React mounts, so capture it at module load.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
  notify();
});
window.addEventListener("appinstalled", () => {
  deferred = null;
  notify();
});

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export interface PwaInstall {
  /** Show an install button at all. */
  available: boolean;
  /** iOS has no install prompt; the button should show manual steps instead. */
  needsManualSteps: boolean;
  install: () => Promise<void>;
}

export function usePwaInstall(): PwaInstall {
  const prompt = useSyncExternalStore(subscribe, () => deferred);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const mql = window.matchMedia("(display-mode: standalone)");
    const update = () => setInstalled(isStandalone());
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    const event = deferred;
    deferred = null;
    notify();
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") setInstalled(true);
  }, []);

  const ios = isIos();
  return {
    available: !installed && (!!prompt || ios),
    needsManualSteps: !installed && !prompt && ios,
    install,
  };
}
