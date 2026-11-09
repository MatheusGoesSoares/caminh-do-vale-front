import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCanOperate } from "@/hooks/use-session";
import {
  LayoutDashboard,
  Activity,
  MapPin,
  Bell,
  Menu,
  X,
  Package,
  FileText,
  Settings,
  Building2,
  Route,
} from "lucide-react";

interface MobileNavProps {
  alertCount?: number;
}

const mainItems = [
  { icon: LayoutDashboard, label: "Início", path: "/" },
  { icon: Activity, label: "Monitor", path: "/monitoramento" },
  { icon: MapPin, label: "Mapa", path: "/mapa" },
  { icon: Bell, label: "Alertas", path: "/alertas", badge: true },
];

const menuItems = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/" },
  { icon: Activity, label: "Monitoramento", path: "/monitoramento" },
  { icon: Package, label: "Cargas e Lotes", path: "/cargas" },
  { icon: Route, label: "Viagens", path: "/viagens", operatorOnly: true },
  { icon: MapPin, label: "Mapa de Transportes", path: "/mapa" },
  { icon: Bell, label: "Alertas", path: "/alertas" },
  { icon: FileText, label: "Histórico e Relatórios", path: "/relatorios" },
  { icon: Building2, label: "Empresas", path: "/empresas" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function MobileNav({ alertCount = 0 }: MobileNavProps) {
  const canOperate = useCanOperate();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Slide-up menu */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 lg:hidden transform transition-transform duration-300 ease-in-out",
          menuOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="bg-white rounded-t-2xl shadow-2xl border-t border-[#E6F4EA] max-h-[70vh] overflow-y-auto">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-[#E6F4EA] rounded-full" />
          </div>

          {/* Close button */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#E6F4EA]">
            <span className="text-sm font-semibold text-[#123A24]">Menu</span>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-1.5 rounded-lg text-[#5B7264] hover:bg-[#F4FAF5]"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Menu items */}
          <nav className="py-2 px-3">
            {menuItems.filter((item) => canOperate || !("operatorOnly" in item)).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-[#E6F4EA] text-[#1A7A44]"
                      : "text-[#5B7264] hover:bg-[#F4FAF5] hover:text-[#123A24]"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Safe area spacer */}
          <div className="h-[env(safe-area-inset-bottom,0px)]" />
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 bg-white border-t border-[#E6F4EA] lg:hidden"
        role="navigation"
        aria-label="Navegação móvel"
      >
        <div className="flex items-stretch justify-around h-14 max-w-lg mx-auto">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors relative",
                  active ? "text-[#1A7A44]" : "text-[#5B7264]"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge && alertCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex items-center justify-center h-3.5 min-w-[14px] px-0.5 text-[8px] font-bold text-white bg-[#D94F4F] rounded-full">
                      {alertCount > 9 ? "9+" : alertCount}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#1A7A44] rounded-full" />
                )}
              </NavLink>
            );
          })}

          {/* Menu toggle */}
          <button
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors",
              menuOpen ? "text-[#1A7A44]" : "text-[#5B7264]"
            )}
            aria-label="Abrir menu completo"
          >
            <Menu className="h-5 w-5" />
            <span>Menu</span>
          </button>
        </div>

        {/* Safe area padding */}
        <div className="h-[env(safe-area-inset-bottom,0px)] bg-white" />
      </nav>
    </>
  );
}
