// Fictitious service providers. This is the only made-up data in the app: the backend has no company
// entity yet, so each vehicle plate coming from the API is assigned to one of these carriers.

export interface ServiceCompany {
  id: string;
  name: string;
  city: string;
  service: string;
  email: string;
  plates: string[];
}

export const serviceCompanies: ServiceCompany[] = [
  {
    id: "transvale",
    name: "TransVale Frios Logística",
    city: "Petrolina - PE",
    service: "Transporte refrigerado de frutas",
    email: "operacao@transvale.example",
    plates: ["QWE1A23"],
  },
  {
    id: "rota-sertaneja",
    name: "Rota Sertaneja Cargas",
    city: "Juazeiro - BA",
    service: "Carretas refrigeradas de longa distância",
    email: "contato@rotasertaneja.example",
    plates: ["RTY2B34"],
  },
  {
    id: "frota-sao-francisco",
    name: "Frota São Francisco Transportes",
    city: "Recife - PE",
    service: "Distribuição refrigerada para centros de distribuição",
    email: "frota@frotasaofrancisco.example",
    plates: [],
  },
  {
    id: "cerrado-frio",
    name: "Cerrado Frio Express",
    city: "Salvador - BA",
    service: "Transporte expresso de cargas perecíveis",
    email: "atendimento@cerradofrio.example",
    plates: [],
  },
];

function normalize(plate: string): string {
  return plate.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

/** Same plate always maps to the same company, including plates the list above doesn't know. */
export function companyForPlate(plate: string | undefined): ServiceCompany | undefined {
  if (!plate) return undefined;
  const key = normalize(plate);
  const listed = serviceCompanies.find((c) => c.plates.some((p) => normalize(p) === key));
  if (listed) return listed;
  const hash = [...key].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return serviceCompanies[hash % serviceCompanies.length];
}
