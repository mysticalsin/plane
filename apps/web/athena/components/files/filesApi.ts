/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Athena BFF files endpoints, prefix /api/v1/files. List and delete reuse ../../api/http's
 * athenaFetch like every other athena/** surface. Upload does not: it is the one place this
 * surface needs real upload-progress events, which fetch()'s streaming-body API does not expose
 * across browsers today, so it drops to a raw XMLHttpRequest — the same "credentials: include"
 * session-cookie auth as athenaFetch, just via `xhr.withCredentials` instead of a RequestInit
 * option.
 *
 * The body is base64 JSON, not multipart: the BFF has no multipart parser and its upload schema
 * (ApiUploadFileSchema in @mantu/athena-domain) takes `{filename, contentType, data}`. This file
 * used to send multipart to a route that has never accepted it, so no upload from this surface
 * had ever succeeded.
 */
import { ATHENA_API_BASE } from "../../config";
import { athenaFetch, ChatApiError, currentWorkspaceSlug } from "../../api/http";
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

/**
 * Downloads a file's bytes and hands them to the browser.
 *
 * Deliberately fetched rather than linked. A plain `<a href>` is a top-level navigation, which
 * cannot carry the `x-athena-plane-workspace` header — so the BFF resolved the caller's default
 * workspace instead of the one they were looking at and answered 404 for a file that was right
 * there on screen. The cost is the browser's native download UI; the alternative is a button that
 * does not work outside one workspace.
 *
 * `/content` is the route the BFF registers; there has never been a `/download`, which is what
 * this pointed at for as long as the button has existed.
 */
export async function downloadFile(file: { id: string; filename: string }): Promise<void> {
  const response = await fetch(`${ATHENA_API_BASE}/files/${encodeURIComponent(file.id)}/content`, {
    credentials: "include",
    headers: currentWorkspaceSlug() ? { "x-athena-plane-workspace": currentWorkspaceSlug()! } : {},
  });
  if (!response.ok) {
    throw new ChatApiError(response.status, "DOWNLOAD_FAILED", `Could not download ${file.filename}.`);
  }

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  link.click();
  URL.revokeObjectURL(url);
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
export async function uploadFile(
  input: UploadFileInput,
  onProgress: (percent: number) => void
): Promise<FileAttachment> {
  const { file, engagementId, channelId } = input;
  const body = JSON.stringify({
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    data: await toBase64(file),
    ...(engagementId ? { engagementId } : {}),
    ...(channelId ? { channelId } : {}),
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${ATHENA_API_BASE}/files`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("content-type", "application/json");
    // The one request on this surface that does not go through athenaFetch still has to say which
    // Plane workspace it is in. Without it the upload succeeded and landed in the caller's default
    // workspace instead of the one they were looking at — a 201 for a file that never appeared.
    const slug = currentWorkspaceSlug();
    if (slug) xhr.setRequestHeader("x-athena-plane-workspace", slug);

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

    xhr.send(body);
  });
}

/**
 * The file's bytes as base64, without a data: prefix.
 *
 * FileReader rather than a hand-rolled loop over an ArrayBuffer: String.fromCharCode over a large
 * byte array blows the argument limit, and chunking it is more code than this.
 */
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", () => reject(new ChatApiError(0, "READ_FAILED", `Could not read ${file.name}.`)));
    reader.addEventListener("load", () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.slice(result.indexOf(",") + 1));
    });
    reader.readAsDataURL(file);
  });
}
