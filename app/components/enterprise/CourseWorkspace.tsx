"use client";

/* eslint-disable @next/next/no-img-element -- Notebook previews only allow size-limited PNG/JPEG data URLs. */

import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { PublicModule } from "../../enterprise/curriculum";
import type { CommunityResourceRecommendationPublic, NotebookPreviewPayload } from "../../enterprise/contracts";
import { conceptAnchor } from "../../enterprise/search-anchor";
import AssessmentPanel from "./AssessmentPanel";
import { SaveState, useDashboard } from "./useDashboard";
import { courseWorkspaceText } from "../../i18n/dictionaries";
import { localizeReviewDate } from "../../i18n/curriculum";
import type { Locale } from "../../i18n/config";

type CourseSection = "lessons" | "lab" | "quiz" | "resources";
const COURSE_SECTIONS: CourseSection[] = ["lessons", "lab", "quiz", "resources"];

const sectionLabel: Record<Locale, Record<CourseSection, string>> = {
  es: {
    lessons: "Lecciones",
    lab: "Laboratorio",
    quiz: "Evaluación",
    resources: "Recursos",
  },
  en: {
    lessons: "Lessons",
    lab: "Lab",
    quiz: "Quiz",
    resources: "Resources",
  },
};

function NotebookInline({ text }: { text: string }) {
  const parts = text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g).filter(Boolean);
  return <>{parts.map((part, index) => part.startsWith("`") && part.endsWith("`")
    ? <code key={index}>{part.slice(1, -1)}</code>
    : part.startsWith("**") && part.endsWith("**")
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part)}</>;
}

function markdownBlocks(text: string) {
  const sourceLines = text.replace(/\r/g, "").split("\n");
  const lines = sourceLines.slice(0, 600);
  const blocks: string[] = [];
  let current: string[] = [];
  let fenced = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) fenced = !fenced;
    if (!fenced && !line.trim()) {
      if (current.length) blocks.push(current.join("\n"));
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current.join("\n"));
  const filtered = blocks.filter((block) => block.trim());
  return {
    blocks: filtered.slice(0, 160),
    truncated: sourceLines.length > lines.length || filtered.length > 160,
  };
}

function NotebookMarkdown({ text, locale = "es" }: { text: string; locale?: Locale }) {
  const markdown = markdownBlocks(text);
  return <div className="ent-notebook-markdown">{markdown.blocks.map((block, index) => {
    const trimmed = block.trim();
    const heading = /^(#{1,4})\s+([\s\S]+)$/.exec(trimmed);
    if (heading) {
      const level = Math.min(heading[1].length + 2, 6);
      const Heading = `h${level}` as "h3" | "h4" | "h5" | "h6";
      return <Heading key={index}><NotebookInline text={heading[2]} /></Heading>;
    }
    const lines = trimmed.split("\n");
    if (lines.every((line) => /^\s*[-*+]\s+/.test(line))) {
      return <ul key={index}>{lines.slice(0, 100).map((line, lineIndex) => <li key={lineIndex}><NotebookInline text={line.replace(/^\s*[-*+]\s+/, "")} /></li>)}</ul>;
    }
    if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
      return <ol key={index}>{lines.slice(0, 100).map((line, lineIndex) => <li key={lineIndex}><NotebookInline text={line.replace(/^\s*\d+[.)]\s+/, "")} /></li>)}</ol>;
    }
    if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
      return <pre key={index}><code>{trimmed.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "")}</code></pre>;
    }
    if (lines.every((line) => /^\s*>\s?/.test(line))) {
      return <blockquote key={index}>{lines.map((line) => line.replace(/^\s*>\s?/, "")).join(" ")}</blockquote>;
    }
    if (lines.length >= 2 && lines[0].includes("|") && /^[\s|:-]+$/.test(lines[1])) {
      const cells = (line: string) => line.replace(/^\||\|$/g, "").split("|").slice(0, 16).map((cell) => cell.trim());
      return <div className="ent-notebook-table-wrap" key={index}><table><thead><tr>{cells(lines[0]).map((cell, cellIndex) => <th key={cellIndex}><NotebookInline text={cell} /></th>)}</tr></thead><tbody>{lines.slice(2, 62).map((line, rowIndex) => <tr key={rowIndex}>{cells(line).map((cell, cellIndex) => <td key={cellIndex}><NotebookInline text={cell} /></td>)}</tr>)}</tbody></table></div>;
    }
    if (/^([-*_])\1{2,}$/.test(trimmed.replace(/\s/g, ""))) return <hr key={index} />;
    return <p key={index}><NotebookInline text={lines.join(" ")} /></p>;
  })}{markdown.truncated ? <p className="ent-markdown-truncated">{locale === "en" ? "Markdown content truncated to keep viewer responsive." : "Contenido Markdown recortado para mantener el visor fluido."}</p> : null}</div>;
}

