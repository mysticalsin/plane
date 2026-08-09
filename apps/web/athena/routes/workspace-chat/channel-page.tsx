/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Route: /:workspaceSlug/chat/:channelId — a specific workspace or DM channel.
 */

import { useParams } from "next/navigation";
import { PageHead } from "@/components/core/page-title";
import { ChatShell } from "../../components/ChatShell";

export default function WorkspaceChatChannelPage() {
  const params = useParams();
  const workspaceSlug = String(params.workspaceSlug ?? "");
  const channelId = String(params.channelId ?? "");

  return (
    <>
      <PageHead title="Chat" />
      <ChatShell workspaceSlug={workspaceSlug} activeChannelId={channelId} />
    </>
  );
}
