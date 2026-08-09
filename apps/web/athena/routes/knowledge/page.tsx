/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Route: /:workspaceSlug/knowledge — the Graphify-built knowledge graph over this workspace's
 * indexed sources. Workspace scoping is resolved server-side from the session, exactly like
 * chat, Polo and Files, so :workspaceSlug is only needed for the page title.
 */
import { PageHead } from "@/components/core/page-title";
import { KnowledgeShell } from "../../components/knowledge/KnowledgeShell";

export default function KnowledgePage() {
  return (
    <>
      <PageHead title="Knowledge" />
      <KnowledgeShell />
    </>
  );
}
