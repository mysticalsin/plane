/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Route: /:workspaceSlug/projects/:projectId/chat — nested into the same project detail
 * layout as issues/cycles/modules/pages (merged in via extended.ts), so the project's own
 * left nav — including the "Chat" entry this build adds — stays visible around it.
 */

import { useParams } from "next/navigation";
import { PageHead } from "@/components/core/page-title";
import { ChatShell } from "../../components/ChatShell";

export default function ProjectChatPage() {
  const params = useParams();
  const workspaceSlug = String(params.workspaceSlug ?? "");
  const projectId = String(params.projectId ?? "");

  return (
    <>
      <PageHead title="Project chat" />
      <ChatShell workspaceSlug={workspaceSlug} projectId={projectId} />
    </>
  );
}
