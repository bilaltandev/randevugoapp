import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-on-brand hover:bg-brand-hover border border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(13,17,23,0.14)]",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-muted shadow-[0_1px_2px_rgba(13,17,23,0.05)]",
  ghost: "bg-transparent text-ink-2 border border-transparent hover:bg-surface-muted hover:text-ink",
  danger: "bg-surface text-danger border border-danger-line hover:bg-danger-soft",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
};

// rounded-button: a pill inside the dashboard, the site's usual corner elsewhere (see .dash-shell).
const BASE =
  "inline-flex items-center justify-center whitespace-nowrap rounded-button font-medium transition-[color,background-color,border-color,transform] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & { href: string };

export function buttonClasses(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "secondary", size = "md", className, children, ...rest } = props;
  const classes = buttonClasses(variant, size, className);

  if (typeof rest.href === "string") {
    const { href, ...anchorProps } = rest as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = rest as ButtonAsButton;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
