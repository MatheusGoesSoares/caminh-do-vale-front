import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/format";
import type { Shipment } from "@/types";

const connectionLabel = { wifi: "Wi-Fi", "2g": "rede 2G" } as const;

// While sending, the board talks to the API about every 30 s. The backend only flags it offline after
// 10 min, so a shorter silence already means it stopped sending.
const SILENT_AFTER_MS = 2 * 60_000;

export function boardIsSilent(device: Shipment["device"], now = Date.now()): boolean {
  if (!device?.lastSeenAt) return true;
  return now - new Date(device.lastSeenAt).getTime() > SILENT_AFTER_MS;
}

export function DeviceStatus({ device, className }: { device: Shipment["device"]; className?: string }) {
  if (!device) return null;

  const silent = boardIsSilent(device);
  const text = !device.lastSeenAt
    ? "Nunca se comunicou"
    : silent
      ? `Sem comunicação · última ${formatRelativeTime(device.lastSeenAt)}`
      : `Online${device.connection ? ` via ${connectionLabel[device.connection]}` : ""} · ${formatRelativeTime(device.lastSeenAt)}`;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-[#5B7264]", className)}>
      <Cpu className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium text-[#123A24]">Placa {device.uid}</span>
      <span
        className={cn("h-2 w-2 shrink-0 rounded-full", silent ? "bg-[#E08A2E]" : "bg-[#1F8A4D]")}
        aria-hidden="true"
      />
      <span>{text}</span>
    </span>
  );
}
