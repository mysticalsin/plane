/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */
import { useCallback, useEffect, useState } from "react";
import { ChatApiError } from "../../api/http";
import { listGitRepos } from "./gitApi";
import type { GitFetchStatus, GitRepo } from "./types";

export interface UseGitReposResult {
  readonly status: GitFetchStatus;
  readonly repos: readonly GitRepo[];
  readonly error: string | null;
  readonly retry: () => void;
}

export function useGitRepos(): UseGitReposResult {
  const [status, setStatus] = useState<GitFetchStatus>("loading");
  const [repos, setRepos] = useState<readonly GitRepo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    listGitRepos()
      .then((res) => {
        if (cancelled) return;
        setRepos(res.repos);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ChatApiError ? err.message : "Could not load repositories.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { status, repos, error, retry };
}
