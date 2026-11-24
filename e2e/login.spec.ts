import { expect, test, type Page } from "@playwright/test";
import { mockApi, RECOVERY_CODES, SECRET, USER, VALID_CODE, VALID_RECOVERY, type Scenario } from "./support/api";
import { step } from "./support/demo";

async function openLogin(page: Page, scenario: Scenario = {}) {
  const calls = await mockApi(page, scenario);
  await page.goto("/login");
  await expect(page.getByLabel("Carregando aplicativo")).toBeHidden({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Entrar no painel" })).toBeVisible();
  return calls;
}

async function typeCredentials(page: Page, password = "senha-correta") {
  await page.getByLabel("E-mail").fill(USER.email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

const codeInput = (page: Page) => page.getByLabel("Código de 6 dígitos do aplicativo autenticador");

async function expectInsidePanel(page: Page) {
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Menu do usuário" })).toBeVisible();
  const session = await page.evaluate(() => JSON.parse(localStorage.getItem("cdv.session") ?? "null"));
  expect(session).toMatchObject({ twoFactor: true, user: { email: USER.email } });
}

test.describe("Login com verificação em duas etapas", () => {
  test("primeiro acesso: senha, QR Code, código e códigos de recuperação @demo", async ({ page }) => {
    const calls = await openLogin(page, { setupRequired: true });

    await step(page, "Teste automatizado (Playwright): login com verificação em duas etapas", async () => {});
    await step(page, "1. A pessoa entra com e-mail e senha", () => typeCredentials(page));

    await step(page, "2. Primeiro acesso: o sistema mostra o QR Code para o aplicativo autenticador", async () => {
      await expect(page.getByRole("heading", { name: "Configurar o autenticador" })).toBeVisible();
      await expect(page.getByAltText("QR code para o aplicativo autenticador")).toBeVisible();
      await expect(page.getByText(SECRET)).toBeVisible();
    });

    await step(page, "3. Digita o código de 6 dígitos que aparece no aplicativo", async () => {
      await codeInput(page).pressSequentially(VALID_CODE, { delay: 120 });
    });

    await step(page, "4. Os códigos de recuperação aparecem uma única vez", async () => {
      await expect(page.getByRole("heading", { name: "Guarde seus códigos de recuperação" })).toBeVisible();
      for (const code of RECOVERY_CODES) await expect(page.getByText(code)).toBeVisible();
      await expect(page.getByRole("button", { name: "Entrar no painel" })).toBeDisabled();
    });

    await step(page, "5. Só entra depois de confirmar que guardou os códigos", async () => {
      await page.getByLabel("Guardei os códigos em um lugar seguro").check();
      await page.getByRole("button", { name: "Entrar no painel" }).click();
      await expectInsidePanel(page);
    });

    // The screen sent what the API expects, and the temporary token was never stored.
    expect(calls.find((c) => c.path === "/auth/login")?.body).toEqual({ email: USER.email, password: "senha-correta" });
    expect(calls.find((c) => c.path === "/auth/2fa/activate")?.body).toEqual({ mfa_token: "mfa-demo", code: VALID_CODE });
    expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain("mfa-demo");

    await step(page, "6. Ao sair, a sessão é encerrada e volta para o login", async () => {
      await page.getByRole("button", { name: "Menu do usuário" }).click();
      await page.getByRole("button", { name: "Sair" }).click();
      await expect(page).toHaveURL(/\/login$/);
    });
    expect(calls.some((c) => c.path === "/auth/logout" && c.body.refresh === "refresh-demo")).toBe(true);
  });

  test("acessos seguintes: entra com o código do aplicativo", async ({ page }) => {
    const calls = await openLogin(page);
    await typeCredentials(page);
    await expect(page.getByRole("heading", { name: "Digite o código" })).toBeVisible();
    await codeInput(page).fill(VALID_CODE);
    await expectInsidePanel(page);
    expect(calls.find((c) => c.path === "/auth/2fa/verify")?.body).toEqual({ mfa_token: "mfa-demo", code: VALID_CODE });
  });

  test("senha errada mostra a mensagem do servidor", async ({ page }) => {
    await openLogin(page);
    await typeCredentials(page, "senha-errada");
    await expect(page.getByRole("alert")).toHaveText("E-mail ou senha inválidos.");
    await expect(page.getByRole("heading", { name: "Entrar no painel" })).toBeVisible();
  });

  test("código errado mostra o erro e limpa o campo para tentar de novo", async ({ page }) => {
    await openLogin(page);
    await typeCredentials(page);
    await codeInput(page).fill("000000");
    await expect(page.getByRole("alert")).toHaveText("Código inválido ou vencido.");
    await expect(codeInput(page)).toHaveValue("");
  });

  test("celular perdido: entra com um código de recuperação", async ({ page }) => {
    const calls = await openLogin(page);
    await typeCredentials(page);
    await page.getByRole("button", { name: /Perdi meu celular/ }).click();
    await page.getByLabel("Código de recuperação").fill(VALID_RECOVERY.toLowerCase());
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expectInsidePanel(page);
    // Typed in lowercase; the screen sends it the way the backend stores it.
    expect(calls.find((c) => c.path === "/auth/2fa/verify")?.body).toEqual({ mfa_token: "mfa-demo", recovery_code: VALID_RECOVERY });
  });

  test("etapa do código vencida (401) volta para e-mail e senha", async ({ page }) => {
    await openLogin(page, { expired: true });
    await typeCredentials(page);
    await codeInput(page).fill(VALID_CODE);
    await expect(page.getByRole("heading", { name: "Entrar no painel" })).toBeVisible();
    await expect(page.getByRole("alert")).toHaveText("Sessão de login expirada. Entre com e-mail e senha de novo.");
  });
});

test.describe("Senha", () => {
  test("esqueci minha senha: pede o link pelo e-mail", async ({ page }) => {
    const calls = await openLogin(page);
    await page.getByRole("link", { name: "Esqueci minha senha" }).click();
    await expect(page.getByRole("heading", { name: "Esqueci minha senha" })).toBeVisible();
    await page.getByLabel("E-mail").fill(USER.email);
    await page.getByRole("button", { name: "Enviar link" }).click();
    await expect(page.getByRole("status")).toContainText("Se o e-mail estiver cadastrado");
    expect(calls.find((c) => c.path === "/auth/password-reset")?.body).toEqual({ email: USER.email });
  });

  test("convite: define a senha pelo link e volta para o login", async ({ page }) => {
    const calls = await mockApi(page);
    await page.goto("/redefinir-senha?uid=Nw&token=token-valido");
    await expect(page.getByRole("heading", { name: "Defina sua senha" })).toBeVisible();
    const save = page.getByRole("button", { name: "Salvar senha" });
    await page.getByLabel("Nova senha").fill("12345678");
    await expect(save).toBeDisabled(); // only digits is not accepted
    await page.getByLabel("Nova senha").fill("uma-senha-boa");
    await page.getByLabel("Repita a senha").fill("uma-senha-boa");
    await save.click();
    await expect(page.getByRole("heading", { name: "Senha definida!" })).toBeVisible();
    expect(calls.find((c) => c.path === "/auth/password-reset/confirm")?.body).toEqual({ uid: "Nw", token: "token-valido", password: "uma-senha-boa" });
    await page.getByRole("link", { name: "Ir para o login" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("link vencido mostra o erro e oferece um link novo", async ({ page }) => {
    await mockApi(page);
    await page.goto("/redefinir-senha?uid=Nw&token=vencido");
    await page.getByLabel("Nova senha").fill("uma-senha-boa");
    await page.getByLabel("Repita a senha").fill("uma-senha-boa");
    await page.getByRole("button", { name: "Salvar senha" }).click();
    await expect(page.getByRole("alert")).toHaveText("Link inválido ou expirado.");
    await expect(page.getByRole("link", { name: "Pedir um link novo" })).toBeVisible();
  });
});
