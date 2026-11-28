import { foundationsGlossary } from "./glossary-entries/foundations";
import { platformGlossary } from "./glossary-entries/platform";
import { storageGlossary } from "./glossary-entries/storage";
import { processingGlossary } from "./glossary-entries/processing";

export type GlossaryCategory =
  | "fundamentos"
  | "plataforma"
  | "gobierno"
  | "almacenamiento"
  | "ingesta"
  | "streaming"
  | "orquestacion"
  | "rendimiento"
  | "desarrollo"
  | "seguridad"
  | "coste";

/** Nivel recomendado para estudiar el término: de lo básico a lo especializado. */
export type GlossaryLevel = "fundamentos" | "intermedio" | "avanzado";

export type GlossaryLocalizedText = {
  /** Solo cuando el término cambia en inglés; si se omite se usa `term`. */
  term?: string;
  aliases: string[];
  definition: string;
  whyItMatters: string;
  example: string;
};

/**
 * Entrada canónica del glosario. Los campos de primer nivel están en español;
 * `en` contiene la redacción editorial inglesa equivalente. `id` es un ancla
 * pública persistente (`/glosario#id`) y `related` contiene IDs de otras
 * entradas para construir la red de conceptos.
 */
export type GlossaryEntry = {
  id: string;
  term: string;
  aliases: string[];
  category: GlossaryCategory;
  level: GlossaryLevel;
  definition: string;
  whyItMatters: string;
  example: string;
  related: string[];
  sourceUrl: string;
  sourceLabel: string;
  reviewedAt: string;
  en: GlossaryLocalizedText;
};

export const glossaryCategoryLabels: Record<GlossaryCategory, string> = {
  fundamentos: "Fundamentos",
  plataforma: "Plataforma",
  gobierno: "Gobierno",
  almacenamiento: "Almacenamiento",
  ingesta: "Ingesta",
  streaming: "Streaming",
  orquestacion: "Orquestación",
  rendimiento: "Rendimiento",
  desarrollo: "Desarrollo",
  seguridad: "Seguridad",
  coste: "Coste",
};

export const glossaryCategoryLabelsEn: Record<GlossaryCategory, string> = {
  fundamentos: "Foundations",
  plataforma: "Platform",
  gobierno: "Governance",
  almacenamiento: "Storage",
  ingesta: "Ingestion",
  streaming: "Streaming",
  orquestacion: "Orchestration",
  rendimiento: "Performance",
  desarrollo: "Development",
  seguridad: "Security",
  coste: "Cost",
};

export const glossaryLevelLabels: Record<GlossaryLevel, { es: string; en: string }> = {
  fundamentos: { es: "Fundamentos", en: "Foundations" },
  intermedio: { es: "Intermedio", en: "Intermediate" },
  avanzado: { es: "Avanzado", en: "Advanced" },
};

export const glossaryEntries: GlossaryEntry[] = [
  ...foundationsGlossary,
  ...platformGlossary,
  ...storageGlossary,
  ...processingGlossary,
];

export const glossaryEntryById: ReadonlyMap<string, GlossaryEntry> = new Map(
  glossaryEntries.map((entry) => [entry.id, entry]),
);
