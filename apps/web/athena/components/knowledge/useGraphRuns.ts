/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * The indexed sources available to this workspace. Loaded once when the surface mounts,
 * because the list only changes when an operator runs a sync — not while someone is
 * searching.
 */
import { useCallback, useEffect, useState } from "react";
import { ChatApiError } from "../../api/http";
import { listGraphRuns } from "../../api/graphClient";
import type { GraphRun } from "../../types/graph";

export interface UseGraphRunsResult {
  readonly status: "loading" | "ready" | "error" | "empty";
  readonly runs: readonly GraphRun[];
  readonly error: string | null;
  readonly retry: () => void;
}

export function useGraphRuns(): UseGraphRunsResult {
  const [status, setStatus] = useState<UseGraphRunsResult["status"]>("loading");
  const [runs, setRuns] = useState<readonly GraphRun[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);

    listGraphRuns()
      .then((response) => {
        if (cancelled) return;
        setRuns(response.runs);
        setStatus(response.runs.length === 0 ? "empty" : "ready");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(cause instanceof ChatApiError ? cause.message : "Could not load indexed sources.");
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { status, runs, error, retry };
}
