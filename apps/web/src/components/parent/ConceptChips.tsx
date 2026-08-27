/**
 * Concept names as chips — the real concepts a learner has explored, shown as
 * tags instead of a bare count. Shared by the parent Dashboard and Progress
 * pages. The caller supplies the surrounding heading.
 */
export function ConceptChips({ concepts }: { concepts: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {concepts.map((concept) => (
        <li
          key={concept}
          className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium"
        >
          💡 {concept}
        </li>
      ))}
    </ul>
  );
}
