/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Athena BFF Polo endpoints, prefix /api/v1/polo (see athena/config.ts's ATHENA_API_BASE).
 * Read-only — Athena does not write to Polo yet. Reuses the same `athenaFetch` every other
 * athena/** surface uses (../../api/http) rather than a second fetch wrapper.
 */

import { athenaFetch } from "../../api/http";
import type { PoloOpportunity, PoloOpportunityPage } from "./types";

export interface ListPoloOpportunitiesParams {
  readonly search?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export function listPoloOpportunities(params: ListPoloOpportunitiesParams = {}): Promise<PoloOpportunityPage> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return athenaFetch<PoloOpportunityPage>(`/polo/opportunities${qs ? `?${qs}` : ""}`);
}

export function getPoloOpportunity(id: string): Promise<PoloOpportunity> {
  return athenaFetch<PoloOpportunity>(`/polo/opportunities/${encodeURIComponent(id)}`);
}
