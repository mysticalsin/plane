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
  readonly name: string;
  readonly mimeType: string;
  /** Exact byte count. Always run through ../format.ts's formatFileSize — never hand-rolled. */
  readonly sizeBytes: number;
  readonly engagementId: string | null;
  readonly channelId: string | null;
  readonly uploadedById: string;
  readonly uploadedByDisplayName: string;
  /** ISO 8601. */
  readonly createdAt: string;
}

export interface FileListResponse {
  readonly items: readonly FileAttachment[];
  readonly nextCursor: string | null;
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
  readonly headCommitSha: string | null;
}

export interface GitCommit {
  readonly sha: string;
  readonly message: string;
  readonly authorName: string;
  /** ISO 8601. */
  readonly authoredAt: string;
}

export interface GitRepo {
  readonly id: string;
  readonly name: string;
  readonly owner: string;
  /** A real git remote — `git clone <cloneUrl>` and `git push` both work against it, backed
   * by Buzz's Smart-HTTP git server. Not a download link. */
  readonly cloneUrl: string;
  readonly defaultBranch: string | null;
  readonly branches: readonly GitBranch[];
  /** `null` means the BFF has no commit-log endpoint for this repo yet — render the honest
   * "not available yet" state, never an empty list (that implies zero commits exist). */
  readonly commits: readonly GitCommit[] | null;
}

export interface GitRepoListResponse {
  readonly repos: readonly GitRepo[];
}
