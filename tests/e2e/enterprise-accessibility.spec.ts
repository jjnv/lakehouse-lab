import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createHash } from "node:crypto";

const routes = [
  { path: "/inicio", heading: "Inicio" },
  { path: "/mi-aprendizaje", heading: "Mi aprendizaje" },
  { path: "/catalogo", heading: "Catálogo" },
  { path: "/curso/data-intelligence-platform-y-arquitectura-lakehouse", heading: "Plataforma" },
  { path: "/simulacro/associate", heading: "Simulacro Associate" },
  { path: "/simulacro/professional", heading: "Simulacro Professional" },
  { path: "/expediente", heading: "Expediente" },
  { path: "/ajustes", heading: "Ajustes" },
  { path: "/certificados/credencial-inexistente", heading: "Verificar certificado" },
] as const;

const publicRoutes = [
  { path: "/", heading: "Ingeniería de datos que se practica." },
  { path: "/demo", heading: "Así se aprende dentro de Lakehouse Lab." },
  { path: "/acerca-de", heading: "Una academia construida como producto real." },
  { path: "/privacidad", heading: "Tu progreso te pertenece." },
  { path: "/terminos", heading: "Aprendizaje independiente, sin promesas engañosas." },
] as const;

async function waitForWorkspace(page: Page) {
  await expect(page.locator(".ent-state-card")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator("main#main-content")).toBeVisible();
}

async function expectWcag22Aa(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
}

test.describe.configure({ mode: "serial" });
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const route of routes) {
  test(`${route.path} conserva estructura y WCAG 2.2 AA`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBeLessThan(400);
    await waitForWorkspace(page);
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    await expectWcag22Aa(page);
  });
}

for (const route of publicRoutes) {
  test(`${route.path} es pública y conserva WCAG 2.2 AA`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("main#public-main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    await expectWcag22Aa(page);
  });
}

test("el drawer móvil atrapa y restaura el foco", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/inicio");
  await waitForWorkspace(page);
  const menu = page.getByRole("button", { name: "Menú" });
  await expect(menu).toBeVisible();
  await menu.click();
  const drawer = page.getByRole("dialog", { name: "Navegación de la plataforma" });
  await expect(drawer).toBeVisible();
  await expectWcag22Aa(page);
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(menu).toBeFocused();
});

test("la navegación principal completa una carga de documento fiable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/inicio");
  await waitForWorkspace(page);
  await page.getByRole("link", { name: "Catálogo", exact: true }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await waitForWorkspace(page);
  await expect(page.getByRole("heading", { level: 1, name: "Catálogo" })).toBeVisible();
});

test("la tarjeta del catálogo abre el curso completo", async ({ page }) => {
  await page.goto("/catalogo");
  await waitForWorkspace(page);
  await page.getByRole("link", { name: "Abrir: Data Intelligence Platform y arquitectura lakehouse" }).click();
  await expect(page).toHaveURL(/\/curso\/data-intelligence-platform-y-arquitectura-lakehouse$/);
  await waitForWorkspace(page);
  await expect(page.getByRole("heading", { level: 2, name: "Data Intelligence Platform y arquitectura lakehouse" })).toBeVisible();
});

test("la búsqueda global lleva al concepto exacto del temario", async ({ page }) => {
  await page.goto("/inicio");
  await waitForWorkspace(page);
  const search = page.getByRole("searchbox", { name: "Buscar conceptos en el temario" });
  await search.fill("watermark");
  const result = page.locator(".ent-search-result").filter({ hasText: "Watermark" }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/\/curso\/estado-ventanas-watermarks-y-datos-tardios\?lesson=.*&concept=concept-/);
  await waitForWorkspace(page);
  const concept = page.locator('.ent-mental-model article[id^="concept-"]').filter({ hasText: "Watermark" }).first();
  await expect(concept).toBeVisible();
  await expect(concept).toBeFocused();
  await expectWcag22Aa(page);
});

