import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, LayoutGrid, List, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShipments } from "@/hooks/use-data-service";
import type { ShipmentFilters, LogisticsStatus, EnvironmentalStatus } from "@/types";
import { ShipmentCard } from "./components/shipment-card";

const fruitOptions = [
  "Todas",
  "Uva de mesa",
  "Manga",
  "Goiaba",
  "Banana",
  "Mamão",
  "Melão honeydew",
  "Melão cantaloupe",
];

const logisticsOptions: Array<{ value: LogisticsStatus | ""; label: string }> = [
  { value: "", label: "Todos os status" },
  { value: "pending", label: "Aguardando" },
  { value: "loading", label: "Carregando" },
  { value: "in_transit", label: "Em trânsito" },
  { value: "stopped", label: "Parado" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
];

const environmentalOptions: Array<{ value: EnvironmentalStatus | ""; label: string }> = [
  { value: "", label: "Todas as condições" },
  { value: "optimal", label: "Ideal" },
  { value: "warning", label: "Atenção" },
  { value: "critical", label: "Crítico" },
  { value: "no_data", label: "Sem dados" },
  { value: "stale", label: "Desatualizado" },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-[#E6F4EA] bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-5 w-24 rounded bg-[#E6F4EA]" />
          <div className="mt-2 h-4 w-32 rounded bg-[#E6F4EA]" />
        </div>
      </div>
      <div className="mt-3 h-4 w-48 rounded bg-[#E6F4EA]" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-14 rounded-lg bg-[#F4FAF5]" />
        <div className="h-14 rounded-lg bg-[#F4FAF5]" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-5 w-20 rounded-full bg-[#E6F4EA]" />
        <div className="h-5 w-16 rounded-full bg-[#E6F4EA]" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 rounded-lg border border-[#E6F4EA] bg-white px-4 py-3">
      <div className="h-4 w-20 rounded bg-[#E6F4EA]" />
      <div className="h-4 w-32 rounded bg-[#E6F4EA]" />
      <div className="flex-1" />
      <div className="h-4 w-12 rounded bg-[#E6F4EA]" />
      <div className="h-5 w-16 rounded-full bg-[#E6F4EA]" />
    </div>
  );
}

export default function ShipmentsPage() {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("busca") ?? "";
  const [search, setSearch] = useState(urlSearch);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);
  const [fruitFilter, setFruitFilter] = useState("Todas");
  const [logisticsFilter, setLogisticsFilter] = useState<LogisticsStatus | "">("");
  const [environmentalFilter, setEnvironmentalFilter] = useState<EnvironmentalStatus | "">("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filters = useMemo<ShipmentFilters>(() => {
    const f: ShipmentFilters = {};
    if (search) f.search = search;
    if (fruitFilter !== "Todas") f.fruitName = fruitFilter;
    if (logisticsFilter) f.logisticsStatus = logisticsFilter;
    if (environmentalFilter) f.environmentalStatus = environmentalFilter;
    return f;
  }, [search, fruitFilter, logisticsFilter, environmentalFilter]);

  const { data: shipments, isLoading } = useShipments(filters);

  const count = shipments?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#123A24]">Cargas e Lotes</h1>
        <p className="mt-1 text-sm text-[#5B7264]">
          {isLoading
            ? "Carregando cargas..."
            : `${count} carga${count !== 1 ? "s" : ""} encontrada${count !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B7264]" />
          <input
            type="text"
            placeholder="Buscar por ID, lote, veículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E6F4EA] bg-white py-2 pl-9 pr-3 text-sm text-[#123A24] placeholder:text-[#8CA596] outline-none transition-colors focus:border-[#1F8A4D] focus:ring-1 focus:ring-[#1F8A4D]"
          />
        </div>

        <select
          value={fruitFilter}
          onChange={(e) => setFruitFilter(e.target.value)}
          className="rounded-lg border border-[#E6F4EA] bg-white px-3 py-2 text-sm text-[#123A24] outline-none focus:border-[#1F8A4D] focus:ring-1 focus:ring-[#1F8A4D]"
        >
          {fruitOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <select
          value={logisticsFilter}
          onChange={(e) => setLogisticsFilter(e.target.value as LogisticsStatus | "")}
          className="rounded-lg border border-[#E6F4EA] bg-white px-3 py-2 text-sm text-[#123A24] outline-none focus:border-[#1F8A4D] focus:ring-1 focus:ring-[#1F8A4D]"
        >
          {logisticsOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={environmentalFilter}
          onChange={(e) => setEnvironmentalFilter(e.target.value as EnvironmentalStatus | "")}
          className="rounded-lg border border-[#E6F4EA] bg-white px-3 py-2 text-sm text-[#123A24] outline-none focus:border-[#1F8A4D] focus:ring-1 focus:ring-[#1F8A4D]"
        >
          {environmentalOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex rounded-lg border border-[#E6F4EA] bg-white p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "grid"
                ? "bg-[#1A7A44] text-white"
                : "text-[#5B7264] hover:text-[#123A24]"
            )}
            aria-label="Visualização em grade"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "list"
                ? "bg-[#1A7A44] text-white"
                : "text-[#5B7264] hover:text-[#123A24]"
            )}
            aria-label="Visualização em lista"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )
      ) : count === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#BFE3C8] py-16">
          <Package className="h-12 w-12 text-[#BFE3C8]" />
          <h3 className="mt-4 text-base font-medium text-[#123A24]">
            Nenhuma carga encontrada
          </h3>
          <p className="mt-1 text-sm text-[#5B7264]">
            Tente ajustar os filtros de busca.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shipments!.map((shipment) => (
            <ShipmentCard key={shipment.id} shipment={shipment} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {shipments!.map((shipment) => (
            <ShipmentCard key={shipment.id} shipment={shipment} compact />
          ))}
        </div>
      )}
    </div>
  );
}
