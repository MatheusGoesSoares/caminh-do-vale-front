import type { Page } from "@playwright/test";
import { expect, test } from "./support/coverage";
import { INVITE_LINK, loginAs } from "./support/api";
import { step } from "./support/demo";

// A tiny valid PNG (the backend checks the file signature): the "photo" of the damaged cargo.
const PHOTO = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

/** Navigates like a person does: through the sidebar (no full page reload). */
async function menu(page: Page, item: string) {
  await page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: item }).click();
}

async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByLabel("Carregando aplicativo")).toBeHidden({ timeout: 15_000 });
}

test.describe("Vendedor", () => {
  test("acompanha a operação e cria uma viagem com motorista e comprador @demo", async ({ page }) => {
    const calls = await loginAs(page, "seller");

    await step(page, "Vendedora: a Visão Geral mostra as cargas em transporte e os alertas", async () => {
      await open(page, "/");
      await expect(page.getByText("Visão geral da operação")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Alertas Ativos" })).toBeVisible();
    });

    await step(page, "Abre uma carga: leituras de temperatura e umidade da placa", async () => {
      await menu(page, "Cargas e Lotes");
      await page.getByRole("link", { name: /VG-13/ }).first().click();
      await expect(page.getByRole("heading", { name: "VG-13" })).toBeVisible();
      await page.getByRole("button", { name: "Temperatura e Umidade" }).click();
      await expect(page.locator(".recharts-surface").first()).toBeVisible();
    });

    await step(page, "Em Viagens, cria uma viagem nova", async () => {
      await menu(page, "Viagens");
      await page.getByRole("button", { name: "Nova viagem" }).click();
      await expect(page.getByRole("dialog", { name: "Nova viagem" })).toBeVisible();
    });

    await step(page, "Escolhe rota, caminhão, placa, motorista, comprador e a carga", async () => {
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Origem").selectOption({ label: "Fazenda Boa Vista · Petrolina - PE" });
      await dialog.getByLabel("Destino").selectOption({ label: "CEAGESP · São Paulo - SP" });
      await dialog.getByLabel("Caminhão").selectOption({ label: "QWE1A23 · Baú refrigerado" });
      await dialog.getByLabel("Placa de monitoramento").selectOption({ label: "VSF-002 · Placa 2" });
      await dialog.getByLabel("Motorista").selectOption({ label: "Motorista Demo" });
      await dialog.getByLabel("Comprador").selectOption({ label: "Comprador Demo" });
      await dialog.getByLabel("Fruta").selectOption({ label: "Manga" });
      await dialog.getByLabel("Lote").fill("MG-2411-09");
      await dialog.getByLabel("Quantidade (kg)").fill("3200");
    });

    await step(page, "A viagem aparece em Planejadas", async () => {
      await page.getByRole("button", { name: "Criar viagem" }).click();
      await expect(page.getByText("Viagem VG-16 criada")).toBeVisible();
      await expect(page.getByRole("link", { name: "VG-16" })).toBeVisible();
    });

    const created = calls.find((c) => c.method === "POST" && c.path === "/shipments")?.body;
    expect(created).toMatchObject({ origin: 3, destination: 4, vehicle: 1, device: 2, driver: 9, buyer: 5, items: [{ fruit: 1, lot: "MG-2411-09", quantity_kg: "3200.00" }] });
  });

  test("reconhece e resolve um alerta", async ({ page }) => {
    const calls = await loginAs(page, "seller");
    await open(page, "/alertas");
    await page.getByRole("button", { name: "Reconhecer" }).first().click();
    await expect.poll(() => calls.some((c) => c.path === "/alerts/7/ack" || c.path === "/alerts/8/ack")).toBe(true);
    await page.getByRole("button", { name: "Marcar como resolvido" }).first().click();
    await expect.poll(() => calls.some((c) => /\/alerts\/\d+\/resolve/.test(c.path))).toBe(true);
  });

  test("busca cargas pelo lote", async ({ page }) => {
    await loginAs(page, "seller");
    await open(page, "/cargas");
    await page.getByPlaceholder("Buscar por ID, lote, veículo...").fill("UV-2411");
    await expect(page.getByText("VG-14").first()).toBeVisible();
    await expect(page.getByText("VG-13")).toHaveCount(0);
  });

  test("cadastra um local em Configurações e o Editar só aparece no que é dele", async ({ page }) => {
    const calls = await loginAs(page, "seller");
    await open(page, "/configuracoes?aba=cadastros");
    const rowOf = (name: string) => page.locator("li").filter({ hasText: name });
    await expect(rowOf("Fazenda Boa Vista").getByRole("button", { name: "Editar" })).toBeVisible();
    await expect(rowOf("CEAGESP").getByRole("button", { name: "Editar" })).toHaveCount(0); // shared: only the platform edits
    await page.getByRole("button", { name: "Novo local" }).click();
    await page.getByLabel("Nome").fill("Armazém Petrolina");
    await page.getByLabel("Cidade").fill("Petrolina - PE");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(rowOf("Armazém Petrolina")).toBeVisible();
    expect(calls.find((c) => c.method === "POST" && c.path === "/locations")?.body).toMatchObject({ name: "Armazém Petrolina", type: "farm", address: "Petrolina - PE" });
  });

  test("pergunta ao assistente sobre a carga aberta", async ({ page }) => {
    const calls = await loginAs(page, "seller");
    await open(page, "/cargas/VG-13");
    await page.getByRole("button", { name: "Perguntar ao assistente", exact: true }).click();
    await page.getByLabel("Mensagem para o assistente").fill("Como está a temperatura?");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Temperatura atual:")).toBeVisible();
    expect(calls.find((c) => c.path === "/chat")?.body).toMatchObject({ message: "Como está a temperatura?", shipment_id: 13 });
  });

  test("telas de mapa, monitoramento, relatórios e empresas abrem com os dados", async ({ page }) => {
    await loginAs(page, "seller");
    await open(page, "/");
    await menu(page, "Monitoramento");
    await expect(page.getByRole("heading", { name: "Monitoramento em Tempo Real" })).toBeVisible();
    await menu(page, "Mapa de Transportes");
    await expect(page.locator(".leaflet-container").first()).toBeVisible();
    await menu(page, "Histórico e Relatórios");
    await expect(page.getByText("VG-13").first()).toBeVisible();
    await menu(page, "Empresas");
    await expect(page.getByText("Dados fictícios, só para demonstração")).toBeVisible();
  });
});

test.describe("Comprador", () => {
  test("confirma o recebimento com avaria e foto @demo", async ({ page }) => {
    const calls = await loginAs(page, "buyer");

    await step(page, "Comprador: a viagem entregue aguarda a confirmação dele", async () => {
      await open(page, "/viagens");
      await expect(page.getByRole("heading", { name: "Entregue, aguardando confirmação" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Finalizar viagem" })).toHaveCount(0);
    });

    await step(page, "Marca que a carga chegou com avaria", async () => {
      await page.getByRole("button", { name: "Confirmar recebimento" }).click();
      await page.getByText("Com avaria", { exact: true }).click();
      await expect(page.getByText("Com avaria, envie ao menos uma foto como prova.")).toBeVisible();
    });

    await step(page, "Com avaria a foto é obrigatória: anexa a foto e descreve o problema", async () => {
      await page.locator('input[type="file"]').setInputFiles({ name: "caixas.png", mimeType: "image/png", buffer: PHOTO });
      await expect(page.getByAltText("Foto 1")).toBeVisible();
      await page.getByLabel(/Observações/).fill("3 caixas amassadas no fundo do baú.");
    });

    await step(page, "Confirma: a viagem é concluída", async () => {
      await page.getByRole("dialog").getByRole("button", { name: "Confirmar recebimento" }).click();
      await expect(page.getByText("Recebimento de VG-14 confirmado")).toBeVisible();
    });

    const confirm = calls.find((c) => c.path === "/shipments/14/confirm");
    expect(confirm?.raw).toContain('name="condition"\r\n\r\ndamaged');
    expect(confirm?.raw).toContain('name="photos"; filename="caixas.png"');
  });
});

test.describe("Motorista", () => {
  test("finaliza a viagem em andamento e inicia a próxima pelo celular @demo", async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 860 });
    const calls = await loginAs(page, "driver");

    await step(page, "Motorista: Minha viagem mostra as leituras ao vivo", async () => {
      await open(page, "/minha-viagem");
      await expect(page.getByRole("main").getByRole("heading", { name: "Minha viagem" })).toBeVisible();
      await expect(page.getByText("Temperatura").first()).toBeVisible();
    });

    await step(page, "Chegou ao destino: finaliza a viagem", async () => {
      await page.getByRole("button", { name: "Finalizar viagem" }).click();
      await page.getByRole("button", { name: "Confirmar" }).click();
      await expect(page.getByText("Aguardando confirmação").first()).toBeVisible();
    });

    await step(page, "E inicia a próxima viagem planejada", async () => {
      await page.getByRole("button", { name: "Iniciar viagem" }).click();
      await page.getByRole("button", { name: "Confirmar" }).click();
      await expect(page.getByRole("button", { name: "Iniciar viagem" })).toHaveCount(0);
    });

    expect(calls.filter((c) => c.method === "POST").map((c) => c.path)).toEqual(["/shipments/13/finish", "/shipments/15/start"]);
  });
});

test.describe("Administrador", () => {
  test("cria um usuário, copia o link do convite e reseta o 2FA @demo", async ({ page }) => {
    const calls = await loginAs(page, "admin");

    await step(page, "Administradora: a tela Usuários mostra papéis, convites e 2FA", async () => {
      await open(page, "/configuracoes?aba=usuarios");
      await expect(page.locator("tr").filter({ hasText: "Motorista Demo" }).getByText("Convite pendente")).toBeVisible();
    });

    await step(page, "Cria uma conta: a pessoa define a própria senha pelo convite", async () => {
      await page.getByRole("button", { name: "Novo usuário" }).click();
      await page.getByLabel("Nome").fill("Nova Compradora");
      await page.getByLabel("E-mail").fill("nova@example.com");
      await page.getByLabel("Papel").selectOption("buyer");
      await page.getByRole("button", { name: "Criar e enviar convite" }).click();
    });

    await step(page, "Sem e-mail configurado, o link do convite aparece para copiar", async () => {
      await expect(page.getByText(INVITE_LINK)).toBeVisible();
      await page.getByRole("button", { name: "Concluir" }).click();
    });

    await step(page, "Celular perdido: reseta o 2FA da vendedora", async () => {
      await page.locator("tr").filter({ hasText: "Vendedora Demo" }).getByRole("button", { name: "Resetar 2FA" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Resetar 2FA" }).click();
      await expect(page.getByText("2FA removido.")).toBeVisible();
    });

    expect(calls.find((c) => c.method === "POST" && c.path === "/auth/users")?.body).toEqual({ name: "Nova Compradora", email: "nova@example.com", role: "buyer" });
    expect(calls.some((c) => c.path === "/auth/users/7/reset-2fa")).toBe(true);
  });

  test("o menu Usuários não aparece para quem não é administrador", async ({ page }) => {
    await loginAs(page, "seller");
    await open(page, "/configuracoes");
    await expect(page.getByRole("tab", { name: "Usuários" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Usuários" })).toHaveCount(0);
  });
});