test("el diálogo destructivo mantiene una salida segura", async ({ page }) => {
  await page.goto("/ajustes");
  await waitForWorkspace(page);
  const trigger = page.getByRole("button", { name: "Eliminar progreso" });
  await trigger.click();
  const dialog = page.getByRole("alertdialog", { name: "¿Eliminar todo tu progreso?" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Eliminar definitivamente" })).toBeDisabled();
  await expectWcag22Aa(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("la migración compara datos y no expone contenido privado", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lakehouse-lab-progress-v2", JSON.stringify({
      completedLessons: { m01: ["m01-l1"] },
      labsPassed: [],
      labConfirmed: [],
      quizScores: {},
      quizAnswers: { m01: { 0: 2 } },
      labCode: { m01: "SELECT secret_draft" },
      gamification: { xp: 20, streak: 1, badges: [] },
    }));
  });
  await page.goto("/inicio");
  await waitForWorkspace(page);
  await expect(page.getByRole("heading", { name: "Hemos encontrado progreso en este navegador." })).toBeVisible();
  await expect(page.getByText("SELECT secret_draft")).toHaveCount(0);
  await expectWcag22Aa(page);
});

test("la interfaz hace reflow a 320 CSS px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/curso/data-intelligence-platform-y-arquitectura-lakehouse");
  await waitForWorkspace(page);
  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  const overflowing = await page.locator("body *").evaluateAll((elements) => elements
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      className: element.getAttribute("class") ?? "",
      parentClassName: element.parentElement?.getAttribute("class") ?? "",
      text: element.textContent?.trim().slice(0, 80) ?? "",
      left: Math.round(element.getBoundingClientRect().left),
      right: Math.round(element.getBoundingClientRect().right),
    }))
    .filter((element) => element.right > window.innerWidth)
    .slice(0, 12));
  expect(widths.document, JSON.stringify(overflowing)).toBeLessThanOrEqual(widths.viewport);
});

test("dos identidades autenticadas conservan progreso aislado", async ({ browser, baseURL }) => {
  const suffix = `${Date.now()}-${process.pid}`;
  const identityHeaders = (seed: string) => ({
    "x-lakehouse-test-session": createHash("sha256").update(seed).digest("hex"),
  });
  const contextA = await browser.newContext({ extraHTTPHeaders: identityHeaders(`isolation-a-${suffix}`) });
  const contextB = await browser.newContext({ extraHTTPHeaders: identityHeaders(`isolation-b-${suffix}`) });
  try {
    const pageA = await contextA.newPage();
    const dashboardAResponse = await pageA.request.get(`${baseURL}/api/me/dashboard`);
    expect(dashboardAResponse.ok()).toBeTruthy();
    const dashboardA = await dashboardAResponse.json();
    const mutation = await pageA.request.post(`${baseURL}/api/lessons/m01/m01-l1/review`, {
      data: {
        action: "complete",
        clientMutationId: `isolation-a-complete-${suffix}`,
        expectedRevision: dashboardA.revision.value,
      },
    });
    expect(mutation.ok()).toBeTruthy();

    const pageB = await contextB.newPage();
    const dashboardBResponse = await pageB.request.get(`${baseURL}/api/me/dashboard`);
    expect(dashboardBResponse.ok()).toBeTruthy();
    const dashboardB = await dashboardBResponse.json();
    const moduleB = dashboardB.progress.find((item: { moduleId: string }) => item.moduleId === "m01");
    expect(moduleB.completedLessonIds).not.toContain("m01-l1");

    const dashboardAAfter = await (await pageA.request.get(`${baseURL}/api/me/dashboard`)).json();
    const moduleA = dashboardAAfter.progress.find((item: { moduleId: string }) => item.moduleId === "m01");
    expect(moduleA.completedLessonIds).toContain("m01-l1");
  } finally {
    await contextA.close();
    await contextB.close();
  }
});

test("un visitante crea un espacio anónimo con una cookie privada", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ extraHTTPHeaders: {} });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/`);
    const start = page.getByRole("link", { name: "Empezar gratis" }).first();
    await expect(start).toHaveAttribute("href", /\/entrar\?return_to=/);
    await start.click();
    await expect(page).toHaveURL(/\/inicio$/);
    await waitForWorkspace(page);

    const cookie = (await context.cookies()).find((item) => item.name === "lakehouse_session");
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: "Lax" });
    expect(cookie?.value).toMatch(/^[a-f0-9]{64}$/);
    expect((await page.request.get(`${baseURL}/api/me/dashboard`)).ok()).toBeTruthy();
  } finally {
    await context.close();
  }
});
