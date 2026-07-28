import type { LearningPathId, LearningPathProfile } from "../learning-paths";
import { DURATION_METHOD, learningPathProfiles } from "../learning-paths";
import type { Locale } from "./config";

const durationMethodEn =
  "Durations add the minutes defined for each curriculum module. Every module includes five lessons, one lab, and one assessment. The labs-only path estimates practical work only: 45 min per standard lab, 75 min per branch project, and 120 min for a capstone.";

const learningPathCopyEn: Record<LearningPathId, Pick<LearningPathProfile, "title" | "shortTitle" | "cta" | "forWhom" | "prerequisites" | "objective" | "expectedOutcome">> = {
  associate: {
    title: "Prepare for Data Engineer Associate",
    shortTitle: "Associate",
    cta: "View Associate modules",
    forWhom: "People who already know basic SQL or Python and want to structure Databricks fundamentals.",
    prerequisites: "Basic SQL, tabular data concepts, and comfort reading technical material.",
    objective: "Cover platform foundations, Delta Lake, ingestion, transformation, Jobs, Unity Catalog, and essential CI/CD.",
    expectedOutcome: "Reach the Associate practice exam with core domains practiced through guided labs.",
  },
  professional: {
    title: "Prepare for Data Engineer Professional",
    shortTitle: "Professional",
    cta: "View the full path",
    forWhom: "Data engineers with Associate-level fundamentals who need to practice production decisions.",
    prerequisites: "Lakehouse foundations, Spark/SQL, and experience reading data pipelines or notebooks.",
    objective: "Connect streaming, CDC, orchestration, performance, FinOps, security, CI/CD, and governance.",
    expectedOutcome: "Build technical judgment for the Professional practice exam and lakehouse architecture reviews.",
  },
  "databricks-cero": {
    title: "Learn Databricks from scratch",
    shortTitle: "From scratch",
    cta: "Start with fundamentals",
    forWhom: "People who want to understand Databricks before thinking about an exam.",
    prerequisites: "Curiosity about data engineering; SQL helps, but the path starts from base concepts.",
    objective: "Build the mental model for platform, compute, notebooks, Spark, Delta, medallion, and Jobs.",
    expectedOutcome: "Navigate the workspace, read a data plan, and execute small practices with judgment.",
  },
  "streaming-cdc": {
    title: "Improve in streaming and CDC",
    shortTitle: "Streaming and CDC",
    cta: "View streaming branch",
    forWhom: "Practitioners who already work with batch and need state, late events, and incremental changes.",
    prerequisites: "Spark, Delta Lake, and Jobs fundamentals; ideally after the Associate section.",
    objective: "Practice Structured Streaming, watermarks, Kafka, Change Data Feed, AUTO CDC, and an SLA project.",
    expectedOutcome: "Design incremental flows with checkpoints, recovery, and explicit latency decisions.",
  },
  laboratorios: {
    title: "Practice with labs",
    shortTitle: "Labs",
    cta: "Open practical resources",
    forWhom: "People who learn best by executing, comparing evidence, and reviewing notebooks.",
    prerequisites: "Access to Databricks Free Edition or an isolated workspace when a lab requires one.",
    objective: "Work through guided practices with starter code, checks, expected evidence, and supporting resources.",
    expectedOutcome: "Collect reproducible evidence and identify which concepts need review before assessment.",
  },
};

function localizedDurationLabel(minutes: number, locale: Locale) {
  const hours = Math.round(minutes / 60);
  return locale === "en" ? `~${hours} h` : `${hours} h aprox.`;
}

export function localizeDurationMethod(locale: Locale) {
  return locale === "en" ? durationMethodEn : DURATION_METHOD;
}

export function localizeLearningPathProfile(path: LearningPathProfile, locale: Locale): LearningPathProfile {
  if (locale === "es") return path;
  return {
    ...path,
    ...learningPathCopyEn[path.id],
    durationLabel: localizedDurationLabel(path.durationMinutes, locale),
  };
}

export function localizeLearningPathProfiles(locale: Locale): LearningPathProfile[] {
  return learningPathProfiles.map((path) => localizeLearningPathProfile(path, locale));
}
