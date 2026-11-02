import { cn } from "@/lib/utils";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

type ConnectionStatus = "connected" | "disconnected" | "syncing";

interface StatusIndicatorProps {
  status: ConnectionStatus;
  label?: string;
  className?: string;
}

const statusConfig: Record<ConnectionStatus, { colors: string; Icon: typeof Wifi; defaultLabel: string }> = {
  connected: { colors: "text-[#1F8A4D] bg-[#E6F4EA]", Icon: Wifi, defaultLabel: "Conectado" },
  disconnected: { colors: "text-[#D94F4F] bg-red-50", Icon: WifiOff, defaultLabel: "Desconectado" },
  syncing: { colors: "text-[#E08A2E] bg-amber-50", Icon: RefreshCw, defaultLabel: "Sincronizando" },
};

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  const { colors, Icon, defaultLabel } = statusConfig[status];
  const displayLabel = label ?? defaultLabel;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1",
        colors,
        className
      )}
      role="status"
      aria-label={displayLabel}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5",
          status === "syncing" && "animate-spin motion-reduce:animate-none"
        )}
        aria-hidden="true"
      />
      <span className="hidden sm:inline">{displayLabel}</span>
    </div>
  );
}
