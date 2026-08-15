/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * ATHENA FILES + GIT WIRE CONTRACT MIRROR — read this before touching anything in
 * athena/components/files/**.
 *
 * At the time this surface was written, apps/bff/src/routes/ had no files.ts or git.ts and
 * packages/domain/src/api.ts had no File/Git-shaped export (verified by listing both
 * directories directly). The BFF's /api/v1/files and /api/v1/git routes are being built in
 * this same run, backed by Buzz's own git Smart-HTTP server (buzz-relay/src/api/git/) and its
 * Blossom blob upload (buzz-relay/src/api/media.rs) per this build's brief. So — exactly like
 * ../../types/chat.ts's own note — this file is, for now, the only definition of that wire
 * shape, written to a plain REST contract that matches every existing Athena BFF idiom:
 * cursor pagination (see ../polo/types.ts's PoloOpportunityPage), the shared
 * ChatApiErrorBody envelope (../../types/chat.ts), and ISO 8601 timestamps throughout.
 * The day a real contract doc lands, diff it against this file — drift should be obvious,
 * not silent.
 *
 * No zod, for the same reason chat.ts gives: zod is not a declared dependency of apps/web,
 * and this surface's writable scope forbids adding one.
 */

export type FilesFetchStatus = "loading" | "error" | "ready";

export interface FileAttachment {
  readonly id: string;
  readonly filename: string;
  readonly contentType: string;
  /** Exact byte count. Always run through ../format.ts's formatFileSize — never hand-rolled. */
  readonly sizeBytes: number;
  /** The blob's sha256 in Buzz's Blossom store; Athena holds no bytes of its own. */
  readonly blobHash: string;
  readonly engagementId: string | null;
  readonly channelId: string | null;
  readonly uploadedBy: string;
  readonly uploadedByDisplayName: string;
  /** ISO 8601. */
  readonly createdAt: string;
}

/** The BFF returns the whole workspace's files in one response — there is no cursor. */
export interface FileListResponse {
  readonly files: readonly FileAttachment[];
}

export interface UploadFileInput {
  readonly file: File;
  readonly engagementId?: string;
  readonly channelId?: string;
}

/** Mirrors ../../types/chat.ts's ChatApiErrorBody — the one error envelope every Athena BFF
 * route uses. Read directly (not through athenaFetch) by the XHR-based uploader in
 * filesApi.ts, which needs upload-progress events that fetch() cannot provide. */
export interface FilesApiErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly correlationId?: string;
  };
}

// --- Git -------------------------------------------------------------------------------

export type GitFetchStatus = "loading" | "error" | "ready";

export interface GitBranch {
  readonly name: string;
  readonly headCommitSha: string;
}

/**
 * A repository announced on the relay. Exactly what GET /git/repos returns — this used to also
 * declare `id`, `defaultBranch`, `branches` and `commits`, none of which the BFF has ever sent,
 * so the card read `repo.branches.length` on undefined and the tab crashed on render.
 */
export interface GitRepo {
  readonly owner: string;
  readonly repo: string;
  readonly name: string | null;
  readonly description: string | null;
  readonly channelId: string;
  /** A real git remote — `git clone <cloneUrl>` and `git push` both work against it, backed
   * by Buzz's Smart-HTTP git server. Not a download link. */
  readonly cloneUrl: string;
}

/**
 * Ref advertisement for one repo, from GET /git/repos/:owner/:repo/refs — fetched per card
 * rather than included in the list, because it costs a round trip to the relay per repository.
 *
 * There is deliberately no commit history here: the relay advertises refs and serves packs, and
 * exposes no log. The BFF says so explicitly (`NotSupportedError` on /log) rather than inventing
 * one, and this surface says so too instead of rendering an empty list that implies zero commits.
 */
export interface GitRefs {
  readonly head: string | null;
  readonly refs: Readonly<Record<string, string>>;
  readonly cloneUrl: string;
}

export interface GitRepoListResponse {
  readonly repos: readonly GitRepo[];
}
