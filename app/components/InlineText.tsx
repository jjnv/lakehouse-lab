/**
 * Renderiza texto editorial con marcado mínimo en línea: `código` y **negrita**.
 * No interpreta HTML, de modo que el contenido sigue escapado por React.
 */
export default function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g).filter(Boolean);
  return <>{parts.map((part, index) => part.startsWith("`") && part.endsWith("`") && part.length > 1
    ? <code key={index}>{part.slice(1, -1)}</code>
    : part.startsWith("**") && part.endsWith("**") && part.length > 3
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part)}</>;
}
