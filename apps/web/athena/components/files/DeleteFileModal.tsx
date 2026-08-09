/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * The confirm step names the exact file being deleted — never a generic "Delete this item?" —
 * per this build's brief.
 */
import { useState } from "react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";
import { ChatApiError } from "../../api/http";
import { deleteFile } from "./filesApi";
import type { FileAttachment } from "./types";

interface DeleteFileModalProps {
  readonly file: FileAttachment | null;
  readonly onClose: () => void;
  readonly onDeleted: () => void;
}

export function DeleteFileModal(props: DeleteFileModalProps) {
  const { file, onClose, onDeleted } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!file) return;
    setIsSubmitting(true);
    try {
      await deleteFile(file.id);
      onDeleted();
      onClose();
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not delete the file",
        message: err instanceof ChatApiError ? err.message : "Something went wrong. Try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AlertModalCore
      isOpen={file !== null}
      handleClose={onClose}
      handleSubmit={() => void handleSubmit()}
      isSubmitting={isSubmitting}
      title="Delete file"
      content={
        file ? (
          <>
            Delete <span className="font-medium text-primary">{file.name}</span>? This cannot be undone.
          </>
        ) : (
          ""
        )
      }
      primaryButtonText={{ default: "Delete", loading: "Deleting" }}
    />
  );
}
