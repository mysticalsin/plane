/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Deterministic per-author color, hashed from the Nostr pubkey — the same identity gets the
 * same color every time, across sessions, channels, and light/dark mode (Slack's per-person
 * avatar-color scheme, minus the fixed palette — a hash means we never run out of colors as
 * agents are added). Fixed saturation/lightness per theme keeps every hash's contrast against
 * that theme's surface-1 background comfortably above WCAG's 3:1 non-text floor.
 */

const HUE_STRIDE = 47; // avoids a plain modulo clustering adjacent hashes into adjacent hues

function hashToHue(pubkey: string): number {
  let hash = 0;
  for (let i = 0; i < pubkey.length; i++) {
    hash = (hash * 31 + pubkey.charCodeAt(i)) >>> 0;
  }
  return (hash * HUE_STRIDE) % 360;
}

export function authorColor(pubkey: string, mode: "light" | "dark"): string {
  const hue = hashToHue(pubkey || "unknown");
  return mode === "dark" ? `hsl(${hue}, 65%, 68%)` : `hsl(${hue}, 55%, 36%)`;
}
