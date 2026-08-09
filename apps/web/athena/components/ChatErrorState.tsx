/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { AlertTriangle } from "lucide-react";
import { Button } from "@plane/ui";
import { FOCUS_RING } from "../utils/focusRing";

interface ChatErrorStateProps {
  readonly message: string;
  readonly onRetry: () => void;
}

/** A working retry, always — design-standards.md requires an error state with a real
 * recovery path, not a dead end. */
export function ChatErrorState(props: ChatErrorStateProps) {
  const { message, onRetry } = props;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <AlertTriangle className="size-6 text-secondary" strokeWidth={1.5} />
      <div>
        <p className="text-14 font-medium text-primary">Something went wrong</p>
        <p className="max-w-sm text-13 text-secondary">{message}</p>
      </div>
      <Button variant="neutral-primary" size="sm" onClick={onRetry} className={FOCUS_RING}>
        Retry
      </Button>
    </div>
  );
}
