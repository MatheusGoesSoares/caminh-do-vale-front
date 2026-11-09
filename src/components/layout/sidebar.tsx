import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCanOperate } from "@/hooks/use-session";
import {
  LayoutDashboard,
  Activity,
  Package,
  MapPin,
  Bell,
  FileText,
  Settings,
  Building2,
  Route,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import logoHorizontal from "@/assets/brand/logo-horizontal-light.png";
import logoIcon from "@/assets/brand/logo-icon-original.png";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  alertCount?: number;
}

const navItems = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/" },
  { icon: Activity, label: "Monitoramento", path: "/monitoramento" },
  { icon: Package, label: "Cargas e Lotes", path: "/cargas" },
  { icon: Route, label: "Viagens", path: "/viagens", operatorOnly: true },
  { icon: MapPin, label: "Mapa de Transportes", path: "/mapa" },
  { icon: Bell, label: "Alertas", path: "/alertas", badge: true },
  { icon: FileText, label: "Histórico e Relatórios", path: "/relatorios" },
  { icon: Building2, label: "Empresas", path: "/empresas" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function Sidebar({ collapsed, onToggle, alertCount = 0 }: SidebarProps) {
  const canOperate = useCanOperate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out shadow-xl",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
      style={{ background: "linear-gradient(170deg, #1a7a44 0%, #1F8A4D 30%, #16643A 70%, #124e2e 100%)" }}
    >
      <svg
        className="pointer-events-none absolute bottom-0 left-0 w-full"
        viewBox="0 0 260 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path fill="rgba(47, 168, 102, 0.18)" d="M0,60 C60,40 120,80 180,60 C220,46 245,50 260,56 L260,120 L0,120Z" />
        <path fill="rgba(191, 227, 200, 0.08)" d="M0,84 C70,70 130,100 200,86 C230,80 250,82 260,84 L260,120 L0,120Z" />
      </svg>

      {/* Logo */}
      <div
        className={cn(
          "relative flex items-center border-b border-white/10 shrink-0 transition-all duration-300",
          collapsed ? "h-[88px] justify-center px-2" : "h-[88px] justify-center px-3"
        )}
      >
        {collapsed ? (
          <img
            src={logoIcon}
            alt="Caminho do Vale"
            className="w-12 h-12 object-contain drop-shadow-lg"
          />
        ) : (
          <img
            src={logoHorizontal}
            alt="Caminho do Vale"
            className="h-[64px] w-auto max-w-full object-contain drop-shadow-lg"
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 py-3 px-2 overflow-y-auto" role="navigation" aria-label="Menu principal">
        <ul className="space-y-0.5">
          {navItems.filter((item) => canOperate || !("operatorOnly" in item)).map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <li
                key={item.path}
                className="relative"
                onMouseEnter={() => collapsed ? setHoveredItem(item.path) : undefined}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                    collapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5",
                    active
                      ? "bg-white/15 text-white border-l-[3px] border-[#F2C94C] shadow-sm"
                      : "text-[#BFE3C8]/85 hover:bg-white/10 hover:text-white border-l-[3px] border-transparent"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "shrink-0 transition-colors",
                      collapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
                      active ? "text-[#F2C94C]" : "text-[#BFE3C8]/85 group-hover:text-white"
                    )}
                  />
                  {!collapsed && <span>{item.label}</span>}
                  {item.badge && alertCount > 0 && (
                    <span
                      className={cn(
                        "flex items-center justify-center text-[10px] font-bold text-white bg-[#D94F4F] rounded-full",
                        collapsed
                          ? "absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1"
                          : "ml-auto h-5 min-w-[20px] px-1.5"
                      )}
                    >
                      {alertCount > 99 ? "99+" : alertCount}
                    </span>
                  )}
                </NavLink>

                {/* Tooltip when collapsed */}
                {collapsed && hoveredItem === item.path && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                    <div className="bg-[#123A24] text-white text-xs font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-lg">
                      {item.label}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="relative shrink-0 border-t border-white/10 p-2">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full py-2 rounded-lg text-[#BFE3C8]/85 hover:bg-white/10 hover:text-white transition-colors"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs font-medium">Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
