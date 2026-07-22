export function conceptAnchor(lessonId: string, term: string) {
  const slug = term
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return `concept-${lessonId}-${slug || "termino"}`;
}
