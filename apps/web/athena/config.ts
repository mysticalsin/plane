/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Single source for Athena's BFF location. Every athena/** module that talks to the BFF
 * imports from here, so pointing the whole chat surface at a different BFF (a different
 * host, a staging deployment) is a one-line change instead of a grep-and-replace.
 */

const DEFAULT_BFF_BASE_URL = "http://localhost:13101";

/** `import.meta.env` always exists under Vite; VITE_-prefixed vars are the only ones the
 * client bundle can see (see apps/web/vite.config.ts's `viteEnv` filter). */
export const ATHENA_BFF_BASE_URL: string =
  (import.meta.env.VITE_ATHENA_BFF_URL as string | undefined) ?? DEFAULT_BFF_BASE_URL;

export const ATHENA_API_BASE = `${ATHENA_BFF_BASE_URL}/api/v1`;
export const ATHENA_CHAT_API_BASE = `${ATHENA_API_BASE}/chat`;
