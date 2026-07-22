"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import {
  associateBlueprint,
  buildExamQuestions,
  examOriginCounts,
  examPoolSizes,
  examMappings,
  modules,
  professionalBlueprint,
  officialSampleCatalog,
  totalMinutes,
  trackMeta,
  type CurriculumModule,
  type TrackId,
} from "./course-data";
import {
  STORAGE_KEY,
  deriveProgress,
  dueLessonReviews,
  earnedMinutes,
  emptyProgress,
  hasStarted,
  isUnlocked as moduleIsUnlocked,
  moduleProgressPercent,
  scheduleLessonReview,
  sanitizeProgress,
  type ExamMode as StoredExamMode,
  type ModuleView,
  type ProgressState,
  type ReviewRating,
} from "./progress";
import {
  badgeCatalog,
  dailyChallenge,
  deriveBadges,
  grantRewards,
  levelFor,
  localDate,
  weeklyMission,
  type Reward,
} from "./gamification";
import {
  blueprintObjectives,
  coverageFor,
  OFFICIAL_BLUEPRINTS,
  PLATFORM_REFERENCES,
  PUBLISHED_AT,
  REVIEWED_AT,
  SITE_VERSION,
  type CertificationLevel,
} from "./editorial-data";

type ExamMode = StoredExamMode | null;

const trackOrder: TrackId[] = ["core", "streaming", "pipelines", "performance", "delivery", "final"];
const topicGroups = {
  platform: { label: "Plataforma y compute", ids: ["m01", "m02", "m06"] },
  development: { label: "SQL, Python y Spark", ids: ["m03", "m04", "m05", "m23", "m28"] },
  ingestion: { label: "Ingesta, streaming y CDC", ids: ["m08", "m09", "m13", "m14", "m15", "m16"] },
  modeling: { label: "Modelado y calidad", ids: ["m07", "m18", "m19"] },
  orchestration: { label: "Pipelines y orquestación", ids: ["m10", "m20", "m21", "m22"] },
  performance: { label: "Rendimiento, observabilidad y coste", ids: ["m24", "m25", "m26", "m27"] },
  governance: { label: "Entrega, seguridad e interoperabilidad", ids: ["m11", "m29", "m30", "m31"] },
  projects: { label: "Proyectos integradores", ids: ["m12", "m17", "m22", "m27", "m32"] },
} as const;
type TopicFilter = keyof typeof topicGroups | "all";
type StatusFilter = "all" | "available" | "in-progress" | "completed" | "locked";
type LevelFilter = "all" | "associate" | "professional";
type StudyRoute = "exam" | "practice" | "professional";
type WorkspaceView = "learn" | "route" | "resources";

const STUDY_ROUTE_KEY = "lakehouse-lab-study-route";
const studyRoutes: Record<StudyRoute, { label: string; description: string; moduleIds: string[]; focus: string }> = {
  exam: { label: "Ruta examen", description: "Blueprint Associate sin desvíos: fundamentos, decisiones y simulacro.", moduleIds: modules.slice(0, 12).map((module) => module.id), focus: "Teoría + evaluación" },
  practice: { label: "Ruta práctica", description: "Associate completo más los laboratorios Professional esenciales para operar con autonomía.", moduleIds: [...modules.slice(0, 12), ...modules.filter((module) => ["m13","m16","m18","m19","m20","m23","m26","m29","m30","m31"].includes(module.id))].map((module) => module.id), focus: "Examen + práctica esencial" },
  professional: { label: "Ruta profesional", description: "Itinerario completo, cuatro ramas, proyectos y capstone Professional.", moduleIds: modules.map((module) => module.id), focus: "Academia completa" },
};

