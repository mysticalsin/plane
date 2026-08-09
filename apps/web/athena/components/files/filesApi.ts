/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Athena BFF files endpoints, prefix /api/v1/files (see ./types.ts's contract note). List and
 * delete reuse ../../api/http's athenaFetch like every other athena/** surface. Upload does
 * not: it is the one place this surface needs real upload-progress events, which fetch()'s
 * streaming-body API does not expose across browsers today, so it drops to a raw
 * XMLHttpRequest — the same "credentials: include" session-cookie auth as athenaFetch,
 * just via `xhr.withCredentials` instead of a RequestInit option.
 */
import { ATHENA_API_BASE } from "../../config";
import { athenaFetch, ChatApiError } from "../../api/http";
import type { FileAttachment, FileListResponse, FilesApiErrorBody, UploadFileInput } from "./types";

export interface ListFilesParams {
  readonly engagementId?: string;
  readonly channelId?: string;
  readonly search?: string;
  readonly cursor?: string;
  readonly limit?: number;
}

export function listFiles(params: ListFilesParams = {}): Promise<FileListResponse> {
  const query = new URLSearchParams();
  if (params.engagementId) query.set("engagementId", params.engagementId);
  if (params.channelId) query.set("channelId", params.channelId);
  if (params.search) query.set("search", params.search);
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return athenaFetch<FileListResponse>(`/files${qs ? `?${qs}` : ""}`);
}

export function deleteFile(id: string): Promise<void> {
  return athenaFetch<void>(`/files/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Not fetched through athenaFetch — clicked as a plain link so the browser's normal
 * top-level-navigation cookie handling (not XHR/fetch CORS rules) carries the session, and so
 * the browser's native download UI (progress, "open file", resume) applies. */
export function fileDownloadUrl(id: string): string {
  return `${ATHENA_API_BASE}/files/${encodeURIComponent(id)}/download`;
}

function isFilesApiErrorBody(value: unknown): value is FilesApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const err = (value as { error?: unknown }).error;
  return typeof err === "object" && err !== null && "code" in err && "message" in err;
}

/**
 * POST /api/v1/files, multipart/form-data. `onProgress` fires with 0–100 as the browser
 * reports `xhr.upload.progress` events — the only part of this surface that cannot go through
 * the shared athenaFetch wrapper. Rejects with the same ChatApiError shape athenaFetch throws,
 * carrying the server's real error message (never a generic one) when the BFF rejects a file.
 */
export function uploadFile(input: UploadFileInput, onProgress: (percent: number) => void): Promise<FileAttachment> {
  const { file, engagementId, channelId } = input;
  const formData = new FormData();
  formData.append("file", file, file.name);
  if (engagementId) formData.append("engagementId", engagementId);
  if (channelId) formData.append("channelId", channelId);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${ATHENA_API_BASE}/files`);
    xhr.withCredentials = true;

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });

    xhr.addEventListener("error", () => {
      reject(new ChatApiError(0, "NETWORK_ERROR", "Could not reach Athena. Check that the BFF is running."));
    });

    xhr.addEventListener("load", () => {
      let json: unknown;
      try {
        json = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
      } catch {
        json = undefined;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(json as FileAttachment);
        return;
      }
      if (isFilesApiErrorBody(json)) {
        reject(new ChatApiError(xhr.status, json.error.code, json.error.message, json.error.correlationId));
        return;
      }
      reject(new ChatApiError(xhr.status, "UNKNOWN_ERROR", `Upload failed with status ${xhr.status}.`));
    });

    xhr.send(formData);
  });
}
