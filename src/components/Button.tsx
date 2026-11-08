import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong disabled:bg-accent/40",
  secondary: "bg-black/5 text-ink hover:bg-black/10 disabled:text-ink/40",
  ghost: "bg-transparent text-accent hover:bg-accent/10 disabled:text-accent/40",
  danger: "bg-blood text-white hover:brightness-95 disabled:bg-blood/40",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-14 px-6 text-base rounded-2xl",
  xl: "h-16 px-8 text-lg rounded-2xl",
};

export function Button({
  variant = "primary",
  size = "lg",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
