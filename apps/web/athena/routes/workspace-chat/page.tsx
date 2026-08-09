/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Route: /:workspaceSlug/chat — the workspace chat surface with no channel picked yet.
 * ChatShell's own "Pick a channel" empty state covers this rather than auto-redirecting
 * to the first channel, so a workspace with zero channels doesn't bounce anywhere.
 */

import { useParams } from "next/navigation";
import { PageHead } from "@/components/core/page-title";
import { ChatShell } from "../../components/ChatShell";

export default function WorkspaceChatPage() {
  const params = useParams();
  const workspaceSlug = String(params.workspaceSlug ?? "");

  return (
    <>
      <PageHead title="Chat" />
      <ChatShell workspaceSlug={workspaceSlug} activeChannelId={null} />
    </>
  );
}
