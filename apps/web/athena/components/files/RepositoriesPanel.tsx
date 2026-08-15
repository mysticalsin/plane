/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Tab 2 of /:workspaceSlug/files — the workspace's git repos, each with its branches, clone
 * URL and (where the BFF provides it) commit history. Backed by Buzz's own git Smart-HTTP
 * server (D:/Buzz/crates/buzz-relay/src/api/git/transport.rs), not a bolted-on integration —
 * see ./types.ts's contract note.
 */
import { ChatEmptyState } from "../ChatEmptyState";
import { ChatErrorState } from "../ChatErrorState";
import { RepoListSkeleton } from "./GitSkeletons";
import { RepoCard } from "./RepoCard";
import { useGitRepos } from "./useGitRepos";

export function RepositoriesPanel() {
  const { status, repos, error, retry } = useGitRepos();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        {status === "loading" && <RepoListSkeleton />}
        {status === "error" && <ChatErrorState message={error ?? "Could not load repositories."} onRetry={retry} />}
        {status === "ready" && repos.length === 0 && (
          <ChatEmptyState
            title="No repositories yet"
            description="Repositories created for this workspace will show up here, with their clone URL and branches."
          />
        )}
        {status === "ready" && repos.length > 0 && (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {repos.map((repo) => (
              <RepoCard key={`${repo.owner}/${repo.repo}`} repo={repo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
