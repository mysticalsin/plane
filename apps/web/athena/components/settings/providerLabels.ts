/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * One home for provider display names, so the key cards and the permission strip can never
 * disagree about what a provider is called.
 */
import type { ChatModelProvider } from "./types";

export const PROVIDER_LABELS: Record<ChatModelProvider, string> = {
  deepseek: "DeepSeek",
  moonshot: "Moonshot",
  anthropic: "Anthropic",
  custom: "Custom endpoint",
};

/** What a custom endpoint is for, shown where a vendor name would carry no information. */
export const CUSTOM_PROVIDER_HINT =
  "Any OpenAI-compatible endpoint — Cloudflare Workers AI, Groq, Together, OpenRouter, or your own gateway.";
