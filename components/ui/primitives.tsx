"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-line",
        "disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-9 px-4 text-sm",
        variant === "default" &&
          "border border-border bg-surface-2 text-offwhite hover:border-border-strong hover:bg-[#1c1c21]",
        variant === "primary" &&
          "bg-accent text-[#04120f] hover:brightness-110 font-semibold",
        variant === "ghost" &&
          "text-muted hover:text-offwhite hover:bg-white/5",
        variant === "danger" &&
          "border border-border text-bad hover:bg-bad/10",
        className
      )}
      {...props}
    />
  );
}

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("panel", className)}>{children}</div>;
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "bad" | "accent";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tone === "neutral" && "border-border text-muted",
        tone === "ok" && "border-ok/30 text-ok bg-ok/5",
        tone === "warn" && "border-warn/30 text-warn bg-warn/5",
        tone === "bad" && "border-bad/30 text-bad bg-bad/5",
        tone === "accent" && "border-accent-line text-accent bg-accent-dim",
        className
      )}
    >
      {children}
    </span>
  );
}

export function LiveDot({
  tone = "accent",
  className,
}: {
  tone?: "accent" | "ok" | "warn" | "bad" | "muted";
  className?: string;
}) {
  const color =
    tone === "ok"
      ? "bg-ok"
      : tone === "warn"
        ? "bg-warn"
        : tone === "bad"
          ? "bg-bad"
          : tone === "muted"
            ? "bg-faint"
            : "bg-accent";
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)}>
      {tone !== "muted" && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-60 animate-pulse-dot",
            color
          )}
        />
      )}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", color)} />
    </span>
  );
}

export function Mono({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("num text-offwhite", className)}>{children}</span>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full", className)} />;
}

export function StatTile({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "neutral" | "accent" | "ok" | "bad";
}) {
  return (
    <Panel className="px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-faint">
        {label}
      </div>
      <div
        className={cn(
          "num mt-1 text-2xl font-semibold tabular-nums",
          tone === "accent" && "text-accent",
          tone === "ok" && "text-ok",
          tone === "bad" && "text-bad",
          tone === "neutral" && "text-offwhite"
        )}
      >
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
    </Panel>
  );
}

export function SectionTitle({
  index,
  title,
  right,
}: {
  index?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-baseline gap-3">
        {index ? (
          <span className="num text-xs text-faint">{index}</span>
        ) : null}
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="num rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
      {children}
    </kbd>
  );
}