function NotebookEditorialGuide({
  cellNumber,
  guide,
  references,
  locale = "es",
}: {
  cellNumber: number;
  guide: NotebookPreviewPayload["cells"][number]["guide"];
  references: NotebookPreviewPayload["guideCoverage"]["references"];
  locale?: Locale;
}) {
  const text = courseWorkspaceText[locale] ?? courseWorkspaceText.es;
  const guideReferences = guide
    ? references.filter((reference) =>
      guide.points.some((point) => point.referenceIds.includes(reference.id)),
    )
    : [];

  const editorialStatusLabel: Record<
    NonNullable<NotebookPreviewPayload["cells"][number]["guide"]>["points"][number]["status"],
    string
  > = {
    current: locale === "en" ? "Current" : "Actual",
    "demo-only": locale === "en" ? "Demo only" : "Solo demostración",
    legacy: locale === "en" ? "Legacy" : "Histórico",
    risky: locale === "en" ? "Risky" : "Riesgo",
  };

  return (
    <details className="ent-notebook-guide">
      <summary>{text.notebookGuideSummary(cellNumber)}</summary>
      <div className="ent-notebook-guide-body">
        {!guide ? (
          <p className="ent-notebook-guide-pending">{text.notebookGuidePending}</p>
        ) : (
          <>
            <div className="ent-notebook-guide-points">
              {guide.points.map((point, pointIndex) => (
                <article key={`${point.title}-${pointIndex}`}>
                  <header>
                    <h4>{point.title}</h4>
                    <span className={`ent-guide-status is-${point.status}`}>
                      {editorialStatusLabel[point.status]}
                    </span>
                  </header>
                  <dl>
                    <div>
                      <dt>{text.notebookGuideWhat}</dt>
                      <dd>{point.what}</dd>
                    </div>
                    <div>
                      <dt>{text.notebookGuideWhy}</dt>
                      <dd>{point.why}</dd>
                    </div>
                  </dl>
                  <section>
                    <h5>{text.notebookGuideBestPractices}</h5>
                    <ul>
                      {point.bestPractices.map((practice) => <li key={practice}>{practice}</li>)}
                    </ul>
                  </section>
                  {point.warnings.length ? (
                    <aside className="ent-notebook-guide-warnings" aria-label={`${text.notebookGuideWarnings}: ${point.title}`}>
                      <strong>{text.notebookGuideWarnings}</strong>
                      <ul>
                        {point.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                      </ul>
                    </aside>
                  ) : null}
                </article>
              ))}
            </div>
            {guide.prerequisites.length || guide.expectedEvidence.length || guideReferences.length ? (
              <div className="ent-notebook-guide-support">
                {guide.prerequisites.length ? (
                  <section>
                    <h4>{text.notebookGuidePrereqs}</h4>
                    <ul>{guide.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                ) : null}
                {guide.expectedEvidence.length ? (
                  <section>
                    <h4>{text.notebookGuideExpectedEvidence}</h4>
                    <ul>{guide.expectedEvidence.map((item) => <li key={item}>{item}</li>)}</ul>
                  </section>
                ) : null}
                {guideReferences.length ? (
                  <section className="ent-notebook-guide-reference-section">
                    <h4>{text.notebookGuideOfficialReferences}</h4>
                    <ul className="ent-notebook-guide-references">
                      {guideReferences.map((reference) => (
                        <li key={reference.id}>
                          <a href={reference.href} target="_blank" rel="noreferrer">
                            {reference.title} <span aria-hidden="true">↗</span>
                          </a>
                          <span>{reference.publisher} · {locale === "en" ? "reviewed" : "revisado"} {reference.reviewedAt}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </details>
  );
}

function localizeNotebookPreview(payload: NotebookPreviewPayload, locale: Locale): NotebookPreviewPayload {
  if (locale === "es") return payload;
  return {
    ...payload,
    reviewedAt: localizeReviewDate(payload.reviewedAt, locale) ?? payload.reviewedAt,
    guideCoverage: {
      ...payload.guideCoverage,
      reviewedAt: localizeReviewDate(payload.guideCoverage.reviewedAt, locale),
      references: payload.guideCoverage.references.map((reference, index) => ({
        ...reference,
        title: reference.publisher === "Databricks" ? `Databricks reference ${index + 1}` : reference.title,
        reviewedAt: localizeReviewDate(reference.reviewedAt, locale) ?? reference.reviewedAt,
      })),
    },
    cells: payload.cells.map((cell) => {
      if (!cell.guide) return cell;
      return {
        ...cell,
        guide: {
          prerequisites: ["Read the resource objective and confirm the runtime, catalog, schema, and permissions before running cells."],
          expectedEvidence: ["A short note, output, metric, or screenshot proving what the cell changed or demonstrated."],
          points: cell.guide.points.map((point, pointIndex) => ({
            ...point,
            title: `Cell guidance ${pointIndex + 1}`,
            what: "Identify the intent of this cell before executing or adapting it.",
            why: "The notebook should be read as a reproducible learning artifact, not copied into production without context.",
            bestPractices: [
              "Keep the catalog, schema, credentials, and runtime explicit.",
              "Capture evidence after each meaningful read, write, configuration, or validation step.",
            ],
            warnings: point.warnings.length
              ? ["Do not reuse demo credentials, delete state, or run cleanup outside the isolated practice scope."]
              : [],
          })),
        },
      };
    }),
  };
}

async function mutationResponse(response: Response, locale: Locale) {
  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
  };
  if (!response.ok)
    throw new Error(body.message || (locale === "en" ? "Could not save progress." : "No se pudo guardar el progreso."));
  return body;
}

type CourseNavigationItem = { slug: string; short: string; number: string };

export default function CourseWorkspace({
  module,
  personalized = true,
  navigation,
  initialLessonId,
  singleLessonMode = false,
  locale = "es",
}: {
  module: PublicModule;
  personalized?: boolean;
  navigation?: { previous: CourseNavigationItem | null; next: CourseNavigationItem | null };
  initialLessonId?: string;
  singleLessonMode?: boolean;
  locale?: Locale;
}) {
  const state = useDashboard(personalized);
  const text = courseWorkspaceText[locale] ?? courseWorkspaceText.es;
  const labels = sectionLabel[locale] ?? sectionLabel.es;
  const [section, setSection] = useState<CourseSection>("lessons");
  const [recall, setRecall] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [labChecks, setLabChecks] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState(module.communityResources[0]?.id ?? "");
  const [notebookPreview, setNotebookPreview] = useState<NotebookPreviewPayload | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const previewRequestRef = useRef<AbortController | null>(null);
  const viewerRef = useRef<HTMLDialogElement | null>(null);
  const viewerCloseRef = useRef<HTMLButtonElement | null>(null);
  const viewerOpenerRef = useRef<HTMLElement | null>(null);
  const courseReady = personalized ? Boolean(!state.loading && state.dashboard) : true;
  const readOnly = !personalized;

  const resourceCoverageLabel: Record<CommunityResourceRecommendationPublic["coverage"], string> = {
    direct: locale === "en" ? "Direct coverage" : "Cobertura directa",
    partial: locale === "en" ? "Partial coverage" : "Cobertura parcial",
    equivalent: locale === "en" ? "Equivalent resource" : "Recurso equivalente",
  };

  const resourceDifficultyLabel: Record<CommunityResourceRecommendationPublic["difficulty"], string> = {
    beginner: locale === "en" ? "Beginner" : "Inicial",
    intermediate: locale === "en" ? "Intermediate" : "Intermedio",
    advanced: locale === "en" ? "Advanced" : "Avanzado",
  };

  const previewUnavailableLabel: Record<Exclude<CommunityResourceRecommendationPublic["previewUnavailableReason"], null>, string> = {
    license_unverified: locale === "en" ? "External view · unverified license" : "Vista externa · licencia no verificada",
    restricted_license: locale === "en" ? "External view · restricted license" : "Vista externa · licencia restringida",
    no_compatible_file: locale === "en" ? "External view · no compatible file" : "Vista externa · archivo no compatible",
  };

  const progress = state.dashboard?.progress.find(
    (item) => item.moduleId === module.id,
  );
  const unlocked = readOnly ? true : progress?.unlocked ?? false;
  const preview = personalized && state.dashboard ? !unlocked : false;
  const completedLessons = new Set(progress?.completedLessonIds ?? []);
  const moduleIndex =
    state.dashboard?.modules.findIndex((item) => item.id === module.id) ?? -1;
  const previous =
    moduleIndex > 0 ? state.dashboard?.modules[moduleIndex - 1] : navigation?.previous ?? null;
  const next =
    moduleIndex >= 0 ? state.dashboard?.modules[moduleIndex + 1] : navigation?.next ?? null;
  const selectedResource = module.communityResources.find((item) => item.id === selectedResourceId) ?? module.communityResources[0] ?? null;

  const loadNotebookPreview = useCallback(async (resource: CommunityResourceRecommendationPublic) => {
    if (!resource.previewAvailable) return;
    const controller = new AbortController();
    previewRequestRef.current = controller;
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const response = await fetch(`/api/resources/${encodeURIComponent(resource.id)}/preview`, {
        headers: { accept: "application/json" },
        signal: controller.signal,
      });
      const body = await response.json().catch(() => ({})) as NotebookPreviewPayload & { message?: string };
      if (!response.ok) throw new Error(body.message || (locale === "en" ? "Could not load preview." : "No se pudo cargar la vista previa."));
      if (
        body.resourceId !== resource.id ||
        body.upstreamRef !== resource.upstreamRef ||
        body.path !== resource.sourcePath
      ) {
        throw new Error(locale === "en" ? "Received preview does not match requested resource." : "La vista previa recibida no corresponde al recurso solicitado.");
      }
      setNotebookPreview(localizeNotebookPreview(body, locale));
    } catch (caught) {
      if (controller.signal.aborted) return;
      setNotebookPreview(null);
      setPreviewError(locale === "en" ? "Could not load preview." : caught instanceof Error ? caught.message : "No se pudo cargar la vista previa.");
    } finally {
      if (previewRequestRef.current === controller) {
        previewRequestRef.current = null;
        setPreviewLoading(false);
      }
    }
  }, [locale]);

  useEffect(() => {
    if (!courseReady) return;
    const frame = requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const requestedSection = params.get("section") ?? params.get("view");
      if (
        requestedSection === "lessons" ||
        requestedSection === "lab" ||
        requestedSection === "quiz" ||
        requestedSection === "resources"
      ) {
        setSection(requestedSection);
      }
      const requestedResource = params.get("resource");
      const requestedCommunityResource = module.communityResources.find((item) => item.id === requestedResource);
      if (requestedCommunityResource) {
        setSection("resources");
        setSelectedResourceId(requestedCommunityResource.id);
        setViewerOpen(true);
        void loadNotebookPreview(requestedCommunityResource);
      }
      const lesson = params.get("lesson") ?? initialLessonId ?? null;
      const requestedConcept = params.get("concept") ?? (window.location.hash.startsWith("#concept-") ? window.location.hash.slice(1) : null);
      if (lesson && module.lessons.some((item) => item.id === lesson)) {
        setSection("lessons");
        requestAnimationFrame(() => {
          const target = document.getElementById(
            `lesson-${lesson}`,
          ) as HTMLDetailsElement | null;
          if (target) {
            target.open = true;
            requestAnimationFrame(() => {
              const conceptTarget = requestedConcept ? document.getElementById(requestedConcept) : null;
              const focusTarget = conceptTarget ?? target.querySelector<HTMLElement>("summary");
              focusTarget?.scrollIntoView({ block: "center" });
              focusTarget?.focus();
            });
          }
        });
      } else if (requestedSection !== "resources" && !requestedResource) {
        requestAnimationFrame(() => {
          const lastLessonId = window.localStorage.getItem(`lakehouse-last-lesson:${module.id}`);
          const firstLesson = document.getElementById(
            `lesson-${module.lessons.some((item) => item.id === lastLessonId) ? lastLessonId : module.lessons[0]?.id}`,
          ) as HTMLDetailsElement | null;
          if (firstLesson) firstLesson.open = true;
        });
      }
      const saved: Record<string, string> = {};
      for (const item of module.lessons)
        saved[item.id] =
          window.localStorage.getItem(`lakehouse-private-draft:${item.id}`) ?? "";
      setRecall(saved);
    });
    return () => cancelAnimationFrame(frame);
  }, [courseReady, initialLessonId, loadNotebookPreview, module.communityResources, module.id, module.lessons]);

  useEffect(() => () => previewRequestRef.current?.abort(), []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (viewerOpen && !viewer.open) {
      viewer.showModal();
      requestAnimationFrame(() => viewerCloseRef.current?.focus());
    } else if (!viewerOpen && viewer.open) {
      viewer.close();
    }
  }, [viewerOpen]);

  function changeSection(nextSection: CourseSection, focus = true) {
    setSection(nextSection);
    history.replaceState(
      {},
      "",
      `${window.location.pathname}?section=${nextSection}`,
    );
    if (focus)
      requestAnimationFrame(() =>
        document.getElementById(`course-panel-${nextSection}`)?.focus(),
      );
  }

  function openLesson(lessonId: string) {
    if (singleLessonMode) {
      window.location.assign(`/curso/${module.slug}/${lessonId}`);
      return;
    }
    setSection("lessons");
    const params = new URLSearchParams(window.location.search);
    params.set("lesson", lessonId);
    params.delete("section");
    history.replaceState({}, "", `${window.location.pathname}?${params}`);
    window.localStorage.setItem(`lakehouse-last-lesson:${module.id}`, lessonId);
    requestAnimationFrame(() => {
      const target = document.getElementById(`lesson-${lessonId}`) as HTMLDetailsElement | null;
      if (!target) return;
      target.open = true;
      target.scrollIntoView({ block: "start", behavior: "smooth" });
      requestAnimationFrame(() => target.querySelector<HTMLElement>("summary")?.focus());
    });
  }

  function tabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (
      !(["ArrowLeft", "ArrowRight", "Home", "End"] as string[]).includes(
        event.key,
      )
    )
      return;
    event.preventDefault();
    const target =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? COURSE_SECTIONS.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + COURSE_SECTIONS.length) % COURSE_SECTIONS.length;
    tabRefs.current[target]?.focus();
    changeSection(COURSE_SECTIONS[target], false);
  }

  function selectResource(resourceId: string) {
    previewRequestRef.current?.abort();
    previewRequestRef.current = null;
    setSelectedResourceId(resourceId);
    setNotebookPreview(null);
    setPreviewLoading(false);
    setPreviewError("");
    const params = new URLSearchParams({ section: "resources", resource: resourceId });
    history.replaceState({}, "", `${window.location.pathname}?${params}`);
  }

  function closeNotebookViewer() {
    previewRequestRef.current?.abort();
    previewRequestRef.current = null;
    setPreviewLoading(false);
    const params = new URLSearchParams(window.location.search);
    params.set("section", "resources");
    params.delete("resource");
    history.replaceState({}, "", `${window.location.pathname}?${params}`);
    setViewerOpen(false);
  }

  function openNotebookViewer(resource: CommunityResourceRecommendationPublic, opener?: HTMLElement) {
    if (opener) viewerOpenerRef.current = opener;
    selectResource(resource.id);
    setViewerOpen(true);
    void loadNotebookPreview(resource);
  }

  async function lessonMutation(
    lessonId: string,
    action: "complete" | "review",
    rating?: "again" | "good",
  ) {
    if (!state.dashboard || preview || readOnly) return;
    state.setSaveState("saving");
    setMessage("");
    try {
      const response = await fetch(
        `/api/lessons/${module.id}/${lessonId}/review`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action,
            rating,
            clientMutationId: crypto.randomUUID(),
            expectedRevision: state.dashboard.revision.value,
          }),
        },
      );
      await mutationResponse(response, locale);
      if (action === "complete")
        window.localStorage.removeItem(`lakehouse-private-draft:${lessonId}`);
      setMessage(
        action === "complete"
          ? (locale === "en" ? "Lesson completed and review scheduled." : "Lección completada y repaso programado.")
          : (locale === "en" ? "Review updated." : "Repaso actualizado."),
      );
      state.setSaveState("saved");
      await state.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : (locale === "en" ? "Could not save." : "No se pudo guardar."),
      );
      state.setSaveState(navigator.onLine ? "error" : "offline");
    }
  }

  async function attestLab() {
    if (
      !state.dashboard ||
      preview ||
      readOnly ||
      labChecks.length !== module.lab.checks.length
    )
      return;
    state.setSaveState("saving");
    setMessage("");
    try {
      const response = await fetch(`/api/labs/${module.id}/attest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          checkIds: labChecks,
          attested: true,
          clientMutationId: crypto.randomUUID(),
          expectedRevision: state.dashboard.revision.value,
        }),
      });
      await mutationResponse(response, locale);
      setMessage(locale === "en" ? "Lab self-attested and saved." : "Laboratorio autoatestiguado y guardado.");
      state.setSaveState("saved");
      await state.refresh();
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : (locale === "en" ? "Could not save." : "No se pudo guardar."),
      );
      state.setSaveState(navigator.onLine ? "error" : "offline");
    }
  }

  function exportLabEvidence() {
    if (labChecks.length !== module.lab.checks.length) return;
    const payload = {
      schemaVersion: "lakehouse-lab-evidence-v1",
      generatedAt: new Date().toISOString(),
      source: `${window.location.origin}/curso/${module.slug}?section=lab`,
      module: { id: module.id, number: module.number, title: module.title },
      lab: {
        id: module.lab.id,
        title: module.lab.title,
        environment: module.lab.environment,
        expectedOutcome: module.lab.expectedOutcome,
        confirmedChecks: module.lab.checks.filter((check) => labChecks.includes(check.id)),
      },
      verification: {
        method: "learner-self-attestation",
        executedByLakehouseLab: false,
        note: locale === "en" ? "This manifest describes self-attested evidence and contains no credentials or workspace access." : "Este manifiesto describe evidencia declarada por el alumno y no contiene credenciales ni acceso al workspace.",
      },
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `lakehouse-lab-${module.id}-evidence.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setMessage(locale === "en" ? "Evidence package exported." : "Paquete de evidencia exportado.");
  }

  const unitPercent = Math.round(
    ((completedLessons.size +
      Number(progress?.labAttested) +
      Number(
        progress?.quizBestPercent !== null &&
          progress?.quizBestPercent !== undefined,
      )) /
      7) *
      100,
  );
  const allLessonsDone = completedLessons.size === module.lessons.length;
  const currentCoursePath = singleLessonMode && initialLessonId ? `/curso/${module.slug}/${initialLessonId}` : `/curso/${module.slug}`;
  const visibleLessons = singleLessonMode && initialLessonId
    ? module.lessons
        .map((lesson, index) => ({ lesson, index }))
        .filter((item) => item.lesson.id === initialLessonId)
    : module.lessons.map((lesson, index) => ({ lesson, index }));
  const focusedLesson = visibleLessons[0] ?? null;
  const focusedLessonMinutes = Math.max(12, Math.round((module.minutes * 0.5) / module.lessons.length));

  if (personalized && state.loading)
    return (
      <div className="ent-state-card" role="status">
        <span className="ent-spinner" />
        <div>
          <strong>{locale === "en" ? "Loading module" : "Cargando el módulo"}</strong>
          <p>{locale === "en" ? "Retrieving your progress." : "Recuperando tu progreso."}</p>
        </div>
      </div>
    );
  if (personalized && !state.dashboard)
    return (
      <div className="ent-state-card is-error" role="alert">
        <div>
          <strong>{locale === "en" ? "Could not open module" : "No se pudo abrir el curso"}</strong>
          <p>{state.error}</p>
        </div>
        <button className="ent-secondary-action" onClick={state.refresh}>
          {locale === "en" ? "Retry" : "Reintentar"}
        </button>
      </div>
    );

  return (
    <div className="ent-course-workspace">
      <article className="ent-course-reader">
        <nav className="ent-breadcrumbs" aria-label={locale === "en" ? "Breadcrumbs" : "Migas de pan"}>
          <a href="/ruta">{text.breadcrumbs.route}</a>
          <a href="/catalogo">{text.breadcrumbs.catalog}</a>
          <a href={`/curso/${module.slug}`}>{text.breadcrumbs.module(module.number)}</a>
          {singleLessonMode && initialLessonId ? <span>{text.breadcrumbs.lesson(module.lessons.findIndex((lesson) => lesson.id === initialLessonId) + 1)}</span> : null}
        </nav>
        {readOnly ? (
          <div className="ent-preview-notice is-public" role="note">
            {/* Solo crearemos un perfil anónimo */}
            <div><b>{text.openContentTitle}</b><p>{text.openContentBody}</p></div>
            <div className="ent-inline-actions"><a className="ent-secondary-action" href="/privacidad">{text.privacyLink}</a><a className={singleLessonMode ? "ent-secondary-action" : "ent-primary-action"} href={`/entrar?return_to=${encodeURIComponent(currentCoursePath)}`}>{text.saveProgressBtn}</a></div>
          </div>
        ) : null}
        {preview ? (
          <div className="ent-preview-notice" role="note">
            <b>{locale === "en" ? "Preview" : "Vista previa"}</b>
            <p>
              {text.previewNotice(module.prerequisites.join(", ") || (locale === "en" ? "previous prerequisites" : "los prerrequisitos anteriores"))}
            </p>
          </div>
        ) : null}
        {singleLessonMode && focusedLesson ? (
          <header className="ent-lesson-focus-header">
            <p className="ent-kicker">{locale === "en" ? `Lesson ${focusedLesson.index + 1} of ${module.lessons.length}` : `Lección ${focusedLesson.index + 1} de ${module.lessons.length}`}</p>
            <h2>{focusedLesson.lesson.title}</h2>
            <p>{focusedLesson.lesson.summary}</p>
            <dl>
              <div><dt>{locale === "en" ? "Duration" : "Duración"}</dt><dd>{text.lessonBrief.duration(focusedLessonMinutes)}</dd></div>
              <div><dt>{text.lessonBrief.objective}</dt><dd>{focusedLesson.lesson.summary}</dd></div>
              <div><dt>{locale === "en" ? "Next step" : "Siguiente paso"}</dt><dd>{focusedLesson.index < module.lessons.length - 1 ? (locale === "en" ? "Continue to next lesson" : "Continuar con la siguiente lección") : (locale === "en" ? "Continue to lab" : "Continuar con el laboratorio")}</dd></div>
            </dl>
          </header>
        ) : (
          <>
            <header className={`ent-course-header ent-artwork-${module.artwork.tone}`}>
              <div>
                <h2>{module.title}</h2>
                <p>{module.description}</p>
              </div>
              {personalized ? <SaveState value={state.saveState} onRetry={state.refresh} /> : <span className="ent-open-source-label">{locale === "en" ? "Public reading" : "Lectura pública"}</span>}
            </header>
            <div className="ent-course-outcomes">
              <span>{text.outcomesTitle}</span>
              <ul>
                {module.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </div>
          </>
        )}
        {singleLessonMode ? (
          <details className="ent-module-context">
            <summary>{text.showModuleDetails}</summary>
            <div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <div className="ent-course-outcomes">
                <span>{text.outcomesTitle}</span>
                <ul>
                  {module.outcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        ) : null}
        <details className="ent-editorial-meta">
          <summary>{text.showSourcesAndReview}</summary>
          <div>
            <h3>{/* Metadatos editoriales */}{text.editorialMetaTitle}</h3>
            <dl>
              <div><dt>{text.lastReview}</dt><dd>{module.sources[0]?.reviewedAt ?? "2026-07-22"}</dd></div>
              <div><dt>{text.level}</dt><dd>{module.level}</dd></div>
              <div><dt>{text.relatedPath}</dt><dd>{module.track}</dd></div>
              <div><dt>{text.blueprintDomains}</dt><dd>{module.examDomains.join(" · ")}</dd></div>
              <div><dt>{text.status}</dt><dd>{text.statusValue}</dd></div>
              <div><dt>{text.mainSources}</dt><dd>{module.sources.slice(0, 2).map((source) => source.label).join(" · ")}</dd></div>
            </dl>
            <a href={`https://github.com/jjnv/lakehouse-lab/issues/new?labels=contenido&title=${encodeURIComponent(`Editorial correction: ${module.title}`)}`} rel="noreferrer">{text.reportError}</a>
          </div>
        </details>
        {!singleLessonMode || section !== "lessons" ? <div
          className="ent-course-tabs"
          role="tablist"
          aria-label={locale === "en" ? "Module activities" : "Actividades del módulo"}
        >
          {COURSE_SECTIONS.map(
            (item, index) => (
              <button
                id={`course-tab-${item}`}
                key={item}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                aria-selected={section === item}
                aria-controls={`course-panel-${item}`}
                tabIndex={section === item ? 0 : -1}
                onKeyDown={(event) => tabKey(event, index)}
                onClick={() => changeSection(item)}
              >
                {labels[item]}
                <span>
                  {item === "lessons"
                    ? `${completedLessons.size}/5`
                    : item === "lab"
                      ? progress?.labAttested
                        ? "✓"
                        : "1"
                      : item === "quiz"
                        ? progress?.quizBestPercent == null
                          ? "4"
                          : `${progress.quizBestPercent}%`
                        : module.communityResources.length}
                </span>
              </button>
            ),
          )}
        </div> : null}

        {section === "lessons" ? (
          <section
            id="course-panel-lessons"
            role="tabpanel"
            tabIndex={-1}
            aria-labelledby={!singleLessonMode || section !== "lessons" ? "course-tab-lessons" : undefined}
            aria-label={singleLessonMode ? (locale === "en" ? "Lesson content" : "Contenido de la lección") : undefined}
            className="ent-lessons-panel"
          >
            {visibleLessons.map(({ lesson, index }) => (
              <details
                id={`lesson-${lesson.id}`}
                className={`ent-lesson ${completedLessons.has(lesson.id) ? "is-complete" : ""} ${singleLessonMode ? "is-single" : ""}`}
                key={lesson.id}
                open={singleLessonMode ? true : undefined}
                onToggle={(event) => {
                  if (event.currentTarget.open) window.localStorage.setItem(`lakehouse-last-lesson:${module.id}`, lesson.id);
                }}
              >
                <summary>
                  <span>
                    {completedLessons.has(lesson.id)
                      ? "✓"
                      : String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <small>{lesson.kicker}</small>
                    <h3>{lesson.title}</h3>
                    <p>{lesson.summary}</p>
                  </div>
                  <i aria-hidden="true">+</i>
                </summary>
                <div className="ent-lesson-body">
                  {singleLessonMode ? (
                    <details className="ent-lesson-brief">
                      <summary>{text.lessonBrief.showPrereqs}</summary>
                      <dl>
                        <div><dt>{text.lessonBrief.difficulty}</dt><dd>{module.level}</dd></div>
                        <div><dt>{text.lessonBrief.prereqs}</dt><dd>{module.prerequisites.length ? module.prerequisites.join(", ") : text.lessonBrief.none}</dd></div>
                      </dl>
                    </details>
                  ) : null}
                  {lesson.explanation.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <section className="ent-mental-model">
                    <h4>{lesson.deepDive.mentalModel}</h4>
                    <div>
                      {lesson.deepDive.concepts.map((concept) => (
                        <article id={conceptAnchor(lesson.id, concept.term)} key={concept.term} tabIndex={-1}>
                          <strong>{concept.term}</strong>
                          <p>{concept.definition}</p>
                          <small>{concept.whyItMatters}</small>
                        </article>
                      ))}
                    </div>
                  </section>
                  <section className="ent-code-example">
                    <div>
                      <span>{lesson.example.language}</span>
                      <strong>{lesson.example.title}</strong>
                    </div>
                    <pre tabIndex={0}>
                      <code>{lesson.example.code}</code>
                    </pre>
                    <p>{lesson.example.note}</p>
                  </section>
                  <div className="ent-learning-notes">
                    <section>
                      <h4>{locale === "en" ? "Key points" : "Puntos clave"}</h4>
                      <ul>
                        {lesson.keyPoints.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <h4>{locale === "en" ? "Avoid" : "Evita"}</h4>
                      <ul>
                        {lesson.pitfalls.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  </div>
                  <section className="ent-recall-card">
                    <div>
                      <h4>{lesson.checkpoint.question}</h4>
                    </div>
                    <label htmlFor={`recall-${lesson.id}`}>
                      {text.activeRecallAnswerLabel}
                    </label>
                    <textarea
                      id={`recall-${lesson.id}`}
                      placeholder={text.activeRecallPlaceholder}
                      value={recall[lesson.id] ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setRecall((current) => ({
                          ...current,
                          [lesson.id]: value,
                        }));
                        window.localStorage.setItem(
                          `lakehouse-private-draft:${lesson.id}`,
                          value,
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="ent-secondary-action"
                      onClick={() =>
                        setRevealed((current) => ({
                          ...current,
                          [lesson.id]: true,
                        }))
                      }
                    >
                      {text.checkAnswer}
                    </button>
                    {revealed[lesson.id] ? (
                      <div className="ent-recall-answer">
                        <span>{text.suggestedAnswer}</span>
                        <p>{lesson.checkpoint.answer}</p>
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              void lessonMutation(lesson.id, "review", "again")
                            }
                            disabled={preview || readOnly}
                          >
                            {locale === "en" ? "Need review" : "Necesito repasarlo"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void lessonMutation(lesson.id, "review", "good")
                            }
                            disabled={preview || readOnly}
                          >
                            {locale === "en" ? "Remembered well" : "Lo recordé bien"}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </section>
                  <footer>
                    <span>
                      {completedLessons.has(lesson.id)
                        ? (locale === "en" ? "Completed" : "Completada")
                        : (locale === "en" ? "Pending" : "Pendiente")}
                    </span>
                    {readOnly ? <a className="ent-secondary-action" href={`/entrar?return_to=${encodeURIComponent(`/curso/${module.slug}/${lesson.id}`)}`}>{text.saveProgressBtn}</a> : <button
                        type="button"
                        className="ent-primary-action"
                        disabled={preview || completedLessons.has(lesson.id)}
                        onClick={() => void lessonMutation(lesson.id, "complete")}
                      >
                        {completedLessons.has(lesson.id)
                          ? (locale === "en" ? "Lesson completed" : "Lección completada")
                          : text.completeLessonBtn}
                      </button>}
                  </footer>
                  <nav className="ent-lesson-navigation" aria-label={locale === "en" ? `Navigation from ${lesson.title}` : `Navegación desde ${lesson.title}`}>
                    {index > 0 ? <button type="button" className="ent-secondary-action" onClick={() => openLesson(module.lessons[index - 1].id)}>← {module.lessons[index - 1].title}</button> : <span />}
                    {index < module.lessons.length - 1 ? <button type="button" className="ent-secondary-action" onClick={() => openLesson(module.lessons[index + 1].id)}>{module.lessons[index + 1].title} →</button> : <button type="button" className="ent-primary-action" onClick={() => changeSection("lab")}>{text.passToLabBtn} →</button>}
                  </nav>
                </div>
              </details>
            ))}
          </section>
        ) : null}

        {section === "lab" ? (
          <section
            id="course-panel-lab"
            role="tabpanel"
            tabIndex={-1}
            aria-labelledby="course-tab-lab"
            className="ent-lab-panel"
          >
            <div className="ent-lab-brief">
              <p className="ent-kicker">{locale === "en" ? "Guided practice · self-attested" : "Práctica guiada · autoatestiguada"}</p>
              <h2>{module.lab.title}</h2>
              <p>{module.lab.scenario}</p>
            </div>
            <div className="ent-lab-spec">
              <article>
                <span>{text.labGoal}</span>
                <p>{module.lab.goal}</p>
              </article>
              <article>
                <span>{locale === "en" ? "Environment" : "Entorno"}</span>
                <p>{module.lab.environment}</p>
              </article>
              <article>
                <span>{locale === "en" ? "Expected outcome" : "Resultado esperado"}</span>
                <p>{module.lab.expectedOutcome}</p>
              </article>
            </div>
            <ol className="ent-lab-steps">
              {module.lab.steps.map((step, index) => (
                <li key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
            <section className="ent-code-example">
              <div>
                <span>Starter code</span>
                <strong>{module.lab.dataset.name}</strong>
              </div>
              <pre tabIndex={0}>
                <code>{module.lab.starterCode}</code>
              </pre>
            </section>
            <details className="ent-solution">
              <summary>{locale === "en" ? "View sample solution" : "Ver solución orientativa"}</summary>
              <p>{locale === "en" ? "Before comparing, try to complete the lab and keep track of errors that helped you diagnose." : "Antes de comparar, intenta completar el laboratorio y conserva los errores que te ayudaron a diagnosticarlo."}</p>
              <pre tabIndex={0}>
                <code>{module.lab.solution}</code>
              </pre>
            </details>
            <fieldset className="ent-attestation">
              <legend>{locale === "en" ? "Confirm obtained evidence" : "Confirma la evidencia obtenida"}</legend>
              <p>
                {locale === "en" ? "The platform does not execute code on your workspace. Declare only what you have verified." : "La academia no ejecuta ni verifica tu workspace. Declara únicamente lo que hayas comprobado."}
              </p>
              {module.lab.checks.map((check) => (
                <label key={check.id}>
                  <input
                    type="checkbox"
                    checked={labChecks.includes(check.id)}
                    disabled={preview || progress?.labAttested}
                    onChange={(event) =>
                      setLabChecks((current) =>
                        event.target.checked
                          ? [...current, check.id]
                          : current.filter((id) => id !== check.id),
                      )
                    }
                  />
                  {check.label}
                </label>
              ))}
              <button
                type="button"
                className="ent-primary-action"
                disabled={
                  preview ||
                  readOnly ||
                  progress?.labAttested ||
                  labChecks.length !== module.lab.checks.length
                }
                onClick={() => void attestLab()}
              >
                {readOnly ? (locale === "en" ? "Create workspace to save" : "Crea un espacio para guardar") : progress?.labAttested
                  ? (locale === "en" ? "Lab self-attested" : "Laboratorio autoatestiguado")
                  : (locale === "en" ? "Confirm lab" : "Confirmar laboratorio")}
              </button>
              <button type="button" className="ent-secondary-action" disabled={labChecks.length !== module.lab.checks.length} onClick={exportLabEvidence}>{text.exportEvidenceBtn}</button>
            </fieldset>
          </section>
        ) : null}

        {section === "quiz" ? (
          <section
            id="course-panel-quiz"
            role="tabpanel"
            tabIndex={-1}
            aria-labelledby="course-tab-quiz"
            className="ent-quiz-panel"
          >
            {personalized && state.dashboard ? <AssessmentPanel
              kind="module-quiz"
              moduleId={module.id}
              title={`${locale === "en" ? "Quiz" : "Evaluación"} · ${module.short}`}
              bestScore={progress?.quizBestPercent ?? null}
              revision={state.dashboard.revision.value}
              disabled={preview || !allLessonsDone || !progress?.labAttested}
              onState={state.setSaveState}
              onCompleted={state.refresh}
              locale={locale}
            /> : <div className="ent-assessment-start"><div><p className="ent-kicker">{locale === "en" ? "Protected assessment" : "Evaluación protegida"}</p><h2>{locale === "en" ? "Check your knowledge" : "Comprueba lo aprendido"}</h2><p>{locale === "en" ? "Correct answers remain on the server. Create a private workspace to start an attempt and save your score." : "Las respuestas correctas permanecen en el servidor. Crea un espacio privado para iniciar un intento y conservar el resultado."}</p></div><a className="ent-primary-action" href={`/entrar?return_to=${encodeURIComponent(`/curso/${module.slug}?section=quiz`)}`}>{locale === "en" ? "Create workspace and start" : "Crear espacio e iniciar"}</a></div>}
          </section>
        ) : null}

        {section === "resources" ? (
          <section
            id="course-panel-resources"
            role="tabpanel"
            tabIndex={-1}
            aria-labelledby="course-tab-resources"
            className="ent-community-panel"
          >
            <header className="ent-community-intro">
              <div>
                <p className="ent-kicker">{locale === "en" ? "Complementary practice · external sources" : "Práctica complementaria · fuentes externas"}</p>
                <h2>{text.resourcesTitle}</h2>
                <p>{/* Consultarlas no modifica el progreso */}{locale === "en" ? "These recommendations extend the lab. Browsing them does not affect progress or internal quizzes." : "Estas recomendaciones amplían el laboratorio propio. Consultarlas no modifica el progreso ni la evaluación interna."}</p>
              </div>
              <a href="/catalogo?view=resources">{locale === "en" ? "Explore resources →" : "Explorar recursos →"}</a>
            </header>

            <div className="ent-community-list">
              {module.communityResources.map((resource) => (
                <article
                  id={`community-resource-${resource.id}`}
                  key={resource.id}
                  tabIndex={-1}
                  className={`ent-community-card ${selectedResourceId === resource.id ? "is-selected" : ""}`}
                >
                  <div className="ent-community-card-heading">
                    <div>
                      <span>{resource.preferred ? (locale === "en" ? "Recommended" : "Recomendado") : (locale === "en" ? `Option ${resource.rank}` : `Opción ${resource.rank}`)}</span>
                      <small>{resourceCoverageLabel[resource.coverage]}</small>
                    </div>
                    <span>{resource.provenance === "official" ? (locale === "en" ? "Official source" : "Fuente oficial") : (locale === "en" ? "Community" : "Comunidad")}</span>
                  </div>
                  <h3>{resource.title}</h3>
                  <p>{resource.rationale}</p>
                  <div className="ent-community-facts">
                    <span>{resourceDifficultyLabel[resource.difficulty]}</span>
                    <span>{resource.format}</span>
                    <span>{resource.languages.join(" · ")}</span>
                    <span className={resource.licenseStatus === "unknown" ? "is-warning" : ""}>{resource.licenseEvidenceHref ? <a href={resource.licenseEvidenceHref} target="_blank" rel="noreferrer">{resource.license}</a> : resource.licenseStatus === "unknown" ? (locale === "en" ? "Unverified license" : "Licencia no verificada") : resource.license}</span>
                  </div>
                  <div className="ent-community-concepts">{resource.concepts.map((concept) => <span key={concept}>{concept}</span>)}</div>
                  <dl className="ent-community-metadata">
                    <div><dt>{locale === "en" ? "Compatibility" : "Compatibilidad"}</dt><dd>{resource.runtimeNotes}</dd></div>
                    <div><dt>{locale === "en" ? "Repository" : "Repositorio"}</dt><dd><a href={resource.repositoryUrl} target="_blank" rel="noreferrer">{resource.repositoryName}</a> · {resource.author}</dd></div>
                    <div><dt>{locale === "en" ? "Editorial review" : "Revisión editorial"}</dt><dd>{resource.reviewedAt} · commit {resource.upstreamRef?.slice(0, 7)} · <span className="ent-reviewed-path">{resource.sourcePath}</span></dd></div>
                  </dl>
                  <details className="ent-community-steps">
                    <summary>{locale === "en" ? "How to use" : "Cómo usarlo"}</summary>
                    <ol>{resource.usageInstructions.map((step) => <li key={step}>{step}</li>)}</ol>
                  </details>
                  <footer>
                    {!resource.previewAvailable ? <span className="ent-preview-unavailable">{resource.previewUnavailableReason ? previewUnavailableLabel[resource.previewUnavailableReason] : (locale === "en" ? "External view" : "Vista externa")}</span> : null}
                    <button type="button" className="ent-primary-action" aria-expanded={viewerOpen && selectedResourceId === resource.id} aria-controls="community-preview" onClick={(event) => openNotebookViewer(resource, event.currentTarget)}>{text.openInternalViewer} <span aria-hidden="true">→</span></button>
                    <a className="ent-secondary-action" href={resource.href} target="_blank" rel="noreferrer">{text.viewGitHubSource} <span aria-hidden="true">↗</span></a>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        <dialog
          ref={viewerRef}
          id="community-preview"
          className="ent-notebook-drawer"
          aria-labelledby="community-preview-title"
          aria-busy={previewLoading}
          onCancel={(event) => {
            event.preventDefault();
            closeNotebookViewer();
          }}
          onClose={() => {
            setViewerOpen(false);
            requestAnimationFrame(() => {
              const fallback = document.getElementById(`community-resource-${selectedResourceId}`)
                ?.querySelector<HTMLElement>('button[aria-controls="community-preview"]')
                ?? document.getElementById("course-panel-resources");
              (viewerOpenerRef.current ?? fallback)?.focus();
              viewerOpenerRef.current = null;
            });
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeNotebookViewer();
          }}
        >
          {selectedResource ? (
            <>
              <header>
                <div>
                  <p className="ent-kicker">{selectedResource.previewAvailable ? (locale === "en" ? "Reading view · no execution" : "Vista de lectura · sin ejecución") : (locale === "en" ? "Reviewed source · external view" : "Fuente revisada · vista externa")}</p>
                  <h3 id="community-preview-title">{selectedResource.title}</h3>
                  <p>{selectedResource.repositoryName} · commit {selectedResource.upstreamRef?.slice(0, 7)}</p>
                </div>
                <div className="ent-notebook-drawer-actions">
                  <a href={selectedResource.href} target="_blank" rel="noreferrer">{locale === "en" ? "Open source ↗" : "Abrir fuente ↗"}</a>
                  <button ref={viewerCloseRef} type="button" onClick={closeNotebookViewer} aria-label={locale === "en" ? "Close notebook viewer" : "Cerrar visor de notebook"}>×</button>
                </div>
              </header>
              <p className="ent-preview-path">{selectedResource.sourcePath}</p>
              <div className="ent-notebook-drawer-body">
                {previewLoading ? <div className="ent-preview-loading" role="status"><span className="ent-spinner" /><p>{locale === "en" ? "Loading notebook safely…" : "Cargando el notebook de forma segura…"}</p></div> : null}
                {previewError ? <div className="ent-preview-error" role="alert"><strong>{locale === "en" ? "Could not load notebook" : "No se pudo mostrar el notebook"}</strong><p>{previewError} {locale === "en" ? "Reviewed source is still available." : "La fuente revisada sigue disponible."}</p><a className="ent-primary-action" href={selectedResource.href} target="_blank" rel="noreferrer">{locale === "en" ? "Open source ↗" : "Abrir fuente ↗"}</a></div> : null}
                {!previewLoading && !previewError && notebookPreview ? (
                  <>
                    {notebookPreview.guideCoverage.status === "partial" ? (
                      <p className="ent-notebook-guide-coverage" role="status">
                        {locale === "en"
                          ? `Partial editorial coverage: ${notebookPreview.guideCoverage.annotatedCells} of ${notebookPreview.guideCoverage.totalCells} cells have a reviewed guide.`
                          : `Cobertura editorial parcial: ${notebookPreview.guideCoverage.annotatedCells} de ${notebookPreview.guideCoverage.totalCells} celdas tienen una guía revisada.`}
                      </p>
                    ) : null}
                    <div className="ent-notebook-cells">
                      {notebookPreview.cells.map((cell) => {
                        const cellNumber = cell.sourceIndex + 1;
                        return (
                          <Fragment key={cell.id}>
                            {cell.kind === "markdown" ? (
                              <article className="is-markdown"><NotebookMarkdown text={cell.text} locale={locale} /></article>
                            ) : (
                              <article className="is-code">
                                <div><span>{locale === "en" ? `Cell ${cellNumber}` : `Celda ${cellNumber}`}</span><b>{cell.language}</b></div>
                                <pre tabIndex={0}><code>{cell.text}</code></pre>
                                {cell.outputs.length ? <div className="ent-notebook-outputs">{cell.outputs.map((output, outputIndex) => output.kind === "text" ? <pre key={outputIndex}><code>{output.text}</code></pre> : <img key={outputIndex} src={output.dataUrl} alt={locale === "en" ? `Graphic output for cell ${cellNumber}` : `Salida gráfica de la celda ${cellNumber}`} />)}</div> : null}
                              </article>
                            )}
                            <NotebookEditorialGuide
                              cellNumber={cellNumber}
                              guide={cell.guide}
                              references={notebookPreview.guideCoverage.references}
                              locale={locale}
                            />
                          </Fragment>
                        );
                      })}
                    </div>
                    {notebookPreview.truncated ? <p className="ent-preview-note">{locale === "en" ? "View truncated for fast, safe loading. The source file contains additional cells or outputs." : "La vista se ha recortado para mantener una lectura segura y rápida. La fuente contiene más celdas o salidas."}</p> : null}
                  </>
                ) : null}
                {!selectedResource.previewAvailable ? (
                  <section className="ent-notebook-external">
                    <span>{selectedResource.format === "dbc" ? (locale === "en" ? "Importable file" : "Archivo importable") : (locale === "en" ? "Reading on GitHub" : "Lectura en GitHub")}</span>
                    <h4>{locale === "en" ? "This notebook opens from its reviewed source" : "Este notebook se abre desde su fuente revisada"}</h4>
                    <p>{locale === "en" ? "The repository license requires reading on GitHub directly. We keep the sidebar navigation, audited commit, and route details intact." : "El repositorio no permite republicar su contenido dentro de Lakehouse Lab. Conservamos la misma experiencia lateral, la ruta exacta y el commit auditado, y dejamos la lectura en GitHub para respetar la autoría."}</p>
                    <dl>
                      <div><dt>{locale === "en" ? "Author" : "Autor"}</dt><dd>{selectedResource.author}</dd></div>
                      <div><dt>{locale === "en" ? "License" : "Licencia"}</dt><dd>{selectedResource.licenseStatus === "unknown" ? (locale === "en" ? "Unverified" : "No verificada") : selectedResource.license}</dd></div>
                      <div><dt>{locale === "en" ? "Format" : "Formato"}</dt><dd>{selectedResource.format}</dd></div>
                    </dl>
                    <a className="ent-primary-action" href={selectedResource.href} target="_blank" rel="noreferrer">{selectedResource.format === "dbc" ? (locale === "en" ? "Open / download .dbc" : "Abrir / descargar .dbc") : (locale === "en" ? "View notebook on GitHub ↗" : "Ver notebook en GitHub ↗")}</a>
                  </section>
                ) : null}
              </div>
            </>
          ) : null}
        </dialog>
        <p className="ent-course-status" role="status" aria-live="polite">
          {message}
        </p>
        <footer className="ent-course-footer">
          {previous ? (
            <a href={`/curso/${previous.slug}`}>← {previous.short}</a>
          ) : (
            <span />
          )}
          {next ? (
            <a href={`/curso/${next.slug}`}>{next.short} →</a>
          ) : (
            <a href="/expediente">{locale === "en" ? "Open record →" : "Abrir expediente →"}</a>
          )}
        </footer>
      </article>
      <aside className="ent-course-index" aria-label={locale === "en" ? "Module index" : "Índice del módulo"}>
        <div>
          <span>{locale === "en" ? `Module ${module.number}` : `Módulo ${module.number}`}</span>
          <strong>{readOnly ? (locale === "en" ? "OPEN" : "ABIERTO") : `${unitPercent}%`}</strong>
        </div>
        {!readOnly ? <div
          className="ent-progress"
          role="progressbar"
          aria-label={locale === "en" ? "Module progress" : "Progreso del módulo"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={unitPercent}
        >
          <i style={{ width: `${unitPercent}%` }} />
        </div> : null}
        <nav>
          {module.lessons.map((lesson, index) => (
            <a
              key={lesson.id}
              href={`/curso/${module.slug}/${lesson.id}`}
              aria-current={initialLessonId === lesson.id ? "page" : undefined}
            >
              <span>{completedLessons.has(lesson.id) ? "✓" : index + 1}</span>
              {lesson.title}
            </a>
          ))}
          <button type="button" onClick={() => changeSection("lab")}>
            <span>{progress?.labAttested ? "✓" : "L"}</span>{labels.lab}
          </button>
          <button type="button" onClick={() => changeSection("quiz")}>
            <span>{progress?.quizBestPercent != null ? "✓" : "T"}</span>
            {labels.quiz}
          </button>
          <button type="button" onClick={() => changeSection("resources")}>
            <span aria-hidden="true">R</span>{labels.resources}
          </button>
        </nav>
        {previous ? (
          <a href={`/curso/${previous.slug}`}>← {locale === "en" ? "Previous module" : "Módulo anterior"}</a>
        ) : null}
      </aside>
    </div>
  );
}
