/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Shared by AgentsPanel (lastAnsweredAt) and ProvidersPanel (updatedAt) — both render an ISO
 * timestamp or null the exact same way, so one function instead of two near-duplicates.
 */
export function formatSettingsTimestamp(iso: string | null): string {
  if (!iso) return "Never";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Never";
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
