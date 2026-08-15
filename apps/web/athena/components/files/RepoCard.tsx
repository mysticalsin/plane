/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * One repository announced on the relay: how to clone it, and what branches it has.
 *
 * This card used to render `repo.branches` and a commit history from fields the BFF has never
 * sent, so the tab threw on the first repo it drew. Branches now come from the refs endpoint that
 * does exist, fetched per card; commit history does not appear at all, because the relay
 * advertises refs and serves packs and has no log to ask for — the BFF answers `/log` with an
 * explicit "not supported", and a card that renders an empty list instead would be claiming the
 * repository has no commits.
 */
import { useEffect, useState } from "react";
import { GitBranch } from "lucide-react";
import { ChatApiError } from "../../api/http";
import { CopyButton } from "../settings/shared/CopyButton";
import { getGitRefs } from "./gitApi";
import type { GitRefs, GitRepo } from "./types";

function BranchPill(props: { name: string; isHead: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-subtle-1 px-2 py-0.5 text-12 text-secondary">
      <GitBranch className="size-3 flex-shrink-0" strokeWidth={1.75} />
      {props.name}
      {props.isHead && <span className="text-tertiary">default</span>}
    </span>
  );
}

/** `refs/heads/main` → `main`; tags are not branches and are left out. */
function branchNames(refs: GitRefs): readonly string[] {
  return Object.keys(refs.refs)
    .filter((ref) => ref.startsWith("refs/heads/"))
    .map((ref) => ref.slice("refs/heads/".length))
    .toSorted();
}

function Branches(props: { refs: GitRefs | null; error: string | null }) {
  const { refs, error } = props;

  if (error) {
    return <p className="rounded-md bg-layer-1 px-3 py-2 text-12 text-tertiary">Could not read branches: {error}</p>;
  }
  if (!refs) {
    return <p className="text-12 text-tertiary">Reading branches…</p>;
  }

  const names = branchNames(refs);
  if (names.length === 0) {
    return <p className="text-12 text-tertiary">No branches yet — nothing has been pushed.</p>;
  }

  const head = refs.head?.startsWith("refs/heads/") ? refs.head.slice("refs/heads/".length) : null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map((name) => (
        <BranchPill key={name} name={name} isHead={name === head} />
      ))}
    </div>
  );
}

export function RepoCard(props: { repo: GitRepo }) {
  const { repo } = props;
  const [refs, setRefs] = useState<GitRefs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const displayName = repo.name ?? repo.repo;

  useEffect(() => {
    let cancelled = false;
    getGitRefs(repo.owner, repo.repo)
      .then((result) => {
        if (!cancelled) setRefs(result);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof ChatApiError ? cause.message : "the relay did not answer");
      });
    return () => {
      cancelled = true;
    };
  }, [repo.owner, repo.repo]);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-subtle p-4">
      <div>
        <h3 className="text-14 font-semibold text-primary">
          {repo.owner}/{displayName}
        </h3>
        {repo.description && <p className="text-12 text-tertiary">{repo.description}</p>}
      </div>

      <div className="flex items-center gap-1 rounded-md border border-subtle-1 bg-layer-1 pl-3">
        <code className="min-w-0 flex-1 truncate text-13 text-secondary">{repo.cloneUrl}</code>
        <CopyButton value={repo.cloneUrl} label={`Copy the clone URL for ${displayName}`} />
      </div>
      <p className="text-12 text-tertiary">
        This is a real git remote — <code className="text-secondary">git clone</code> this URL to work on {displayName}{" "}
        locally, and <code className="text-secondary">git push</code> to send commits back here.
      </p>

      <Branches refs={refs} error={error} />
    </div>
  );
}
