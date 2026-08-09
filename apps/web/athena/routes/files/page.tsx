/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Route: /:workspaceSlug/files — file attachments and the workspace's git repositories, in
 * two tabs (see ../../components/files/FilesShell.tsx). Workspace scoping is resolved
 * server-side from the session, exactly like chat and Polo, so :workspaceSlug is only needed
 * for the page title.
 */
import { PageHead } from "@/components/core/page-title";
import { FilesShell } from "../../components/files/FilesShell";

export default function FilesPage() {
  return (
    <>
      <PageHead title="Files" />
      <FilesShell />
    </>
  );
}
