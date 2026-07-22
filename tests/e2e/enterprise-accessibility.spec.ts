import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

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

test("la navegación mueve el foco al contenido nuevo", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/inicio");
  await waitForWorkspace(page);
  await page.getByRole("link", { name: "Catálogo", exact: true }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await expect(page.locator("main#main-content")).toBeFocused();
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
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});
