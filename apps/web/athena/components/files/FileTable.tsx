/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Column layout and classNames lifted from ../polo/PoloOpportunityTable.tsx so the two
 * Athena table surfaces read as the same product.
 */
import { Download, Trash2 } from "lucide-react";
import { cn } from "@plane/utils";
import { FOCUS_RING } from "../../utils/focusRing";
import { fileDownloadUrl } from "./filesApi";
import { formatFileDate, formatFileSize, formatFileType } from "./format";
import type { FileAttachment } from "./types";

interface FileTableProps {
  readonly files: readonly FileAttachment[];
  readonly onRequestDelete: (file: FileAttachment) => void;
}

export function FileTable(props: FileTableProps) {
  const { files, onRequestDelete } = props;

  return (
    <div className="h-full overflow-auto">
      <table className="w-full table-auto whitespace-nowrap">
        <thead className="sticky top-0 divide-y divide-subtle bg-surface-1">
          <tr className="divide-x divide-subtle text-13 text-primary">
            <th className="px-2.5 py-2 text-left font-medium">Name</th>
            <th className="px-2.5 py-2 text-left font-medium">Type</th>
            <th className="px-2.5 py-2 text-right font-medium">Size</th>
            <th className="px-2.5 py-2 text-left font-medium">Uploaded by</th>
            <th className="px-2.5 py-2 text-left font-medium">Date</th>
            <th className="px-2.5 py-2 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {files.map((file) => (
            <tr key={file.id} className="divide-x divide-subtle text-13 text-secondary">
              <td className="max-w-96 truncate px-2.5 py-2 font-medium text-primary">{file.filename}</td>
              <td className="px-2.5 py-2">{formatFileType(file.contentType)}</td>
              <td className="px-2.5 py-2 text-right tabular-nums">{formatFileSize(file.sizeBytes)}</td>
              <td className="max-w-48 truncate px-2.5 py-2">{file.uploadedByDisplayName}</td>
              <td className="px-2.5 py-2 tabular-nums">{formatFileDate(file.createdAt)}</td>
              <td className="px-2.5 py-2">
                {/* size-11 (44px): these two are the highest-stakes actions on this surface
                    (one is destructive), so they get the full touch-target floor even though
                    the surrounding table is dense — see design-standards.md. */}
                <div className="flex items-center justify-end gap-1">
                  <a
                    href={fileDownloadUrl(file.id)}
                    rel="noreferrer"
                    aria-label={`Download ${file.filename}`}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-md text-secondary hover:bg-layer-transparent-hover hover:text-primary",
                      FOCUS_RING
                    )}
                  >
                    <Download className="size-3.5" strokeWidth={1.75} />
                  </a>
                  <button
                    type="button"
                    onClick={() => onRequestDelete(file)}
                    aria-label={`Delete ${file.filename}`}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-md text-secondary hover:bg-danger-subtle hover:text-danger-primary",
                      FOCUS_RING
                    )}
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
