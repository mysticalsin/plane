/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Shared by AgentsPanel (lastAnsweredAt) and ProvidersPanel (updatedAt) — both render an ISO
 * timestamp or null the exact same way, so one function instead of two near-duplicates.
 *
 * Formats in UTC, deliberately. This app is server-rendered, and a local-time string differs
 * between the server (UTC) and the browser, which is a hydration mismatch. Where the local time
 * genuinely matters — a chat message's clock — use <LocalTime/>, which swaps to local after mount.
 * A settings row saying when a key was saved does not need that machinery.
 */
export function formatSettingsTimestamp(iso: string | null): string {
  if (!iso) return "Never";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "Never";
  return parsed.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}
