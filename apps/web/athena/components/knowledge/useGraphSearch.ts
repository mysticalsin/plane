/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Search state for the knowledge graph. Mirrors ../files/useFiles.ts's
 * status/error/retry/debounced-search shape so the two surfaces behave identically.
 *
 * An empty query is treated as "idle", not as a search for everything: the BFF requires a
 * non-empty q, and firing a request on every cleared input would produce a 400 the user
 * never asked for.
 */
import { useCallback, useEffect, useState } from "react";
import { ChatApiError } from "../../api/http";
import { searchGraph } from "../../api/graphClient";
import type { GraphNode, GraphRun } from "../../types/graph";

const SEARCH_DEBOUNCE_MS = 300;

export type GraphFetchStatus = "idle" | "loading" | "ready" | "error" | "empty";

export interface UseGraphSearchResult {
  readonly status: GraphFetchStatus;
  readonly nodes: readonly GraphNode[];
  readonly run: GraphRun | null;
  readonly error: string | null;
  readonly search: string;
  readonly setSearch: (value: string) => void;
  readonly retry: () => void;
}

export function useGraphSearch(sourceKey: string | undefined): UseGraphSearchResult {
  const [status, setStatus] = useState<GraphFetchStatus>("idle");
  const [nodes, setNodes] = useState<readonly GraphNode[]>([]);
  const [run, setRun] = useState<GraphRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.length === 0) {
      setStatus("idle");
      setNodes([]);
      setError(null);
      return;
    }

    // `cancelled` guards against a slow earlier query resolving after a later one and
    // overwriting fresher results with stale ones.
    let cancelled = false;
    setStatus("loading");
    setError(null);

    searchGraph(debouncedSearch, sourceKey)
      .then((response) => {
        if (cancelled) return;
        setRun(response.run);
        setNodes(response.nodes);
        setStatus(response.nodes.length === 0 ? "empty" : "ready");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(cause instanceof ChatApiError ? cause.message : "Could not search the knowledge graph.");
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, sourceKey, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { status, nodes, run, error, search, setSearch, retry };
}
