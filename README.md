# 🌿 Caminho do Vale

Plataforma de monitoramento de transporte de frutas do Vale do São Francisco.

## Sobre

O **Caminho do Vale** é uma aplicação web progressiva (PWA) para monitoramento em tempo real das condições ambientais e logísticas do transporte de frutas produzidas na região de Petrolina (PE) e Juazeiro (BA).

A plataforma permite que produtores, transportadoras e gestores logísticos acompanhem temperatura, umidade, localização e alertas de cada carga durante todo o percurso.

### Funcionalidades

- **Dashboard** com visão geral operacional e indicadores-chave
- **Monitoramento** de temperatura e umidade em tempo real com gráficos interativos
- **Rastreamento geográfico** dos veículos em mapa interativo (Leaflet + OpenStreetMap)
- **Sistema de alertas** configurável com níveis de gravidade e reconhecimento
- **Catálogo de perfis** de conservação pós-colheita baseados em referências científicas
- **Histórico e relatórios** com exportação CSV
- **PWA instalável** com suporte a funcionamento offline básico
- **Responsivo** para desktop, tablet e smartphone

### Tecnologias

- React 19 + TypeScript (tipagem estrita)
- Vite 8
- Tailwind CSS v4
- Recharts (gráficos de linha, área e combinados)
- Leaflet + React-Leaflet + OpenStreetMap (mapas)
- TanStack Query (gerenciamento de dados assíncronos)
- Zod (validação de dados na fronteira da API)
- vite-plugin-pwa + Workbox (PWA)
- Vitest + React Testing Library (testes)
- date-fns (formatação de datas em pt-BR)
- Lucide React (ícones)

## Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd caminho-do-vale

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção (TypeScript + Vite) |
| `npm run preview` | Preview local do build de produção |
| `npm run test` | Executa os testes uma vez |
| `npm run test:watch` | Executa os testes em modo watch |

## Modo Demonstração

A aplicação inicia por padrão em **modo demonstração** com dados simulados realistas. Um indicador "Modo demonstração" é exibido na barra superior da interface.

Os cenários simulados incluem:

| Carga | Fruta | Cenário |
|---|---|---|
| CV-1001 | Uva de mesa | Transporte em condições normais |
| CV-1002 | Manga Tommy Atkins | Temperatura elevada (crítico) |
| CV-1003 | Goiaba | Umidade abaixo do limite (atenção) |
| CV-1004 | Banana | Sensor sem comunicação recente |
| CV-1005 | Melão honeydew | Entrega concluída |
| CV-1006 | Mamão | Aguardando carregamento |

Para conectar com uma API real, configure as variáveis de ambiente:

```env
VITE_DATA_PROVIDER=api
VITE_API_BASE_URL=https://sua-api.com
```

## Estrutura do Projeto

```
src/
  app/                    # Providers e router
  assets/brand/           # Logotipos SVG
  components/
    ui/                   # Componentes base (Card, Badge, Button, etc.)
    layout/               # Sidebar, Header, MobileNav, AppLayout
    charts/               # Gráficos de temperatura, umidade, combinado
    maps/                 # Mapa interativo de rastreamento
    alerts/               # Componentes de alertas
    shipments/            # Componentes de cargas
  features/
    dashboard/            # Página principal
    monitoring/           # Monitoramento em tempo real
    shipments/            # Listagem e detalhes de cargas
    tracking/             # Mapa de transportes em tela cheia
    alerts/               # Central de alertas
    reports/              # Histórico e relatórios
    settings/             # Configurações
  services/
    api/                  # Interface DataService e stub da API
    mock/                 # Mock provider com dados simulados
  hooks/                  # Hooks React (TanStack Query, responsividade)
  types/                  # Interfaces TypeScript e schemas Zod
  config/                 # Perfis de frutas
  utils/                  # Regras de monitoramento, formatação
  styles/                 # CSS global e tokens Tailwind
public/
  icons/                  # Ícones PWA (192, 512, maskable)
  offline.html            # Página offline
```

## Integração com API

Consulte [API_INTEGRATION.md](./API_INTEGRATION.md) para detalhes sobre os contratos de dados esperados e as informações que precisam ser confirmadas com a equipe de backend.

A arquitetura utiliza um padrão de abstração (`DataService`) que permite trocar o provider de dados (mock → API) sem alterar nenhum componente visual.

## Perfis de Frutas

O catálogo inicial inclui perfis de conservação pós-colheita para:

- Uva de mesa
- Manga (verde-madura e parcialmente madura)
- Goiaba (verde-madura e madura)
- Banana
- Mamão (3 estágios de maturação)
- Melão honeydew e cantaloupe

Os valores são referências científicas do UC Davis Postharvest Technology Center e não devem ser interpretados como limites operacionais definitivos para todos os cultivares.

## Licença

Projeto acadêmico — Vale do São Francisco.
