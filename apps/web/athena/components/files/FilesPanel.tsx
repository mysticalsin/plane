/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Tab 1 of /:workspaceSlug/files — upload zone, filter bar, and the dense file table, wired
 * to the same loading/error/empty/ready state matrix every athena/** data view uses (see
 * ../polo/PoloShell.tsx).
 */
import { useState } from "react";
import { ChatEmptyState } from "../ChatEmptyState";
import { ChatErrorState } from "../ChatErrorState";
import { DeleteFileModal } from "./DeleteFileModal";
import { FileTable } from "./FileTable";
import { FileUploadZone } from "./FileUploadZone";
import { FilesFilterBar } from "./FilesFilterBar";
import { FilesTableSkeleton } from "./FilesSkeletons";
import { useFiles } from "./useFiles";
import { useFilterOptions } from "./useFilterOptions";
import type { FileAttachment } from "./types";

function emptyStateCopy(search: string, engagementId: string, channelId: string) {
  if (search) {
    return { title: `No files match "${search}"`, description: "Try a different file name." };
  }
  if (engagementId) {
    return {
      title: "No files attached to this engagement yet",
      description: "Drag a file above, or click to browse, to attach the first one.",
    };
  }
  if (channelId) {
    return {
      title: "No files attached to this channel yet",
      description: "Drag a file above, or click to browse, to attach the first one.",
    };
  }
  return {
    title: "No files uploaded yet",
    description: "Drag a file above, or click to browse, to attach the first one.",
  };
}

export function FilesPanel() {
  const {
    status,
    files,
    error,
    search,
    setSearch,
    engagementId,
    setEngagementId,
    channelId,
    setChannelId,
    retry,
    refresh,
  } = useFiles();
  const { engagements, channels } = useFilterOptions();
  const [pendingDelete, setPendingDelete] = useState<FileAttachment | null>(null);

  const empty = emptyStateCopy(search, engagementId, channelId);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <FileUploadZone engagementId={engagementId} channelId={channelId} onUploaded={refresh} />

      <FilesFilterBar
        search={search}
        onSearchChange={setSearch}
        engagementId={engagementId}
        onEngagementChange={setEngagementId}
        channelId={channelId}
        onChannelChange={setChannelId}
        engagements={engagements}
        channels={channels}
        resultCount={files.length}
      />

      <div className="flex-1 overflow-hidden">
        {status === "loading" && <FilesTableSkeleton />}
        {status === "error" && <ChatErrorState message={error ?? "Could not load files."} onRetry={retry} />}
        {status === "ready" && files.length === 0 && (
          <ChatEmptyState title={empty.title} description={empty.description} />
        )}
        {status === "ready" && files.length > 0 && <FileTable files={files} onRequestDelete={setPendingDelete} />}
      </div>

      <DeleteFileModal file={pendingDelete} onClose={() => setPendingDelete(null)} onDeleted={refresh} />
    </div>
  );
}
