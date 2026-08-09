/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Shared across every athena/** data hook so every pane implements the same three states
 * (design-standards.md: loading / error / empty are mandatory on data-fetching components). */
export type ChatFetchStatus = "loading" | "error" | "ready";
