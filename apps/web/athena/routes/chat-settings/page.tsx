/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Route: /:workspaceSlug/chat/settings — relay status, identity, channel administration, the
 * agent roster, BYOK model-provider keys and per-channel notification preferences. Every
 * setting here is workspace/user scoped server-side (requireAuth + resolveActiveWorkspaceId in
 * apps/bff/src/routes/chatSettings/**), so workspaceSlug is only needed for the page title.
 */

import { PageHead } from "@/components/core/page-title";
import { ChatSettingsShell } from "../../components/settings/ChatSettingsShell";

export default function ChatSettingsPage() {
  return (
    <>
      <PageHead title="Chat settings" />
      <ChatSettingsShell />
    </>
  );
}
