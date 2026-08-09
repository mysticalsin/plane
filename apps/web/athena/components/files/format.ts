/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Intl-backed formatting only — no hand-rolled division-and-string-concat maths, per this
 * build's brief. Intl.NumberFormat's `unit` style already knows how to render "1.2 MB"; the
 * only manual work left is picking which unit fits the magnitude.
 */

const SIZE_UNITS: readonly { readonly unit: string; readonly bytesPerUnit: number }[] = [
  { unit: "terabyte", bytesPerUnit: 1_000_000_000_000 },
  { unit: "gigabyte", bytesPerUnit: 1_000_000_000 },
  { unit: "megabyte", bytesPerUnit: 1_000_000 },
  { unit: "kilobyte", bytesPerUnit: 1_000 },
];

export function formatFileSize(bytes: number): string {
  const fit = SIZE_UNITS.find((candidate) => bytes >= candidate.bytesPerUnit);
  const unit = fit?.unit ?? "byte";
  const value = fit ? bytes / fit.bytesPerUnit : bytes;
  return new Intl.NumberFormat(undefined, {
    style: "unit",
    unit,
    unitDisplay: "short",
    maximumFractionDigits: unit === "byte" ? 0 : 1,
  }).format(value);
}

export function formatFileDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

/** "application/pdf" -> "PDF", "image/png" -> "PNG". Falls back to the raw mime type when it
 * has no "/" to split on, rather than guessing — real data beats a wrong-looking label. */
export function formatFileType(mimeType: string): string {
  const subtype = mimeType.split("/")[1];
  if (!subtype) return mimeType;
  return subtype.replace(/^(x-|vnd\.)/, "").toUpperCase();
}
