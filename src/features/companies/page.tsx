import { Link } from "react-router-dom";
import { Building2, Mail, MapPin, Package, Truck, Info } from "lucide-react";
import { Card, Badge, Skeleton } from "@/components/ui";
import { useShipments } from "@/hooks/use-data-service";
import { serviceCompanies } from "@/config/companies";
import type { Shipment } from "@/types";

const ACTIVE = new Set(["pending", "loading", "in_transit", "stopped"]);

export default function CompaniesPage() {
  const { data: shipments, isLoading } = useShipments();

  const byCompany = new Map<string, Shipment[]>();
  for (const s of shipments ?? []) {
    if (!s.carrier) continue;
    byCompany.set(s.carrier.id, [...(byCompany.get(s.carrier.id) ?? []), s]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#123A24]">Empresas</h1>
        <p className="mt-1 text-sm text-[#5B7264]">Transportadoras que prestam os serviços de transporte</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-[#427DA5]/10 p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#427DA5]" />
        <p className="text-xs text-[#427DA5]">
          Estas empresas são fictícias. O back ainda não tem cadastro de empresas, então cada veículo que vem dele é
          ligado a uma delas pela placa.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {serviceCompanies.map((company) => {
          const list = byCompany.get(company.id) ?? [];
          const active = list.filter((s) => ACTIVE.has(s.logisticsStatus));
          const plates = [...new Set(list.map((s) => s.vehicleId).filter(Boolean))];

          return (
            <Card key={company.id} className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E6F4EA]">
                  <Building2 className="h-5 w-5 text-[#1A7A44]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-[#123A24]">{company.name}</h2>
                  <p className="text-sm text-[#5B7264]">{company.service}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-[#5B7264]">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {company.city}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  {company.email}
                </p>
                <p className="flex items-center gap-2">
                  <Truck className="h-4 w-4 shrink-0" />
                  {plates.length > 0 ? plates.join(", ") : "Nenhum veículo em cargas no momento"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#F4FAF5] p-3">
                  <p className="text-xs text-[#5B7264]">Cargas ativas</p>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-7 w-10" />
                  ) : (
                    <p className="text-2xl font-bold text-[#123A24]">{active.length}</p>
                  )}
                </div>
                <div className="rounded-lg bg-[#F4FAF5] p-3">
                  <p className="text-xs text-[#5B7264]">Total de cargas</p>
                  {isLoading ? (
                    <Skeleton className="mt-1 h-7 w-10" />
                  ) : (
                    <p className="text-2xl font-bold text-[#123A24]">{list.length}</p>
                  )}
                </div>
              </div>

              {list.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {list.map((s) => (
                    <Link key={s.id} to={`/cargas/${s.id}`}>
                      <Badge variant={ACTIVE.has(s.logisticsStatus) ? "info" : "neutral"}>
                        <Package className="mr-1 inline h-3 w-3" />
                        {s.id} · {s.fruitName}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