function formatHours(minutes: number) {
  const roundedMinutes = Math.round(minutes);
  const hours = Math.floor(roundedMinutes / 60);
  const rest = roundedMinutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

const moduleSearchIndices = new Map(modules.map((module) => [module.id, [
  module.title,
  module.short,
  module.description,
  module.lab.goal,
  module.lab.scenario,
  ...module.lab.steps,
  ...module.outcomes,
  ...module.examDomains,
  ...examMappings.filter((mapping) => mapping.moduleIds.includes(module.id)).flatMap((mapping) => [mapping.domain, ...mapping.objectives]),
  ...module.lessons.flatMap((lesson) => [
    lesson.title,
    lesson.summary,
    ...lesson.explanation,
    lesson.deepDive.mentalModel,
    ...lesson.deepDive.mechanics,
    ...lesson.deepDive.concepts.flatMap((concept) => [concept.term, concept.definition, concept.whyItMatters]),
    lesson.deepDive.workedScenario.situation,
    ...lesson.deepDive.workedScenario.reasoning,
    lesson.deepDive.workedScenario.outcome,
    ...lesson.keyPoints,
    ...lesson.pitfalls,
    lesson.examDecision,
    lesson.example.code,
  ]),
].join(" ").toLocaleLowerCase("es")]));

function missingPrerequisiteText(module: CurriculumModule, completed: Set<string>) {
  const missing = module.prerequisites
    .filter((id) => !completed.has(id))
    .map((id) => modules.find((item) => item.id === id))
    .filter((item): item is CurriculumModule => Boolean(item));
  if (!missing.length) return "";
  return missing.map((item) => `${item.number} · ${item.title}`).join("; ");
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function workspaceViewFromHash(hash: string): WorkspaceView {
  if (hash === "#catalog") return "route";
  if (hash === "#resources" || hash === "#editorial" || hash === "#blueprint-matrix") return "resources";
  return "learn";
}

export default function Home() {
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState("m01");
  const [view, setView] = useState<ModuleView>("lessons");
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState<TrackId | "all">("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [studyRoute, setStudyRoute] = useState<StudyRoute>("professional");
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("learn");
  const [pendingLessonId, setPendingLessonId] = useState<string | null>(null);
  const [modulePickerOpen, setModulePickerOpen] = useState(false);
  const [cloud, setCloud] = useState<"AWS" | "Azure" | "GCP">("AWS");
  const [labResult, setLabResult] = useState<{ checks: boolean[]; passed: boolean } | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [submittedQuiz, setSubmittedQuiz] = useState<boolean | null>(null);
  const [retryOnlyMistakes, setRetryOnlyMistakes] = useState(false);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [resetPending, setResetPending] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [examMode, setExamMode] = useState<ExamMode>(null);
  const [examPage, setExamPage] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examAttempt, setExamAttempt] = useState(1);
  const moduleHeadingRef = useRef<HTMLHeadingElement>(null);
  const catalogHeadingRef = useRef<HTMLHeadingElement>(null);
  const resourcesHeadingRef = useRef<HTMLHeadingElement>(null);
  const modulePickerSummaryRef = useRef<HTMLElement>(null);
  const progressRef = useRef<ProgressState>(emptyProgress);
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const resetDialogRef = useRef<HTMLDivElement>(null);

  const completed = useMemo(() => new Set(progress.completedModules), [progress.completedModules]);
  const activeModule = modules.find((module) => module.id === activeId) ?? modules[0];
  const completedMinutes = modules.reduce((sum, module) => sum + earnedMinutes(module, progress), 0);
  const percent = Math.round((completedMinutes / totalMinutes) * 100);
  const level = levelFor(progress.gamification.xp);
  const reviewQueue = useMemo(() => dueLessonReviews(progress, localDate()), [progress]);
  const routeModuleIds = studyRoutes[studyRoute].moduleIds;
  const routeModuleSet = useMemo(() => new Set(routeModuleIds), [routeModuleIds]);

  const isUnlocked = (module: CurriculumModule) => moduleIsUnlocked(module, completed);

  const filteredModules = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("es");
    return modules.filter((module) => {
      const searchIndex = moduleSearchIndices.get(module.id) ?? "";
      const matchesText = !normalized || searchIndex.includes(normalized);
      const matchesTrack = trackFilter === "all" || module.track === trackFilter;
      const matchesLevel = levelFilter === "all" || (levelFilter === "associate" ? module.level.includes("Associate") : module.level.includes("Professional"));
      const matchesTopic = topicFilter === "all" || (topicGroups[topicFilter].ids as readonly string[]).includes(module.id);
      const unlocked = moduleIsUnlocked(module, completed);
      const started = hasStarted(module, progress);
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "completed" && completed.has(module.id)) ||
        (statusFilter === "in-progress" && started && !completed.has(module.id)) ||
        (statusFilter === "available" && unlocked && !started && !completed.has(module.id)) ||
        (statusFilter === "locked" && !unlocked);
      return routeModuleSet.has(module.id) && matchesText && matchesTrack && matchesLevel && matchesTopic && matchesStatus;
    });
  }, [search, trackFilter, levelFilter, topicFilter, statusFilter, completed, progress, routeModuleSet]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let restored: ProgressState = emptyProgress;
      try {
        restored = sanitizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
      } catch {}
      const savedRoute = localStorage.getItem(STUDY_ROUTE_KEY);
      if (savedRoute === "exam" || savedRoute === "practice" || savedRoute === "professional") setStudyRoute(savedRoute);
      setProgress(restored);
      progressRef.current = restored;

      const params = new URLSearchParams(window.location.search);
      const exam = params.get("exam");
      const slug = params.get("module");
      const restoredCompleted = new Set(restored.completedModules);
      const validExam = exam === "associate" || exam === "professional";
      if (validExam) setExamMode(exam);
      else setWorkspaceView(workspaceViewFromHash(window.location.hash));
      if (slug) {
        const deepLinked = modules.find((module) => module.slug === slug);
        if (deepLinked && moduleIsUnlocked(deepLinked, restoredCompleted)) {
          setActiveId(deepLinked.id);
          setPreviewMode(false);
          setView(deepLinked.id === restored.lastModuleId ? restored.lastView : "lessons");
          requestAnimationFrame(() => document.getElementById("academy")?.scrollIntoView({ behavior: scrollBehavior(), block: "start" }));
        } else if (deepLinked) {
          setActiveId(deepLinked.id);
          setPreviewMode(true);
          setView("lessons");
          setLockedNotice(`Vista previa del módulo ${deepLinked.number}. Para registrar progreso necesitas completar antes: ${missingPrerequisiteText(deepLinked, restoredCompleted)}.`);
          requestAnimationFrame(() => document.getElementById("academy")?.scrollIntoView({ behavior: scrollBehavior(), block: "start" }));
        }
      } else if (!validExam) {
        const lastModule = modules.find((module) => module.id === restored.lastModuleId);
        if (lastModule && moduleIsUnlocked(lastModule, restoredCompleted)) {
          setActiveId(lastModule.id);
          setView(restored.lastView);
        }
      }
      setLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    progressRef.current = progress;
    if (loaded) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch {}
    }
  }, [progress, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem(STUDY_ROUTE_KEY, studyRoute);
  }, [studyRoute, loaded]);

  useEffect(() => {
    const onPopState = () => {
      const current = progressRef.current;
      const currentCompleted = new Set(current.completedModules);
      const params = new URLSearchParams(window.location.search);
      const exam = params.get("exam");
      if (exam === "associate" || exam === "professional") {
        setExamMode(exam);
        setExamPage(0);
        setExamAnswers({});
        setExamSubmitted(false);
        setExamAttempt((value) => value + 1);
        setLockedNotice(null);
        setPreviewMode(false);
        return;
      }
      setExamMode(null);
      setWorkspaceView(workspaceViewFromHash(window.location.hash));
      const deepLinked = modules.find((module) => module.slug === params.get("module"));
      if (deepLinked && moduleIsUnlocked(deepLinked, currentCompleted)) {
        setActiveId(deepLinked.id);
        setPreviewMode(false);
        setView(deepLinked.id === current.lastModuleId ? current.lastView : "lessons");
        setSubmittedQuiz(null);
        setRetryOnlyMistakes(false);
        setLabResult(null);
        setShowSolution(false);
        setLockedNotice(null);
      } else if (deepLinked) {
        setActiveId(deepLinked.id);
        setPreviewMode(true);
        setView("lessons");
        setSubmittedQuiz(null);
        setRetryOnlyMistakes(false);
        setLabResult(null);
        setShowSolution(false);
        setLockedNotice(`Vista previa del módulo ${deepLinked.number}. Para registrar progreso necesitas completar antes: ${missingPrerequisiteText(deepLinked, currentCompleted)}.`);
      }
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onPopState);
    };
  }, []);

  useEffect(() => {
    if (workspaceView !== "learn" || view !== "lessons" || !pendingLessonId) return;
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => {
      const lesson = document.getElementById(`lesson-${activeId}-${pendingLessonId}`) as HTMLDetailsElement | null;
      if (!lesson) return;
      lesson.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
      lesson.querySelector<HTMLElement>("summary")?.focus({ preventScroll: true });
      setPendingLessonId(null);
    }));
    return () => cancelAnimationFrame(frame);
  }, [activeId, pendingLessonId, view, workspaceView]);

  function updateProgress(
    updater: (current: ProgressState) => ProgressState,
    activityRewards: Reward[] | ((before: ProgressState, after: ProgressState) => Reward[]) = [],
  ) {
    setProgress((current) => {
      const derived = deriveProgress(updater(current));
      const rewards = [...(typeof activityRewards === "function" ? activityRewards(current, derived) : activityRewards)];
      const newlyCompleted = derived.completedModules.filter((id) => !current.completedModules.includes(id));
      for (const id of newlyCompleted) {
        rewards.push({ id: `module:${id}`, xp: 100 });
        if (id === "m12" || id === "m32") rewards.push({ id: `capstone:${id}`, xp: 250 });
      }
      const granted = grantRewards(derived.gamification, rewards);
      if (granted.awardedXp > 0) {
        setCelebration(`+${granted.awardedXp} XP`);
        window.setTimeout(() => setCelebration(null), 2200);
      }
      return { ...derived, gamification: deriveBadges(granted.state, derived.completedModules) };
    });
  }

  function navigateWorkspace(nextView: WorkspaceView, push = true) {
    setWorkspaceView(nextView);
    if (nextView !== "learn") setModulePickerOpen(false);
    const url = new URL(window.location.href);
    url.hash = nextView === "route" ? "catalog" : nextView === "resources" ? "resources" : "academy";
    if (push) history.pushState({}, "", url);
    setAnnouncement(nextView === "route" ? "Ruta de estudio abierta." : nextView === "resources" ? "Recursos de estudio abiertos." : "Área de aprendizaje abierta.");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: scrollBehavior() });
      const target = nextView === "route" ? catalogHeadingRef.current : nextView === "resources" ? resourcesHeadingRef.current : moduleHeadingRef.current;
      target?.focus({ preventScroll: true });
    }));
  }

  function openModulePicker() {
    if (modulePickerOpen) {
      setModulePickerOpen(false);
      setAnnouncement("Selector de módulos cerrado.");
      return;
    }
    setWorkspaceView("learn");
    setModulePickerOpen(true);
    const url = new URL(window.location.href);
    url.hash = "academy";
    history.pushState({}, "", url);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById("academy")?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
      modulePickerSummaryRef.current?.focus({ preventScroll: true });
    }));
  }

  function openModule(module: CurriculumModule, requestedView: ModuleView = "lessons", requestedLessonId: string | null = null) {
    const preview = !isUnlocked(module);
    setWorkspaceView("learn");
    setModulePickerOpen(false);
    setActiveId(module.id);
    setPreviewMode(preview);
    setView(requestedView);
    setPendingLessonId(requestedLessonId);
    setSubmittedQuiz(null);
    setRetryOnlyMistakes(false);
    setLabResult(null);
    setShowSolution(false);
    setExamMode(null);
    setLockedNotice(preview ? `Vista previa del módulo ${module.number}. Para registrar progreso necesitas completar antes: ${missingPrerequisiteText(module, completed)}.` : null);
    if (!preview) updateProgress((current) => ({ ...current, lastModuleId: module.id, lastView: requestedView }));
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("module", module.slug);
    url.hash = "academy";
    history.pushState({}, "", url);
    setAnnouncement(`${preview ? "Vista previa" : "Módulo"} ${module.number}: ${module.title}.`);
    if (requestedLessonId) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById("academy")?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
      moduleHeadingRef.current?.focus({ preventScroll: true });
    }));
  }

  function handleModuleLink(event: MouseEvent<HTMLAnchorElement>, module: CurriculumModule) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    openModule(module);
  }

  function selectView(nextView: ModuleView) {
    setView(nextView);
    if (!previewMode) updateProgress((current) => ({ ...current, lastModuleId: activeModule.id, lastView: nextView }));
  }

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, currentView: ModuleView) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const views: ModuleView[] = ["lessons", "lab", "quiz"];
    const currentIndex = views.indexOf(currentView);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? views.length - 1 : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + views.length) % views.length;
    const nextView = views[nextIndex];
    selectView(nextView);
    requestAnimationFrame(() => document.getElementById(`tab-${nextView}`)?.focus());
  }

  function openExam(mode: Exclude<ExamMode, null>) {
    setExamMode(mode);
    setExamPage(0);
    setExamAnswers({});
    setExamSubmitted(false);
    setExamAttempt((value) => value + 1);
    setLockedNotice(null);
    setPreviewMode(false);
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("exam", mode);
    url.hash = "";
    history.pushState({}, "", url);
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  }

  function closeExam() {
    setExamMode(null);
    setWorkspaceView("learn");
    const url = new URL(window.location.href);
    url.search = "";
    const lastVisitedModule = modules.find((item) => item.id === progress.lastModuleId);
    if (lastVisitedModule) url.searchParams.set("module", lastVisitedModule.slug);
    url.hash = "academy";
    history.replaceState({}, "", url);
    requestAnimationFrame(() => {
      document.getElementById("academy")?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
      moduleHeadingRef.current?.focus({ preventScroll: true });
    });
  }

  function recordLessonRecall(lessonId: string, rating: ReviewRating) {
    if (previewMode) return;
    updateProgress((current) => {
      const scheduled = scheduleLessonReview(current, activeModule.id, lessonId, rating, localDate());
      if (rating !== "good") return { ...scheduled, lastModuleId: activeModule.id, lastView: "lessons" };
      const lessons = new Set(current.completedLessons[activeModule.id] ?? []);
      lessons.add(lessonId);
      return { ...scheduled, completedLessons: { ...scheduled.completedLessons, [activeModule.id]: [...lessons] }, lastModuleId: activeModule.id, lastView: "lessons" };
    }, (before) => rating === "good" ? [
      ...(before.completedLessons[activeModule.id]?.includes(lessonId) ? [{ id: `review:${activeModule.id}:${lessonId}:${localDate()}`, xp: 8 }] : [{ id: `lesson:${activeModule.id}:${lessonId}`, xp: 10 }]),
      { id: `daily:${localDate()}`, xp: 5 },
    ] : []);
    setAnnouncement(rating === "good" ? "Recuperación registrada. Volverá a aparecer en tu cola de repaso." : "Lección marcada para repasar mañana.");
  }

  function reviewSource(lessonId: string, sourceId: string) {
    if (previewMode) return;
    updateProgress((current) => current, [{ id: `source:${activeModule.id}:${lessonId}:${sourceId}`, xp: 5 }]);
    setAnnouncement("Fuente oficial registrada en tu ruta de estudio.");
  }

  function setLabCode(value: string) {
    if (previewMode) return;
    updateProgress((current) => ({
      ...current,
      labCode: { ...current.labCode, [activeModule.id]: value },
      labsPassed: current.labsPassed.filter((id) => id !== activeModule.id),
      labConfirmed: current.labConfirmed.filter((id) => id !== activeModule.id),
      lastModuleId: activeModule.id,
      lastView: "lab",
    }));
    setLabResult(null);
  }

  function setLabConfirmed(confirmed: boolean) {
    if (previewMode) return;
    updateProgress((current) => ({
      ...current,
      labConfirmed: confirmed ? [...new Set([...current.labConfirmed, activeModule.id])] : current.labConfirmed.filter((id) => id !== activeModule.id),
      labsPassed: confirmed ? current.labsPassed : current.labsPassed.filter((id) => id !== activeModule.id),
      lastModuleId: activeModule.id,
      lastView: "lab",
    }));
    setLabResult(null);
  }

  function runLab() {
    if (previewMode) return;
    const code = progress.labCode[activeModule.id] ?? activeModule.lab.starterCode;
    const checks = activeModule.lab.checks.map((check) => new RegExp(check.pattern, "i").test(code));
    const confirmed = progress.labConfirmed.includes(activeModule.id);
    const passed = checks.every(Boolean) && confirmed;
    setLabResult({ checks, passed });
    updateProgress((current) => ({
      ...current,
      labsPassed: passed ? [...new Set([...current.labsPassed, activeModule.id])] : current.labsPassed.filter((id) => id !== activeModule.id),
      lastModuleId: activeModule.id,
      lastView: "lab",
    }), passed ? [{ id: `lab:${activeModule.id}`, xp: 50 }] : []);
    setAnnouncement(passed ? "Laboratorio registrado con evidencia declarada." : confirmed ? "El código de partida aún no contiene todos los elementos esenciales." : "Ejecuta la práctica en Databricks y confirma la evidencia antes de registrarla.");
  }

  function editPassedLab() {
    if (previewMode) return;
    updateProgress((current) => ({
      ...current,
      labsPassed: current.labsPassed.filter((id) => id !== activeModule.id),
      labConfirmed: current.labConfirmed.filter((id) => id !== activeModule.id),
      lastModuleId: activeModule.id,
      lastView: "lab",
    }));
    setLabResult(null);
    setShowSolution(false);
    setAnnouncement("Laboratorio abierto para edición; deberás ejecutarlo y validarlo de nuevo.");
  }

  function chooseQuizAnswer(question: number, option: number) {
    if (previewMode) return;
    updateProgress((current) => ({
      ...current,
      quizAnswers: { ...current.quizAnswers, [activeModule.id]: { ...(current.quizAnswers[activeModule.id] ?? {}), [question]: option } },
      lastModuleId: activeModule.id,
      lastView: "quiz",
    }));
    setSubmittedQuiz(false);
  }

  function submitQuiz() {
    if (previewMode) return;
    const answers = progress.quizAnswers[activeModule.id] ?? {};
    const score = activeModule.quiz.reduce((sum, question, index) => sum + (answers[index] === question.answer ? 1 : 0), 0);
    const rewards: Reward[] = activeModule.quiz.flatMap((question, index) => answers[index] === question.answer ? [{ id: `quiz-correct:${activeModule.id}:${index}`, xp: 15 }] : []);
    if (score === activeModule.quiz.length) rewards.push({ id: `quiz-perfect:${activeModule.id}`, xp: 40 });
    updateProgress((current) => ({ ...current, quizScores: { ...current.quizScores, [activeModule.id]: Math.max(current.quizScores[activeModule.id] ?? 0, score) } }), rewards);
    setSubmittedQuiz(true);
    setRetryOnlyMistakes(false);
    setAnnouncement(`Resultado del test: ${score} de ${activeModule.quiz.length}.`);
  }

  function resetQuizAttempt() {
    updateProgress((current) => ({
      ...current,
      quizAnswers: Object.fromEntries(Object.entries(current.quizAnswers).filter(([id]) => id !== activeModule.id)),
      lastModuleId: activeModule.id,
      lastView: "quiz",
    }));
    setSubmittedQuiz(false);
    setRetryOnlyMistakes(false);
    setAnnouncement("Nuevo intento preparado.");
  }

  function retryQuizMistakes() {
    const currentAnswers = progress.quizAnswers[activeModule.id] ?? {};
    const correctAnswers: Record<number, number> = Object.fromEntries(activeModule.quiz.flatMap((question, index) => currentAnswers[index] === question.answer ? [[index, currentAnswers[index]]] : []));
    const remaining = activeModule.quiz.length - Object.keys(correctAnswers).length;
    updateProgress((current) => ({
      ...current,
      quizAnswers: { ...current.quizAnswers, [activeModule.id]: correctAnswers },
      lastModuleId: activeModule.id,
      lastView: "quiz",
    }));
    setSubmittedQuiz(false);
    setRetryOnlyMistakes(true);
    setAnnouncement(`Reintento preparado con ${remaining} ${remaining === 1 ? "pregunta fallada" : "preguntas falladas"}.`);
  }

  function resetAcademy() {
    localStorage.removeItem(STORAGE_KEY);
    setProgress(emptyProgress);
    setWorkspaceView("learn");
    setModulePickerOpen(false);
    setActiveId("m01");
    setView("lessons");
    setSubmittedQuiz(null);
    setRetryOnlyMistakes(false);
    setPreviewMode(false);
    setLabResult(null);
    setShowSolution(false);
    setLockedNotice(null);
    setSearch("");
    setTrackFilter("all");
    setLevelFilter("all");
    setTopicFilter("all");
    setStatusFilter("all");
    setExamMode(null);
    setExamPage(0);
    setExamAnswers({});
    setExamSubmitted(false);
    setResetPending(false);
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("module", modules[0].slug);
    url.hash = "academy";
    history.replaceState({}, "", url);
    setAnnouncement("Academia reiniciada. El progreso local se ha borrado.");
    requestAnimationFrame(() => requestAnimationFrame(() => moduleHeadingRef.current?.focus()));
  }

  function closeResetDialog() {
    setResetPending(false);
    requestAnimationFrame(() => resetButtonRef.current?.focus());
  }

  function handleResetDialogKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeResetDialog();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...(resetDialogRef.current?.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])') ?? [])]
      .filter((element) => !element.hasAttribute("disabled"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const lastModule = modules.find((module) => module.id === progress.lastModuleId);
  const continueModule = lastModule && routeModuleSet.has(lastModule.id) && isUnlocked(lastModule) && !completed.has(lastModule.id)
    ? lastModule
    : modules.find((module) => routeModuleSet.has(module.id) && isUnlocked(module) && hasStarted(module, progress) && !completed.has(module.id))
      ?? modules.find((module) => routeModuleSet.has(module.id) && isUnlocked(module) && !completed.has(module.id))
      ?? modules[31];

  const continueLesson = continueModule.lessons.find((lesson) => !(progress.completedLessons[continueModule.id] ?? []).includes(lesson.id));
  const continueAction: { view: ModuleView; lessonId: string | null; label: string } = continueLesson
    ? { view: "lessons", lessonId: continueLesson.id, label: `Lección ${continueModule.lessons.indexOf(continueLesson) + 1} · ${continueLesson.title}` }
    : !progress.labsPassed.includes(continueModule.id) || !progress.labConfirmed.includes(continueModule.id)
      ? { view: "lab", lessonId: null, label: continueModule.kind === "capstone" ? "Proyecto pendiente" : "Laboratorio pendiente" }
      : { view: "quiz", lessonId: null, label: (progress.quizScores[continueModule.id] ?? 0) >= 3 ? "Hito final pendiente" : "Test pendiente" };
  const challengeTarget = reviewQueue[0] ?? (continueLesson ? { module: continueModule, lesson: continueLesson, review: null } : null);

  function continueLearning() {
    openModule(continueModule, continueAction.view, continueAction.lessonId);
  }

  function startDailyChallenge() {
    if (!challengeTarget) return;
    openModule(challengeTarget.module, "lessons", challengeTarget.lesson.id);
  }

  if (examMode) {
    return <ExamSimulator
      key={`${examMode}-${examAttempt}`}
      mode={examMode}
      attempt={examAttempt}
      page={examPage}
      answers={examAnswers}
      submitted={examSubmitted}
      previousScore={progress.examScores[examMode]}
      onPage={setExamPage}
      onAnswer={(index, answer) => { setExamAnswers((current) => ({ ...current, [index]: answer })); setExamSubmitted(false); }}
      onSubmit={(score, completedAttempt) => { setExamSubmitted(true); updateProgress((current) => ({ ...current, examScores: { ...current.examScores, [examMode]: score }, examCompleted: completedAttempt ? { ...current.examCompleted, [examMode]: true } : current.examCompleted })); }}
      onRetry={() => { setExamPage(0); setExamAnswers({}); setExamSubmitted(false); setExamAttempt((value) => value + 1); window.scrollTo({ top: 0, behavior: scrollBehavior() }); }}
      onClose={closeExam}
    />;
  }

  return (
    <main>
      <a className="skip-link" href="#academy" onClick={(event) => { event.preventDefault(); navigateWorkspace("learn"); }}>Saltar al contenido del módulo</a>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
      {celebration && <div className="xp-toast" role="status" aria-live="polite"><span>✦</span>{celebration}</div>}
      <header className="site-header">
        <a className="brand" href="#academy" aria-label="Inicio de Lakehouse Lab" onClick={(event) => { event.preventDefault(); navigateWorkspace("learn"); }}><span className="brand-mark"><i /><i /><i /></span>Lakehouse Lab</a>
        <nav aria-label="Áreas de la academia">
          <a href="#academy" aria-current={workspaceView === "learn" ? "page" : undefined} onClick={(event) => { event.preventDefault(); navigateWorkspace("learn"); }}>Aprender</a>
          <a href="#catalog" aria-current={workspaceView === "route" ? "page" : undefined} onClick={(event) => { event.preventDefault(); navigateWorkspace("route"); }}>Ruta</a>
          <a href="#resources" aria-current={workspaceView === "resources" ? "page" : undefined} onClick={(event) => { event.preventDefault(); navigateWorkspace("resources"); }}>Recursos</a>
        </nav>
        <div className="header-progress"><a href="#editorial" onClick={(event) => { event.preventDefault(); navigateWorkspace("resources"); }}>v{SITE_VERSION}</a><span>{percent}% · {completed.size}/32</span><div role="progressbar" aria-label="Progreso total" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{ width: `${percent}%` }} /></div></div>
      </header>

      <div id="top" className="page-shell">
        {lockedNotice && <div className="access-notice" role="alert"><div><b>Contenido bloqueado</b><p>{lockedNotice}</p></div><button aria-label="Cerrar aviso" onClick={() => setLockedNotice(null)}>×</button></div>}
        {workspaceView === "learn" && <>
        <section className="hero daily-hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Tu siguiente paso</p>
            <h1 id="hero-title">Continúa donde lo dejaste<span>.</span></h1>
            <p className="hero-text"><b>Módulo {continueModule.number} · {continueModule.short}</b><br />{continueAction.label}</p>
            <div className="hero-actions">
              <button className="primary-button" onClick={continueLearning}>Continuar aprendiendo<span>→</span></button>
              <button className="secondary-button" aria-controls="module-picker" aria-expanded={modulePickerOpen} onClick={openModulePicker}>Cambiar de módulo</button>
            </div>
            <div className="hero-proof"><span>{percent}% completado</span><span>{completed.size}/32 módulos</span><span>{progress.gamification.streak} días de racha</span>{reviewQueue.length > 0 && <span>{reviewQueue.length} {reviewQueue.length === 1 ? "repaso pendiente" : "repasos pendientes"}</span>}</div>
          </div>
          <div className="hero-dashboard">
            <div className="hero-progress-card">
              <div className="progress-orbit" role="progressbar" aria-label="Progreso ponderado de la academia" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties}><strong>{percent}%</strong><small>completado</small></div>
              <div><p>Tu progreso</p><b>{completed.size} de 32 módulos</b><span>{formatHours(completedMinutes)} de {formatHours(totalMinutes)}</span></div>
            </div>
            <details className="daily-disclosure game-disclosure"><summary>Repaso, retos e insignias <span>Ver detalles</span></summary><GamificationDashboard progress={progress} level={level} completed={completed} reviewCount={reviewQueue.length} challengeLabel={challengeTarget ? (challengeTarget.review ? `Repasa «${challengeTarget.lesson.title}»` : dailyChallenge(modules, completed, progress.completedLessons)) : "Tu cola de repaso está al día."} onChallenge={startDailyChallenge} /></details>
          </div>
        </section>
        </>}

        {workspaceView === "resources" && <section id="resources" className="resource-hub workspace-surface" aria-labelledby="resources-title">
          <div className="resource-hub-heading"><p className="eyebrow">Consulta cuando lo necesites</p><h2 id="resources-title" ref={resourcesHeadingRef} tabIndex={-1}>Método, blueprint y revisión.</h2><p>La información de referencia sigue disponible sin competir con tu actividad diaria.</p></div>
        <details className="daily-disclosure method-disclosure">
          <summary><span><b>Cómo estudiar</b><small>El método progresivo en cuatro pasos</small></span><i>Abrir</i></summary>
        <section className="study-method" aria-labelledby="study-method-title">
          <div><p className="eyebrow">Método autosuficiente</p><h2 id="study-method-title">Contexto primero. Profundidad después.</h2><p>Cada explicación parte de lo que ya sabes, presenta una idea sencilla y solo entonces introduce vocabulario, mecánica y excepciones. No marques una lección hasta poder recorrer esa cadena con tus propias palabras.</p></div>
          <ol><li><span>01</span><div><b>Sitúa el problema</b><p>Entiende qué necesidad aparece y qué se vuelve difícil sin esta capacidad.</p></div></li><li><span>02</span><div><b>Nombra las piezas</b><p>Aprende pocos conceptos cada vez y relaciónalos con una imagen mental.</p></div></li><li><span>03</span><div><b>Recorre la mecánica</b><p>Sigue datos, estado, permisos, costes y fallos cuando las piezas ya son familiares.</p></div></li><li><span>04</span><div><b>Decide y ejecuta</b><p>Aplica las restricciones a un caso, comprueba el código y conserva evidencia.</p></div></li></ol>
        </section>
        </details>

          <BlueprintMatrix onOpen={openModule} />
          <EditorialSection />
        </section>}

        {workspaceView === "route" && <section id="catalog" className="catalog workspace-surface" aria-labelledby="catalog-title">
          <div className="section-heading"><div><p className="eyebrow">{studyRoutes[studyRoute].label}</p><h2 id="catalog-title" ref={catalogHeadingRef} tabIndex={-1}>Elige cuánto necesitas recorrer.</h2><p>Abre cualquier módulo de la ruta. Si aún no está desbloqueado, entrarás en vista previa sin modificar tu progreso.</p></div><button ref={resetButtonRef} className="text-button danger" onClick={() => setResetPending(true)}>Reiniciar progreso</button></div>
          <div className="study-routes" role="radiogroup" aria-label="Ruta de estudio">{(Object.entries(studyRoutes) as [StudyRoute, typeof studyRoutes[StudyRoute]][]).map(([id, route]) => { const minutes = modules.filter((module) => route.moduleIds.includes(module.id)).reduce((sum, module) => sum + module.minutes, 0); return <button key={id} role="radio" aria-checked={studyRoute === id} className={studyRoute === id ? "active" : ""} onClick={() => setStudyRoute(id)}><span>{route.focus}</span><b>{route.label}</b><p>{route.description}</p><small>{route.moduleIds.length} módulos · {formatHours(minutes)}</small></button>; })}</div>
          <p className="route-note">Cambiar de ruta solo filtra y prioriza contenido; nunca borra progreso ni XP.</p>
          <div className="filters">
            <label htmlFor="module-search"><span>Buscar</span><input id="module-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ej. Auto Loader, ABAC, skew…" /></label>
            <details className="filter-disclosure"><summary id="filter-summary">Más filtros</summary><div role="group" aria-labelledby="filter-summary"><label htmlFor="filter-track"><span>Rama</span><select id="filter-track" value={trackFilter} onChange={(event) => setTrackFilter(event.target.value as TrackId | "all")}><option value="all">Todas</option>{trackOrder.map((track) => <option key={track} value={track}>{trackMeta[track].name}</option>)}</select></label><label htmlFor="filter-level"><span>Nivel</span><select id="filter-level" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as LevelFilter)}><option value="all">Todos</option><option value="associate">Associate</option><option value="professional">Professional</option></select></label><label htmlFor="filter-topic"><span>Tema</span><select id="filter-topic" value={topicFilter} onChange={(event) => setTopicFilter(event.target.value as TopicFilter)}><option value="all">Todos</option>{Object.entries(topicGroups).map(([value, group]) => <option key={value} value={value}>{group.label}</option>)}</select></label><label htmlFor="filter-status"><span>Estado</span><select id="filter-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">Todos</option><option value="available">Sin empezar</option><option value="in-progress">En curso</option><option value="completed">Superados</option><option value="locked">Bloqueados</option></select></label></div></details>
            <div className="result-count" aria-live="polite"><strong>{filteredModules.length}</strong><span>módulos</span></div>
          </div>
          <div className="module-grid">
            {filteredModules.map((module) => <ModuleCard key={module.id} module={module} unlocked={isUnlocked(module)} done={completed.has(module.id)} progress={moduleProgressPercent(module, progress)} onLink={handleModuleLink} />)}
          </div>
          {!filteredModules.length && <div className="empty-state"><b>No hay módulos con esos filtros.</b><button onClick={() => { setSearch(""); setTrackFilter("all"); setLevelFilter("all"); setTopicFilter("all"); setStatusFilter("all"); }}>Limpiar filtros</button></div>}
        </section>}

        {workspaceView === "learn" && <><section id="academy" className="academy workspace-surface" aria-labelledby="module-title">
          <div className="academy-content">
            <details id="module-picker" className="module-picker" open={modulePickerOpen} onToggle={(event) => setModulePickerOpen(event.currentTarget.open)}>
              <summary ref={modulePickerSummaryRef}><span>Módulo {activeModule.number} de {routeModuleSet.size}</span><b>{activeModule.short}</b><i>{modulePickerOpen ? "Cerrar" : "Cambiar"}</i></summary>
              {modulePickerOpen && <nav aria-label="Cambiar módulo">{modules.filter((module) => routeModuleSet.has(module.id) || module.id === activeModule.id).map((module) => <a key={module.id} href={`?module=${module.slug}#academy`} data-preview={!isUnlocked(module) || undefined} aria-current={activeModule.id === module.id ? "step" : undefined} onClick={(event) => handleModuleLink(event, module)} className={activeModule.id === module.id ? "active" : completed.has(module.id) ? "done" : !isUnlocked(module) ? "preview-link" : ""}><span>{completed.has(module.id) ? "✓" : module.number}</span><b>{module.short}</b><small>{!isUnlocked(module) ? "Vista previa" : completed.has(module.id) ? "Superado" : trackMeta[module.track].name}</small></a>)}</nav>}
            </details>
            <div className="module-header">
              <div><p className="eyebrow">Módulo {activeModule.number} · {activeModule.level} · {formatHours(activeModule.minutes)}</p><h2 id="module-title" ref={moduleHeadingRef} tabIndex={-1}>{activeModule.title}</h2><p>{activeModule.description}</p></div>
              <div className={`mastery ${completed.has(activeModule.id) ? "passed" : ""}`} role="progressbar" aria-label={`Progreso del módulo ${activeModule.number}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={moduleProgressPercent(activeModule, progress)}><strong>{completed.has(activeModule.id) ? "✓" : `${moduleProgressPercent(activeModule, progress)}%`}</strong><span>{completed.has(activeModule.id) ? "Superado" : "Módulo"}</span></div>
            </div>
            {previewMode && <div className="preview-banner" role="status"><span>Vista previa</span><div><b>Explora sin alterar tu progreso</b><p>Las lecciones, el laboratorio, las fuentes y el test son consultables. Las respuestas, soluciones, XP y controles de finalización permanecen desactivados.</p></div></div>}
            <div className="module-metadata"><span>{trackMeta[activeModule.track].name}</span>{activeModule.examDomains.map((domain) => <span key={domain}>{domain}</span>)}</div>
            <div className="academy-tabs" role="tablist" aria-label="Contenido del módulo">
              <button id="tab-lessons" role="tab" aria-controls="panel-lessons" aria-selected={view === "lessons"} tabIndex={view === "lessons" ? 0 : -1} className={view === "lessons" ? "active" : ""} onKeyDown={(event) => handleTabKey(event, "lessons")} onClick={() => selectView("lessons")}>01 · Lecciones <i>{progress.completedLessons[activeModule.id]?.length ?? 0}/5</i></button>
              <button id="tab-lab" role="tab" aria-controls="panel-lab" aria-selected={view === "lab"} tabIndex={view === "lab" ? 0 : -1} className={view === "lab" ? "active" : ""} onKeyDown={(event) => handleTabKey(event, "lab")} onClick={() => selectView("lab")}>02 · {activeModule.kind === "capstone" ? "Proyecto" : "Laboratorio"} <i>{progress.labsPassed.includes(activeModule.id) ? "✓" : ""}</i></button>
              <button id="tab-quiz" role="tab" aria-controls="panel-quiz" aria-selected={view === "quiz"} tabIndex={view === "quiz" ? 0 : -1} className={view === "quiz" ? "active" : ""} onKeyDown={(event) => handleTabKey(event, "quiz")} onClick={() => selectView("quiz")}>03 · Test <i>{progress.quizScores[activeModule.id] ?? "—"}/4</i></button>
            </div>

            {view === "lessons" && <LessonsView key={activeModule.id} module={activeModule} completedLessons={previewMode ? [] : progress.completedLessons[activeModule.id] ?? []} preview={previewMode} requestedLessonId={pendingLessonId} onRecall={recordLessonRecall} onSource={reviewSource} onNext={() => selectView("lab")} />}
            {view === "lab" && <LabView module={activeModule} code={previewMode ? activeModule.lab.starterCode : progress.labCode[activeModule.id] ?? activeModule.lab.starterCode} cloud={cloud} result={previewMode ? null : labResult} passed={!previewMode && progress.labsPassed.includes(activeModule.id)} confirmed={!previewMode && progress.labConfirmed.includes(activeModule.id)} showSolution={!previewMode && showSolution} preview={previewMode} onCloud={setCloud} onCode={setLabCode} onConfirm={setLabConfirmed} onRun={runLab} onEdit={editPassedLab} onSolution={() => setShowSolution((value) => !value)} onNext={() => selectView("quiz")} />}
            {view === "quiz" && <QuizView module={activeModule} answers={previewMode ? {} : progress.quizAnswers[activeModule.id] ?? {}} submitted={!previewMode && (submittedQuiz === true || (submittedQuiz === null && progress.quizScores[activeModule.id] !== undefined && Object.keys(progress.quizAnswers[activeModule.id] ?? {}).length === activeModule.quiz.length))} retryOnlyMistakes={retryOnlyMistakes} score={previewMode ? undefined : progress.quizScores[activeModule.id]} preview={previewMode} requirementsMet={!previewMode && (progress.completedLessons[activeModule.id]?.length ?? 0) >= activeModule.lessons.length && progress.labsPassed.includes(activeModule.id) && (activeModule.id === "m12" ? progress.examCompleted.associate === true : activeModule.id === "m32" ? progress.examCompleted.professional === true : true)} examRequired={activeModule.id === "m12" ? "associate" : activeModule.id === "m32" ? "professional" : null} examDone={activeModule.id === "m12" ? progress.examCompleted.associate === true : activeModule.id === "m32" ? progress.examCompleted.professional === true : true} onExam={openExam} onAnswer={chooseQuizAnswer} onSubmit={submitQuiz} onRetryMistakes={retryQuizMistakes} onRetry={resetQuizAttempt} onBack={() => selectView("lessons")} />}
            {completed.has(activeModule.id) && <div className="completion-banner" role="status"><div><span>✓</span><div><b>Módulo {activeModule.number} superado</b><p>{activeModule.id === "m12" ? "Las cuatro especializaciones ya están abiertas." : activeModule.id === "m32" ? "Has completado toda la academia." : "Tu progreso se ha guardado en este dispositivo."}</p></div></div>{activeModule.id !== "m32" && (activeModule.id === "m12" ? <button className="primary-button" onClick={() => navigateWorkspace("route")}>Elegir especialización <span>→</span></button> : <button className="primary-button" onClick={continueLearning}>Continuar con {continueModule.number} <span>→</span></button>)}</div>}
          </div>
        </section>
        <details className="daily-disclosure exam-disclosure">
          <summary><span><b>Simulacros de certificación</b><small>Associate y Professional · siempre disponibles</small></span><i>Ver simulacros</i></summary>
          <section className="exam-strip" aria-label="Simulacros de certificación">
            <div><p className="eyebrow">Evaluación acumulativa</p><h2>Dos hitos. Una carrera completa.</h2></div>
            <button onClick={() => openExam("associate")}><span>Associate · disponible</span><b>45 preguntas · 90 min</b><small>{progress.examScores.associate !== undefined ? `Mejor resultado: ${progress.examScores.associate}% · banco de ${examPoolSizes.associate}` : `Banco de ${examPoolSizes.associate}: ${examOriginCounts.associate.original} originales + ${examOriginCounts.associate.augmented} ampliadas`}</small></button>
            <button onClick={() => openExam("professional")}><span>Professional · disponible</span><b>59 preguntas · 120 min</b><small>{progress.examScores.professional !== undefined ? `Mejor resultado: ${progress.examScores.professional}% · banco de ${examPoolSizes.professional}` : `Banco de ${examPoolSizes.professional}: ${examOriginCounts.professional.original} originales + ${examOriginCounts.professional.augmented} ampliadas`}</small></button>
          </section>
        </details>
        </>}
      </div>

      {resetPending && <div className="dialog-backdrop" onKeyDown={handleResetDialogKey}><div ref={resetDialogRef} className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title" aria-describedby="reset-description"><p className="eyebrow">Acción irreversible</p><h2 id="reset-title">¿Reiniciar toda la academia?</h2><p id="reset-description">Se borrarán lecciones, laboratorios, tests, simulacros, XP, rachas e insignias guardados en este dispositivo.</p><div><button className="secondary-button" autoFocus onClick={closeResetDialog}>Conservar progreso</button><button className="danger-button" onClick={resetAcademy}>Sí, borrar progreso</button></div></div></div>}

      <footer><a className="brand" href="#academy" onClick={(event) => { event.preventDefault(); navigateWorkspace("learn"); }}><span className="brand-mark"><i /><i /><i /></span>Lakehouse Lab</a><p>Autoría Lakehouse Lab · v{SITE_VERSION} · revisión {REVIEWED_AT} · no contiene preguntas reales de examen.</p><div><a href="#editorial" onClick={(event) => { event.preventDefault(); navigateWorkspace("resources"); }}>Autoría y changelog</a><a href={`#${workspaceView === "route" ? "catalog" : workspaceView === "resources" ? "resources" : "academy"}`} onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: scrollBehavior() }); }}>Volver arriba ↑</a></div></footer>
    </main>
  );
}

