import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createHash } from "node:crypto";

const routes = [
  { path: "/inicio", heading: "Inicio" },
  { path: "/mi-aprendizaje", heading: "Plan" },
  { path: "/catalogo", heading: "Temario" },
  { path: "/recursos", heading: "Recursos" },
  { path: "/curso/data-intelligence-platform-y-arquitectura-lakehouse", heading: "Plataforma" },
  { path: "/curso/data-intelligence-platform-y-arquitectura-lakehouse/m01-l1", heading: "Plataforma" },
  { path: "/simulacro/associate", heading: "Simulacro Associate" },
  { path: "/simulacro/professional", heading: "Simulacro Professional" },
  { path: "/expediente", heading: "Resultados" },
  { path: "/ajustes", heading: "Mi cuenta" },
  { path: "/certificados/credencial-inexistente", heading: "Verificar constancia" },
] as const;

const publicRoutes = [
  { path: "/", heading: "Empieza con fundamentos lakehouse." },
  { path: "/ruta", heading: "Empieza desde cero si no sabes qué elegir." },
  { path: "/metodologia", heading: "Cómo validamos el contenido." },
  { path: "/changelog", heading: "Qué ha cambiado en el contenido." },
  { path: "/acerca-de", heading: "Preparación independiente para Data Engineers." },
  { path: "/privacidad", heading: "Tu progreso te pertenece." },
  { path: "/recuperar", heading: "Vuelve a tu aprendizaje." },
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

function notebookPreviewPayload(resourceId: string, title: string) {
  return {
    resourceId,
    title,
    sourceHref: `https://example.invalid/${resourceId}`,
    upstreamRef: "82ed21472bcd9801f0919b98a5afe9f40b3fcd74",
    path: "notebooks/pyspark/change-data-feed.ipynb",
    reviewedAt: "23 jul 2026",
    cells: [
      {
        id: "cell-markdown-0",
        sourceIndex: 0,
        sourceDigest: "b".repeat(64),
        kind: "markdown",
        text: `# ${title}\n\nContenido seguro interceptado para la prueba.`,
        guide: {
          points: [
            {
              title: "Contexto de la demostración",
              what: "Presenta el objetivo antes de ejecutar código.",
              why: "Permite relacionar la celda con el resultado esperado.",
              bestPractices: ["Documentar el propósito y los supuestos de entrada."],
              warnings: [],
              status: "current",
              referenceIds: ["notebook-docs"],
            },
            {
              title: "Ejemplo no productivo",
              what: "Acota una variante pensada solo para aprendizaje.",
              why: "Evita trasladar el atajo a una carga real.",
              bestPractices: ["Sustituir valores de ejemplo por parámetros validados."],
              warnings: ["No reutilices credenciales ni rutas de una demostración."],
              status: "risky",
              referenceIds: ["security-docs"],
            },
          ],
          prerequisites: ["Comprender la estructura básica de un notebook."],
          expectedEvidence: ["Una explicación verificable del resultado de la celda."],
        },
      },
      {
        id: "cell-code-3",
        sourceIndex: 3,
        sourceDigest: "c".repeat(64),
        kind: "code",
        language: "python",
        text: "print('preview segura')",
        outputs: [{ kind: "text", text: "preview segura\n" }],
        guide: null,
      },
    ],
    guideCoverage: {
      status: "partial",
      annotatedCells: 1,
      totalCells: 2,
      reviewedAt: "2026-07-23",
      references: [
        {
          id: "notebook-docs",
          title: "Documentación oficial de notebooks",
          publisher: "Databricks",
          href: "https://docs.databricks.com/aws/en/notebooks/",
          reviewedAt: "2026-07-23",
        },
        {
          id: "security-docs",
          title: "Buenas prácticas de seguridad",
          publisher: "Databricks",
          href: "https://docs.databricks.com/aws/en/security/",
          reviewedAt: "2026-07-23",
        },
      ],
    },
    truncated: false,
  };
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

test("la ruta antigua de demo redirige al catálogo abierto", async ({ page }) => {
  const response = await page.goto("/demo");
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/catalogo$/u);
  await expect(page.locator("main#main-content")).toBeVisible();
});

test("el drawer móvil atrapa y restaura el foco", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/inicio");
  await waitForWorkspace(page);
  const menu = page.getByRole("button", { name: "Menú" });
  await expect(menu).toBeVisible();
  await menu.click();
  const drawer = page.getByRole("dialog", { name: "Navegación principal" });
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
  await page.getByRole("link", { name: "Temario", exact: true }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await waitForWorkspace(page);
  await expect(page.getByRole("heading", { level: 1, name: "Temario" })).toBeVisible();
});

test("la tarjeta del catálogo abre el curso completo", async ({ page }) => {
  await page.goto("/catalogo");
  await waitForWorkspace(page);
  await expect(page.getByRole("heading", { level: 2, name: "Encuentra tu siguiente módulo" })).toBeVisible();
  await page.getByRole("link", { name: "Abrir: Data Intelligence Platform y arquitectura lakehouse" }).click();
  await expect(page).toHaveURL(/\/curso\/data-intelligence-platform-y-arquitectura-lakehouse$/);
  await waitForWorkspace(page);
  await expect(page.getByRole("heading", { level: 2, name: "Data Intelligence Platform y arquitectura lakehouse" })).toBeVisible();
  await expect(page.locator(".ent-lesson-body > p")).toHaveCount(10);
});

test("el catálogo descubre notebooks por temática sin duplicar el progreso", async ({ page }) => {
  await page.goto("/catalogo?view=resources");
  await waitForWorkspace(page);
  await expect(page.getByRole("tab", { name: /Recursos/ })).toHaveAttribute("aria-selected", "true");
  const resourceCards = page.locator(".ent-resource-card");
  await expect(resourceCards).toHaveCount(36);
  await expect(resourceCards.locator(".ent-resource-card-topline b").filter({ hasText: "Vista interna" })).toHaveCount(19);
  await expect(resourceCards.locator(".ent-resource-card-topline b").filter({ hasText: "Archivo en GitHub" })).toHaveCount(17);
  const fileActions = resourceCards.getByRole("link", { name: /Ver archivo/ });
  await expect(fileActions).toHaveCount(36);
  await expect(resourceCards.getByRole("link", { name: /Ver notebook/ })).toHaveCount(36);
  const reviewedHrefs = await fileActions.evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href));
  expect(reviewedHrefs.every((href) => /^https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[a-f0-9]{40}\/.+/.test(href))).toBe(true);
  await page.getByRole("searchbox", { name: "Buscar", exact: true }).fill("Change Data Feed");
  await expect(page.locator(".ent-resource-card")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "change-data-feed.ipynb" })).toBeVisible();
  await expectWcag22Aa(page);
});

