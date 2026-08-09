/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Shared focus-visible treatment for every interactive element this surface adds: a solid
 * 2px ring in the accent color, which sits well above the 3:1 non-text contrast floor
 * against both light and dark surface-1 (design-standards.md's required-states rule).
 */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1";
