/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { layout, route } from "@react-router/dev/routes";
import type { RouteConfigEntry } from "@react-router/dev/routes";

/**
 * Athena's Buzz-backed chat surface — Plane's "Slack but better", living inside Plane's own
 * shell rather than as a bolted-on panel. All route files live under apps/web/athena/**,
 * kept entirely outside apps/web/core and apps/web/app so the fork can take upstream Plane
 * merges cleanly.
 *
 * File paths are relative to the app directory (apps/web/app — see react-router.config.ts's
 * `appDirectory: "app"`), exactly like every path in ./core.ts, regardless of which
 * routes.ts-registered file declares them. "../athena/..." reaches the sibling
 * apps/web/athena directory from there.
 *
 * mergeRoutes (./helper.ts) deep-merges an extended entry into a core entry only when their
 * `file` keys match AT THE SAME ARRAY DEPTH — it does not search the whole tree. core.ts
 * nests "(projects)/layout.tsx" three levels down: (all)/layout.tsx →
 * [workspaceSlug]/layout.tsx → (projects)/layout.tsx. Declaring that file at the top level
 * here (instead of mirroring the same three-level chain) would NOT merge into it — it would
 * become an orphaned duplicate wrapper missing AuthenticationWrapper/WorkspaceAuthWrapper
 * from (all)/layout.tsx and [workspaceSlug]/layout.tsx. So every layout() below re-states
 * the exact ancestor chain core.ts uses, purely so mergeRoutes can find the matching file at
 * each level and splice our routes in as new children — none of these layout files are
 * duplicated on disk; `layout()` here is just a pointer to the same existing core file.
 */
export const extendedRoutes: RouteConfigEntry[] = [
  layout("./(all)/layout.tsx", [
    layout("./(all)/[workspaceSlug]/layout.tsx", [
      layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
        // Both workspace-scoped chat routes ride inside the same "(projects)" shell as
        // stickies/active-cycles/drafts — the workspace's left rail (projects list +
        // workspace nav) stays visible, exactly like those routes.

        // /:workspaceSlug/chat — the workspace chat surface
        route(":workspaceSlug/chat", "../athena/routes/workspace-chat/page.tsx"),
        // /:workspaceSlug/chat/:channelId — a specific channel
        route(":workspaceSlug/chat/:channelId", "../athena/routes/workspace-chat/channel-page.tsx"),

        // /:workspaceSlug/chat/settings — relay, identity, channels, agents, model providers
        // and notifications. A static segment, so React Router ranks it above the dynamic
        // ":channelId" route immediately above rather than treating "settings" as a channel id.
        route(":workspaceSlug/chat/settings", "../athena/routes/chat-settings/page.tsx"),

        // /:workspaceSlug/polo — the Polo (CRM) section: read-only opportunities table + detail
        // panel. Same "(projects)" shell as chat, so the workspace's left rail stays visible.
        route(":workspaceSlug/polo", "../athena/routes/polo/page.tsx"),

        // /:workspaceSlug/files — file attachments + the workspace's git repositories, in two
        // tabs. Same "(projects)" shell as chat/Polo, so the workspace's left rail stays visible.
        route(":workspaceSlug/files", "../athena/routes/files/page.tsx"),

        // /:workspaceSlug/knowledge — the Graphify-built code knowledge graph: search a node,
        // see what it depends on and what depends on it, trace a path between any two.
        route(":workspaceSlug/knowledge", "../athena/routes/knowledge/page.tsx"),

        // /:workspaceSlug/projects/:projectId/chat — the project's own channel, nested as a
        // sibling of issues/cycles/modules/pages inside the existing project detail layout
        // so the project's left nav (including this build's "Chat" entry) surrounds it.
        layout("./(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/layout.tsx", [
          route(":workspaceSlug/projects/:projectId/chat", "../athena/routes/project-chat/page.tsx"),
        ]),
      ]),
    ]),
  ]),
];
