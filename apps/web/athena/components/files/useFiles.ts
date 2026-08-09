/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Mirrors ../polo/usePoloOpportunities.ts's status/error/retry/debounced-search shape.
 * `refresh` is `retry` under a second name — used both for "try again" after an error and to
 * re-fetch the list after an upload or delete succeeds, so a mutation and a manual retry are
 * indistinguishable to the fetch effect below.
 */
import { useCallback, useEffect, useState } from "react";
import { ChatApiError } from "../../api/http";
import { listFiles } from "./filesApi";
import type { FileAttachment, FilesFetchStatus } from "./types";

const SEARCH_DEBOUNCE_MS = 300;

export interface UseFilesResult {
  readonly status: FilesFetchStatus;
  readonly files: readonly FileAttachment[];
  readonly error: string | null;
  readonly search: string;
  readonly setSearch: (value: string) => void;
  readonly engagementId: string;
  readonly setEngagementId: (value: string) => void;
  readonly channelId: string;
  readonly setChannelId: (value: string) => void;
  readonly retry: () => void;
  readonly refresh: () => void;
}

export function useFiles(): UseFilesResult {
  const [status, setStatus] = useState<FilesFetchStatus>("loading");
  const [files, setFiles] = useState<readonly FileAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [engagementId, setEngagementId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    listFiles({
      search: debouncedSearch || undefined,
      engagementId: engagementId || undefined,
      channelId: channelId || undefined,
      limit: 200,
    })
      .then((page) => {
        if (cancelled) return;
        setFiles(page.items);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ChatApiError ? err.message : "Could not load files.");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, engagementId, channelId, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    status,
    files,
    error,
    search,
    setSearch,
    engagementId,
    setEngagementId,
    channelId,
    setChannelId,
    retry,
    refresh: retry,
  };
}
