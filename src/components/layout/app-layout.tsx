import { useState, useCallback, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { useAlerts, useNotifications } from "@/hooks/use-data-service";
import { isDemoMode } from "@/services";

const pageTitles: Record<string, string> = {
  "/": "Visão Geral",
  "/monitoramento": "Monitoramento",
  "/cargas": "Cargas e Lotes",
  "/mapa": "Mapa de Transportes",
  "/alertas": "Alertas",
  "/relatorios": "Histórico e Relatórios",
  "/configuracoes": "Configurações",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/cargas/")) return "Detalhes da Carga";
  for (const [path, title] of Object.entries(pageTitles)) {
    if (path !== "/" && pathname.startsWith(path)) return title;
  }
  return "Caminho do Vale";
}

export function AppLayout() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(() => new Date());

  const { data: alerts, isError: alertsError, isFetching: alertsFetching } = useAlerts({ status: "active" });
  const connectionStatus = alertsError
    ? "disconnected"
    : !alerts && alertsFetching
      ? "syncing"
      : "connected";
  const { data: notifications } = useNotifications();
  const alertCount = alerts?.length ?? 0;

  useEffect(() => {
    if (alerts || notifications) {
      setLastSyncAt(new Date());
    }
  }, [alerts, notifications]);

  const title = getPageTitle(location.pathname);
  const isMapPage = location.pathname === "/mapa";

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setSidebarCollapsed(true);
    };
    handler(mql);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-[#F4FAF5]">
      {/* Desktop/Tablet sidebar */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          alertCount={alertCount}
        />
      </div>

      {/* Main content area */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-[margin-left] duration-300 ease-in-out",
          "md:ml-[var(--sidebar-width)]"
        )}
        style={
          { "--sidebar-width": sidebarCollapsed ? "72px" : "260px" } as React.CSSProperties
        }
      >
        <Header
          title={title}
          isDemoMode={isDemoMode()}
          connectionStatus={connectionStatus}
          lastSyncAt={lastSyncAt}
          notifications={notifications ?? []}
        />

        <main
          className={cn(
            "flex-1",
            isMapPage ? "p-0" : "p-4 sm:p-6 lg:p-8",
            !isMapPage && "pb-20 md:pb-4"
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav alertCount={alertCount} />
    </div>
  );
}
