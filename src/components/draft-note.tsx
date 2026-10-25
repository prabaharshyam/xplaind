// IQ-6 and ED-9: until a person reviews a record, the page says it is a draft.
export function DraftNote() {
  return (
    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
      Draft: written with AI help and not yet checked by a reviewer. Treat it as a starting point.
    </p>
  );
}
