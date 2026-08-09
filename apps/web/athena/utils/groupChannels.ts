/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ChatChannel } from "../types/chat";

export interface GroupedChannels {
  readonly project: readonly ChatChannel[];
  readonly workspace: readonly ChatChannel[];
  readonly dm: readonly ChatChannel[];
}

/** Slack's own left-rail split (channels, then DMs), refined with the project/workspace
 * distinction Athena channels already carry natively. */
export function groupChannels(channels: readonly ChatChannel[]): GroupedChannels {
  return {
    project: channels.filter((c) => c.kind === "PROJECT"),
    workspace: channels.filter((c) => c.kind === "WORKSPACE"),
    dm: channels.filter((c) => c.kind === "DM"),
  };
}
