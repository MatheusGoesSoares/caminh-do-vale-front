import { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import {
  Truck,
  ThermometerSun,
  AlertTriangle,
  CheckCircle,
  WifiOff,
  Droplets,
  Eye,
  ChevronRight,
  Clock,
  Package,
  Search,
  MapPin,
} from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeRangeSelector } from '@/components/ui/time-range-selector';
import { EmptyState } from '@/components/ui/empty-state';
import { TemperatureChart } from '@/components/charts/temperature-chart';
import { HumidityChart } from '@/components/charts/humidity-chart';
import { useSimulatedRoutes } from '@/hooks/use-simulated-routes';
import {
  useDashboardSummary,
  useShipments,
  useAlerts,
  useReadingHistory,
} from '@/hooks/use-data-service';
import {
  logisticsStatusLabels,
  environmentalStatusLabels,
  environmentalBadgeVariant,
  logisticsBadgeVariant,
} from '@/utils/status-labels';
import type { TimeRange, Shipment } from '@/types';

const ShipmentMap = lazy(() =>
  import('@/components/maps/shipment-map').then((m) => ({
    default: m.ShipmentMap,
  }))
);

function formatTemp(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(1)}°C`;
}

function formatHumidity(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(0)}%`;
}

function tempColor(shipment: Shipment): string {
  if (!shipment.latestReading?.temperatureC) return 'text-[#5B7264]';
  const t = shipment.latestReading.temperatureC;
  const { temperatureMinC, temperatureMaxC } = shipment.environmentalLimits;
  if (t < temperatureMinC || t > temperatureMaxC) return 'text-[#D94F4F]';
  const margin = 2;
  if (t < temperatureMinC + margin || t > temperatureMaxC - margin) return 'text-[#E08A2E]';
  return 'text-[#1F8A4D]';
}

function relativeTime(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });
  } catch {
    return '—';
  }
}

