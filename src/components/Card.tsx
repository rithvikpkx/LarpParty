import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-3xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${className}`} {...props} />;
}
