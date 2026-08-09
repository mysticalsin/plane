/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Athena BFF git endpoints, prefix /api/v1/git (see ./types.ts's contract note). Read-only —
 * this surface lists repos, branches and (where available) commit history; cloning and
 * pushing happen from the user's own `git` client against the `cloneUrl` this returns, never
 * through this BFF.
 */
import { athenaFetch } from "../../api/http";
import type { GitRepoListResponse } from "./types";

export function listGitRepos(): Promise<GitRepoListResponse> {
  return athenaFetch<GitRepoListResponse>("/git/repos");
}
