/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Where Polo's own web app lives, for the "open in Polo" deep link
 * (D:/BIDCRM/apps/web/src/routes/AppRoutes.tsx:247 — `/opportunities/:id`). Same env-override
 * pattern as athena/config.ts's ATHENA_BFF_BASE_URL, so pointing at a non-default Polo
 * deployment is a one-line change.
 */
const DEFAULT_POLO_WEB_BASE_URL = "http://localhost:5173";

export const POLO_WEB_BASE_URL: string =
  (import.meta.env.VITE_POLO_WEB_URL as string | undefined) ?? DEFAULT_POLO_WEB_BASE_URL;
