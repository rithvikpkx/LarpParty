export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block size-6 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60 ${className}`}
      aria-label="Loading"
    />
  );
}
