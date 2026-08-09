/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Backs the detail panel: fetches GET /polo/opportunities/:id independently of the list, so
 * the panel has its own skeleton/error/retry rather than silently reusing the row already in
 * memory (proves the detail route end to end, and would pick up fields the list omits).
 */
import { useCallback, useEffect, useState } from "react";
import { ChatApiError } from "../../api/http";
import { getPoloOpportunity } from "./poloApi";
import type { PoloFetchStatus, PoloOpportunity } from "./types";

export interface UsePoloOpportunityResult {
  readonly status: PoloFetchStatus;
  readonly opportunity: PoloOpportunity | null;
  readonly error: string | null;
  readonly retry: () => void;
}

export function usePoloOpportunity(id: string | null): UsePoloOpportunityResult {
  const [status, setStatus] = useState<PoloFetchStatus>("ready");
  const [opportunity, setOpportunity] = useState<PoloOpportunity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) {
      setOpportunity(null);
      setStatus("ready");
      setError(null);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    getPoloOpportunity(id)
      .then((result) => {
        if (cancelled) return;
        setOpportunity(result);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ChatApiError ? err.message : "Could not load this opportunity from Polo.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { status, opportunity, error, retry };
}