function GamificationDashboard({ progress, level, completed, reviewCount, challengeLabel, onChallenge }: { progress: ProgressState; level: ReturnType<typeof levelFor>; completed: Set<string>; reviewCount: number; challengeLabel: string; onChallenge: () => void }) {
  const todayActions = progress.gamification.dailyActionCounts[localDate()] ?? 0;
  return <section className="game-panel" aria-labelledby="game-title">
    <div className="game-level"><div><p className="eyebrow">Nivel actual</p><h2 id="game-title">{level.current.name}</h2><span>{progress.gamification.xp.toLocaleString("es-ES")} XP{level.next ? ` · ${level.next.xp - progress.gamification.xp} para ${level.next.name}` : " · nivel máximo"}</span></div><strong>{progress.gamification.streak}<small>días</small></strong></div>
    <div className="level-progress" role="progressbar" aria-label="Progreso al siguiente nivel" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level.percent}><i style={{ width: `${level.percent}%` }} /></div>
    <div className="missions"><article className="active-mission"><span>{reviewCount > 0 ? `Repaso de hoy · ${reviewCount} pendiente${reviewCount === 1 ? "" : "s"}` : "Reto diario"}</span><b>{challengeLabel}</b><button type="button" onClick={onChallenge} disabled={!challengeLabel || challengeLabel.includes("al día")}>Responder ahora <i>→</i></button></article><article><span>Misión semanal</span><b>{weeklyMission(modules, completed)}</b></article></div>
    <div className="combo-row"><span>Combo de hoy</span>{[3,5,7].map((threshold) => <i key={threshold} className={todayActions >= threshold ? "earned" : ""}>{threshold}</i>)}</div>
    <div className="badge-row" aria-label="Insignias obtenidas">{progress.gamification.badges.length ? progress.gamification.badges.map((id) => { const badge = badgeCatalog[id as keyof typeof badgeCatalog]; return badge ? <span key={id} title={badge.label}><i>{badge.icon}</i>{badge.label}</span> : null; }) : <small>Tu primera insignia aparecerá al completar un laboratorio.</small>}</div>
  </section>;
}

