/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Knowledge-graph API calls. Goes through athenaFetch like every other athena/** network
 * call, so the session cookie, error envelope and correlation id are handled in one place.
 */

import type {
  GraphNeighborsResponse,
  GraphPathResponse,
  GraphRunListResponse,
  GraphSearchResponse,
} from "../types/graph";
import { athenaFetch } from "./http";

/** Only ever appends a source when one is chosen, so the BFF's "most recent run" default stands. */
function withSource(params: URLSearchParams, sourceKey?: string): URLSearchParams {
  if (sourceKey) params.set("sourceKey", sourceKey);
  return params;
}

export function listGraphRuns(): Promise<GraphRunListResponse> {
  return athenaFetch<GraphRunListResponse>("/graph/runs");
}

export function searchGraph(query: string, sourceKey?: string, limit = 25): Promise<GraphSearchResponse> {
  const params = withSource(new URLSearchParams({ q: query, limit: String(limit) }), sourceKey);
  return athenaFetch<GraphSearchResponse>(`/graph/search?${params.toString()}`);
}

export function getGraphNeighbors(nodeId: string, sourceKey?: string, limit = 60): Promise<GraphNeighborsResponse> {
  const params = withSource(new URLSearchParams({ limit: String(limit) }), sourceKey);
  // The node id can contain characters that are legal in a path segment but change its meaning,
  // so it is encoded rather than interpolated raw.
  return athenaFetch<GraphNeighborsResponse>(
    `/graph/nodes/${encodeURIComponent(nodeId)}/neighbors?${params.toString()}`
  );
}

export function findGraphPath(from: string, to: string, sourceKey?: string): Promise<GraphPathResponse> {
  const params = withSource(new URLSearchParams({ from, to }), sourceKey);
  return athenaFetch<GraphPathResponse>(`/graph/path?${params.toString()}`);
}

/** Removes an indexed source and every run for it. */
export function deleteGraphSource(sourceKey: string): Promise<void> {
  return athenaFetch<void>(`/graph/sources/${encodeURIComponent(sourceKey)}`, { method: "DELETE" });
}
