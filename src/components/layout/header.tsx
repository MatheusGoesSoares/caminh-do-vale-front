import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  Search,
  Bell,
  Info,
  User,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  InfoIcon,
} from "lucide-react";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { AppNotification } from "@/types";
import { logout, useSession } from "@/hooks/use-session";
import type { UserRole } from "@/services/api/session";

interface HeaderProps {
  title: string;
  isDemoMode?: boolean;
  connectionStatus?: "connected" | "disconnected" | "syncing";
  lastSyncAt?: Date | null;
  notifications?: AppNotification[];
  onNotificationRead?: (id: string) => void;
}

const notificationIcon: Record<string, typeof AlertTriangle> = {
  warning: AlertTriangle,
  critical: AlertCircle,
  success: CheckCircle2,
  info: InfoIcon,
};

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  operator: "Operador",
  viewer: "Visualizador",
};

const notificationColor: Record<string, string> = {
  warning: "text-[#E08A2E]",
  critical: "text-[#D94F4F]",
  success: "text-[#1F8A4D]",
  info: "text-[#427DA5]",
};

export function Header({
  title,
  isDemoMode = false,
  connectionStatus = "connected",
  lastSyncAt = null,
  notifications = [],
  onNotificationRead,
}: HeaderProps) {
  const navigate = useNavigate();
  const session = useSession();
  const userName = session?.user.name ?? "Operador";
  const userEmail = session?.user.email ?? "operador@demo.com";
  const userRole = session?.user.role ? roleLabels[session.user.role] : null;
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E6F4EA]">
      {/* Demo mode banner */}
      {isDemoMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-center gap-2">
          <Info className="h-3.5 w-3.5 text-[#E08A2E]" />
          <span className="text-xs font-medium text-amber-800">
            Modo demonstração — dados simulados
          </span>
        </div>
      )}

      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        {/* Left: Title */}
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-semibold text-[#123A24] truncate">
            {title}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Connection status & sync time */}
          <div className="hidden md:flex items-center gap-3">
            <StatusIndicator status={connectionStatus} />
            {lastSyncAt && (
              <span className="text-[11px] text-[#5B7264]">
                Última sincronização:{" "}
                {formatDistanceToNow(lastSyncAt, {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <form
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = searchQuery.trim();
                  if (!q) return;
                  navigate(`/cargas?busca=${encodeURIComponent(q)}`);
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="flex items-center bg-[#F4FAF5] rounded-lg border border-[#E6F4EA] overflow-hidden transition-colors focus-within:border-[#1F8A4D] focus-within:ring-2 focus-within:ring-[#1F8A4D]/20"
              >
                <Search className="h-4 w-4 text-[#5B7264] ml-2.5 shrink-0" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                  placeholder="Buscar cargas, lotes..."
                  aria-label="Buscar cargas e lotes"
                  className="bg-transparent text-sm text-[#123A24] placeholder-[#5B7264] px-2 py-1.5 w-40 sm:w-56 outline-none [&::-webkit-search-cancel-button]:hidden"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="p-1.5 text-[#5B7264] hover:text-[#123A24]"
                  aria-label="Fechar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-[#5B7264] hover:bg-[#F4FAF5] hover:text-[#123A24] transition-colors"
                aria-label="Abrir busca"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg text-[#5B7264] hover:bg-[#F4FAF5] hover:text-[#123A24] transition-colors"
              aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold text-white bg-[#D94F4F] rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-[#E6F4EA] overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#E6F4EA] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#123A24]">
                    Notificações
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-[#5B7264]">
                      {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[#5B7264]">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => {
                      const Icon = notificationIcon[notif.type] ?? InfoIcon;
                      const color = notificationColor[notif.type] ?? "text-[#5B7264]";
                      return (
                        <button
                          key={notif.id}
                          className={cn(
                            "w-full text-left px-4 py-3 border-b border-[#F4FAF5] last:border-b-0 hover:bg-[#F4FAF5] transition-colors flex gap-3",
                            !notif.read && "bg-[#E6F4EA]/30"
                          )}
                          onClick={() => onNotificationRead?.(notif.id)}
                        >
                          <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", color)} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#123A24] truncate">
                              {notif.title}
                            </p>
                            <p className="text-xs text-[#5B7264] mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-[#5B7264] mt-1">
                              {formatDistanceToNow(new Date(notif.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-[#1A7A44] shrink-0 mt-1.5" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#F4FAF5] transition-colors"
              aria-label="Menu do usuário"
            >
              <div className="h-8 w-8 rounded-full bg-[#1A7A44] flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="hidden lg:block text-sm font-medium text-[#123A24]">
                {userName}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#E6F4EA] overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#E6F4EA]">
                  <p className="text-sm font-medium text-[#123A24] truncate">{userName}</p>
                  <p className="text-xs text-[#5B7264] truncate">{userEmail}</p>
                  {userRole && (
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[#1A7A44]">
                      {userRole}
                    </p>
                  )}
                </div>
                {session && (
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                        navigate("/login", { replace: true });
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#5B7264] hover:bg-[#F4FAF5] hover:text-[#123A24] transition-colors"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
