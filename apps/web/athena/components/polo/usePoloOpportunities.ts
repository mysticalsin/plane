/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Mirrors athena/hooks/useChatChannels.ts's status/error/retry shape (design-standards.md:
 * every data-fetching component needs loading + error + empty states). Debounces `search` by
 * 300ms so a fast typist doesn't fire one request per keystroke.
 */
import { useCallback, useEffect, useState } from "react";
import { ChatApiError } from "../../api/http";
import { listPoloOpportunities } from "./poloApi";
import type { PoloFetchStatus, PoloOpportunity } from "./types";

const SEARCH_DEBOUNCE_MS = 300;

export interface UsePoloOpportunitiesResult {
  readonly status: PoloFetchStatus;
  readonly opportunities: readonly PoloOpportunity[];
  readonly error: string | null;
  readonly search: string;
  readonly setSearch: (value: string) => void;
  readonly retry: () => void;
}

export function usePoloOpportunities(): UsePoloOpportunitiesResult {
  const [status, setStatus] = useState<PoloFetchStatus>("loading");
  const [opportunities, setOpportunities] = useState<readonly PoloOpportunity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    listPoloOpportunities({ search: debouncedSearch || undefined, limit: 100 })
      .then((page) => {
        if (cancelled) return;
        setOpportunities(page.items);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ChatApiError ? err.message : "Could not load opportunities from Polo.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { status, opportunities, error, search, setSearch, retry };
}
