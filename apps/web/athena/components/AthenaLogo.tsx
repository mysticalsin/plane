/**
 * Athena brand mark — a minimal geometric owl monogram.
 * Shared brand constant used anywhere apps/web needs the Athena logo
 * instead of the upstream Plane mark (@plane/propel/icons PlaneLogo).
 */

import * as React from "react";

export interface AthenaLogoProps extends React.SVGAttributes<SVGElement> {
  className?: string;
  width?: string | number;
  height?: string | number;
  color?: string;
}

export const ATHENA_ACCENT = "#006b4f";

export function AthenaLogo({
  width = "40",
  height = "40",
  className,
  color = "currentColor",
  ...rest
}: AthenaLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      {/* head */}
      <path
        d="M20 3C11.716 3 5 9.716 5 18v6a4 4 0 0 0 4 4h1.2l2.4 6.2a1 1 0 0 0 1.86.06L16.6 28h6.8l2.14 6.26a1 1 0 0 0 1.86-.06L29.8 28H31a4 4 0 0 0 4-4v-6c0-8.284-6.716-15-15-15Z"
        fill={color}
      />
      {/* ear tufts */}
      <path d="M9 8 5 2l6.2 2.4L9 8Z" fill={color} />
      <path d="M31 8 35 2l-6.2 2.4L31 8Z" fill={color} />
      {/* eyes (cut-outs) */}
      <circle cx="14.5" cy="18" r="4" fill="var(--athena-logo-bg, #fff)" />
      <circle cx="25.5" cy="18" r="4" fill="var(--athena-logo-bg, #fff)" />
      <circle cx="14.5" cy="18" r="1.6" fill={color} />
      <circle cx="25.5" cy="18" r="1.6" fill={color} />
      {/* beak */}
      <path d="M18.6 21.5h2.8L20 24.6l-1.4-3.1Z" fill="var(--athena-logo-bg, #fff)" />
    </svg>
  );
}

export interface AthenaLockupProps extends React.SVGAttributes<SVGElement> {
  className?: string;
  width?: string | number;
  height?: string | number;
}

/**
 * Mark plus wordmark, for the places upstream uses PlaneLockup (auth header, onboarding).
 * Inherits `currentColor` so it adapts to light and dark exactly as the mark it replaces did.
 */
export function AthenaLockup({ width = 110, height = 22, className, ...rest }: AthenaLockupProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Athena"
      {...rest}
    >
      <g transform="translate(0,2)">
        <path
          d="M20 3C11.716 3 5 9.716 5 18v6a4 4 0 0 0 4 4h1.2l2.4 6.2a1 1 0 0 0 1.86.06L16.6 28h6.8l2.14 6.26a1 1 0 0 0 1.86-.06L29.8 28H31a4 4 0 0 0 4-4v-6c0-8.284-6.716-15-15-15Z"
          fill="currentColor"
        />
        <path d="M9 8 5 2l6.2 2.4L9 8Z" fill="currentColor" />
        <path d="M31 8 35 2l-6.2 2.4L31 8Z" fill="currentColor" />
        <circle cx="14.5" cy="18" r="4" fill="var(--athena-logo-bg, #0c0c0e)" />
        <circle cx="25.5" cy="18" r="4" fill="var(--athena-logo-bg, #0c0c0e)" />
        <circle cx="14.5" cy="18" r="1.6" fill="currentColor" />
        <circle cx="25.5" cy="18" r="1.6" fill="currentColor" />
      </g>
      <text
        x="50"
        y="30"
        fill="currentColor"
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontSize="26"
        fontWeight="600"
        letterSpacing="0.5"
      >
        Athena
      </text>
    </svg>
  );
}
