import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Flag, Truck, MapPin, Package, Building2, Loader2, Lock, CheckCircle2, X } from "lucide-react";
import { Card, Badge, Button, Skeleton, EmptyState } from "@/components/ui";
import { useFinishShipment, useShipments, useStartShipment } from "@/hooks/use-data-service";
import { useCanOperate } from "@/hooks/use-session";
import { formatDateTime } from "@/utils/format";
import type { Shipment } from "@/types";

type Action = { kind: "start" | "finish"; shipment: Shipment };

const actionText = {
  start: {
    title: "Iniciar viagem",
    confirm: "Iniciar agora",
    body: "A partir de agora a placa passa a enviar as leituras para esta viagem.",
  },
  finish: {
    title: "Finalizar viagem",
    confirm: "Finalizar agora",
    body: "A viagem será encerrada e passará para o histórico. Essa ação não pode ser desfeita.",
  },
} as const;

function TripRow({
  shipment,
  action,
  onAction,
}: {
  shipment: Shipment;
  action?: Action["kind"];
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#E6F4EA] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/cargas/${shipment.id}`} className="font-semibold text-[#123A24] hover:underline">
            {shipment.id}
          </Link>
          <span className="text-sm text-[#5B7264]">{shipment.fruitName}</span>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-[#5B7264]">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {shipment.origin} → {shipment.destination}
          </span>
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5B7264]">
          <span className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            Lote {shipment.batchId}
          </span>
          {shipment.vehicleId && (
            <span className="flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" />
              {shipment.vehicleId}
            </span>
          )}
          {shipment.carrier && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {shipment.carrier.name}
            </span>
          )}
          {shipment.startedAt && <span>Início: {formatDateTime(shipment.startedAt)}</span>}
          {shipment.completedAt && <span>Fim: {formatDateTime(shipment.completedAt)}</span>}
        </p>
      </div>

      {action === "start" && (
        <Button onClick={onAction} className="shrink-0">
          <Play className="h-4 w-4" />
          Iniciar viagem
        </Button>
      )}
      {action === "finish" && (
        <Button variant="danger" onClick={onAction} className="shrink-0">
          <Flag className="h-4 w-4" />
          Finalizar viagem
        </Button>
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-[#123A24]">{title}</h2>
        <Badge variant="neutral">{count}</Badge>
      </div>
      {children}
    </Card>
  );
}

export default function TripsPage() {
  const canOperate = useCanOperate();
  const { data: shipments, isLoading } = useShipments();
  const start = useStartShipment();
  const finish = useFinishShipment();
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (!canOperate) {
    return (
      <EmptyState
        icon={Lock}
        title="Sem permissão"
        description="Só operadores e administradores podem iniciar e finalizar viagens."
      />
    );
  }

  const planned = shipments?.filter((s) => s.logisticsStatus === "pending") ?? [];
  const active = shipments?.filter((s) => s.logisticsStatus === "in_transit") ?? [];
  const completed = shipments?.filter((s) => s.logisticsStatus === "delivered").slice(0, 5) ?? [];
  const mutation = pending?.kind === "start" ? start : finish;

  async function confirm() {
    if (!pending) return;
    setError(null);
    try {
      await mutation.mutateAsync(pending.shipment.id);
      setDone(
        `${pending.shipment.id} ${pending.kind === "start" ? "iniciada" : "finalizada"} com sucesso.`
      );
      setPending(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a ação.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#123A24]">Viagens</h1>
        <p className="mt-1 text-sm text-[#5B7264]">Inicie as viagens planejadas e finalize as que chegaram ao destino</p>
      </div>

      {done && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-[#E6F4EA] px-4 py-3 text-sm text-[#1A7A44]" role="status">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {done}
          </span>
          <button onClick={() => setDone(null)} aria-label="Fechar aviso" className="rounded p-1 hover:bg-white/60">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <Section title="Planejadas" count={planned.length}>
            {planned.length === 0 ? (
              <p className="text-sm text-[#5B7264]">Nenhuma viagem esperando para começar.</p>
            ) : (
              planned.map((s) => (
                <TripRow key={s.id} shipment={s} action="start" onAction={() => setPending({ kind: "start", shipment: s })} />
              ))
            )}
          </Section>

          <Section title="Em andamento" count={active.length}>
            {active.length === 0 ? (
              <p className="text-sm text-[#5B7264]">Nenhuma viagem em andamento.</p>
            ) : (
              active.map((s) => (
                <TripRow key={s.id} shipment={s} action="finish" onAction={() => setPending({ kind: "finish", shipment: s })} />
              ))
            )}
          </Section>

          {completed.length > 0 && (
            <Section title="Concluídas recentemente" count={completed.length}>
              {completed.map((s) => (
                <TripRow key={s.id} shipment={s} />
              ))}
            </Section>
          )}
        </>
      )}

      {pending && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trip-action-title"
          onClick={() => !mutation.isPending && setPending(null)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="trip-action-title" className="text-lg font-bold text-[#123A24]">
              {actionText[pending.kind].title} {pending.shipment.id}?
            </h2>
            <p className="mt-1 text-sm text-[#5B7264]">
              {pending.shipment.fruitName} · {pending.shipment.origin} → {pending.shipment.destination}
            </p>
            <p className="mt-3 text-sm text-[#123A24]">{actionText[pending.kind].body}</p>

            {error && (
              <p className="mt-3 rounded-lg bg-[#FCE8E6] px-3 py-2 text-sm text-[#B03A3A]" role="alert">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setPending(null);
                  setError(null);
                }}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant={pending.kind === "finish" ? "danger" : "primary"}
                onClick={confirm}
                disabled={mutation.isPending}
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {actionText[pending.kind].confirm}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
