/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * `commits === null` and `commits === []` are deliberately rendered differently: null means
 * the BFF has no commit-log endpoint for this repo yet ("not available yet"), an empty array
 * means the endpoint answered and the repo genuinely has zero commits — collapsing the two
 * into one "no commits" empty state would quietly claim knowledge the app doesn't have.
 */
import { GitBranch } from "lucide-react";
import { CopyButton } from "../settings/shared/CopyButton";
import { formatFileDate } from "./format";
import type { GitRepo } from "./types";

function BranchPill(props: { name: string; isDefault: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-subtle-1 px-2 py-0.5 text-12 text-secondary">
      <GitBranch className="size-3 flex-shrink-0" strokeWidth={1.75} />
      {props.name}
      {props.isDefault && <span className="text-tertiary">default</span>}
    </span>
  );
}

function CommitHistory(props: { repo: GitRepo }) {
  const { commits } = props.repo;

  if (commits === null) {
    return (
      <p className="rounded-md bg-layer-1 px-3 py-2 text-12 text-tertiary">
        Commit history is not available yet for this repository.
      </p>
    );
  }

  if (commits.length === 0) {
    return <p className="rounded-md bg-layer-1 px-3 py-2 text-12 text-tertiary">No commits yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-subtle rounded-md border border-subtle">
      {commits.map((commit) => (
        <li key={commit.sha} className="flex items-center gap-3 px-3 py-2 text-13">
          <span className="font-mono flex-shrink-0 rounded bg-layer-2 px-1.5 py-0.5 text-12 text-secondary">
            {commit.sha.slice(0, 7)}
          </span>
          <span className="min-w-0 flex-1 truncate text-primary">{commit.message}</span>
          <span className="flex-shrink-0 text-12 text-tertiary">{commit.authorName}</span>
          <span className="flex-shrink-0 text-12 text-tertiary tabular-nums">{formatFileDate(commit.authoredAt)}</span>
        </li>
      ))}
    </ul>
  );
}

export function RepoCard(props: { repo: GitRepo }) {
  const { repo } = props;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-subtle p-4">
      <div>
        <h3 className="text-14 font-semibold text-primary">
          {repo.owner}/{repo.name}
        </h3>
      </div>

      <div className="flex items-center gap-1 rounded-md border border-subtle-1 bg-layer-1 pl-3">
        <code className="min-w-0 flex-1 truncate text-13 text-secondary">{repo.cloneUrl}</code>
        <CopyButton value={repo.cloneUrl} label={`Copy the clone URL for ${repo.name}`} />
      </div>
      <p className="text-12 text-tertiary">
        This is a real git remote — <code className="text-secondary">git clone</code> this URL to work on {repo.name}{" "}
        locally, and <code className="text-secondary">git push</code> to send commits back here.
      </p>

      {repo.branches.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {repo.branches.map((branch) => (
            <BranchPill key={branch.name} name={branch.name} isDefault={branch.name === repo.defaultBranch} />
          ))}
        </div>
      ) : (
        <p className="text-12 text-tertiary">No branches yet.</p>
      )}

      <CommitHistory repo={repo} />
    </div>
  );
}