function BlueprintMatrix({ onOpen }: { onOpen: (module: CurriculumModule, view?: ModuleView) => void }) {
  const [level, setLevel] = useState<CertificationLevel>("Associate");
  const items = blueprintObjectives.filter((item) => item.level === level);
  const coverage = coverageFor(level);
  const domains = [...new Set(items.map((item) => item.domain))];
  return <section id="blueprint-matrix" className="blueprint-matrix" aria-labelledby="matrix-title">
    <details className="daily-disclosure blueprint-disclosure"><summary><span><b id="matrix-title">Blueprint y cobertura</b><small>Objetivos oficiales y trazabilidad por lección, laboratorio y test</small></span><i>Abrir matriz</i></summary>
    <div className="section-heading"><div><p className="eyebrow">Matriz auditable</p><h2>Blueprint completo, objetivo por objetivo.</h2></div><p>Los porcentajes expresan cobertura interna del curso, no pesos oficiales ni suficiencia para aprobar.</p></div>
    <div className="coverage-caveat" role="note"><strong>Objetivo mencionado ≠ objetivo explicado ≠ habilidad demostrada.</strong><p>El mapeo confirma que existe un artefacto asociado. No acredita por sí solo profundidad, dificultad equivalente al examen ni ejecución autónoma en un workspace real.</p></div>
    <div className="matrix-shell">
      <div className="matrix-tabs" role="tablist" aria-label="Certificación">{(["Associate","Professional"] as const).map((item) => <button key={item} role="tab" aria-selected={level === item} className={level === item ? "active" : ""} onClick={() => setLevel(item)}>{item}</button>)}</div>
      <div className="coverage-stats evidence-stats"><article><strong>{coverage.counts.mapped}/{coverage.counts.total}</strong><span>Mencionados</span><small>objetivo enlazado</small></article><article><strong>{coverage.counts.explained}/{coverage.counts.total}</strong><span>Explicados</span><small>auditoría editorial interna</small></article><article><strong>{coverage.counts.practiced}/{coverage.counts.total}</strong><span>Practicados</span><small>actividad diseñada</small></article><article><strong>{coverage.counts.assessed}/{coverage.counts.total}</strong><span>Evaluados</span><small>pregunta asociada</small></article><article><strong>{coverage.counts.reproduced}/{coverage.counts.total}</strong><span>Reproducidos</span><small>ejecución independiente</small></article></div>
      <div className="domain-coverage">{domains.map((domain) => { const domainItems = items.filter((item) => item.domain === domain); const covered = domainItems.filter((item) => item.moduleIds.length).length; const percentage = Math.round(covered / domainItems.length * 100); return <article key={domain}><div><b>{domain}</b><span>{covered}/{domainItems.length} objetivos</span></div><div role="progressbar" aria-label={`Cobertura de ${domain}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><i style={{width:`${percentage}%`}} /></div><strong>{percentage}%</strong></article>; })}</div>
      <div className="matrix-table-wrap"><table><thead><tr><th>Dominio y objetivo oficial</th><th>Lecciones</th><th>Laboratorios</th><th>Preguntas</th><th>Evidencia</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><small>{item.domain}</small><b>{item.objective}</b></td>{(["lessons", "lab", "quiz"] as const).map((target) => <td key={target}><div className="matrix-modules">{item.moduleIds.map((id) => { const module = modules.find((entry) => entry.id === id); return module ? <button key={id} onClick={() => onOpen(module, target)} aria-label={`Abrir ${target === "lessons" ? "lecciones" : target === "lab" ? "laboratorio" : "preguntas"} del módulo ${module.number}`}>M{module.number}</button> : null; })}</div></td>)}<td><span className="gap">Diseñado · no reproducido</span></td></tr>)}</tbody></table></div>
      <div className="matrix-foot"><a href={OFFICIAL_BLUEPRINTS[level].href} target="_blank" rel="noreferrer">Abrir {OFFICIAL_BLUEPRINTS[level].label} ↗</a><span>Revalidado {REVIEWED_AT}</span></div>
    </div></details>
  </section>;
}

function EditorialSection() {
  return <section id="editorial" className="editorial" aria-labelledby="editorial-title">
    <details className="daily-disclosure editorial-disclosure"><summary><span><b>Autoría, versión y changelog</b><small>Ficha editorial y procedimiento de revisión</small></span><i>Abrir ficha</i></summary><div className="editorial-disclosure-body">
    <div className="editorial-heading"><div><p className="eyebrow">Ficha editorial</p><h2 id="editorial-title">Contenido trazable y revisable.</h2><p>Lakehouse Lab publica qué versión estás estudiando, qué fuentes la respaldan y cómo se mantiene.</p></div><div className="version-seal"><span>Lakehouse Lab</span><strong>v{SITE_VERSION}</strong><small>Versión auditable vigente</small></div></div>
    <div className="editorial-grid">
      <article><span>Autor principal</span><h3>Lakehouse Lab · identidad editorial</h3><p>No se publica todavía una persona física verificable. El sitio no afirma certificaciones, empleo en Databricks ni experiencia productiva que no hayan sido acreditados públicamente.</p></article>
      <article><span>Revisión técnica</span><h3>Revisor externo pendiente</h3><p>La revisión actual es editorial e interna. Ningún porcentaje de cobertura debe interpretarse como aval independiente.</p></article>
      <article><span>Transparencia</span><h3>Sin respaldo comercial declarado</h3><p>Proyecto formativo independiente, no afiliado ni respaldado por Databricks. Conflictos de interés humanos: no verificables hasta publicar autoría nominal.</p></article>
      <article><span>Errores y correcciones</span><h3>Historial público en esta ficha</h3><p>El changelog registra correcciones desde v1.0.0. El repositorio público y un canal externo de incidencias siguen pendientes; por ahora las correcciones se solicitan en la tarea que mantiene el sitio.</p></article>
      <article><span>Control de versión</span><h3>Publicado {PUBLISHED_AT}</h3><p>Última revisión: {REVIEWED_AT}. Major cambia blueprint o estructura; minor amplía contenido o labs; patch corrige fuentes o erratas.</p></article>
      <article><span>Blueprints base</span><h3>Associate + Professional</h3><p><a href={OFFICIAL_BLUEPRINTS.Associate.href} target="_blank" rel="noreferrer">Associate · mayo 2026 ↗</a><a href={OFFICIAL_BLUEPRINTS.Professional.href} target="_blank" rel="noreferrer">Professional · noviembre 2025 ↗</a></p></article>
      <article><span>Procedimiento de revisión</span><h3>Revisión trimestral y por evento</h3><ol><li>Comprobar guías, Runtime y release notes.</li><li>Verificar cada afirmación y laboratorio.</li><li>Actualizar matriz, costes y changelog.</li><li>Revalidar enlaces, progreso, accesibilidad y build.</li><li>Comprobación recomendada dos semanas antes de cada examen.</li></ol></article>
    </div>
    <div className="changelog"><div><p className="eyebrow">Changelog</p><h3>v{SITE_VERSION} · {REVIEWED_AT}</h3><p>Aprendizaje activo, repaso espaciado y navegación enfocada.</p></div><ul><li>Aprender, Ruta y Recursos son superficies independientes: solo se monta lo que necesitas en ese momento.</li><li>«Continuar» y el reto diario abren la lección o actividad exacta, incluidos los repasos pendientes.</li><li>Cada lección exige explicar con tus palabras antes de mostrar la respuesta y programar el siguiente repaso.</li><li>Los tests conservan la mejor marca, explican cada respuesta y permiten reintentar únicamente los errores.</li><li>La interfaz adopta un cuaderno técnico más legible, con navegación móvil visible, foco claro y menos ruido visual.</li></ul></div>
    <div className="changelog changelog-previous"><div><p className="eyebrow">Versión anterior</p><h3>v1.6.0 · {REVIEWED_AT}</h3><p>Lectura progresiva y superficie diaria minimalista.</p></div><ul><li>La academia eliminó la barra lateral permanente y añadió un selector de módulo bajo demanda.</li><li>Objetivos, ruta conceptual, contexto multinube y blueprint quedaron completos, pero plegados.</li><li>Las cinco lecciones pasaron a funcionar como acordeón.</li><li>Cada lección conservó explicación, código, errores, decisiones y fuentes oficiales.</li><li>Se redujeron paneles duplicados, fondos decorativos y métricas simultáneas.</li></ul></div>
    <div className="changelog changelog-previous"><div><p className="eyebrow">Versión anterior</p><h3>v1.5.1 · {REVIEWED_AT}</h3><p>Preguntas contenidas y laboratorios con límites explícitos.</p></div><ul><li>Los enunciados y respuestas se ajustan al ancho disponible, incluso con términos técnicos largos y en móvil.</li><li>Cada laboratorio organiza la práctica en construir, comprobar y explicar.</li><li>La ficha de entorno y requisitos queda plegada para reducir fricción sin perder trazabilidad.</li><li>El editor se identifica como borrador local: no ejecuta Databricks ni Spark.</li><li>La finalización registra evidencia declarada; no se presenta como validación independiente del workspace.</li></ul></div>
    <div className="changelog changelog-previous"><div><p className="eyebrow">Versión anterior</p><h3>v1.5.0 · {REVIEWED_AT}</h3><p>Simulacros siempre disponibles y bancos ampliados con procedencia explícita.</p></div><ul><li>Associate y Professional se pueden abrir desde el inicio, también mediante URL directa.</li><li>Associate amplía su banco a 80 preguntas: 50 originales del curso y 30 variantes sintéticas.</li><li>Professional amplía su banco a 100 preguntas: 64 originales del curso y 36 variantes sintéticas.</li><li>Las 14 muestras oficiales retiradas se indexan y enlazan en la página exacta de cada guía oficial.</li><li>Cada pregunta distingue su origen; no se incorporan dumps ni preguntas de exámenes activos.</li></ul></div>
    <div className="changelog changelog-previous"><div><p className="eyebrow">Versión anterior</p><h3>v1.4.0 · {REVIEWED_AT}</h3></div><ul><li>Fuentes específicas por subtema y matriz de evidencia por niveles.</li><li>Laboratorios con reproducibilidad declarada y rutas de estudio diferenciadas.</li><li>Contexto operativo común, AWS, Azure y GCP visible en cada módulo.</li></ul></div>
    <div className="changelog changelog-previous"><div><p className="eyebrow">Versión anterior</p><h3>v1.3.0 · {REVIEWED_AT}</h3></div><ul><li>Corrección responsive y ampliación de los bancos de simulacro.</li><li>Blueprint Professional revalidado contra noviembre de 2025.</li></ul></div>
    <div className="changelog changelog-previous"><div><p className="eyebrow">Versión anterior</p><h3>v1.2.0 · {REVIEWED_AT}</h3></div><ul><li>Interfaz diaria centrada en continuar.</li><li>Mapa y catálogo unificados.</li><li>Recursos avanzados bajo demanda.</li><li>Filtros secundarios desplegables.</li></ul></div>
    <div className="changelog changelog-previous"><div><p className="eyebrow">Versión anterior</p><h3>v1.1.0 · {REVIEWED_AT}</h3></div><ul><li>Mapa de comprensión al inicio de cada módulo.</li><li>Puentes explícitos entre lecciones.</li><li>Explicaciones guiadas en cinco pasos.</li><li>Ejemplos después de construir la intuición.</li></ul></div>
    <div className="changelog changelog-previous"><div><p className="eyebrow">Versión inicial</p><h3>v1.0.0 · {PUBLISHED_AT}</h3></div><ul><li>Autoría, versionado y procedimiento editorial públicos.</li><li>Citas técnicas por lección y matriz completa de blueprints.</li><li>Vista previa segura de módulos bloqueados.</li><li>Laboratorios versionados y gamificación con XP, rachas, combos e insignias.</li></ul></div>
    </div></details>
  </section>;
}

function TrackRow({ track, completed, isUnlocked, onLink, compact = false }: { track: TrackId; completed: Set<string>; isUnlocked: (module: CurriculumModule) => boolean; onLink: (event: MouseEvent<HTMLAnchorElement>, module: CurriculumModule) => void; compact?: boolean }) {
  const items = modules.filter((module) => module.track === track);
  const meta = trackMeta[track];
  return <article className={`track-row track-${meta.color} ${compact ? "compact" : ""}`}>
    <div className="track-heading"><span>{meta.eyebrow}</span><h3>{meta.name}</h3><p>{meta.description}</p></div>
    <div className="track-modules">{items.map((module) => <a key={module.id} href={`?module=${module.slug}`} onClick={(event) => onLink(event, module)} data-preview={!isUnlocked(module) || undefined} title={!isUnlocked(module) ? `Abrir vista previa. Requiere ${module.prerequisites.join(", ")}` : undefined} className={completed.has(module.id) ? "done" : isUnlocked(module) ? "ready" : "locked"}><span>{completed.has(module.id) ? "✓" : module.number}</span><b>{module.short}</b><small>{isUnlocked(module) ? formatHours(module.minutes) : `Vista previa · requiere ${module.prerequisites.map((id) => modules.find((item) => item.id === id)?.number).join(", ")}`}</small></a>)}</div>
  </article>;
}

function ModuleCard({ module, unlocked, done, progress, onLink }: { module: CurriculumModule; unlocked: boolean; done: boolean; progress: number; onLink: (event: MouseEvent<HTMLAnchorElement>, module: CurriculumModule) => void }) {
  const prerequisiteNames = module.prerequisites.map((id) => modules.find((item) => item.id === id)?.number).filter(Boolean).join(", ");
  return <a href={`?module=${module.slug}`} data-preview={!unlocked || undefined} className={`module-card track-${trackMeta[module.track].color}`} onClick={(event) => onLink(event, module)}>
    <span className="module-number">{done ? "✓" : module.number}</span>
    <span className="module-track">{trackMeta[module.track].name}</span>
    <b>{module.title}</b>
    <p>{module.description}</p>
    <div className="module-card-meta"><span>{formatHours(module.minutes)}</span><span>5 capítulos</span><span>{module.kind === "capstone" ? "Proyecto final" : "1 práctica"}</span></div>
    {progress > 0 && !done && <div className="module-card-meter"><span><i style={{ width: `${progress}%` }} /></span><small>{progress}%</small></div>}
    <small className={done ? "done" : unlocked ? "ready" : "locked"}>{done ? "Módulo superado" : unlocked ? "Abrir módulo →" : `Vista previa → · requiere ${prerequisiteNames}`}</small>
  </a>;
}

function ClaimRefs(_props: { module: CurriculumModule; lessonId: string; refIds: string[]; onSource: (lessonId: string, sourceId: string) => void }) {
  return null;
}

function LessonsView({ module, completedLessons, preview, requestedLessonId, onRecall, onSource, onNext }: { module: CurriculumModule; completedLessons: string[]; preview: boolean; requestedLessonId: string | null; onRecall: (id: string, rating: ReviewRating) => void; onSource: (lessonId: string, sourceId: string) => void; onNext: () => void }) {
  const mappedCoverage = examMappings.filter((mapping) => mapping.moduleIds.includes(module.id));
  const blueprintCoverage = mappedCoverage.length ? mappedCoverage : [{ level: module.level, domain: module.examDomains.join(" · "), objectives: module.outcomes }];
  const firstIncompleteLessonId = module.lessons.find((lesson) => !completedLessons.includes(lesson.id))?.id;
  const [openLessonId, setOpenLessonId] = useState<string | null>(requestedLessonId ?? firstIncompleteLessonId ?? module.lessons[0]?.id ?? null);
  useEffect(() => {
    if (requestedLessonId) setOpenLessonId(requestedLessonId);
  }, [requestedLessonId]);
  function handleRecall(lessonId: string, rating: ReviewRating) {
    onRecall(lessonId, rating);
  }
  return <div id="panel-lessons" className="lessons-view" role="tabpanel" aria-labelledby="tab-lessons" tabIndex={0}>
    <div className="lesson-context-list">
      <details className="outcomes compact-theory"><summary><span>Objetivos</span><b>Lo que podrás explicar al terminar</b><i>{module.outcomes.length}</i></summary><div>{module.outcomes.map((outcome) => <p key={outcome}>✓ {outcome}</p>)}</div></details>
      <details className="module-learning-map compact-theory" aria-labelledby={`learning-map-${module.id}`}>
        <summary><span>Ruta de comprensión</span><b id={`learning-map-${module.id}`}>Cinco ideas, de fundamentos a integración</b><i>5</i></summary>
        <div className="compact-theory-body"><p><b>Construiremos el tema por capas.</b> {module.prerequisites.length ? `Este módulo retoma lo aprendido en ${module.prerequisites.map((id) => modules.find((item) => item.id === id)?.short).filter(Boolean).join(", ")}.` : "No necesitas conocimientos previos de Databricks: empezamos por el problema que la plataforma intenta resolver."} Cada lección añade una pieza y reutiliza la anterior antes de introducir más detalle.</p><ol>{module.lessons.map((lesson, index) => <li key={lesson.id}><span>{index + 1}</span><div><small>{["Fundamentos", "Conecta", "Opera", "Decide", "Integra"][index]}</small><b>{lesson.title}</b></div></li>)}</ol></div>
      </details>
      <details className="cloud-context compact-theory" aria-labelledby={`cloud-context-${module.id}`}>
        <summary><span>Multinube</span><b id={`cloud-context-${module.id}`}>Un principio común, tres implementaciones</b><i>3</i></summary>
        <div className="compact-theory-body"><p><b>Principio común:</b> {module.description} Los nombres de servicios, identidades, endpoints y perímetros cambian por proveedor; no traslades literalmente una configuración entre nubes.</p><div className="cloud-context-grid">{module.lab.cloudNotes.map((item) => <article key={item.cloud}><span>{item.cloud}</span><p>{item.note}</p></article>)}</div><p className="cloud-context-sources">Comprueba los detalles operativos en las fuentes etiquetadas AWS, Azure o GCP al final de cada lección.</p></div>
      </details>
      <details className="blueprint-coverage compact-theory" aria-labelledby={`blueprint-${module.id}`}><summary><span>Certificación</span><b id={`blueprint-${module.id}`}>Objetivos del blueprint relacionados</b><i>{blueprintCoverage.length}</i></summary><div className="compact-theory-body"><p>Estos objetivos están mapeados a teoría, práctica y preguntas. El mapeo no demuestra por sí solo profundidad ni dominio autónomo.</p><div>{blueprintCoverage.map((mapping) => <article key={`${mapping.level}-${mapping.domain}`}><span>{mapping.level}</span><b>{mapping.domain}</b><ul>{mapping.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></article>)}</div></div></details>
    </div>
    {module.lessons.map((lesson, index) => {
      const done = completedLessons.includes(lesson.id);
      const lessonMinutes = Math.round(module.minutes * (module.kind === "capstone" ? .3 : module.kind === "branch-project" ? .35 : .5) / module.lessons.length);
      const previousLesson = index > 0 ? module.lessons[index - 1] : null;
      const nextLesson = module.lessons[index + 1] ?? null;
      const learningStage = ["Fundamentos", "Conecta", "Opera", "Decide", "Integra"][index];
      const isOpen = openLessonId === lesson.id;
      return <details id={`lesson-${module.id}-${lesson.id}`} className={`lesson ${done ? "done" : ""}`} data-lesson-id={lesson.id} key={lesson.id} open={isOpen} onToggle={(event) => {
        if (event.currentTarget.open) setOpenLessonId(lesson.id);
        else setOpenLessonId((current) => current === lesson.id ? null : current);
      }}>
        <summary className="lesson-summary"><span className="lesson-index">{String(index + 1).padStart(2,"0")}</span><div><small>{learningStage} · ≈ {lessonMinutes} min</small><h3>{lesson.title}</h3><p>{lesson.summary}</p></div><i>{done ? "✓" : "+"}</i></summary>
        {isOpen && <div className="lesson-copy">
          <p className="eyebrow">{lesson.kicker} · {learningStage}</p><h3>{lesson.title}</h3>
          <div className="lesson-bridge"><div><span>Punto de partida</span><b>{previousLesson ? `Ya has visto: ${previousLesson.title}` : "Empezamos desde cero"}</b></div><p>{previousLesson ? `Ahora conectaremos esa idea con «${lesson.title}». No necesitas memorizar lo anterior: basta con recordar qué problema resolvía.` : `Primero situaremos «${lesson.title}» dentro del propósito general del módulo. Después añadiremos vocabulario, mecánica y una decisión real.`}</p>{nextLesson && <small>Esto preparará la siguiente pieza: {nextLesson.title}.</small>}</div>
          <p className="lead lesson-one-line"><span>En una frase</span>{lesson.summary}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></p>
          <details className="deep-dive" open={!done}>
            <summary><span>Explicación guiada, paso a paso</span><small>Problema → intuición → vocabulario → mecánica → caso · ≈ {lessonMinutes} min</small></summary>
            <div className="deep-dive-body progressive-body">
              <section className="explanation-stage stage-problem" data-step="1"><p className="eyebrow">Primero, el contexto</p><h4>Qué problema intentamos resolver</h4><p>{lesson.explanation[0]}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></p><p className="stage-check"><b>Antes de seguir:</b> formula con tus palabras qué se vuelve difícil si esta capacidad no existe.</p></section>
              <section className="mental-model explanation-stage" data-step="2"><p className="eyebrow">Después, la intuición</p><h4>Una imagen mental para organizarlo</h4><p>{lesson.deepDive.mentalModel}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></p><p className="stage-check"><b>Quédate con esto:</b> identifica entrada, transformación y resultado antes de entrar en detalles.</p></section>
              <section className="concepts explanation-stage" data-step="3"><div><p className="eyebrow">Ahora, el vocabulario</p><h4>Tres conceptos, de uno en uno</h4><p className="stage-intro">Lee primero la definición. Solo después conecta cada término con su utilidad práctica.</p></div><div className="concept-grid">{lesson.deepDive.concepts.map((concept, conceptIndex) => <article key={concept.term}><span>{conceptIndex + 1}</span><h5>{concept.term}</h5><p>{concept.definition}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></p><small><b>Por qué importa:</b> {concept.whyItMatters}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></small></article>)}</div></section>
              <section className="mechanics explanation-stage" data-step="4"><p className="eyebrow">Con las piezas claras</p><h4>Qué ocurre realmente y por qué</h4><p>{lesson.explanation[1]}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></p>{lesson.deepDive.mechanics.map((paragraph) => <p key={paragraph}>{paragraph}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></p>)}<p className="stage-check"><b>Comprueba:</b> recorre el proceso en orden y señala dónde se guarda estado, dónde puede fallar y quién tiene responsabilidad.</p></section>
              <section className="worked-scenario explanation-stage" data-step="5"><div><p className="eyebrow">Por último, aplícalo</p><h4>De la restricción a la decisión</h4><p>{lesson.deepDive.workedScenario.situation}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></p></div><ol>{lesson.deepDive.workedScenario.reasoning.map((step, stepIndex) => <li key={step}><span>{stepIndex + 1}</span><p>{step}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></p></li>)}</ol><div className="scenario-outcome"><b>Resultado defendible</b><p>{lesson.deepDive.workedScenario.outcome}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></p></div></section>
            </div>
          </details>
          <div className="code-example"><div className="code-example-header"><div><span>Paso 6 · {lesson.example.language}</span><b>{lesson.example.title}</b></div><CopyCodeButton code={lesson.example.code} /></div><pre><code>{lesson.example.code}</code></pre><p>{lesson.example.note}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></p></div>
          <div className="key-points"><h4>Haz una pausa: qué debes retener</h4><div>{lesson.keyPoints.map((point) => <span key={point}>✓ {point}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></span>)}</div></div>
          <div className="lesson-guidance"><div className="pitfalls"><h4>Errores frecuentes</h4>{lesson.pitfalls.map((pitfall) => <p key={pitfall}>× {pitfall}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></p>)}</div><div className="exam-decision"><h4>Decisión de examen</h4><p>{lesson.examDecision}<ClaimRefs module={module} lessonId={lesson.id} refIds={lesson.refIds} onSource={onSource} /></p></div></div>
          <RecallPrompt lesson={lesson} done={done} preview={preview} onRate={(rating) => handleRecall(lesson.id, rating)} />
          <details className="lesson-sources"><summary>Fuentes oficiales <i>{lesson.refIds.length}</i></summary><div>{lesson.refIds.map((id) => module.sources.find((source) => source.id === id)).filter((source): source is CurriculumModule["sources"][number] => Boolean(source)).map((source) => <a key={source.id} href={source.href} target="_blank" rel="noreferrer" onClick={() => onSource(lesson.id, source.id)}>{source.label}<small>{source.publisher} · {source.cloud} · {source.version} · revisada {source.reviewedAt}</small></a>)}</div></details>
        </div>}
      </details>;
    })}
    <details className="sources-card"><summary><span>Referencias oficiales del módulo</span><i>{module.sources.length}</i></summary><ul>{module.sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer">{source.label} <span>↗</span></a><small>{source.publisher} · {source.cloud} · revisada {source.reviewedAt}</small></li>)}</ul></details>
    <div className="view-next"><span>{preview ? "Vista previa: el progreso no cambia" : `${completedLessons.length}/5 lecciones completadas`}</span><button className="primary-button" onClick={onNext}>Ir al laboratorio <span>→</span></button></div>
  </div>;
}

function RecallPrompt({ lesson, done, preview, onRate }: { lesson: CurriculumModule["lessons"][number]; done: boolean; preview: boolean; onRate: (rating: ReviewRating) => void }) {
  const [draft, setDraft] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [rated, setRated] = useState<ReviewRating | null>(null);
  const [status, setStatus] = useState("");
  const ready = draft.trim().length >= 20;
  function rate(rating: ReviewRating) {
    if (rated) return;
    onRate(rating);
    setRated(rating);
    setStatus(rating === "good" ? "Recuerdo registrado. Volverá a aparecer según tu calendario de repaso." : "Programado para repasar mañana.");
  }
  return <section className={`retrieval-card ${done ? "is-review" : ""}`} aria-labelledby={`recall-title-${lesson.id}`}>
    <div className="retrieval-heading"><div><p className="eyebrow">Recuerdo activo</p><h4 id={`recall-title-${lesson.id}`}>{done ? "Comprueba si todavía puedes explicarlo." : "Explícalo antes de mirar la respuesta."}</h4></div><span>{done ? "Repaso" : "Para completar"}</span></div>
    <p className="retrieval-question">{lesson.checkpoint.question}</p>
    <label htmlFor={`recall-${lesson.id}`}>Tu explicación, con tus palabras</label>
    <textarea id={`recall-${lesson.id}`} value={draft} minLength={20} rows={4} disabled={preview} onChange={(event) => { setDraft(event.target.value); setStatus(""); }} placeholder="Escribe qué ocurre, por qué y qué decisión tomarías…" />
    {!revealed ? <div className="retrieval-actions"><small>{preview ? "Disponible cuando desbloquees el módulo." : ready ? "Ya puedes comparar." : "Escribe al menos una idea completa (20 caracteres)."}</small><button className="primary-button" disabled={preview || !ready} onClick={() => setRevealed(true)}>Comparar respuesta <span>→</span></button></div> : <>
      <div className="retrieval-answer" role="note"><span>Respuesta de referencia</span><p>{lesson.checkpoint.answer}</p></div>
      <div className="retrieval-rating"><p>Compara ideas, no palabras exactas. ¿Tu explicación incluía la relación y la decisión clave?</p><div><button className="secondary-button" disabled={Boolean(rated)} onClick={() => rate("again")}>Necesito repasarla</button><button className="primary-button" disabled={Boolean(rated)} onClick={() => rate("good")}>{done ? "La sigo explicando bien" : "La expliqué bien"}<span>✓</span></button></div></div>
    </>}
    <p className="retrieval-status" aria-live="polite">{status}</p>
  </section>;
}

function CopyCodeButton({ code }: { code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("failed");
    }
  }
  return <button type="button" onClick={copy} aria-live="polite">{status === "copied" ? "✓ Copiado" : status === "failed" ? "No se pudo copiar" : "Copiar código"}</button>;
}

function LabView({ module, code, cloud, result, passed, confirmed, showSolution, preview, onCloud, onCode, onConfirm, onRun, onEdit, onSolution, onNext }: { module: CurriculumModule; code: string; cloud: "AWS"|"Azure"|"GCP"; result: { checks:boolean[]; passed:boolean } | null; passed:boolean; confirmed:boolean; showSolution:boolean; preview:boolean; onCloud:(cloud:"AWS"|"Azure"|"GCP")=>void; onCode:(code:string)=>void; onConfirm:(confirmed:boolean)=>void; onRun:()=>void; onEdit:()=>void; onSolution:()=>void; onNext:()=>void }) {
  const cloudNote = module.lab.cloudNotes.find((item) => item.cloud === cloud)!;
  const clouds = ["AWS", "Azure", "GCP"] as const;
  const practiceMinutes = Math.round(module.minutes * (module.kind === "capstone" ? .4 : module.kind === "branch-project" ? .5 : .35));
  function handleCloudKey(event: KeyboardEvent<HTMLButtonElement>, currentCloud: typeof cloud) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = clouds.indexOf(currentCloud);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? clouds.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + clouds.length) % clouds.length;
    onCloud(clouds[nextIndex]);
    requestAnimationFrame(() => document.getElementById(`cloud-${clouds[nextIndex]}`)?.focus());
  }
  return <div id="panel-lab" className="lab-view" role="tabpanel" aria-labelledby="tab-lab" tabIndex={0}>
    <div className="lab-brief"><span>⌘</span><div><p className="eyebrow">{module.kind === "capstone" ? "Proyecto integrador" : "Práctica guiada"} · {formatHours(practiceMinutes)}</p><h3>{module.lab.title}</h3><p>{module.lab.goal}</p><small>{module.lab.scenario}</small></div></div>
    <section className="lab-purpose" aria-labelledby={`lab-purpose-${module.id}`}><div><p className="eyebrow">Para que sea útil</p><h4 id={`lab-purpose-${module.id}`}>Termina con una prueba observable, no solo con código copiado.</h4></div><ol><li><span>1</span><p><b>Construye</b>{module.lab.goal}</p></li><li><span>2</span><p><b>Comprueba</b>{module.lab.expectedOutcome}</p></li><li><span>3</span><p><b>Explica</b>Qué decisión tomaste, qué falló y cómo sabes que el resultado es correcto.</p></li></ol></section>
    <details className="lab-spec" aria-label="Ficha versionada del laboratorio">
      <summary className="lab-spec-head"><div><span>{module.lab.id}</span><strong>v{module.lab.version} · entorno y requisitos</strong></div><small>Revisado {module.lab.reviewedAt}</small></summary>
      <div className="lab-spec-grid"><article><span>Cloud y entorno</span><b>{cloud} · {module.lab.freeEdition.supported ? "Free Edition compatible" : "Cuenta de pago"}</b><p>{module.lab.environment}. {module.lab.freeEdition.note}</p></article><article><span>Runtime y compute</span><b>{module.lab.compute}</b><p>Referencia clásica: {module.lab.runtime.classic}</p></article><article><span>Coste estimado</span><b>{module.lab.freeEdition.supported ? module.lab.estimatedCost.free : module.lab.estimatedCost.paid[cloud]}</b><p>Alternativa {cloud}: {module.lab.estimatedCost.paid[cloud]}. {module.lab.estimatedCost.assumptions}</p></article><article><span>Estado de reproducibilidad</span><b>{module.lab.reproducibility.status === "independently-verified" ? "Verificado independientemente" : "Especificado · verificación pendiente"}</b><p>{module.lab.reproducibility.note} Ejecuciones independientes registradas: {module.lab.reproducibility.independentRuns}.</p></article><article><span>Dataset</span><b>{module.lab.dataset.name}</b><p>{module.lab.dataset.acquisition}</p></article><article><span>Resultado y validación</span><b>Salida verificable</b><p>{module.lab.expectedOutcome}</p></article></div>
      <div className="lab-prereqs"><span>Prerequisitos</span><ul>{module.lab.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div className="lab-prereqs"><span>Privilegios mínimos</span><ul>{module.lab.permissions.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div className="lab-spec-links"><a href={PLATFORM_REFERENCES.freeEdition.href} target="_blank" rel="noreferrer">Límites de Free Edition ↗</a><a href={PLATFORM_REFERENCES.runtime.href} target="_blank" rel="noreferrer">Runtime soportados ↗</a><a href={PLATFORM_REFERENCES.pricing.href} target="_blank" rel="noreferrer">Precios oficiales ↗</a></div>
    </details>
    <ol className="lab-steps">{module.lab.steps.map((step,index) => <li key={step}><span>{index+1}</span><p>{step}</p></li>)}</ol>
    <div className="evidence-card"><h4>Evidencia que debes conservar</h4><ul>{module.lab.expectedEvidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul></div>
    <div className="cloud-panel"><div className="cloud-tabs" role="tablist" aria-label="Variante de nube">{clouds.map((item) => <button id={`cloud-${item}`} role="tab" aria-controls="cloud-note" aria-selected={cloud===item} tabIndex={cloud===item?0:-1} className={cloud===item?"active":""} onKeyDown={(event) => handleCloudKey(event, item)} onClick={() => onCloud(item)} key={item}>{item}</button>)}</div><p id="cloud-note" role="tabpanel" aria-labelledby={`cloud-${cloud}`}>{cloudNote.note}</p></div>
    <div className="lab-boundary" role="note"><b>Este editor no ejecuta Databricks ni Spark.</b><span>Sirve para preparar y copiar el código. La validación real ocurre en tu workspace y debe producir la evidencia indicada arriba.</span></div>
    <div className="editor"><div className="editor-bar"><div><i/><i/><i/><b>{module.lab.solution.trimStart().match(/^(SELECT|CREATE|ALTER|MERGE|WITH|INSERT|GRANT)/) ? "starter.sql" : "starter.py"}</b></div><div className="editor-tools"><CopyCodeButton code={showSolution ? module.lab.solution : code} /><button disabled={preview || (!showSolution && !result && !passed)} title={preview ? "La solución permanece oculta en vista previa" : !result && !passed ? "Revisa primero la preparación" : undefined} onClick={onSolution}>{showSolution ? "Ocultar referencia" : "Ver referencia"}</button></div></div><textarea value={showSolution ? module.lab.solution : code} onChange={(event) => onCode(event.target.value)} readOnly={preview || showSolution || passed} spellCheck={false} aria-label="Borrador local del laboratorio" aria-describedby="sandbox-note"/><div className="editor-actions"><span id="sandbox-note">{preview ? "Vista previa de solo lectura; no se registra código, progreso ni XP." : passed ? "Evidencia registrada; usa «Editar y revalidar» para cambiarla." : "Revisión local de elementos esenciales; no ejecuta ni verifica resultados."}</span><button disabled={preview || passed} onClick={onRun}>Revisar preparación</button></div></div>
    <label className="evidence-confirm"><input type="checkbox" checked={confirmed} disabled={preview || passed} onChange={(event) => onConfirm(event.target.checked)} /><span><b>{preview ? "Disponible al desbloquear el módulo" : "He ejecutado la práctica en Databricks"}</b><small>{preview ? "Explorar este laboratorio no modifica el progreso." : "He comparado la salida con la evidencia esperada y no he incluido credenciales en el código."}</small></span></label>
    {result && <div className={`lab-result ${result.passed ? "passed":"failed"}`} role="status"><div><strong>{result.passed ? "✓ Laboratorio registrado" : "Falta preparación o evidencia"}</strong><span>{result.checks.filter(Boolean).length}/{result.checks.length} elementos</span></div>{module.lab.checks.map((check,index) => <p key={check.label} className={result.checks[index]?"ok":"missing"}>{result.checks[index]?"✓":"×"} {check.label}</p>)}{!confirmed && <p className="missing">× Falta confirmar la ejecución real</p>}{result.passed && <small>Registro basado en tu declaración; Lakehouse Lab no puede inspeccionar el workspace.</small>}</div>}
    {passed && !result && <div className="lab-result passed locked-result"><strong>✓ Laboratorio ya superado</strong><button className="secondary-button" onClick={onEdit}>Editar y revalidar</button></div>}
    <div className="lab-operations"><details><summary>Fallo intencionado y recuperación</summary><dl><div><dt>{module.lab.deliberateFailure.scenario}</dt><dd>{module.lab.deliberateFailure.recovery}</dd></div></dl></details><details><summary>Cleanup idempotente</summary><ol>{module.lab.cleanup.map((item) => <li key={item}><code>{item}</code></li>)}</ol></details><details><summary>Solución de fallos</summary><dl>{module.lab.troubleshooting.map((item) => <div key={item.symptom}><dt>{item.symptom}</dt><dd>{item.fix}</dd></div>)}</dl></details></div>
    <div className="lab-sources"><span>Fuentes verificadas</span>{module.sources.map((source) => <a key={source.id} href={source.href} target="_blank" rel="noreferrer">{source.label}<small>{source.publisher} · {source.version} · revisada {source.reviewedAt}</small></a>)}</div>
    <div className="view-next"><span>{preview ? "Vista previa: el progreso y el XP no cambian" : passed ? "Práctica completada" : "La comprobación no sustituye la ejecución en Databricks"}</span><button className="primary-button" onClick={onNext}>Hacer el test <span>→</span></button></div>
  </div>;
}

function QuizView({ module, answers, submitted, retryOnlyMistakes, score, preview, requirementsMet, examRequired, examDone, onExam, onAnswer, onSubmit, onRetryMistakes, onRetry, onBack }: { module: CurriculumModule; answers:Record<number,number>; submitted:boolean; retryOnlyMistakes:boolean; score?:number; preview:boolean; requirementsMet:boolean; examRequired:StoredExamMode|null; examDone:boolean; onExam:(mode:StoredExamMode)=>void; onAnswer:(question:number,option:number)=>void; onSubmit:()=>void; onRetryMistakes:()=>void; onRetry:()=>void; onBack:()=>void }) {
  const answered = Object.keys(answers).length;
  const attemptScore = module.quiz.reduce((total, question, index) => total + (answers[index] === question.answer ? 1 : 0), 0);
  const mistakes = module.quiz.length - attemptScore;
  const pending = module.quiz.length - answered;
  return <div id="panel-quiz" className="quiz-view" role="tabpanel" aria-labelledby="tab-quiz" tabIndex={0}>
    <div className="quiz-intro"><div><p className="eyebrow">Evaluación razonada</p><h3>{preview ? "Preguntas visibles, respuestas protegidas." : retryOnlyMistakes ? `Corrige ${pending} ${pending === 1 ? "decisión pendiente" : "decisiones pendientes"}.` : "Necesitas 3 de 4 respuestas correctas."}</h3><p>{preview ? "El test está en modo lectura. Desbloquea el módulo para responder, corregir y ganar XP." : retryOnlyMistakes ? "Tus respuestas correctas se conservan. Vuelve a razonar únicamente las que fallaste." : "Responde primero; después verás tu elección, la respuesta correcta y el razonamiento."}</p></div><strong>{submitted ? attemptScore : answered}/4</strong></div>
    <div className={`quiz-list ${preview ? "preview-quiz" : ""}`}>{module.quiz.map((question,index) => {
      const retainedCorrect = retryOnlyMistakes && !submitted && answers[index] === question.answer;
      return <fieldset key={question.question} className={retainedCorrect ? "retained-correct" : ""}><legend><span>{String(index+1).padStart(2,"0")}</span>{question.question}</legend><small className="domain-label">{question.domain}{retainedCorrect ? " · correcta conservada" : ""}</small><div>{question.options.map((option,optionIndex) => { const selected=answers[index]===optionIndex; const correct=question.answer===optionIndex; return <label key={option} className={submitted ? correct?"correct":selected?"incorrect":"" : selected?"selected":""}><input type="radio" name={`${module.id}-${index}`} checked={selected} disabled={preview || submitted || retainedCorrect} onChange={() => onAnswer(index,optionIndex)} /><span>{String.fromCharCode(65+optionIndex)}</span>{option}</label>; })}</div>{submitted && !preview && <div className="quiz-feedback"><span><b>Tu respuesta:</b> {answers[index] === undefined ? "Sin respuesta" : question.options[answers[index]]}</span><span><b>Respuesta correcta:</b> {question.options[question.answer]}</span><p>{question.explanation}</p></div>}</fieldset>;
    })}</div>
    {examRequired && !examDone && !preview && <div className="capstone-exam"><div><p className="eyebrow">Requisito del capstone</p><h3>Completa el simulacro {examRequired === "associate" ? "Associate" : "Professional"}.</h3><p>El intento es obligatorio para cerrar el proyecto. El 80% sigue siendo sólo un indicador interno de preparación.</p></div><button className="primary-button" onClick={() => onExam(examRequired)}>Abrir simulacro <span>→</span></button></div>}
    <div className="quiz-submit"><button className="secondary-button" onClick={onBack}>← Volver a lecciones</button><div aria-live="polite">{submitted && !preview && <p className={attemptScore>=3&&requirementsMet?"pass":"warn"}>{attemptScore>=3 ? requirementsMet ? "Módulo superado. El siguiente ya está disponible." : examRequired && !examDone ? "Test aprobado; falta completar el simulacro del capstone." : "Test aprobado; completa las lecciones y la práctica." : `Resultado de este intento: ${attemptScore}/4. Tu mejor marca es ${score ?? attemptScore}/4.`}</p>}{preview ? <button className="primary-button" disabled>Disponible al desbloquear</button> : submitted ? <div className="quiz-retry-actions">{mistakes > 0 && <button className="primary-button" onClick={onRetryMistakes}>Reintentar solo {mistakes} <span>→</span></button>}<button className="secondary-button" onClick={onRetry}>Repetir las 4</button></div> : <button className="primary-button" disabled={answered<4} onClick={onSubmit}>{retryOnlyMistakes ? `Corregir ${pending} pendientes` : "Corregir test"} <span>→</span></button>}</div></div>
  </div>;
}

function ExamSimulator({ mode, attempt, page, answers, submitted, previousScore, onPage, onAnswer, onSubmit, onRetry, onClose }: { mode:"associate"|"professional"; attempt:number; page:number; answers:Record<number,number>; submitted:boolean; previousScore?:number; onPage:(page:number)=>void; onAnswer:(index:number,answer:number)=>void; onSubmit:(score:number,completedAttempt:boolean)=>void; onRetry:()=>void; onClose:()=>void }) {
  const questions = useMemo(() => buildExamQuestions(mode, attempt), [mode, attempt]);
  const [priorScore] = useState(previousScore);
  const pageSize = 10;
  const pages = Math.ceil(questions.length/pageSize);
  const safePage = Math.min(Math.max(page, 0), pages - 1);
  const visible = questions.slice(safePage*pageSize, (safePage+1)*pageSize);
  const score = questions.reduce((sum,question,index) => sum+(answers[index]===question.answer?1:0),0);
  const exactRatio = score / questions.length;
  const percent = Math.round(exactRatio*100);
  const answered = Math.min(Object.keys(answers).length, questions.length);
  const completedAttempt = answered === questions.length;
  const isReady = completedAttempt && exactRatio >= .8;
  const blueprint = mode === "associate" ? associateBlueprint : professionalBlueprint;
  const officialSamples = officialSampleCatalog[mode];
  const originCounts = examOriginCounts[mode];
  const [secondsLeft, setSecondsLeft] = useState(mode === "associate" ? 90 * 60 : 120 * 60);
  useEffect(() => {
    if (submitted || secondsLeft <= 0) return;
    const interval = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [submitted, secondsLeft]);
  useEffect(() => {
    if (secondsLeft === 0 && !submitted) onSubmit(percent, completedAttempt);
  }, [secondsLeft, submitted, onSubmit, percent, completedAttempt]);
  const timer = `${String(Math.floor(secondsLeft / 60)).padStart(2,"0")}:${String(secondsLeft % 60).padStart(2,"0")}`;
  const domainStats = Object.entries(questions.reduce<Record<string,{ correct:number; total:number; moduleIds:Set<string> }>>((stats, question, index) => {
    const domain = question.domain || "Otros";
    const current = stats[domain] ?? { correct:0, total:0, moduleIds:new Set<string>() };
    current.total += 1;
    if (answers[index] === question.answer) current.correct += 1;
    if (question.moduleId) current.moduleIds.add(question.moduleId);
    stats[domain] = current;
    return stats;
  }, {})).map(([domain, stat]) => ({ ...stat, domain })).sort((a,b) => (a.correct/a.total)-(b.correct/b.total));
  return <main className="exam-shell">
    <header className="exam-header"><button className="brand as-button" onClick={onClose}><span className="brand-mark"><i/><i/><i/></span>Lakehouse Lab</button><div><span>{mode === "associate" ? "Associate":"Professional"}</span><b>{questions.length} preguntas · simulacro trazable</b></div><button className="secondary-button" onClick={onClose}>Cerrar</button></header>
    <div className="exam-progress" role="progressbar" aria-label="Preguntas respondidas" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answered}><i style={{width:`${(answered/questions.length)*100}%`}}/></div>
    <section className="exam-hero"><p className="eyebrow">Simulacro {mode === "associate" ? "Associate":"Professional"} · siempre disponible</p><h1>Piensa como ingeniero,<br/>no como memorizador<span>.</span></h1><p>Este intento selecciona {questions.length} preguntas de un banco de {examPoolSizes[mode]}. Contiene {originCounts.original} preguntas originales del curso y {originCounts.augmented} variantes sintéticas basadas en los objetivos de las muestras retiradas. Las {originCounts.official} muestras oficiales se consultan directamente en la guía y nunca se mezclan sin etiqueta. No usamos dumps ni preguntas activas del examen.</p><div><span>{answered}/{questions.length} respondidas</span><span aria-label={`Tiempo restante ${timer}`}>⏱ {timer}</span><span>Banco: {examPoolSizes[mode]}</span>{priorScore !== undefined && <span>Anterior: {priorScore}%</span>}<a href={blueprint} target="_blank" rel="noreferrer">Guía y muestras oficiales ↗</a></div></section>
    <section className="exam-origin-guide" aria-label="Procedencia de las preguntas"><div><span className="origin-badge origin-original">Original del curso</span><p>Pregunta escrita específicamente para Lakehouse Lab y alineada al blueprint.</p></div><div><span className="origin-badge origin-augmented">Sintética · ampliada desde muestra oficial</span><p>Cambia contexto, datos y distractores; conserva el objetivo de una muestra retirada.</p></div><details><summary>{officialSamples.length} muestras oficiales retiradas en la guía</summary><div>{officialSamples.map((sample) => <a key={sample.id} href={`${blueprint}#page=${sample.page}`} target="_blank" rel="noreferrer"><span>Oficial retirada · Q{sample.number}</span><b>{sample.objective}</b></a>)}</div></details></section>
    <section className="exam-questions"><div className="exam-page-heading"><span>Página {safePage+1} de {pages}</span><b>Preguntas {safePage*pageSize+1}—{Math.min((safePage+1)*pageSize,questions.length)}</b></div>{visible.map((question,localIndex) => { const index=safePage*pageSize+localIndex; return <fieldset key={`${question.moduleId}-${index}`}><legend><span>{String(index+1).padStart(2,"0")}</span>{question.question}</legend><div className="question-meta"><small className="domain-label">{question.domain}</small><small className={`origin-badge ${question.origin === "augmented-official-sample" ? "origin-augmented" : "origin-original"}`}>{question.originLabel ?? "Original del curso"}</small></div><div>{question.options.map((option,optionIndex) => <label key={option} className={submitted ? question.answer===optionIndex?"correct":answers[index]===optionIndex?"incorrect":"" : answers[index]===optionIndex?"selected":""}><input type="radio" name={`exam-${index}`} checked={answers[index]===optionIndex} disabled={submitted} onChange={() => onAnswer(index,optionIndex)}/><span>{String.fromCharCode(65+optionIndex)}</span>{option}</label>)}</div>{submitted && <p className="quiz-feedback"><b>{answers[index]===question.answer?"Correcta. ":"Respuesta recomendada. "}</b>{question.explanation}{question.augmentationMethod && <small className="augmentation-note">Método: {question.augmentationMethod}</small>}{question.sourceUrl && <a className="question-source" href={question.sourceUrl} target="_blank" rel="noreferrer">{question.sourceLabel ?? "Referencia oficial"} ↗</a>}</p>}</fieldset> })}</section>
    <div className="exam-nav"><button className="secondary-button" disabled={safePage===0} onClick={() => {onPage(safePage-1);window.scrollTo({top:0,behavior:scrollBehavior()})}}>← Anterior</button><div>{Array.from({length:pages},(_,index)=><button key={index} aria-label={`Ir a página ${index+1}`} className={`${safePage===index?"active":""} ${questions.slice(index*pageSize,(index+1)*pageSize).every((_,local) => answers[index*pageSize+local] !== undefined)?"answered":""}`} onClick={() => onPage(index)}>{index+1}</button>)}</div>{safePage<pages-1?<button className="primary-button" onClick={() => {onPage(safePage+1);window.scrollTo({top:0,behavior:scrollBehavior()})}}>Siguiente →</button>:<button className="primary-button" disabled={answered<questions.length || submitted} onClick={() => onSubmit(percent, true)}>Corregir simulacro →</button>}</div>
    {submitted && <section className="exam-summary" aria-live="polite"><div className={`exam-result ${isReady?"passed":"failed"}`}><strong>{percent}%</strong><div><h2>{!completedAttempt?"Intento no completado":isReady?"Preparación sólida":"Aún hay dominios que reforzar"}</h2><p>{!completedAttempt ? `El tiempo terminó con ${answered} de ${questions.length} preguntas respondidas. Este intento no completa el hito.` : `${score} de ${questions.length} respuestas correctas. Para alcanzar realmente el 80% necesitas al menos ${mode === "associate" ? 36 : 48} aciertos.`}</p><button className="secondary-button" onClick={onRetry}>Nuevo intento con otro orden</button></div></div><div className="domain-breakdown"><div><p className="eyebrow">Diagnóstico por dominio</p><h2>Empieza por tus áreas más débiles.</h2></div><div>{domainStats.map((stat) => { const ratio=Math.round((stat.correct/stat.total)*100); const moduleNumbers=[...stat.moduleIds].map((id)=>modules.find((module)=>module.id===id)?.number).filter(Boolean).join(", "); return <article key={stat.domain}><span>{ratio}%</span><div><b>{stat.domain}</b><small>{stat.correct}/{stat.total} correctas · repasa módulos {moduleNumbers}</small></div></article>; })}</div></div></section>}
  </main>;
}
