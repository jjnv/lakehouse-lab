import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createHash } from "node:crypto";

const SCENARIO = "/playground/scenario/uc-permissions-run-as";

async function expectWcag22Aa(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
}

async function openActions(page: Page) {
  const actionsTab = page.locator(".pg-panel-switch").getByRole("button", { name: "Acciones" });
  if (await actionsTab.isVisible()) await actionsTab.click();
}

async function act(page: Page, label: string) {
  await openActions(page);
  const button = page.getByRole("button", { name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}`, "u") });
  await expect(button).toBeEnabled();
  await button.click();
}

async function solveLeastPrivilege(page: Page, origin = "") {
  await page.goto(`${origin}${SCENARIO}`);
  await expect(page.locator(".pg-workspace[aria-busy='false']")).toBeVisible();
  await act(page, "Leer el error de la tarea fallida");
  await act(page, "Revisar el cambio de run-as en el bundle");
  await act(page, "SHOW GRANTS en el esquema");
  await act(page, "SHOW GRANTS en el volume");
  await openActions(page);
  for (const hypothesis of ["Falta USE SCHEMA", "Falta READ VOLUME", "La identidad anterior obtenía acceso"]) {
    await page.getByRole("checkbox", { name: new RegExp(hypothesis, "u") }).check();
  }
  await page.getByRole("button", { name: "Declarar", exact: true }).click();
  await act(page, "Avisar a ventas");
  await act(page, "GRANT USE SCHEMA");
  await act(page, "GRANT READ VOLUME");
  await act(page, "Reparar el run");
  await act(page, "Probar accesos negativos");
  await act(page, "Declarar los grants como código");
  page.once("dialog", (dialog) => dialog.accept());
  await openActions(page);
  await page.getByRole("button", { name: "Cerrar incidencia" }).click();
  await expect(page.getByRole("heading", { level: 2, name: /Permisos insuficientes/u })).toBeFocused();
}

test.describe.configure({ mode: "serial" });

test("el Playground es público, accesible y no crea sesión", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ extraHTTPHeaders: {} });
  try {
    const page = await context.newPage();
    const response = await page.goto(`${baseURL}/playground`);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["cache-control"] ?? "").not.toContain("public");
    await expect(page.getByRole("heading", { level: 1, name: "Playground" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Production Incident Simulator" })).toBeVisible();
    await expect(page.locator(".pg-scenarios > li")).toHaveCount(5);
    await expect(page.getByText(/sintéticos y educativos/u).first()).toBeVisible();
    await expectWcag22Aa(page);
    expect((await context.cookies()).some((cookie) => cookie.name === "lakehouse_session")).toBe(false);
    await page.goto(`${baseURL}${SCENARIO}`);
    await expect(page.locator(".pg-workspace[aria-busy='false']")).toBeVisible();
    await expectWcag22Aa(page);
    expect((await context.cookies()).some((cookie) => cookie.name === "lakehouse_session")).toBe(false);
  } finally {
    await context.close();
  }
});

test("la navegación principal enlaza el Playground", async ({ page }) => {
  await page.goto("/inicio");
  const link = page.locator('a[href="/playground"]').first();
  await expect(link).toHaveAttribute("href", "/playground");
});

test("investigar revela evidencias y las acciones cambian métricas y tiempo", async ({ page }) => {
  await page.goto(SCENARIO);
  await expect(page.locator(".pg-workspace[aria-busy='false']")).toBeVisible();
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.locator(".pg-statusbar")).toContainText("0 / 240");
  await act(page, "Leer el error de la tarea fallida");
  await expect(page.locator(".pg-live")).toContainText("USE SCHEMA");
  await expect(page.locator(".pg-statusbar")).toContainText("3 / 240");
  await expect(page.locator(".pg-statusbar")).toContainText("2 / 13");
  // La acción ya realizada no puede repetirse.
  await openActions(page);
  await expect(page.getByRole("button", { name: /^Leer el error de la tarea fallida/u })).toBeDisabled();
  // Recuperación local tras recargar.
  await page.reload();
  await expect(page.getByText("Se ha recuperado tu progreso local de este escenario.")).toBeVisible();
  await expect(page.locator(".pg-statusbar")).toContainText("3 / 240");
});

test("resolución completa con informe post mortem, guardado idempotente y enlace al currículo", async ({ page, baseURL }) => {
  // `next dev` normaliza request.url a localhost; el control same-origin exige navegar con ese host.
  const origin = baseURL!.replace("127.0.0.1", "localhost");
  await page.goto(`${origin}${SCENARIO}`);
  await page.evaluate(() => window.localStorage.clear());
  await solveLeastPrivilege(page, origin);
  await expect(page.locator(".pg-score strong")).toHaveText(/^(9\d|100)$/u);
  await expect(page.getByRole("heading", { name: "Causa raíz" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Alternativas razonables" })).toBeVisible();
  await expectWcag22Aa(page);

  const saveResponse = page.waitForResponse((response) => response.url().endsWith("/api/playground/attempts") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Guardar resultado" }).click();
  const saved = await saveResponse;
  expect(saved.status(), await saved.text()).toBe(201);
  await expect(page.getByText("Resultado guardado en tu espacio.")).toBeVisible();

  const overview = await (await page.request.get(`${origin}/api/playground/attempts`)).json();
  expect(overview.attempts.some((attempt: { scenarioId: string; status: string }) => attempt.scenarioId === "uc-permissions-run-as" && attempt.status === "recovered")).toBe(true);
  const exported = await (await page.request.get(`${origin}/api/me/export`)).json();
  expect(exported.playground.attempts.length).toBeGreaterThan(0);

  const lesson = page.locator(".pg-report a[href^='/curso/']").first();
  const href = await lesson.getAttribute("href");
  await lesson.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`, "u"));
});

