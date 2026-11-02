# Integração com API — Caminho do Vale

Este documento descreve os contratos de dados esperados pelo frontend e as informações que precisam ser confirmadas com a equipe de backend.

## Status da Integração

| Item | Status |
|---|---|
| Contratos TypeScript definidos | ✅ Implementado |
| Validação com Zod | ✅ Implementado |
| Mock Provider | ✅ Implementado |
| API Provider | ⬜ Pendente |
| Endpoints HTTP definitivos | ⬜ A confirmar com backend |
| Autenticação | ⬜ A confirmar |
| WebSocket / SSE | ⬜ A confirmar |
| Paginação | ⬜ A confirmar |

---

## Contratos de Dados

### SensorReading

```ts
interface SensorReading {
  id: string;                        // Identificador único da leitura
  sensorId: string;                  // Identificador do sensor
  shipmentId: string;                // Carga associada
  temperatureC: number | null;       // Temperatura em °C (null se indisponível)
  relativeHumidity: number | null;   // Umidade relativa em % (null se indisponível)
  measuredAt: string;                // Hora da medição no sensor (ISO 8601 com fuso)
  receivedAt?: string;               // Hora de recebimento pelo servidor
}
```

### GeoPosition

```ts
interface GeoPosition {
  latitude: number;       // -90 a 90
  longitude: number;      // -180 a 180
  recordedAt: string;     // ISO 8601
  accuracyMeters?: number;
}
```

### EnvironmentalLimits

```ts
interface EnvironmentalLimits {
  temperatureMinC: number;       // Limite mínimo de temperatura (°C)
  temperatureMaxC: number;       // Limite máximo de temperatura (°C)
  relativeHumidityMin: number;   // Limite mínimo de umidade (%)
  relativeHumidityMax: number;   // Limite máximo de umidade (%)
  policyId?: string;             // Referência à política de alerta
}
```

**Validação:** `temperatureMinC ≤ temperatureMaxC` e `relativeHumidityMin ≤ relativeHumidityMax`.

### Shipment

```ts
interface Shipment {
  id: string;
  batchId: string;
  fruitProfileId: string;
  fruitName: string;
  variety?: string;
  maturityStage?: string;
  quantityKg?: number;
  vehicleId?: string;
  sensorIds: string[];
  origin: string;
  destination: string;
  logisticsStatus: "pending" | "loading" | "in_transit" | "stopped" | "delivered" | "cancelled";
  environmentalStatus: "optimal" | "warning" | "critical" | "no_data" | "stale";
  environmentalLimits: EnvironmentalLimits;
  latestReading?: SensorReading;
  latestPosition?: GeoPosition;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}
```

**Nota:** `logisticsStatus` e `environmentalStatus` são conceitos independentes. Uma carga pode estar "Em transporte" e em "Estado crítico" simultaneamente.

### MonitoringAlert

```ts
interface MonitoringAlert {
  id: string;
  shipmentId: string;
  sensorId?: string;
  type: "temperature_low" | "temperature_high" | "humidity_low" | "humidity_high" | "sensor_offline" | "location_unavailable";
  severity: "warning" | "critical";
  status: "active" | "resolved";
  startedAt: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
  message: string;
  durationMs?: number;
}
```

### FruitStorageProfile

```ts
interface FruitStorageProfile {
  id: string;
  fruit: string;
  variety?: string;
  maturityStage: string;
  temperatureMinC: number;
  temperatureMaxC: number;
  relativeHumidityMin: number;
  relativeHumidityMax: number;
  sourceUrl: string;
  notes?: string;
}
```

### DashboardSummary

```ts
interface DashboardSummary {
  shipmentsInTransit: number;
  shipmentsOptimal: number;
  activeAlerts: number;
  completedDeliveries: number;
  sensorsOffline: number;
}
```

### AppNotification

```ts
interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "critical" | "success";
  read: boolean;
  createdAt: string;
  shipmentId?: string;
}
```

---

## Métodos do Serviço de Dados

A interface `DataService` define os métodos que o frontend consome. A implementação atual é `MockDataProvider`; ao integrar, basta implementar `ApiDataProvider` com as mesmas assinaturas.

```ts
interface DataService {
  getDashboardSummary(): Promise<DashboardSummary>;
  getShipments(filters?: ShipmentFilters): Promise<Shipment[]>;
  getShipmentById(id: string): Promise<Shipment | null>;
  getLatestReadings(shipmentId: string): Promise<SensorReading | null>;
  getReadingHistory(shipmentId: string, range: TimeRange): Promise<SensorReading[]>;
  getShipmentPositions(shipmentId: string): Promise<GeoPosition[]>;
  getAlerts(filters?: AlertFilters): Promise<MonitoringAlert[]>;
  acknowledgeAlert(id: string): Promise<void>;
  getFruitProfiles(): Promise<FruitStorageProfile[]>;
  getNotifications(): Promise<AppNotification[]>;
}
```

