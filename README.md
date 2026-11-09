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

## Dados

Todos os dados vêm da API do back (PI Frutas). Não há modo demonstração: é preciso entrar com uma conta do back.

```env
VITE_API_BASE_URL=https://projeto-integrador-time1.onrender.com/api/v1
```

No site publicado na Vercel, o front chama `/api/v1` e o `vercel.json` repassa as chamadas ao back.

O único dado fictício são as transportadoras em `src/config/companies.ts`: o back ainda não tem cadastro de empresas, então cada veículo é ligado a uma delas pela placa.

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
    trips/                # Iniciar e finalizar viagens (operador)
    companies/            # Empresas que prestam os serviços
  services/
    api/                  # Interface DataService e cliente da API do back
  hooks/                  # Hooks React (TanStack Query, responsividade)
  types/                  # Interfaces TypeScript e schemas Zod
  config/                 # Empresas fictícias (transportadoras)
  utils/                  # Regras de monitoramento, formatação
  styles/                 # CSS global e tokens Tailwind
public/
  icons/                  # Ícones PWA (192, 512, maskable)
  offline.html            # Página offline
```

## Integração com API

Consulte [API_INTEGRATION.md](./API_INTEGRATION.md) para detalhes sobre os contratos de dados esperados e as informações que precisam ser confirmadas com a equipe de backend.

A arquitetura utiliza um padrão de abstração (`DataService`): os componentes visuais não chamam a API diretamente.

## Perfis de Frutas

As faixas de temperatura e umidade de cada fruta vêm do back (`/fruits` e `/fruit-parameters`) e aparecem em Configurações.

## Licença

Projeto acadêmico — Vale do São Francisco.