test("el catálogo abre el notebook en el visor lateral mediante un enlace profundo", async ({ page }) => {
  await page.route("**/api/resources/delta-cdf/preview", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(notebookPreviewPayload("delta-cdf", "change-data-feed.ipynb")),
    });
  });
  const before = await (await page.request.get("/api/me/dashboard")).json();
  await page.goto("/catalogo?view=resources");
  await waitForWorkspace(page);
  await expect(page.getByRole("tab", { name: /Recursos/ })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("searchbox", { name: "Buscar", exact: true }).fill("change-data-feed.ipynb");
  const resourceCard = page.locator(".ent-resource-card").filter({ has: page.getByRole("heading", { name: "change-data-feed.ipynb", exact: true }) });
  await resourceCard.getByRole("link", { name: /Ver notebook/ }).click();
  await expect(page).toHaveURL(/\/curso\/change-data-feed-cdc-auto-cdc-y-scd\?section=resources&resource=delta-cdf/);
  await waitForWorkspace(page);
  await expect(page.getByRole("tab", { name: /Recursos/ })).toHaveAttribute("aria-selected", "true");
  const viewer = page.locator("dialog#community-preview");
  await expect(viewer).toBeVisible();
  await expect(viewer).toHaveAttribute("open", "");
  await expect(viewer.locator("#community-preview-title")).toHaveText("change-data-feed.ipynb");
  await expect(viewer.locator(".ent-notebook-cells > article")).toHaveCount(2);
  await expect(viewer.getByRole("status")).toContainText("Cobertura editorial parcial: 1 de 2");
  const guides = viewer.locator(".ent-notebook-guide");
  await expect(guides).toHaveCount(2);
  const firstGuide = guides.first();
  const firstGuideSummary = firstGuide.getByText("Guía editorial de la celda 1", { exact: true });
  await expect(firstGuide).not.toHaveAttribute("open", "");
  await expect(firstGuide.getByRole("heading", { name: "Contexto de la demostración" })).toBeHidden();
  expect(await firstGuideSummary.evaluate((summary) => (summary as HTMLElement).tabIndex)).toBeGreaterThanOrEqual(0);
  await firstGuideSummary.focus();
  await expect(firstGuideSummary).toBeFocused();
  await expect(firstGuideSummary).toHaveCSS("outline-style", "solid");
  expect(await firstGuideSummary.evaluate((summary) => summary.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  await page.keyboard.press("Enter");
  await expect(firstGuide).toHaveAttribute("open", "");
  await expect(firstGuide.getByText("Actual", { exact: true })).toBeVisible();
  await expect(firstGuide.getByText("Riesgo", { exact: true })).toBeVisible();
  await expect(firstGuide.getByText("Qué hace", { exact: true }).first()).toBeVisible();
  await expect(firstGuide.getByText("Por qué", { exact: true }).first()).toBeVisible();
  await expect(firstGuide.getByRole("heading", { name: "Buenas prácticas" }).first()).toBeVisible();
  await expect(firstGuide.getByRole("heading", { name: "Requisitos previos" })).toBeVisible();
  await expect(firstGuide.getByRole("heading", { name: "Evidencia esperada" })).toBeVisible();
  const officialLink = firstGuide.getByRole("link", { name: /Documentación oficial de notebooks/ });
  await expect(officialLink).toHaveAttribute("target", "_blank");
  await expect(officialLink).toHaveAttribute("rel", "noreferrer");
  await expect(officialLink).toHaveAttribute("href", "https://docs.databricks.com/aws/en/notebooks/");
  await page.setViewportSize({ width: 320, height: 800 });
  const viewerWidth = await viewer.evaluate((dialog) => ({
    clientWidth: dialog.clientWidth,
    scrollWidth: dialog.scrollWidth,
  }));
  expect(viewerWidth.scrollWidth).toBeLessThanOrEqual(viewerWidth.clientWidth);
  await page.keyboard.press("Space");
  await expect(firstGuide).not.toHaveAttribute("open", "");
  const pendingGuide = guides.nth(1);
  await expect(pendingGuide.getByText("Guía editorial de la celda 4", { exact: true })).toBeVisible();
  await pendingGuide.getByText("Guía editorial de la celda 4", { exact: true }).click();
  await expect(pendingGuide.getByText("Anotación pendiente de revisión", { exact: true })).toBeVisible();
  await expect(viewer.locator(".is-code").getByText("Celda 4", { exact: true })).toBeVisible();
  const after = await (await page.request.get("/api/me/dashboard")).json();
  expect(after.revision.value).toBe(before.revision.value);
  await expectWcag22Aa(page);
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(page).toHaveURL(/\/curso\/change-data-feed-cdc-auto-cdc-y-scd\?section=resources$/);
  await expect(page.locator("#community-resource-delta-cdf").getByRole("button", { name: /Abrir visor interno/ })).toBeFocused();
});

test("el visor interno renderiza celdas y Escape restaura el foco al botón que lo abrió", async ({ page }) => {
  await page.route("**/api/resources/delta-cdf/preview", async (route) => {
    const payload = notebookPreviewPayload("delta-cdf", "change-data-feed.ipynb");
    payload.cells[0].text = [
      "# change-data-feed.ipynb",
      "Contenido seguro interceptado para la prueba.",
      ...Array.from({ length: 170 }, (_, index) => `Bloque Markdown ${index + 1}`),
    ].join("\n\n");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
  await page.goto("/curso/delta-lake-acid-esquema-historial-y-dml?section=resources");
  await waitForWorkspace(page);

  const resourceCard = page.locator("#community-resource-delta-cdf");
  const opener = resourceCard.getByRole("button", { name: /Abrir visor interno/ });
  await expect(page.locator(".ent-community-card").getByRole("button", { name: /Abrir visor interno/ })).toHaveCount(3);
  await opener.click();
  const viewer = page.locator("dialog#community-preview");
  await expect(viewer).toBeVisible();
  await expect(viewer.locator(".ent-notebook-cells .is-markdown")).toContainText("Contenido seguro interceptado");
  await expect(viewer.locator(".ent-markdown-truncated")).toHaveText("Contenido Markdown recortado para mantener el visor fluido.");
  await expect(viewer.locator(".ent-notebook-cells .is-code")).toContainText("print('preview segura')");
  await expect(viewer.getByText("preview segura", { exact: true })).toBeVisible();
  await expect(viewer.getByRole("button", { name: "Cerrar visor de notebook" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(viewer).toBeHidden();
  await expect(opener).toBeFocused();
});

const previewIdentityMismatches = [
  { field: "resourceId", patch: { resourceId: "otro-recurso" } },
  { field: "upstreamRef", patch: { upstreamRef: "f".repeat(40) } },
  { field: "path", patch: { path: "notebooks/pyspark/otro-notebook.ipynb" } },
] as const;

for (const mismatch of previewIdentityMismatches) {
  test(`el visor rechaza una vista previa con ${mismatch.field} divergente`, async ({ page }) => {
    await page.route("**/api/resources/delta-cdf/preview", async (route) => {
      const payload = notebookPreviewPayload("delta-cdf", "change-data-feed.ipynb");
      Object.assign(payload, mismatch.patch);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });
    await page.goto("/curso/delta-lake-acid-esquema-historial-y-dml?section=resources");
    await waitForWorkspace(page);
    await page.locator("#community-resource-delta-cdf").getByRole("button", { name: /Abrir visor interno/ }).click();
    const viewer = page.locator("dialog#community-preview");
    await expect(viewer.getByRole("alert")).toContainText("La vista previa recibida no corresponde al recurso solicitado.");
    await expect(viewer.locator(".ent-notebook-cells")).toHaveCount(0);
    await expectWcag22Aa(page);
  });
}

test("el recurso externo usa el mismo visor y ofrece GitHub sin solicitar la API interna", async ({ page }) => {
  let previewRequests = 0;
  page.on("request", (request) => {
    if (/\/api\/resources\/[^/]+\/preview/.test(request.url())) previewRequests += 1;
  });
  await page.goto("/curso/data-intelligence-platform-y-arquitectura-lakehouse?section=resources");
  await waitForWorkspace(page);

  const resourceCard = page.locator("#community-resource-free-pipelines");
  const opener = resourceCard.getByRole("button", { name: /Abrir visor interno/ });
  await opener.click();
  const viewer = page.locator("dialog#community-preview");
  await expect(viewer).toBeVisible();
  await expect(viewer.locator("#community-preview-title")).toHaveText("Databricks Free Declarative Pipelines");
  await expect(viewer.getByText("Fuente revisada · vista externa")).toBeVisible();
  const githubAction = viewer.getByRole("link", { name: /Ver notebook en GitHub/ });
  await expect(githubAction).toBeVisible();
  await expect(githubAction).toHaveAttribute("href", /^https:\/\/github\.com\/andkret\/Databricks-Free-Declarative-Pipelines\/blob\/[a-f0-9]{40}\//);
  await expect.poll(() => previewRequests).toBe(0);
});

test("las cuatro pestañas del curso conservan navegación de teclado", async ({ page }) => {
  await page.goto("/curso/data-intelligence-platform-y-arquitectura-lakehouse");
  await waitForWorkspace(page);
  const lessons = page.getByRole("tab", { name: /Lecciones/ });
  await lessons.focus();
  await page.keyboard.press("End");
  const resources = page.getByRole("tab", { name: /Recursos/ });
  await expect(resources).toBeFocused();
  await expect(resources).toHaveAttribute("aria-selected", "true");
});

test("la búsqueda global lleva al concepto exacto del temario", async ({ page }) => {
  await page.goto("/inicio");
  await waitForWorkspace(page);
  const search = page.getByRole("searchbox", { name: "Buscar conceptos en el temario" });
  await search.fill("watermark");
  const result = page.locator(".ent-search-result").filter({ hasText: "Watermark" }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/\/curso\/estado-ventanas-watermarks-y-datos-tardios\/m14-l2\?concept=concept-.*#concept-/);
  await waitForWorkspace(page);
  const concept = page.locator('.ent-mental-model article[id^="concept-"]').filter({ hasText: "Watermark" }).first();
  await expect(concept).toBeVisible();
  await expect(concept).toBeFocused();
  await expectWcag22Aa(page);
});

test("la búsqueda global encuentra un notebook y abre su ficha", async ({ page }) => {
  await page.goto("/inicio");
  await waitForWorkspace(page);
  const search = page.getByRole("searchbox", { name: "Buscar conceptos en el temario" });
  await search.fill("Photon.py");
  const result = page.locator(".ent-search-result").filter({ hasText: "Photon.py" }).first();
  await expect(result).toBeVisible();
  await expect(result).toContainText("Notebook");
  await result.click();
  await expect(page).toHaveURL(/\/curso\/photon-data-skipping-y-liquid-clustering\?section=resources&resource=learn-photon/);
  await waitForWorkspace(page);
  await expect(page.locator("dialog#community-preview").getByRole("heading", { name: "Photon.py" })).toBeVisible();
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

test("el dashboard no expone preferencias de nube ni planificación retirada", async ({ page, baseURL }) => {
  const response = await page.request.get(`${baseURL}/api/me/dashboard`);
  expect(response.ok()).toBeTruthy();
  const dashboard = await response.json();
  const serialized = JSON.stringify(dashboard);
  for (const retiredField of [
    "cloud",
    "clouds",
    "weeklyTargetMinutes",
    "weeklyMinutes",
    "dueAt",
    "durationDays",
    "minutes",
  ]) {
    expect(serialized).not.toContain(`"${retiredField}"`);
  }
  expect(dashboard).toHaveProperty("preferences.goal");
  expect(dashboard.preferences).toHaveProperty("onboardingCompleted");
});

test("las nuevas páginas de certificación y simulacro son públicas sin crear sesión", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ extraHTTPHeaders: {} });
  try {
    const page = await context.newPage();
    const anonymousRoutes = [
      { path: "/associate", heading: "Databricks Data Engineer Associate" },
      { path: "/professional", heading: "Databricks Data Engineer Professional" },
      { path: "/simulacros", heading: "Simulacros internos Associate y Professional" },
      { path: "/simulacro/associate", heading: "Databricks Data Engineer Associate" },
      { path: "/simulacro/professional", heading: "Databricks Data Engineer Professional" },
    ] as const;
    for (const route of anonymousRoutes) {
      const response = await page.goto(`${baseURL}${route.path}`);
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator("main#public-main")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      await expect(page.locator("main#main-content")).toHaveCount(0);
      await expect(page.getByText(/No está afiliado|no equivale al examen oficial/i).first()).toBeVisible();
      expect((await context.cookies()).some((item) => item.name === "lakehouse_session")).toBe(false);
    }
  } finally {
    await context.close();
  }
});

test("un visitante crea un espacio anónimo con una cookie privada", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ extraHTTPHeaders: {} });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/`);
    await page.getByRole("link", { name: "Temario" }).first().click();
    await expect(page).toHaveURL(/\/catalogo$/u);
    await expect(page.getByRole("heading", { level: 1, name: "Temario" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Crear espacio para guardar" })).toBeVisible();
    expect((await context.cookies()).some((item) => item.name === "lakehouse_session")).toBe(false);

    await page.goto(`${baseURL}/curso/data-intelligence-platform-y-arquitectura-lakehouse`);
    await expect(page.getByRole("heading", { level: 1, name: "Plataforma" })).toBeVisible();
    await expect(page.getByText("Lectura pública").first()).toBeVisible();
    expect((await context.cookies()).some((item) => item.name === "lakehouse_session")).toBe(false);

    await page.goto(`${baseURL}/`);
    const start = page.getByRole("link", { name: "Guardar progreso" }).first();
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