const ACTIVE_LOGISTICS: string[] = ['in_transit', 'stopped', 'loading'];

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: shipments, isLoading: shipmentsLoading } = useShipments();
  const { data: alerts, isLoading: alertsLoading } = useAlerts({ status: 'active' });

  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [tableSearch, setTableSearch] = useState('');

  const inTransitShipments =
    shipments?.filter((s) => ACTIVE_LOGISTICS.includes(s.logisticsStatus)) ?? [];

  const selectedShipment = shipments?.find((s) => s.id === selectedShipmentId);

  const { data: readings, isLoading: readingsLoading } = useReadingHistory(
    selectedShipmentId,
    timeRange
  );

  useEffect(() => {
    if (inTransitShipments.length > 0 && !selectedShipmentId) {
      setSelectedShipmentId(inTransitShipments[0].id);
    }
  }, [inTransitShipments.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const simulated = useSimulatedRoutes(inTransitShipments);

  const filteredTableShipments = inTransitShipments.filter((s) => {
    if (!tableSearch) return true;
    const q = tableSearch.toLowerCase();
    return (
      s.id.toLowerCase().includes(q) ||
      s.fruitName.toLowerCase().includes(q) ||
      s.origin.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q) ||
      (s.vehicleId?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-7 shadow-lg sm:px-8"
        style={{ background: "linear-gradient(145deg, #1a7a44 0%, #1F8A4D 30%, #16643A 70%, #124e2e 100%)" }}
      >
        <div
          className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #BFE3C8 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-10 right-1/4 h-40 w-40 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #F2C94C 0%, transparent 70%)" }}
        />
        <svg
          className="pointer-events-none absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path fill="rgba(47, 168, 102, 0.18)" d="M0,70 C240,40 480,100 720,72 C960,44 1200,60 1440,50 L1440,120 L0,120Z" />
          <path fill="rgba(191, 227, 200, 0.08)" d="M0,96 C300,80 600,112 900,94 C1140,80 1300,90 1440,88 L1440,120 L0,120Z" />
        </svg>

        <div className="relative">
          <h1 className="font-display text-2xl font-bold leading-tight text-white sm:text-3xl" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
            Visão geral da operação,{" "}
            <span className="text-[#F2C94C]">do vale ao destino.</span>
          </h1>
          <p className="mt-2 text-sm text-[#BFE3C8]/90 sm:text-base">
            Acompanhe suas cargas e condições de transporte
          </p>
        </div>
      </div>

      {/* Row 1: Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {summaryLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <MetricCard
              icon={Truck}
              label="Cargas em transporte"
              value={summary?.shipmentsInTransit ?? 0}
              iconColor="#1A7A44"
              iconBg="#E6F4EA"
            />
            <MetricCard
              icon={CheckCircle}
              label="Condições ideais"
              value={summary?.shipmentsOptimal ?? 0}
              iconColor="#1F8A4D"
              iconBg="#E6F4EA"
            />
            <MetricCard
              icon={AlertTriangle}
              label="Alertas ativos"
              value={summary?.activeAlerts ?? 0}
              iconColor={(summary?.activeAlerts ?? 0) > 0 ? '#D94F4F' : '#5B7264'}
              iconBg={(summary?.activeAlerts ?? 0) > 0 ? '#FDECEA' : '#F4FAF5'}
            />
            <MetricCard
              icon={Package}
              label="Entregas concluídas"
              value={summary?.completedDeliveries ?? 0}
              iconColor="#1F8A4D"
              iconBg="#E6F4EA"
            />
            <MetricCard
              icon={WifiOff}
              label="Sensores offline"
              value={summary?.sensorsOffline ?? 0}
              iconColor={(summary?.sensorsOffline ?? 0) > 0 ? '#E08A2E' : '#5B7264'}
              iconBg={(summary?.sensorsOffline ?? 0) > 0 ? '#FEF3E6' : '#F4FAF5'}
            />
          </>
        )}
      </div>

      {/* Row 2: Temperature + Alerts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Temperature Chart */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ThermometerSun className="h-5 w-5 text-[#1A7A44]" />
              <h2 className="text-base font-semibold text-[#123A24]">Temperatura</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedShipmentId}
                onChange={(e) => setSelectedShipmentId(e.target.value)}
                className="rounded-lg border border-[#BFE3C8]/40 bg-white px-3 py-1.5 text-sm text-[#123A24] outline-none focus:ring-2 focus:ring-[#1A7A44]/20"
                aria-label="Selecionar carga"
              >
                {inTransitShipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.fruitName}
                  </option>
                ))}
              </select>
              <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
            </div>
          </div>

          <div className="mt-4 h-64 sm:h-72">
            {readingsLoading || shipmentsLoading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : readings && readings.length > 0 && selectedShipment ? (
              <TemperatureChart
                readings={readings}
                limits={selectedShipment.environmentalLimits}
                timeRange={timeRange}
              />
            ) : (
              <EmptyState
                icon={ThermometerSun}
                title="Sem dados de temperatura"
                description="Selecione uma carga em transporte para visualizar os dados."
              />
            )}
          </div>
        </Card>

        {/* Active Alerts */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#D94F4F]" />
              <h2 className="text-base font-semibold text-[#123A24]">Alertas Ativos</h2>
            </div>
            {(alerts?.length ?? 0) > 0 && (
              <Badge variant="critical">{alerts!.length}</Badge>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {alertsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))
            ) : alerts && alerts.length > 0 ? (
              <>
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 rounded-lg border border-[#F4FAF5] p-3 transition-colors hover:bg-[#F4FAF5]/60"
                  >
                    <AlertTriangle
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        alert.severity === 'critical'
                          ? 'text-[#D94F4F]'
                          : 'text-[#E08A2E]'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#123A24] leading-tight">
                        {alert.message}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[#5B7264]">
                        <span>{alert.shipmentId}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {relativeTime(alert.startedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <Link
                  to="/alertas"
                  className="flex items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium text-[#1A7A44] transition-colors hover:bg-[#E6F4EA]"
                >
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle className="h-10 w-10 text-[#1F8A4D]" />
                <p className="text-sm font-medium text-[#1F8A4D]">Nenhum alerta ativo</p>
                <p className="text-xs text-[#5B7264]">
                  Todas as cargas estão dentro dos parâmetros configurados.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Row 3: Humidity + Map */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Humidity Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-[#427DA5]" />
            <h2 className="text-base font-semibold text-[#123A24]">Umidade</h2>
          </div>
          <div className="mt-4 h-64 sm:h-72">
            {readingsLoading || shipmentsLoading ? (
              <Skeleton className="h-full w-full rounded-lg" />
            ) : readings && readings.length > 0 && selectedShipment ? (
              <HumidityChart
                readings={readings}
                limits={selectedShipment.environmentalLimits}
                timeRange={timeRange}
              />
            ) : (
              <EmptyState
                icon={Droplets}
                title="Sem dados de umidade"
                description="Selecione uma carga em transporte para visualizar os dados."
              />
            )}
          </div>
        </Card>

        {/* Mini Map */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#1A7A44]" />
              <h2 className="text-base font-semibold text-[#123A24]">Localização</h2>
            </div>
            <Link
              to="/mapa"
              className="text-xs font-medium text-[#1A7A44] transition-colors hover:text-[#1F8A4D]"
            >
              Ampliar
            </Link>
          </div>
          <div className="mt-3 h-[300px] overflow-hidden rounded-lg">
            {shipmentsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <Suspense fallback={<Skeleton className="h-full w-full" />}>
                <ShipmentMap
                  shipments={simulated.shipments}
                  routes={simulated.routes}
                  selectedShipmentId={selectedShipmentId}
                  onShipmentSelect={setSelectedShipmentId}
                  height="300px"
                />
              </Suspense>
            )}
          </div>
        </Card>
      </div>

      {/* Row 4: Active Shipments Table */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-[#123A24]">Transportes Ativos</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B7264]" />
              <input
                type="text"
                placeholder="Buscar cargas..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="rounded-lg border border-[#BFE3C8]/40 bg-white py-1.5 pl-9 pr-3 text-sm text-[#123A24] outline-none focus:ring-2 focus:ring-[#1A7A44]/20"
                aria-label="Buscar cargas"
              />
            </div>
            <Link
              to="/cargas"
              className="flex items-center gap-1 text-sm font-medium text-[#1A7A44] transition-colors hover:text-[#1F8A4D]"
            >
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="mt-4 hidden overflow-x-auto md:block">
          {shipmentsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : filteredTableShipments.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Nenhuma carga encontrada"
              description="Não há cargas ativas correspondentes à sua busca."
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E6F4EA] text-left text-xs font-medium uppercase tracking-wider text-[#5B7264]">
                  <th className="pb-3 pr-4">ID</th>
                  <th className="pb-3 pr-4">Fruta</th>
                  <th className="pb-3 pr-4">Rota</th>
                  <th className="pb-3 pr-4">Temp.</th>
                  <th className="pb-3 pr-4">Umidade</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Condição</th>
                  <th className="pb-3 pr-4">Última leitura</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4FAF5]">
                {filteredTableShipments.map((s) => (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-[#F4FAF5]/50"
                  >
                    <td className="py-3 pr-4 font-semibold text-[#123A24]">{s.id}</td>
                    <td className="py-3 pr-4 text-[#123A24]">{s.fruitName}</td>
                    <td className="py-3 pr-4 text-[#5B7264]">
                      <span className="whitespace-nowrap">
                        {s.origin.split(',')[0]} → {s.destination.split(',')[0]}
                      </span>
                    </td>
                    <td className={`py-3 pr-4 font-medium ${tempColor(s)}`}>
                      {formatTemp(s.latestReading?.temperatureC)}
                    </td>
                    <td className="py-3 pr-4 text-[#123A24]">
                      {formatHumidity(s.latestReading?.relativeHumidity)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={logisticsBadgeVariant[s.logisticsStatus] as any}>
                        {logisticsStatusLabels[s.logisticsStatus]}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={environmentalBadgeVariant[s.environmentalStatus] as any}>
                        {environmentalStatusLabels[s.environmentalStatus]}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-xs text-[#5B7264]">
                      {relativeTime(s.latestReading?.measuredAt)}
                    </td>
                    <td className="py-3">
                      <Link
                        to={`/cargas/${s.id}`}
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-[#5B7264] transition-colors hover:bg-[#E6F4EA] hover:text-[#1A7A44]"
                        aria-label={`Ver detalhes da carga ${s.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Card Layout */}
        <div className="mt-4 space-y-3 md:hidden">
          {shipmentsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))
          ) : filteredTableShipments.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="Nenhuma carga encontrada"
              description="Não há cargas ativas correspondentes à sua busca."
            />
          ) : (
            filteredTableShipments.map((s) => (
              <Link
                key={s.id}
                to={`/cargas/${s.id}`}
                className="block rounded-xl border border-[#E6F4EA] p-4 transition-colors hover:bg-[#F4FAF5]/60"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#123A24]">{s.id}</span>
                    <Badge variant={environmentalBadgeVariant[s.environmentalStatus] as any}>
                      {environmentalStatusLabels[s.environmentalStatus]}
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#5B7264]" />
                </div>
                <p className="mt-1 text-sm text-[#5B7264]">
                  {s.fruitName} · {s.origin.split(',')[0]} → {s.destination.split(',')[0]}
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className={`font-medium ${tempColor(s)}`}>
                    {formatTemp(s.latestReading?.temperatureC)}
                  </span>
                  <span className="text-[#123A24]">
                    {formatHumidity(s.latestReading?.relativeHumidity)}
                  </span>
                  <span className="ml-auto text-xs text-[#5B7264]">
                    {relativeTime(s.latestReading?.measuredAt)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
