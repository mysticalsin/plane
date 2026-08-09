/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Athena chat's project-nav entry point. Wired in as the default value of
 * ProjectNavigation's `additionalNavigationItems` prop (see the two-line edit in
 * project-navigation.tsx) rather than at its render call site
 * (core/components/workspace/sidebar/projects-list-item.tsx:483), which sits outside
 * this build's writable scope — editing it would touch a file with no sanctioned
 * extension point.
 *
 * i18n note: `i18n_key: "sidebar.chat"` follows the exact naming convention of the other
 * items in project-navigation.tsx's baseNavigation ("sidebar.work_items", "sidebar.cycles",
 * ...), but no such key exists yet in packages/i18n's locale files, and adding one is
 * outside this build's writable paths (extended.ts, athena/**, and one line of
 * project-navigation.tsx only). Until it's added there, the label falls back to the raw
 * key string per i18next's default missing-key behaviour (verified in
 * packages/i18n/src/core/instance.ts — no parseMissingKeyHandler is configured).
 */

import { EUserPermissions } from "@plane/constants";
import { CommentFillIcon } from "@plane/propel/icons";
import type { TNavigationItem } from "@/components/workspace/sidebar/project-navigation";

export function getAthenaChatNavigationItems(workspaceSlug: string, projectId: string): TNavigationItem[] {
  return [
    {
      i18n_key: "sidebar.chat",
      key: "chat",
      name: "Chat",
      href: `/${workspaceSlug}/projects/${projectId}/chat`,
      icon: CommentFillIcon,
      access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
      shouldRender: true,
      // Directly under "Work items" (sortOrder 1) — Buzz chat is a first-class surface
      // here, not an afterthought bolted onto the bottom of the list.
      sortOrder: 1.5,
    },
  ];
}
