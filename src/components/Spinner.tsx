/** Small rotating ring shown inside a button while its request is running. */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-[1em] w-[1em] shrink-0 animate-spin rounded-full border-[3px] border-current border-t-transparent align-[-0.15em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${className}`}
    />
  );
}
