import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/format";
import type { Shipment } from "@/types";

const connectionLabel = { wifi: "Wi-Fi", "2g": "rede 2G" } as const;

export function DeviceStatus({ device, className }: { device: Shipment["device"]; className?: string }) {
  if (!device) return null;

  const text = device.online
    ? `Online${device.connection ? ` via ${connectionLabel[device.connection]}` : ""}`
    : device.lastSeenAt
      ? `Sem comunicação · última ${formatRelativeTime(device.lastSeenAt)}`
      : "Nunca se comunicou";

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-[#5B7264]", className)}>
      <Cpu className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium text-[#123A24]">Placa {device.uid}</span>
      <span
        className={cn("h-2 w-2 shrink-0 rounded-full", device.online ? "bg-[#1F8A4D]" : "bg-[#8CA596]")}
        aria-hidden="true"
      />
      <span>{text}</span>
    </span>
  );
}