### Tipos auxiliares de filtro

```ts
type TimeRange = "1h" | "6h" | "24h" | "7d" | "custom";

interface ShipmentFilters {
  search?: string;
  fruitName?: string;
  logisticsStatus?: LogisticsStatus;
  environmentalStatus?: EnvironmentalStatus;
  vehicleId?: string;
  batchId?: string;
}

interface AlertFilters {
  severity?: AlertSeverity;
  status?: AlertStatus;
  type?: AlertType;
  shipmentId?: string;
}
```

---

## Endpoints Esperados (a confirmar)

Os caminhos abaixo são **sugestões**. Os endpoints definitivos devem ser acordados com a equipe de backend.

| Método | Endpoint sugerido | Descrição |
|---|---|---|
| GET | `/api/dashboard/summary` | Resumo do dashboard |
| GET | `/api/shipments` | Listar cargas (aceita query params de filtro) |
| GET | `/api/shipments/:id` | Detalhes de uma carga |
| GET | `/api/shipments/:id/readings/latest` | Última leitura de sensores da carga |
| GET | `/api/shipments/:id/readings?range=24h` | Histórico de leituras por período |
| GET | `/api/shipments/:id/positions` | Histórico de posições geográficas |
| GET | `/api/alerts` | Listar alertas (aceita query params de filtro) |
| PATCH | `/api/alerts/:id/acknowledge` | Reconhecer um alerta |
| GET | `/api/fruit-profiles` | Perfis de conservação das frutas |
| GET | `/api/notifications` | Notificações do usuário |

---

## Validação de Dados

Todas as respostas da API são validadas com schemas Zod na fronteira do serviço. Dados inválidos são rejeitados antes de chegarem aos componentes.

Validações aplicadas:

- Timestamps em formato ISO 8601
- Umidade relativa: 0–100%
- Latitude: -90 a 90
- Longitude: -180 a 180
- Limites ambientais: mínimo ≤ máximo
- Campos string obrigatórios não vazios
- IDs obrigatórios presentes

Os schemas estão definidos em `src/types/schemas.ts`.

---

## Tempo Real

O frontend está preparado para três estratégias de atualização:

1. **REST com polling** (implementado) — O TanStack Query faz polling configurável (padrão: 15–30s).
2. **WebSocket** (preparado) — A interface suporta troca para WebSocket; o contrato de mensagens precisa ser definido.
3. **Server-Sent Events** (preparado) — Alternativa ao WebSocket para atualizações unidirecionais.

Recursos implementados:

- Indicador visual de conexão (conectado / desconectado / sincronizando)
- Reconexão automática ao recuperar rede
- Diferenciação entre hora da medição (`measuredAt`), hora de recebimento (`receivedAt`) e hora de sincronização do frontend
- Detecção de leituras desatualizadas (stale)
- Tratamento de dados fora de ordem

---

## Como Conectar a API Real

### 1. Configure as variáveis de ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
VITE_DATA_PROVIDER=api
VITE_API_BASE_URL=https://sua-api.exemplo.com
```

### 2. Implemente o ApiDataProvider

O arquivo `src/services/api/api-provider.ts` contém um stub com todos os métodos da interface. Implemente cada método com chamadas HTTP à sua API:

```ts
async getShipments(filters?: ShipmentFilters): Promise<Shipment[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  // ...
  const response = await fetch(`${this.baseUrl}/api/shipments?${params}`);
  const data = await response.json();
  return ShipmentSchema.array().parse(data);
}
```

### 3. Nenhuma alteração nos componentes visuais

A troca de mock para API real é transparente para toda a camada visual. Os componentes consomem dados através dos hooks do TanStack Query, que por sua vez chamam o `DataService` — cuja implementação é selecionada pela variável de ambiente.

---

## Perguntas para a Equipe de Backend

- [ ] Formato de autenticação (JWT, OAuth 2.0, API Key?)
- [ ] Estrutura exata dos endpoints REST (paths, query params, paginação)
- [ ] Protocolo de tempo real preferido (WebSocket, SSE, ou apenas polling?)
- [ ] Formato de paginação das listagens (offset/limit, cursor?)
- [ ] Rate limits aplicáveis
- [ ] Formato padronizado de erros (estrutura do body de erro)
- [ ] Fuso horário dos timestamps (UTC recomendado)
- [ ] Configuração de CORS necessária
- [ ] Frequência esperada de leituras dos sensores
- [ ] Existirá endpoint de bulk/batch para leituras históricas?
- [ ] Como será feita a inscrição para notificações push (web push subscription)?
