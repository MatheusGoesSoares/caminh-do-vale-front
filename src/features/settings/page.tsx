import { useState } from "react";
import {
  Leaf,
  Bell,
  ExternalLink,
  ThermometerSun,
  Droplets,
  WifiOff,
  MapPin,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Skeleton, EmptyState, Tabs, TabPanel } from "@/components/ui";
import { useFruitProfiles } from "@/hooks/use-data-service";
import { isDemoMode } from "@/services";
import { API_BASE_URL } from "@/services/api/http";

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6F4EA] shrink-0">
        <Icon className="h-4 w-4 text-[#1F8A4D]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#123A24]">{label}</p>
        {description && <p className="text-xs text-[#5B7264] mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F8A4D] focus-visible:ring-offset-2",
          checked ? "bg-[#1A7A44]" : "bg-[#BFE3C8]"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

function SourceLink({ source }: { source: string }) {
  if (!/^https?:\/\//i.test(source)) {
    return <span className="text-xs text-[#5B7264]">{source || "—"}</span>;
  }
  return (
    <a
      href={source}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-[#427DA5] hover:underline"
    >
      {new URL(source).hostname.includes("ucdavis") ? "UC Davis" : "Ver fonte"}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function FruitProfilesTab() {
  const { data: profiles, isLoading } = useFruitProfiles();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!profiles?.length) {
    return (
      <EmptyState
        icon={Leaf}
        title="Nenhum perfil de fruta cadastrado"
        description="Os perfis de frutas serão carregados do catálogo padrão."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg bg-[#427DA5]/10 p-3">
        <Info className="h-4 w-4 text-[#427DA5] shrink-0" />
        <p className="text-xs text-[#427DA5]">
          Estes são valores científicos de referência para conservação pós-colheita. Edição disponível com integração à API.
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E6F4EA]">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Fruta</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Maturação</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Temperatura</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Umidade</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-[#5B7264]">Fonte</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b border-[#F4FAF5] hover:bg-[#F4FAF5]/50">
                <td className="py-2.5 px-3">
                  <div>
                    <p className="font-medium text-[#123A24]">{p.fruit}</p>
                    {p.variety && <p className="text-xs text-[#5B7264]">{p.variety}</p>}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-[#5B7264]">{p.maturityStage}</td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <ThermometerSun className="h-3.5 w-3.5 text-[#5B7264]" />
                    <span className="text-[#123A24]">
                      {p.temperatureMinC === p.temperatureMaxC
                        ? `${p.temperatureMinC}°C`
                        : `${p.temperatureMinC}°C a ${p.temperatureMaxC}°C`}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="h-3.5 w-3.5 text-[#5B7264]" />
                    <span className="text-[#123A24]">{p.relativeHumidityMin}% a {p.relativeHumidityMax}%</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <SourceLink source={p.sourceUrl} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {profiles.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-semibold text-[#123A24]">{p.fruit}</p>
                {p.variety && <p className="text-xs text-[#5B7264]">{p.variety}</p>}
              </div>
              <Badge variant="neutral">{p.maturityStage}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#5B7264]">
                <ThermometerSun className="h-3 w-3" />
                <span>
                  {p.temperatureMinC === p.temperatureMaxC
                    ? `${p.temperatureMinC}°C`
                    : `${p.temperatureMinC}° a ${p.temperatureMaxC}°C`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#5B7264]">
                <Droplets className="h-3 w-3" />
                <span>{p.relativeHumidityMin}% a {p.relativeHumidityMax}%</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-[#5B7264]">
              Fonte: <SourceLink source={p.sourceUrl} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [tempAlerts, setTempAlerts] = useState(true);
  const [humidityAlerts, setHumidityAlerts] = useState(true);
  const [offlineAlerts, setOfflineAlerts] = useState(true);
  const [locationAlerts, setLocationAlerts] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  async function requestPermission() {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tipos de alerta</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-[#E6F4EA]">
          <Toggle
            icon={ThermometerSun}
            label="Alertas de temperatura"
            description="Notificar quando a temperatura sair dos limites operacionais"
            checked={tempAlerts}
            onChange={setTempAlerts}
          />
          <Toggle
            icon={Droplets}
            label="Alertas de umidade"
            description="Notificar quando a umidade sair dos limites operacionais"
            checked={humidityAlerts}
            onChange={setHumidityAlerts}
          />
          <Toggle
            icon={WifiOff}
            label="Sensor offline"
            description="Notificar quando um sensor parar de enviar dados"
            checked={offlineAlerts}
            onChange={setOfflineAlerts}
          />
          <Toggle
            icon={MapPin}
            label="Localização indisponível"
            description="Notificar quando a localização do veículo não estiver disponível"
            checked={locationAlerts}
            onChange={setLocationAlerts}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações do navegador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#5B7264]">Permissão:</span>
            <Badge
              variant={
                notificationPermission === "granted" ? "success" :
                notificationPermission === "denied" ? "critical" : "neutral"
              }
            >
              {notificationPermission === "granted" ? "Concedida" :
               notificationPermission === "denied" ? "Negada" : "Não solicitada"}
            </Badge>
          </div>

          {notificationPermission === "default" && (
            <Button variant="secondary" size="sm" onClick={requestPermission}>
              <Bell className="h-3.5 w-3.5" />
              Solicitar permissão
            </Button>
          )}

          {notificationPermission === "denied" && (
            <p className="text-xs text-[#D94F4F]">
              Permissão negada. Para habilitar, altere nas configurações do navegador.
            </p>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-[#427DA5]/10 p-3 mt-3">
            <Info className="h-4 w-4 text-[#427DA5] shrink-0" />
            <p className="text-xs text-[#427DA5]">
              Notificações push dependem da integração com o backend. Atualmente, apenas notificações internas do aplicativo estão disponíveis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SystemTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Informações do sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg bg-[#F4FAF5] p-4">
              <p className="text-xs text-[#5B7264] mb-1">Frequência de atualização</p>
              <p className="text-sm font-semibold text-[#123A24]">30 segundos</p>
            </div>
            <div className="rounded-lg bg-[#F4FAF5] p-4">
              <p className="text-xs text-[#5B7264] mb-1">Modo de dados</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#123A24]">
                  {isDemoMode() ? "Demonstração (Mock)" : "API"}
                </p>
                {isDemoMode() && (
                  <Badge variant="warning">Demo</Badge>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-[#F4FAF5] p-4">
              <p className="text-xs text-[#5B7264] mb-1">Versão do aplicativo</p>
              <p className="text-sm font-semibold text-[#123A24]">0.1.0</p>
            </div>
            <div className="rounded-lg bg-[#F4FAF5] p-4">
              <p className="text-xs text-[#5B7264] mb-1">Ambiente</p>
              <p className="text-sm font-semibold text-[#123A24]">
                {import.meta.env.MODE === "production" ? "Produção" : "Desenvolvimento"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-[#427DA5]/10 p-3">
            <Info className="h-4 w-4 text-[#427DA5] shrink-0 mt-0.5" />
            <p className="text-xs text-[#427DA5]">
              {isDemoMode() ? (
                <>
                  Os dados são simulados. Para usar o back real, defina{" "}
                  <code className="font-mono bg-[#427DA5]/10 px-1 rounded">VITE_DATA_PROVIDER=api</code>.
                </>
              ) : (
                <>
                  Conectado a <code className="font-mono bg-[#427DA5]/10 px-1 rounded">{API_BASE_URL}</code>.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profiles");

  const tabs = [
    { id: "profiles", label: "Perfis de Frutas" },
    { id: "notifications", label: "Notificações" },
    { id: "system", label: "Sistema" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#123A24]">Configurações</h1>
        <p className="text-sm text-[#5B7264] mt-1">
          Gerencie os perfis de frutas, notificações e preferências do sistema
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <TabPanel id="profiles" activeTab={activeTab}>
        <FruitProfilesTab />
      </TabPanel>

      <TabPanel id="notifications" activeTab={activeTab}>
        <NotificationsTab />
      </TabPanel>

      <TabPanel id="system" activeTab={activeTab}>
        <SystemTab />
      </TabPanel>
    </div>
  );
}
