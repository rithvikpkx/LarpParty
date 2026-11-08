import type { InputHTMLAttributes } from "react";

export function TextField({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="text-muted mb-2 block text-sm font-medium">{label}</span>
      <input
        className={`focus:border-accent focus:ring-accent/15 h-14 w-full rounded-2xl border border-black/10 bg-white px-4 text-lg transition outline-none focus:ring-4 ${className}`}
        {...props}
      />
    </label>
  );
}
