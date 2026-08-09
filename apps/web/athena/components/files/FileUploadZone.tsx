/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Drag-and-drop zone plus a file picker, both feeding the same upload queue. Each queued file
 * tracks its own XHR progress (see ./filesApi.ts's uploadFile) and, on failure, shows the
 * server's real error message rather than a generic "upload failed" — required by this
 * build's brief. Uploads tag the file with whichever engagement/channel filter is currently
 * active, so "upload while filtered to Engagement X" files land scoped to Engagement X.
 */
import { useCallback, useRef, useState } from "react";
import { AlertTriangle, Check, Upload, X } from "lucide-react";
import { cn } from "@plane/utils";
import { ChatApiError } from "../../api/http";
import { FOCUS_RING } from "../../utils/focusRing";
import { uploadFile } from "./filesApi";

interface QueuedUpload {
  readonly id: string;
  readonly name: string;
  readonly progress: number;
  readonly status: "uploading" | "done" | "error";
  readonly errorMessage: string | null;
}

interface FileUploadZoneProps {
  readonly engagementId: string;
  readonly channelId: string;
  readonly onUploaded: () => void;
}

function newQueueId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export function FileUploadZone(props: FileUploadZoneProps) {
  const { engagementId, channelId, onUploaded } = props;
  const [queue, setQueue] = useState<readonly QueuedUpload[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateQueueItem = useCallback((id: string, patch: Partial<QueuedUpload>) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const startUpload = useCallback(
    (file: File) => {
      const id = newQueueId();
      setQueue((prev) => [...prev, { id, name: file.name, progress: 0, status: "uploading", errorMessage: null }]);

      uploadFile({ file, engagementId: engagementId || undefined, channelId: channelId || undefined }, (percent) =>
        updateQueueItem(id, { progress: percent })
      )
        .then(() => {
          updateQueueItem(id, { status: "done", progress: 100 });
          onUploaded();
        })
        .catch((err: unknown) => {
          const message = err instanceof ChatApiError ? err.message : "Upload failed for an unknown reason.";
          updateQueueItem(id, { status: "error", errorMessage: message });
        });
    },
    [channelId, engagementId, onUploaded, updateQueueItem]
  );

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(startUpload);
  }

  function dismissQueueItem(id: string) {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="flex flex-col gap-2 border-b border-subtle p-4">
      {/* A real <button>, not a div with role="button": it gets Enter/Space activation, focus and
          the correct announcement for free, which the hand-rolled keydown handler was imitating. */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        aria-label="Drop files here or press Enter to choose files to upload"
        className={cn(
          "flex min-h-[44px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors motion-reduce:transition-none",
          FOCUS_RING,
          isDragOver ? "border-accent-primary bg-accent-primary/5" : "hover:border-subtle-2 border-subtle-1"
        )}
      >
        <Upload className="size-5 text-tertiary" strokeWidth={1.75} />
        <p className="text-13 text-primary">
          <span className="font-medium">Drag files here</span> or click to browse
        </p>
        <p className="text-12 text-tertiary">Attached to whichever engagement or channel filter is active above.</p>
      </button>

      {/* Outside the button on purpose: a <button> may not contain interactive content, and nesting
          the file input would make it unreachable. */}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {queue.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {queue.map((item) => (
            <li key={item.id} className="flex items-center gap-2.5 rounded-md border border-subtle px-3 py-2 text-13">
              {item.status === "uploading" && (
                <div className="h-1.5 w-24 flex-shrink-0 overflow-hidden rounded-full bg-layer-2">
                  <div
                    className="h-full rounded-full bg-accent-primary transition-[width] motion-reduce:transition-none"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              {item.status === "done" && (
                <Check className="size-3.5 flex-shrink-0 text-success-primary" strokeWidth={1.75} />
              )}
              {item.status === "error" && (
                <AlertTriangle className="size-3.5 flex-shrink-0 text-danger-primary" strokeWidth={1.75} />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-primary">{item.name}</p>
                {item.status === "error" && item.errorMessage && (
                  <p className="truncate text-12 text-danger-primary">{item.errorMessage}</p>
                )}
              </div>

              {item.status !== "uploading" && (
                <button
                  type="button"
                  onClick={() => dismissQueueItem(item.id)}
                  aria-label={`Dismiss upload status for ${item.name}`}
                  className={cn(
                    "flex size-11 flex-shrink-0 items-center justify-center rounded-md text-tertiary hover:bg-layer-transparent-hover hover:text-primary",
                    FOCUS_RING
                  )}
                >
                  <X className="size-3.5" strokeWidth={1.75} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
