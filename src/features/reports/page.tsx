import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Download,
  AlertTriangle,
  Truck,
  Clock,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Select, Skeleton, EmptyState, MetricCard } from "@/components/ui";
import { useShipments, useAlerts } from "@/hooks/use-data-service";
import {
  formatLogisticsStatus,
  formatEnvironmentalStatus,
  getEnvironmentalBadgeVariant,
  getLogisticsBadgeVariant,
  formatAlertType,
  formatDateTime,
} from "@/utils/format";
import type { MonitoringAlert, Shipment } from "@/types";

type Period = "today" | "week" | "month" | "quarter";

function getPeriodLabel(period: Period): string {
  const labels: Record<Period, string> = {
    today: "Hoje",
    week: "Última semana",
    month: "Último mês",
    quarter: "Últimos 3 meses",
  };
  return labels[period];
}

function getPeriodStartDate(period: Period): Date {
  const now = new Date();
  switch (period) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "quarter":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
}

function getAlertDuration(alert: MonitoringAlert): string {
  const start = new Date(alert.startedAt).getTime();
  const end = alert.resolvedAt ? new Date(alert.resolvedAt).getTime() : Date.now();
  const diffMs = end - start;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}min`;
  return `${minutes}min`;
}

function exportAlertsCsv(alerts: MonitoringAlert[]) {
  const header = "Data,Carga,Tipo,Severidade,Duração,Status\n";
  const rows = alerts.map((a) =>
    [
      formatDateTime(a.startedAt),
      a.shipmentId,
      formatAlertType(a.type),
      a.severity === "critical" ? "Crítico" : "Atenção",
      getAlertDuration(a),
      a.status === "active" ? "Ativo" : "Resolvido",
    ].join(",")
  );
  const csv = header + rows.join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `alertas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportShipmentsCsv(shipments: Shipment[]) {
  const header = "Data,Carga,Fruta,Origem,Destino,Status Logístico,Condição Ambiental\n";
  const rows = shipments.map((s) =>
    [
      formatDateTime(s.createdAt),
      s.id,
      s.fruitName,
      s.origin,
      s.destination,
      formatLogisticsStatus(s.logisticsStatus),
      formatEnvironmentalStatus(s.environmentalStatus),
    ].join(",")
  );
  const csv = header + rows.join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transportes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("week");

  const { data: allShipments, isLoading: shipmentsLoading } = useShipments();
  const { data: allAlerts, isLoading: alertsLoading } = useAlerts();

  const isLoading = shipmentsLoading || alertsLoading;

  const periodStart = useMemo(() => getPeriodStartDate(period), [period]);

  const filteredAlerts = useMemo(() => {
    if (!allAlerts) return [];
    return allAlerts.filter((a) => new Date(a.startedAt) >= periodStart);
  }, [allAlerts, periodStart]);

  const filteredShipments = useMemo(() => {
    if (!allShipments) return [];
    return allShipments.filter((s) => new Date(s.createdAt) >= periodStart);
  }, [allShipments, periodStart]);

  const stats = useMemo(() => {
    const totalShipments = filteredShipments.length;
    const totalAlerts = filteredAlerts.length;

    const optimalShipments = filteredShipments.filter((s) => s.environmentalStatus === "optimal").length;
    const tempCompliance = totalShipments > 0 ? Math.round((optimalShipments / totalShipments) * 100) : 0;

    const totalViolationMs = filteredAlerts.reduce((sum, a) => {
      const start = new Date(a.startedAt).getTime();
      const end = a.resolvedAt ? new Date(a.resolvedAt).getTime() : Date.now();
      return sum + (end - start);
    }, 0);
    const violationHours = Math.round(totalViolationMs / 3600000 * 10) / 10;

    return { totalShipments, totalAlerts, tempCompliance, violationHours };
  }, [filteredShipments, filteredAlerts]);

  const periodOptions = [
    { value: "today", label: "Hoje" },
    { value: "week", label: "Última semana" },
    { value: "month", label: "Último mês" },
    { value: "quarter", label: "Últimos 3 meses" },
  ];

  const [sortAlerts, setSortAlerts] = useState<"desc" | "asc">("desc");
  const sortedAlerts = useMemo(() => {
    return [...filteredAlerts].sort((a, b) => {
      const diff = new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      return sortAlerts === "desc" ? diff : -diff;
    });
  }, [filteredAlerts, sortAlerts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#123A24]">Histórico e Relatórios</h1>
          <p className="text-sm text-[#5B7264] mt-1">
            Consulte o histórico de transportes e alertas
          </p>
        </div>
        <div className="w-48">
          <Select
            options={periodOptions}
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={Truck}
              label="Total de cargas"
              value={stats.totalShipments}
              subtitle={getPeriodLabel(period)}
            />
            <MetricCard
              icon={AlertTriangle}
              label="Total de alertas"
              value={stats.totalAlerts}
              iconColor="text-[#E08A2E]"
              iconBg="bg-[#E08A2E]/10"
            />
            <MetricCard
              icon={CheckCircle}
              label="Conformidade"
              value={`${stats.tempCompliance}%`}
              subtitle="Cargas em condições ideais"
              iconColor="text-[#1F8A4D]"
              iconBg="bg-[#1F8A4D]/10"
            />
            <MetricCard
              icon={Clock}
              label="Horas em violação"
              value={stats.violationHours}
              subtitle="Tempo acumulado"
              iconColor="text-[#D94F4F]"
              iconBg="bg-[#D94F4F]/10"
            />
          </div>

          {/* Alert history */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#E08A2E]" />
                Histórico de Alertas
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortAlerts(sortAlerts === "desc" ? "asc" : "desc")}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {sortAlerts === "desc" ? "Mais recentes" : "Mais antigos"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => exportAlertsCsv(sortedAlerts)}
                  disabled={sortedAlerts.length === 0}
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sortedAlerts.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title="Nenhum alerta no período"
                  description="Não houve alertas durante o período selecionado."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E6F4EA]">
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Data</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Carga</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Tipo</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Severidade</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Duração</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAlerts.map((alert) => (
                        <tr key={alert.id} className="border-b border-[#F4FAF5] hover:bg-[#F4FAF5]/50">
                          <td className="py-2.5 px-3 text-[#123A24] whitespace-nowrap">
                            {formatDateTime(alert.startedAt)}
                          </td>
                          <td className="py-2.5 px-3 font-medium">
                            <Link to={`/cargas/${alert.shipmentId}`} className="text-[#1A7A44] hover:underline">
                              {alert.shipmentId}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 text-[#5B7264]">{formatAlertType(alert.type)}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant={alert.severity === "critical" ? "critical" : "warning"}>
                              {alert.severity === "critical" ? "Crítico" : "Atenção"}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-[#5B7264]">{getAlertDuration(alert)}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant={alert.status === "active" ? "warning" : "success"}>
                              {alert.status === "active" ? "Ativo" : "Resolvido"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipment history */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#1A7A44]" />
                Histórico de Transportes
              </CardTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => exportShipmentsCsv(filteredShipments)}
                disabled={filteredShipments.length === 0}
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </Button>
            </CardHeader>
            <CardContent>
              {filteredShipments.length === 0 ? (
                <EmptyState
                  icon={Truck}
                  title="Nenhum transporte no período"
                  description="Não há registros de transporte para o período selecionado."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E6F4EA]">
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Data</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Carga</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Fruta</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264] hidden md:table-cell">Origem → Destino</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Status</th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Condição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredShipments.map((shipment) => (
                        <tr
                          key={shipment.id}
                          onClick={() => navigate(`/cargas/${shipment.id}`)}
                          className="cursor-pointer border-b border-[#F4FAF5] hover:bg-[#E6F4EA]/60"
                        >
                          <td className="py-2.5 px-3 text-[#123A24] whitespace-nowrap">
                            {formatDateTime(shipment.createdAt)}
                          </td>
                          <td className="py-2.5 px-3 font-medium">
                            <Link
                              to={`/cargas/${shipment.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#1A7A44] hover:underline"
                            >
                              {shipment.id}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 text-[#5B7264]">
                            {shipment.fruitName}
                            <span className="block text-xs md:hidden">
                              {shipment.origin} → {shipment.destination}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 hidden md:table-cell">
                            <Link
                              to={`/cargas/${shipment.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[#1A7A44] hover:underline"
                              title="Abrir todos os dados desta viagem"
                            >
                              {shipment.origin} → {shipment.destination}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant={getLogisticsBadgeVariant(shipment.logisticsStatus) as "success" | "warning" | "critical" | "info" | "neutral" | "muted"}>
                              {formatLogisticsStatus(shipment.logisticsStatus)}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant={getEnvironmentalBadgeVariant(shipment.environmentalStatus) as "success" | "warning" | "critical" | "info" | "neutral" | "muted"}>
                              {formatEnvironmentalStatus(shipment.environmentalStatus)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