test("el servidor recalcula la evaluación, rechaza payloads manipulados y aísla usuarios", async ({ browser, baseURL }) => {
  const suffix = `${Date.now()}-${process.pid}`;
  const headersFor = (seed: string) => ({ "x-lakehouse-test-session": createHash("sha256").update(seed).digest("hex") });
  const contextA = await browser.newContext({ extraHTTPHeaders: headersFor(`pg-a-${suffix}`) });
  const contextB = await browser.newContext({ extraHTTPHeaders: headersFor(`pg-b-${suffix}`) });
  try {
    const pageA = await contextA.newPage();
    const payload = {
      scenarioId: "orchestration-retry-effects",
      scenarioVersion: "1.0.0",
      mode: "evaluation",
      seed: 99,
      idempotencyKey: `pg-e2e-${suffix}`.padEnd(24, "x"),
      inputs: [
        { type: "action", actionId: "view-run-history" },
        { type: "action", actionId: "inspect-bundle-diff" },
        { type: "action", actionId: "fix-bundle-deploy" },
        { type: "action", actionId: "repair-notify" },
      ],
    };
    const created = await pageA.request.post(`${baseURL}/api/playground/attempts`, { data: payload });
    expect(created.status(), await created.text()).toBe(201);
    const body = await created.json();
    expect(body.attempt.status).toBe("failed");
    expect(body.evaluation.score).toBeLessThanOrEqual(40);
    const replayed = await pageA.request.post(`${baseURL}/api/playground/attempts`, { data: payload });
    expect(replayed.status()).toBe(200);
    expect((await replayed.json()).attempt.id).toBe(body.attempt.id);
    const conflicting = await pageA.request.post(`${baseURL}/api/playground/attempts`, { data: { ...payload, seed: 100 } });
    expect(conflicting.status()).toBe(409);
    const tampered = await pageA.request.post(`${baseURL}/api/playground/attempts`, { data: { ...payload, idempotencyKey: `${payload.idempotencyKey}-2`, score: 100 } });
    expect(tampered.status()).toBe(422);
    const unfinished = await pageA.request.post(`${baseURL}/api/playground/attempts`, { data: { ...payload, idempotencyKey: `${payload.idempotencyKey}-3`, inputs: payload.inputs.slice(0, 2) } });
    expect(unfinished.status()).toBe(422);
    const invalidAction = await pageA.request.post(`${baseURL}/api/playground/attempts`, { data: { ...payload, idempotencyKey: `${payload.idempotencyKey}-4`, inputs: [{ type: "action", actionId: "validate-ledger-everything" }] } });
    expect(invalidAction.status()).toBe(422);

    const pageB = await contextB.newPage();
    const overviewB = await (await pageB.request.get(`${baseURL}/api/playground/attempts`)).json();
    expect(overviewB.attempts.some((attempt: { id: string }) => attempt.id === body.attempt.id)).toBe(false);
    const sameKeyB = await pageB.request.post(`${baseURL}/api/playground/attempts`, { data: payload });
    expect(sameKeyB.status()).toBe(201);
    expect((await sameKeyB.json()).attempt.id).not.toBe(body.attempt.id);

    const anonymous = await browser.newContext({ extraHTTPHeaders: {} });
    const anonymousResponse = await (await anonymous.newPage()).request.post(`${baseURL}/api/playground/attempts`, { data: payload });
    expect(anonymousResponse.status()).toBe(401);
    await anonymous.close();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});

test("el workspace es usable en móvil con paneles conmutables y en inglés", async ({ page, context, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(SCENARIO);
  await expect(page.locator(".pg-workspace[aria-busy='false']")).toBeVisible();
  const switcher = page.locator(".pg-panel-switch");
  await expect(switcher).toBeVisible();
  await switcher.getByRole("button", { name: "Evidencias" }).click();
  await expect(page.locator("#pg-panel-evidence")).toBeVisible();
  await expect(page.locator("#pg-panel-actions")).toBeHidden();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expectWcag22Aa(page);

  await context.addCookies([{ name: "lakehouse_locale", value: "en", url: baseURL! }]);
  const english = await context.browser()!.newContext({ extraHTTPHeaders: {} });
  await english.addCookies([{ name: "lakehouse_locale", value: "en", url: baseURL! }]);
  const englishPage = await english.newPage();
  await englishPage.goto(`${baseURL}${SCENARIO}`);
  await expect(englishPage.getByRole("heading", { level: 1, name: "Insufficient privileges after moving to a service principal" })).toBeVisible();
  await expect(englishPage.getByText(/synthetic and educational/u).first()).toBeVisible();
  await english.close();
});
