/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Just enough of GET /api/v1/engagements (apps/bff/src/routes/engagements.ts — a real,
 * already-shipped route, unlike files/git above) to populate the engagement filter dropdown.
 * Mirrors only the fields this surface reads from @mantu/athena-domain's ApiEngagementSchema
 * (id, name) rather than pulling in the full shape this surface never uses.
 */
import { athenaFetch } from "../../api/http";

export interface EngagementOption {
  readonly id: string;
  readonly name: string;
}

interface EngagementListResponse {
  readonly engagements: readonly EngagementOption[];
}

export async function listEngagementOptions(): Promise<readonly EngagementOption[]> {
  const res = await athenaFetch<EngagementListResponse>("/engagements");
  return res.engagements;
}

/** Idempotent server-side on (workspace, name) — creating one that exists returns the existing row. */
export function createEngagement(name: string): Promise<EngagementOption> {
  return athenaFetch<EngagementOption>("/engagements", { method: "POST", body: JSON.stringify({ name }) });
}
