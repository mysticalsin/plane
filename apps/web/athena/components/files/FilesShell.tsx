/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * The two-tab shell for /:workspaceSlug/files. Uses @plane/ui's simple `Tabs` (tabs: TabItem[])
 * rather than @plane/propel/tabs' compound API — this surface only ever needs two static
 * tabs, so the one-prop version is the simpler fit (Build Law: simplest thing that works).
 * Headless UI unmounts the inactive panel by default, so Files and Repositories never both
 * fetch at once.
 */
import type { TabItem } from "@plane/ui";
import { Tabs } from "@plane/ui";
import { FilesPanel } from "./FilesPanel";
import { RepositoriesPanel } from "./RepositoriesPanel";

const TAB_ITEMS: TabItem[] = [
  { key: "files", label: "Files", content: <FilesPanel /> },
  { key: "repositories", label: "Repositories", content: <RepositoriesPanel /> },
];

export function FilesShell() {
  return (
    <Tabs
      tabs={TAB_ITEMS}
      storageKey="athena-files-tabs"
      tabListContainerClassName="border-b border-subtle px-4 py-2"
      tabPanelClassName="flex-1 overflow-hidden"
      containerClassName="overflow-hidden"
      size="sm"
    />
  );
}
