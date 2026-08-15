/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ATHENA_API_BASE } from "../config";
import type { ChatApiErrorBody } from "../types/chat";

export class ChatApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId: string | undefined;

  constructor(status: number, code: string, message: string, correlationId?: string) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
    this.code = code;
    this.correlationId = correlationId;
  }
}

function isChatApiErrorBody(value: unknown): value is ChatApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const err = (value as { error?: unknown }).error;
  return typeof err === "object" && err !== null && "code" in err && "message" in err;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * The Plane workspace slug from the URL, which is always `/:workspaceSlug/...` in this app.
 *
 * Sent so the BFF can put the caller in the Athena workspace mirroring the Plane workspace they
 * are actually looking at. It is a request, not a claim: the BFF asks Plane whether this user
 * belongs to that workspace and ignores the header unless Plane agrees. Without it, everyone gets
 * a private workspace of their own and two teammates never share a channel.
 */
export function currentWorkspaceSlug(): string | null {
  const [, slug] = window.location.pathname.split("/");
  // Plane's own non-workspace routes live at these prefixes; sending one as a workspace would just
  // be a lookup that always fails.
  const reserved = new Set(["", "accounts", "god-mode", "profile", "settings", "create-workspace", "invitations"]);
  return slug && !reserved.has(slug) ? slug : null;
}

/**
 * The one place athena/** touches the network. `credentials: "include"` carries the BFF's
 * session cookie; the Buzz signing key never reaches this file or the browser at all — the
 * BFF holds it server-side and proxies to the relay, per this build's security floor.
 */
export async function athenaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const slug = currentWorkspaceSlug();
  let response: Response;
  try {
    response = await fetch(`${ATHENA_API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        // Only when there is actually a body. Fastify rejects an empty body that declares itself
        // JSON (FST_ERR_CTP_EMPTY_JSON_BODY), which broke every bodyless POST in this app — the
        // "Test connection" buttons among them — with an error that looked like a server fault.
        ...(init?.body === undefined || init.body === null ? {} : { "content-type": "application/json" }),
        ...(slug ? { "x-athena-plane-workspace": slug } : {}),
        ...init?.headers,
      },
    });
  } catch (_cause) {
    throw new ChatApiError(0, "NETWORK_ERROR", "Could not reach Athena. Check that the BFF is running.");
  }

  const text = await response.text();
  const json: unknown = text ? safeJsonParse(text) : undefined;

  if (!response.ok) {
    if (isChatApiErrorBody(json)) {
      throw new ChatApiError(response.status, json.error.code, json.error.message, json.error.correlationId);
    }
    throw new ChatApiError(response.status, "UNKNOWN_ERROR", `Request failed with status ${response.status}.`);
  }

  return json as T;
}
